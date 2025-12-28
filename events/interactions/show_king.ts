import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { getCurrentKing } from '../../utils/roleUtils';
import { getState } from '../../gameState';
import config from '../../config.json';

export async function handleShowKing(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    // Safety check for guild
    if (!interaction.guild) {
        return interaction.editReply('This command can only be used in a server.');
    }

    const king = await getCurrentKing(interaction.guild);
    const state = await getState();
    const streak = state.streak;

    if (!king) {
        const noKingEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("👑 No King")
            .setDescription("There is no King currently reigning!");
        await interaction.editReply({ embeds: [noKingEmbed] });
    } else {
        const kingEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle("👑 CURRENT KING")
            .setDescription(`The current King is ${king}!`)
            .addFields({ name: "Win Streak", value: `**${streak}**`, inline: true })
            .setTimestamp();

        // Add king avatar
        kingEmbed.setThumbnail(king.user.displayAvatarURL());

        // Add server image from config
        if ((config as any).announcementImagePath) {
            kingEmbed.setImage((config as any).announcementImagePath);
        }

        await interaction.editReply({ embeds: [kingEmbed] });
    }
}