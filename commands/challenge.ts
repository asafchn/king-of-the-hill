import { SlashCommandBuilder, ChatInputCommandInteraction, User } from 'discord.js';
import { getState, setChallenge } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Challenge the current King or a specific user')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to challenge (optional if challenging the King)')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Best of 3 or 5')
            .setRequired(false)
            .addChoices(
                { name: 'Best of 3', value: 'bo3' },
                { name: 'Best of 5', value: 'bo5' }
            ));

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const state = getState();
    const challenger = interaction.user;
    let targetUser = interaction.options.getUser('target');
    const type = (interaction.options.getString('type') || 'bo3') as 'bo3' | 'bo5';

    if (!targetUser) {
        if (!state.king) {
            return interaction.reply({ content: 'There is no King currently! An admin needs to set one first or you can challenge someone specific.', ephemeral: true });
        }
        try {
            targetUser = await interaction.client.users.fetch(state.king);
        } catch (error) {
            return interaction.reply({ content: 'Could not find the current King.', ephemeral: true });
        }
    }

    if (state.activeChallenge) {
        return interaction.reply({ content: 'There is already an active challenge in progress!', ephemeral: true });
    }

    if (challenger.id === targetUser.id) {
        return interaction.reply({ content: 'You cannot challenge yourself!', ephemeral: true });
    }

    setChallenge({
        challenger: challenger.id,
        defender: targetUser.id,
        type: type,
        scores: { challenger: 0, defender: 0 },
        accepted: false
    });

    const channel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
    if (channel && channel.isTextBased()) {
        await channel.send(`⚔️ **CHALLENGE!** ${challenger} has challenged ${targetUser} to a **${type === 'bo3' ? 'Best of 3' : 'Best of 5'}**! \n${targetUser}, type \`/accept\` to begin!`);
    }

    await interaction.reply({ content: `Challenge sent to ${targetUser}!`, ephemeral: true });
};
