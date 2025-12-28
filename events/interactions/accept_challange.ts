import { ButtonInteraction, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getState, acceptChallenge } from '../../gameState';
import config from '../../config.json';
import { sendReportButtons } from './vote_winner'; // Will implement this next

export async function handleAcceptChallenge(interaction: ButtonInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const state = getState();
    if (!state.activeChallenge || state.activeChallenge.accepted) {
        return interaction.reply({ content: '❌ Invalid or already accepted.', ephemeral: true });
    }

    if (interaction.user.id !== state.activeChallenge.defender) {
        return interaction.reply({ content: '❌ Only the challenged player can accept this!', ephemeral: true });
    }

    acceptChallenge();

    await interaction.message.edit({ components: [] }).catch(() => null);

    await interaction.reply({ content: '✅ Challenge accepted!', ephemeral: true });

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
}
