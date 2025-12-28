import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel, Guild } from 'discord.js';
import { getState, castVote, clearVotes } from '../../gameState';
import { processMatchEnd, handleRoleAndNicknameUpdates } from '../../commands/reportResult/helpers';
import config from '../../config.json';

/**
 * Sends the voting buttons to both players
 */
export async function sendReportButtons(guild: Guild, challengerId: string, defenderId: string) {
    const challenger = await guild.members.fetch(challengerId).catch(() => null);
    const defender = await guild.members.fetch(defenderId).catch(() => null);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`vote_winner_${challengerId}`)
            .setLabel(`Winner: ${challenger?.user.username || 'Challenger'}`)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`vote_winner_${defenderId}`)
            .setLabel(`Winner: ${defender?.user.username || 'Defender'}`)
            .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setTitle("⚔️ MATCH OVER?")
        .setDescription(`${challenger} and ${defender}, select the winner below to confirm the result. **Both players must agree!**`)
        .setTimestamp();

    if ((config as any).announcementImagePath) {
        embed.setImage((config as any).announcementImagePath);
    }

    const channel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;
    if (channel) {
        await channel.send({
            embeds: [embed],
            components: [row]
        });
    }
}

export async function handleVoteWinner(interaction: ButtonInteraction) {
    const { customId } = interaction;
    const winnerId = customId.split('_')[2];
    const guild = interaction.guild;
    if (!guild) return;

    const state = getState();
    const challenge = state.activeChallenge;

    if (!challenge || !challenge.accepted) {
        return interaction.reply({ content: 'No active match to report.', ephemeral: true });
    }

    if (interaction.user.id !== challenge.challenger && interaction.user.id !== challenge.defender) {
        return interaction.reply({ content: 'You are not in this match!', ephemeral: true });
    }

    castVote(interaction.user.id, winnerId);
    await interaction.reply({ content: `You voted for <@${winnerId}> as the winner. Waiting for opponent...`, ephemeral: true });

    const updatedState = getState().activeChallenge;
    if (updatedState?.challengerVote && updatedState?.defenderVote) {
        const annChannel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;

        await interaction.message.edit({ components: [] }).catch(() => null);

        if (updatedState.challengerVote === updatedState.defenderVote) {
            const finalWinnerId = updatedState.challengerVote;
            const { isNewKing, oldKingId } = processMatchEnd(getState(), finalWinnerId);
            await handleRoleAndNicknameUpdates(guild, oldKingId, finalWinnerId, isNewKing);

            if (annChannel) {
                const streak = getState().streak;
                const challengeButton = new ButtonBuilder()
                    .setCustomId('challenge_king')
                    .setLabel('Challenge the King')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️');
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(challengeButton);

                const embed = new EmbedBuilder()
                    .setColor(isNewKing ? 0xFFA500 : 0x00FF00)
                    .setTitle(isNewKing ? "👑 NEW KING!" : "👑 STILL KING!")
                    .setDescription(isNewKing
                        ? `<@${finalWinnerId}> has defeated <@${oldKingId}> and claimed the throne!`
                        : `<@${finalWinnerId}> defended the throne!`)
                    .addFields({ name: "Current Streak", value: `**${streak}**`, inline: true })
                    .setTimestamp();

                // Add winner avatar
                const winnerMember = await guild.members.fetch(finalWinnerId).catch(() => null);
                if (winnerMember) embed.setThumbnail(winnerMember.user.displayAvatarURL());

                if ((config as any).announcementImagePath) {
                    embed.setImage((config as any).announcementImagePath);
                }

                await annChannel.send({ embeds: [embed], components: [row] });
            }
        } else {
            clearVotes();
            if (annChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle("⚠️ VOTE CONFLICT!")
                    .setDescription(`<@${challenge.challenger}> and <@${challenge.defender}> disagreed on the winner. **Please vote again.**`)
                    .setTimestamp();

                if ((config as any).announcementImagePath) {
                    embed.setImage((config as any).announcementImagePath);
                }
                await annChannel.send({ embeds: [embed] });
            }
            await sendReportButtons(guild, challenge.challenger, challenge.defender);
        }
    }
}