import { SlashCommandBuilder, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getState, setChallenge } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Challenge the current King or another player')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user you want to challenge (leave empty for current King)'))
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Match type')
            .addChoices(
                { name: 'Best of 3', value: 'bo3' },
                { name: 'Best of 5', value: 'bo5' }
            ));

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const state = getState();
    const challenger = interaction.user;
    let targetUser = interaction.options.getUser('target');
    const type = (interaction.options.getString('type') || 'bo3') as 'bo3' | 'bo5';

    if (!targetUser) {
        if (!state.king) {
            return interaction.editReply({ content: 'There is no King currently! An admin needs to set one first.' });
        }
        try {
            targetUser = await interaction.client.users.fetch(state.king);
        } catch (error) {
            return interaction.editReply({ content: 'Could not find the current King.' });
        }
    }

    if (state.activeChallenge) {
        return interaction.editReply({ content: 'There is already an active challenge in progress!' });
    }

    if (challenger.id === targetUser.id) {
        return interaction.editReply({ content: 'You cannot challenge yourself!' });
    }

    setChallenge({
        challenger: challenger.id,
        defender: targetUser.id,
        type: type,
        scores: { challenger: 0, defender: 0 },
        accepted: false
    });

    const channel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
    if (channel?.isTextBased()) {
        const acceptButton = new ButtonBuilder()
            .setCustomId('accept_challenge')
            .setLabel('Accept Challenge')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚔️');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton);

        await (channel as any).send({
            content: `⚔️ **CHALLENGE!** ${challenger} has challenged ${targetUser} to a **${type === 'bo3' ? 'Best of 3' : 'Best of 5'}**! \n${targetUser}, click the button below or type \`/accept\` to begin!`,
            components: [row]
        });
    }

    await interaction.editReply({ content: `Challenge sent to ${targetUser}!` });
};
