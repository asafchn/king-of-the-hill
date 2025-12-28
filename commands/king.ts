import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getState } from '../gameState';
import { getCurrentKing } from '../utils/roleUtils';

export const data = new SlashCommandBuilder()
    .setName('king')
    .setDescription('Show the current King and their streak');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    console.log('[King] Starting execution...');
    const guild = interaction.guild;
    if (!guild) {
        console.warn('[King] No guild found in interaction.');
        return;
    }

    console.log('[King] Searching for current King...');
    const currentKingMember = await getCurrentKing(guild);
    const state = getState();

    if (!currentKingMember) {
        console.log('[King] No King currently reigning.');
        return interaction.editReply('There is no King currently reigning!');
    }

    const streak = state.streak;
    console.log(`[King] Current King: ${currentKingMember.user.tag}, Streak: ${streak}`);
    await interaction.editReply(`👑 The current King is ${currentKingMember} with a win streak of **${streak}**!`);
    console.log('[King] Execution finished.');
};
