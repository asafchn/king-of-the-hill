import { Events, Interaction, ChatInputCommandInteraction, ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { ExtendedClient } from '../Client';
import config from '../config.json';
import { handleButtonInteraction, handleModalInteraction } from './interactionHandlers';

export const name = Events.InteractionCreate;
export const execute = async (interaction: Interaction) => {
    // 1. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        console.log(`[CMD] /${commandName} by ${interaction.user.tag}`);

        try {
            const command = (interaction.client as ExtendedClient).commands.get(commandName);

            if (!command) {
                console.error(`[ERR] Command /${commandName} not found.`);
                return interaction.reply({ content: 'Command not found.', ephemeral: true });
            }

            // Defer if not the dashboard
            if (commandName !== 'dashboard') {
                await interaction.deferReply({ ephemeral: true });
            }

            // Channel Restriction Logic
            const channel = interaction.channel;
            const channelName = channel && 'name' in channel ? (channel as any).name : null;

            const announcementsOnly = ['challenge', 'accept'];
            const reportsOnly = ['report', 'king', 'setking', 'dashboard'];

            if (announcementsOnly.includes(commandName) && channelName !== config.channelName) {
                const announcementChannel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
                const msg = `❌ Use in ${announcementChannel ? `<#${announcementChannel.id}>` : `#${config.channelName}`}.`;
                if (interaction.deferred) return interaction.editReply({ content: msg });
                return interaction.reply({ content: msg, ephemeral: true });
            }

            if (reportsOnly.includes(commandName) && channelName !== config.reportChannelName) {
                const reportChannel = interaction.guild?.channels.cache.find(c => c.name === config.reportChannelName);
                const msg = `❌ Use in ${reportChannel ? `<#${reportChannel.id}>` : `#${config.reportChannelName}`}.`;
                if (interaction.deferred) return interaction.editReply({ content: msg });
                return interaction.reply({ content: msg, ephemeral: true });
            }

            await command.execute(interaction);
        } catch (error) {
            console.error(`[ERR] /${commandName}:`, (error as Error).message);
            const errorMsg = 'An error occurred during command execution.';
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: errorMsg });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        }
        return;
    }

    // 2. Handle Buttons
    if (interaction.isButton()) {
        console.log(`[BTN] ${interaction.customId} by ${interaction.user.tag}`);
        try {
            await handleButtonInteraction(interaction as ButtonInteraction);
        } catch (error) {
            console.error(`[ERR] Button ${interaction.customId}:`, (error as Error).message);
        }
        return;
    }

    // 3. Handle Modals
    if (interaction.isModalSubmit()) {
        console.log(`[MOD] ${interaction.customId} by ${interaction.user.tag}`);
        try {
            await handleModalInteraction(interaction as ModalSubmitInteraction);
        } catch (error) {
            console.error(`[ERR] Modal ${interaction.customId}:`, (error as Error).message);
        }
        return;
    }
};
