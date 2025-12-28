import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getCurrentKing } from '../utils/roleUtils';
import { getState } from '../gameState';

export const data = new SlashCommandBuilder()
    .setName('king')
    .setDescription('Show the current King and their streak');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const currentKingMember = await getCurrentKing(guild);
    const state = getState();

    if (!currentKingMember) {
        return interaction.editReply('There is no King currently reigning!');
    }

    const streak = state.streak;
    await interaction.editReply(`👑 The current King is ${currentKingMember} with a win streak of **${streak}**!`);
};
