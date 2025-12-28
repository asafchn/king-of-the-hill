import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getState } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Accept a pending challenge');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    console.log('[Accept] Starting execution...');
    const state = getState();
    const user = interaction.user;

    console.log(`[Accept] User: ${user.tag}`);

    if (!state.activeChallenge) {
        console.log('[Accept] No active challenge found.');
        return interaction.editReply({ content: 'There is no active challenge to accept.' });
    }

    if (state.activeChallenge.defender !== user.id) {
        console.log(`[Accept] User ${user.tag} is not the defender. Defender ID: ${state.activeChallenge.defender}`);
        return interaction.editReply({ content: 'You are not the defender in the current challenge!' });
    }

    if (state.activeChallenge.accepted) {
        console.log('[Accept] Challenge already accepted.');
        return interaction.editReply({ content: 'The challenge has already been accepted.' });
    }

    console.log('[Accept] Updating state: accepted = true');
    state.activeChallenge.accepted = true;

    const channel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
    if (channel && channel.isTextBased()) {
        console.log(`[Accept] Sending announcement to channel: ${config.channelName}`);
        await channel.send(`✅ **ACCEPTED!** The match between <@${state.activeChallenge.challenger}> and <@${state.activeChallenge.defender}> is ON!`);
    } else {
        console.warn(`[Accept] Announcement channel ${config.channelName} not found or not text-based.`);
    }

    console.log('[Accept] Replying to user...');
    await interaction.editReply({ content: 'Challenge accepted! Good luck!' });
    console.log('[Accept] Execution finished.');
};
