import { ButtonInteraction, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getState, acceptChallenge } from '../../gameState';
import config from '../../config.json';
import { sendReportButtons } from './vote_winner'; // Will implement this next

export async function handleAcceptChallenge(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    // Handle DM context: fetch the main guild
    const guild = interaction.guild || interaction.client.guilds.cache.first();
    if (!guild) {
        return interaction.editReply('❌ Could not find the server.');
    }

    try {
        const state = await getState();
        if (!state.activeChallenge || state.activeChallenge.accepted) {
            return interaction.editReply('❌ Invalid or already accepted.');
        }

        if (interaction.user.id !== state.activeChallenge.defender) {
            return interaction.editReply('❌ Only the challenged player can accept this!');
        }

        await acceptChallenge();

        await interaction.message.edit({ components: [] }).catch(() => null);

        await interaction.editReply('✅ Challenge accepted!');

        const channel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("✅ CHALLENGE ACCEPTED!")
                .setDescription(`The match between <@${state.activeChallenge.challenger}> and <@${state.activeChallenge.defender}> is **ON**!`)
                .setTimestamp();

            // Add user avatar
            embed.setThumbnail(interaction.user.displayAvatarURL());

            if ((config as any).announcementImagePath) {
                embed.setImage((config as any).announcementImagePath);
            }
            await channel.send({ embeds: [embed] });
        }

        await sendReportButtons(guild, state.activeChallenge.challenger, state.activeChallenge.defender);
    } catch (error) {
        console.error("Error handling accept challenge:", error);
        await interaction.editReply('❌ An error occurred while accepting the challenge.');
    }
}
