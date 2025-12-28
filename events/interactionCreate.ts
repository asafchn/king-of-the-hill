import { Events, Interaction, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { ExtendedClient } from '../Client';
import config from '../config.json';

export const name = Events.InteractionCreate;
export const execute = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = (interaction.client as ExtendedClient).commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    // Channel Restriction Logic
    const channel = interaction.channel as TextChannel;
    const commandName = interaction.commandName;

    const announcementsOnly = ['challenge', 'accept', 'king', 'setking'];
    const reportsOnly = ['report'];

    if (announcementsOnly.includes(commandName) && channel?.name !== config.channelName) {
        return interaction.reply({
            content: `❌ This command can only be used in the <#${interaction.guild?.channels.cache.find(c => c.name === config.channelName)?.id}> channel.`,
            ephemeral: true
        });
    }

    if (reportsOnly.includes(commandName) && channel?.name !== config.reportChannelName) {
        return interaction.reply({
            content: `❌ This command can only be used in the <#${interaction.guild?.channels.cache.find(c => c.name === config.reportChannelName)?.id}> channel.`,
            ephemeral: true
        });
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
};
