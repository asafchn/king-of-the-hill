import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getState } from '../gameState';
import { getCurrentKing } from '../utils/roleUtils';

export const data = new SlashCommandBuilder()
    .setName('king')
    .setDescription('Show the current King and their streak');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const currentKingMember = await getCurrentKing(guild);
    const state = getState();

    if (!currentKingMember) {
        return interaction.reply('There is no King currently reigning!');
    }

    const streak = state.streak;
    await interaction.reply(`👑 The current King is ${currentKingMember} with a win streak of **${streak}**!`);
};
