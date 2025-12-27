import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { getState, setKing, clearChallenge } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report the results of the challenge')
    .addIntegerOption(option =>
        option.setName('my_score')
            .setDescription('Your score')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('opponent_score')
            .setDescription('Opponent\'s score')
            .setRequired(true));

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const state = getState();
    const user = interaction.user;

    if (!state.activeChallenge) {
        return interaction.reply({ content: 'There is no active challenge to report on.', ephemeral: true });
    }

    if (!state.activeChallenge.accepted) {
        return interaction.reply({ content: 'The challenge has not been accepted yet.', ephemeral: true });
    }

    if (state.activeChallenge.challenger !== user.id && state.activeChallenge.defender !== user.id) {
        return interaction.reply({ content: 'You are not a participant in the current challenge.', ephemeral: true });
    }

    const myScore = interaction.options.getInteger('my_score', true);
    const opponentScore = interaction.options.getInteger('opponent_score', true);

    let challengerScore, defenderScore;
    if (user.id === state.activeChallenge.challenger) {
        challengerScore = myScore;
        defenderScore = opponentScore;
    } else {
        defenderScore = myScore;
        challengerScore = opponentScore;
    }

    const type = state.activeChallenge.type;
    const maxScore = type === 'bo3' ? 2 : 3;

    if (challengerScore > maxScore || defenderScore > maxScore) {
        return interaction.reply({ content: `Invalid scores! For ${type}, the max score is ${maxScore}.`, ephemeral: true });
    }

    let winnerId: string | null = null;
    if (challengerScore === maxScore) winnerId = state.activeChallenge.challenger;
    else if (defenderScore === maxScore) winnerId = state.activeChallenge.defender;

    if (!winnerId) {
        return interaction.reply({ content: `The match is not over yet based on these scores! Someone needs to reach ${maxScore} wins.`, ephemeral: true });
    }

    const oldKingId = state.king;
    const newKingId = winnerId;
    const isNewKing = oldKingId !== newKingId;

    setKing(newKingId);
    clearChallenge();

    const guild = interaction.guild;
    if (!guild) return;

    const role = guild.roles.cache.find(r => r.name === config.roleName);
    const channel = guild.channels.cache.find(c => c.name === config.channelName);

    if (!role) {
        if (channel && channel.isTextBased()) await channel.send('⚠️ **Error:** "King of the Hill" role not found!');
    } else {
        if (oldKingId && isNewKing) {
            try {
                const oldKingMember = await guild.members.fetch(oldKingId);
                if (oldKingMember) await oldKingMember.roles.remove(role);
            } catch (e) { console.error('Failed to remove role from old king', e); }
        }

        try {
            const newKingMember = await guild.members.fetch(newKingId);
            if (newKingMember) {
                await newKingMember.roles.add(role);

                const currentStreak = getState().streak;
                const originalName = newKingMember.user.username;

                try {
                    await newKingMember.setNickname(`${originalName} [${currentStreak}]`);
                } catch (err) {
                    console.log('Could not update nickname (likely permission issue)');
                    if (channel && channel.isTextBased()) await channel.send(`(Note: Could not update King's nickname due to permissions)`);
                }
            }
        } catch (e) { console.error('Failed to add role to new king', e); }
    }

    if (channel && channel.isTextBased()) {
        const streak = getState().streak;
        if (isNewKing) {
            await channel.send(`👑 **NEW KING!** <@${newKingId}> has defeated <@${oldKingId}> and claimed the throne! \nCurrent Streak: **${streak}**`);
        } else {
            await channel.send(`👑 **STILL KING!** <@${newKingId}> defended the throne! \nCurrent Streak: **${streak}**`);
        }
    }

    await interaction.reply({ content: 'Match reported successfully!', ephemeral: true });
};
