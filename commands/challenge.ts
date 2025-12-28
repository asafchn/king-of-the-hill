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
    console.log('[Challenge] Starting execution...');
    const state = getState();
    const challenger = interaction.user;
    let targetUser = interaction.options.getUser('target');
    const type = (interaction.options.getString('type') || 'bo3') as 'bo3' | 'bo5';

    console.log(`[Challenge] Challenger: ${challenger.tag}, Target (optional): ${targetUser?.tag}, Type: ${type}`);

    if (!targetUser) {
        if (!state.king) {
            console.log('[Challenge] No King set and no target provided.');
            return interaction.editReply({ content: 'There is no King currently! An admin needs to set one first or you can challenge someone specific.' });
        }
        try {
            console.log(`[Challenge] No target provided, fetching King from database: ${state.king}`);
            targetUser = await interaction.client.users.fetch(state.king);
        } catch (error) {
            console.error('[Challenge] Error fetching King:', error);
            return interaction.editReply({ content: 'Could not find the current King.' });
        }
    }

    if (state.activeChallenge) {
        console.log('[Challenge] Already an active challenge.');
        return interaction.editReply({ content: 'There is already an active challenge in progress!' });
    }

    if (challenger.id === targetUser.id) {
        console.log('[Challenge] Challenger tried to challenge themselves.');
        return interaction.editReply({ content: 'You cannot challenge yourself!' });
    }

    console.log(`[Challenge] Setting up challenge: ${challenger.tag} vs ${targetUser.tag}`);
    setChallenge({
        challenger: challenger.id,
        defender: targetUser.id,
        type: type,
        scores: { challenger: 0, defender: 0 },
        accepted: false
    });

    const channel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
    if (channel && channel.isTextBased()) {
        console.log(`[Challenge] Sending announcement to channel: ${config.channelName}`);
        await channel.send(`⚔️ **CHALLENGE!** ${challenger} has challenged ${targetUser} to a **${type === 'bo3' ? 'Best of 3' : 'Best of 5'}**! \n${targetUser}, type \`/accept\` to begin!`);
    } else {
        console.warn(`[Challenge] Announcement channel ${config.channelName} not found or not text-based.`);
    }

    console.log('[Challenge] Replying to user...');
    await interaction.editReply({ content: `Challenge sent to ${targetUser}!` });
    console.log('[Challenge] Execution finished.');
};
