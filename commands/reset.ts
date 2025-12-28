import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder, GuildMember } from 'discord.js';
import { fullReset } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Full reset of the King of the Hill state (Admin/Mod only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild); // Base level permission, role check inside

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;
    if (!guild || !member) return;

    // Check for Mod role if not Admin
    const hasModRole = member.roles.cache.some(r => r.name === config.modRoleName);
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    if (!hasModRole && !isAdmin) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("❌ Permission Denied")
            .setDescription("You do not have permission to use this command. Only Admins and Moderators can reset the state.");
        return interaction.editReply({ embeds: [errorEmbed] });
    }

    console.log(`[AUD] /reset initiated by ${interaction.user.tag}`);

    // 1. Reset DB
    fullReset();

    // 2. Remove King role from everyone
    const role = guild.roles.cache.find(r => r.name === config.roleName);
    if (role) {
        // Fetch only members who have the role to be efficient
        try {
            const membersWithRole = await guild.members.fetch().then(m => m.filter(mem => mem.roles.cache.has(role.id)));
            for (const [id, mem] of membersWithRole) {
                await mem.roles.remove(role).catch(() => null);
                // Remove existing [n] streak suffix if it exists
                const baseName = mem.displayName.replace(/\s\[\d+\]$/, '');
                if (mem.displayName !== baseName) {
                    await mem.setNickname(baseName).catch(() => null);
                }
            }
        } catch (e) {
            console.error('[ERR] Failed to fetch members or remove roles:', e);
        }
    }

    // 3. Announce in game channel
    const channel = guild.channels.cache.find(c => c.name === config.channelName) as TextChannel;
    if (channel) {
        const resetAnnouncement = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("🔄 FULL RESET!")
            .setDescription("The King of the Hill state has been cleared by a moderator. The throne is now vacant!")
            .setTimestamp();

        // Add server image from config
        if ((config as any).announcementImagePath) {
            resetAnnouncement.setImage((config as any).announcementImagePath);
        }

        // Add user avatar (user per profile image)
        const userAvatar = interaction.user.displayAvatarURL();
        resetAnnouncement.setThumbnail(userAvatar);

        // Add server image from config
        if (config.announcementImagePath) {
            resetAnnouncement.setImage(config.announcementImagePath);
        }

        // Add author info (optional, but shows who did it)
        resetAnnouncement.setAuthor({
            name: `${interaction.user.tag}`,
            iconURL: userAvatar
        });

        await channel.send({ embeds: [resetAnnouncement] });
    }

    // 4. Success message to the user
    const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("✅ Reset Complete")
        .setDescription("The bot state has been fully reset, and the King role has been removed from all players.");

    await interaction.editReply({ embeds: [successEmbed] });
};
