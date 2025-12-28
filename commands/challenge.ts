import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getCurrentKing } from '../utils/roleUtils';
import { getState, setChallenge } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Challenge the current King for the throne!');

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const guild = interaction.guild;
    if (!guild) return;

    const state = await getState();
    const kingMember = await getCurrentKing(guild);

    if (!kingMember) {
        return interaction.editReply({ content: '❌ No King to challenge.' });
    }
    if (state.activeChallenge) {
        return interaction.editReply({ content: '❌ A challenge is already in progress.' });
    }
    if (interaction.user.id === kingMember.id) {
        return interaction.editReply({ content: '❌ You are the King!' });
    }

    await setChallenge({
        challenger: interaction.user.id,
        defender: kingMember.id,
        type: 'bo3',
        scores: { challenger: 0, defender: 0 },
        accepted: false
    });

    await interaction.editReply({ content: '⚔️ Challenge sent!' });

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
};
