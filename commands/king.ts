import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getState } from '../gameState';

export const data = new SlashCommandBuilder()
    .setName('king')
    .setDescription('Show the current King and their streak');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const state = getState();
    if (!state.king) {
        return interaction.reply('There is no King currently reigning!');
    }

    const streak = state.streak;
    await interaction.reply(`👑 The current King is <@${state.king}> with a win streak of **${streak}**!`);
};
