import { ButtonInteraction, EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getCurrentKing } from '../../utils/roleUtils';
import { getState, setChallenge } from '../../gameState';
import config from '../../config.json';

export async function handleChallengeKing(interaction: ButtonInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const state = getState();
    const kingMember = await getCurrentKing(guild);

    if (!kingMember) {
        return interaction.reply({ content: '❌ No King to challenge.', ephemeral: true });
    }
    if (state.activeChallenge) {
        return interaction.reply({ content: '❌ A challenge is already in progress.', ephemeral: true });
    }
    if (interaction.user.id === kingMember.id) {
        return interaction.reply({ content: '❌ You are the King!', ephemeral: true });
    }

    setChallenge({
        challenger: interaction.user.id,
        defender: kingMember.id,
        type: 'bo3',
        scores: { challenger: 0, defender: 0 },
        accepted: false
    });

    // Remove buttons from the message that triggered this
    await interaction.message.edit({ components: [] }).catch(() => null);

    await interaction.reply({ content: '⚔️ Challenge sent!', ephemeral: true });

    const annChannel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;
    if (annChannel) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle("⚔️ NEW CHALLENGE!")
            .setDescription(`<@${interaction.user.id}> has challenged the King, <@${kingMember.id}>!`)
            .setTimestamp();

        // Add user avatar
        embed.setThumbnail(interaction.user.displayAvatarURL());

        if ((config as any).announcementImagePath) {
            embed.setImage((config as any).announcementImagePath);
        }
        await annChannel.send({ embeds: [embed] });
    }

    try {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('accept_challenge').setLabel('Accept Challenge').setStyle(ButtonStyle.Success).setEmoji('⚔️')
        );
        await kingMember.send({ content: `⚔️ **Challenged!** ${interaction.user.tag} wants the throne. 24 hours to respond!`, components: [row] });
    } catch (e) {
        if (annChannel) await annChannel.send(`⚠️ Could not DM King ${kingMember}.`);
    }
}