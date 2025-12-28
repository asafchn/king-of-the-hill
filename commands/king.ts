import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getCurrentKing } from '../utils/roleUtils';
import { getState } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('king')
    .setDescription('Show the current King and their streak');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const currentKingMember = await getCurrentKing(guild);
    const state = await getState();

    if (!currentKingMember) {
        const noKingEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("👑 No King")
            .setDescription("There is no King currently reigning!");
        return interaction.editReply({ embeds: [noKingEmbed] });
    }

    const streak = state.streak;
    const kingEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle("👑 CURRENT KING")
        .setDescription(`The current King is <@${currentKingMember.id}>!`)
        .addFields({ name: "Win Streak", value: `**${streak}**`, inline: true })
        .setTimestamp();

    // Add king avatar (user per profile image)
    kingEmbed.setThumbnail(currentKingMember.user.displayAvatarURL());

    // Add server image from config
    if ((config as any).announcementImagePath) {
        kingEmbed.setImage((config as any).announcementImagePath);
    }

    await interaction.editReply({ embeds: [kingEmbed] });
};
