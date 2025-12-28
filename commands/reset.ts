import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { fullReset } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Full reset of the King of the Hill state (Admin/Mod only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild); // Base level permission, role check inside

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const member = interaction.member;
    const guild = interaction.guild;
    if (!guild || !member) return;

    // Check for Mod role if not Admin
    const hasModRole = (member as any).roles.cache.some((r: any) => r.name === config.modRoleName);
    const isAdmin = (member as any).permissions.has(PermissionFlagsBits.Administrator);

    if (!hasModRole && !isAdmin) {
        return interaction.editReply({ content: '❌ You do not have permission to use this command.' });
    }

    console.log(`[AUD] /reset initiated by ${interaction.user.tag}`);

    // 1. Reset DB
    fullReset();

    // 2. Remove King role from everyone
    const role = guild.roles.cache.find(r => r.name === config.roleName);
    if (role) {
        const membersWithRole = await guild.members.fetch().then(m => m.filter(mem => mem.roles.cache.has(role.id)));
        for (const [id, member] of membersWithRole) {
            await member.roles.remove(role).catch(() => null);
            // Optionally reset nickname if we want to be thorough
            await member.setNickname(member.user.username).catch(() => null);
        }
    }

    // 3. Announce
    const channel = guild.channels.cache.find(c => c.name === config.channelName) as TextChannel;
    if (channel) {
        await channel.send('🔄 **FULL RESET!** The King of the Hill state has been cleared by a moderator. The throne is now vacant!');
    }

    await interaction.editReply({ content: '✅ Bot state has been fully reset.' });
};
