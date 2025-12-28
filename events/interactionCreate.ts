import { Events, Interaction, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { ExtendedClient } from '../Client';
import config from '../config.json';

export const name = Events.InteractionCreate;
export const execute = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;
    console.log(`📥 Received command: /${commandName} from ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);

    try {
        const command = (interaction.client as ExtendedClient).commands.get(commandName);

        if (!command) {
            console.error(`❌ No command matching ${commandName} was found.`);
            return interaction.reply({ content: 'Command not found.', ephemeral: true });
        }

        // 1. Defer the reply immediately to give us time (3s -> 15m)
        console.log(`⏱️ Deferring reply for /${commandName}...`);
        await interaction.deferReply({ ephemeral: true });

        // 2. Channel Restriction Logic
        const channel = interaction.channel;
        const channelName = channel && 'name' in channel ? (channel as any).name : null;

        const announcementsOnly = ['challenge', 'accept'];
        const reportsOnly = ['report', 'king', 'setking'];

        if (announcementsOnly.includes(commandName) && channelName !== config.channelName) {
            console.log(`⚠️ Restriction: /${commandName} used in wrong channel. Expected: ${config.channelName}`);
            const announcementChannel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
            return interaction.editReply({
                content: `❌ This command can only be used in the ${announcementChannel ? `<#${announcementChannel.id}>` : `#${config.channelName}`} channel.`
            });
        }

        if (reportsOnly.includes(commandName) && channelName !== config.reportChannelName) {
            console.log(`⚠️ Restriction: /${commandName} used in wrong channel. Expected: ${config.reportChannelName}`);
            const reportChannel = interaction.guild?.channels.cache.find(c => c.name === config.reportChannelName);
            return interaction.editReply({
                content: `❌ This command can only be used in the ${reportChannel ? `<#${reportChannel.id}>` : `#${config.reportChannelName}`} channel.`
            });
        }

        console.log(`⚙️ Executing /${commandName}...`);
        await command.execute(interaction);
        console.log(`✅ Successfully executed /${commandName}`);
    } catch (error) {
        console.error(`💥 Error handling /${commandName}:`, error);

        try {
            const errorMsg = 'There was an error while executing this command!';
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: errorMsg });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        } catch (innerError) {
            console.error('CRITICAL: Failed to send error reply:', innerError);
        }
    }
};
