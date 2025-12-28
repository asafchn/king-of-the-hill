import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Show the interactive bot dashboard (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const execute = async (interaction: ChatInputCommandInteraction) => {
    console.log('[Dashboard] Starting execution...');

    const embed = new EmbedBuilder()
        .setTitle('👑 King of the Hill Dashboard')
        .setDescription('Use the buttons below to manage the game and check the status.')
        .setColor('#FFD700')
        .addFields(
            { name: 'Show King', value: 'Check who currently reigns and their win streak.', inline: true },
            { name: 'Crown King', value: 'Manually set a new King (Admin only).', inline: true },
            { name: 'Report Match', value: 'Submit scores for the active challenge.', inline: true }
        )
        .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('challenge_king')
                .setLabel('Challenge King')
                .setEmoji('⚔️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('show_king')
                .setLabel('Show King')
                .setEmoji('👑')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('open_crown_modal')
                .setLabel('Crown King')
                .setEmoji('🏆')
                .setStyle(ButtonStyle.Primary)
        );

    console.log('[Dashboard] Replying with embed and buttons...');
    await interaction.reply({ embeds: [embed], components: [row] });
    console.log('[Dashboard] Execution finished.');
};
