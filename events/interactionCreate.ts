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

        // Channel Restriction Logic
        const channel = interaction.channel;
        const channelName = channel && 'name' in channel ? channel.name : null;

        const announcementsOnly = ['challenge', 'accept', 'king', 'setking'];
        const reportsOnly = ['report'];

        if (announcementsOnly.includes(commandName) && channelName !== config.channelName) {
            console.log(`⚠️ Restriction: /${commandName} used in wrong channel (${channelName}). Expected: ${config.channelName}`);
            const announcementChannel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
            return interaction.reply({
                content: `❌ This command can only be used in the ${announcementChannel ? `<#${announcementChannel.id}>` : `#${config.channelName}`} channel.`,
                ephemeral: true
            });
        }

        if (reportsOnly.includes(commandName) && channelName !== config.reportChannelName) {
            console.log(`⚠️ Restriction: /${commandName} used in wrong channel (${channelName}). Expected: ${config.reportChannelName}`);
            const reportChannel = interaction.guild?.channels.cache.find(c => c.name === config.reportChannelName);
            return interaction.reply({
                content: `❌ This command can only be used in the ${reportChannel ? `<#${reportChannel.id}>` : `#${config.reportChannelName}`} channel.`,
                ephemeral: true
            });
        }

        console.log(`⚙️ Executing /${commandName}...`);
        await command.execute(interaction);
        console.log(`✅ Successfully executed /${commandName}`);
    } catch (error) {
        console.error(`💥 Error handling /${commandName}:`, error);

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } catch (innerError) {
            console.error('Failed to send error reply:', innerError);
        }
    }
};
