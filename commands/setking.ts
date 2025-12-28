import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, TextChannel } from 'discord.js';
import { getCurrentKing } from '../utils/roleUtils';
import { resetStreak, setKing, getState } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('setking')
    .setDescription('Manually set the current King (Admin only)')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to crown as King')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const targetUser = interaction.options.getUser('user', true);
    const guild = interaction.guild;
    if (!guild) return;

    const currentKingMember = await getCurrentKing(guild);
    const oldKingId = currentKingMember?.id;

    resetStreak();
    setKing(targetUser.id);

    const role = guild.roles.cache.find(r => r.name === config.roleName);
    if (role) {
        if (oldKingId) {
            const oldMember = await guild.members.fetch(oldKingId).catch(() => null);
            if (oldMember) {
                await oldMember.roles.remove(role).catch(() => null);
                // Strip existing [n] streak suffix if it exists
                const baseName = oldMember.displayName.replace(/\s\[\d+\]$/, '');
                if (oldMember.nickname !== baseName) {
                    await oldMember.setNickname(baseName).catch(() => null);
                }
            }
        }
        const newMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (newMember) await newMember.roles.add(role).catch(() => null);
    }

    // Announce in game channel
    const channel = guild.channels.cache.find(c => c.name === config.channelName) as TextChannel;
    if (channel) {
        const challengeButton = new ButtonBuilder()
            .setCustomId('challenge_king')
            .setLabel('Challenge the King')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚔️');
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(challengeButton);

        const state = getState();
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle("👑 NEW KING CROWNED!")
            .setDescription(`<@${targetUser.id}> has been manually set as the King by an administrator!`)
            .addFields({ name: "Current Streak", value: `**${state.streak}**`, inline: true })
            .setTimestamp();

        // Add target user avatar
        embed.setThumbnail(targetUser.displayAvatarURL());

        // Add server image from config
        if ((config as any).announcementImagePath) {
            embed.setImage((config as any).announcementImagePath);
        }

        await channel.send({
            embeds: [embed],
            components: [row]
        });
    }

    const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("✅ King Set")
        .setDescription(`Successfully crowned <@${targetUser.id}> as the new King.`);

    await interaction.editReply({ embeds: [successEmbed] });
};
