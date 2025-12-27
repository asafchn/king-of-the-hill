import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getState } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Accept a pending challenge');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const state = getState();
    const user = interaction.user;

    if (!state.activeChallenge) {
        return interaction.reply({ content: 'There is no active challenge to accept.', ephemeral: true });
    }

    if (state.activeChallenge.defender !== user.id) {
        return interaction.reply({ content: 'You are not the defender in the current challenge!', ephemeral: true });
    }

    if (state.activeChallenge.accepted) {
        return interaction.reply({ content: 'The challenge has already been accepted.', ephemeral: true });
    }

    state.activeChallenge.accepted = true;

    const channel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
    if (channel && channel.isTextBased()) {
        await channel.send(`✅ **ACCEPTED!** The match between <@${state.activeChallenge.challenger}> and <@${state.activeChallenge.defender}> is ON!`);
    }

    await interaction.reply({ content: 'Challenge accepted! Good luck!', ephemeral: true });
};
