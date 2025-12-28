import { EmbedBuilder, Guild, GuildMember, TextChannel } from "discord.js";
import { getState, checkAndRevoke } from '../gameState';
import config from '../config.json';

export async function getCurrentKing(guild: Guild): Promise<GuildMember | null> {
    const role = guild.roles.cache.find(r => r.name === config.roleName);
    if (!role) return null;

    try {
        const members = await guild.members.fetch({ time: 5000 });
        return members.find(m => m.roles.cache.has(role.id)) || null;
    } catch (error) {
        return guild.members.cache.find(m => m.roles.cache.has(role.id)) || null;
    }
}

/**
 * Synchronizes the Discord roles and nicknames with the database state.
 */
export async function syncKingState(guild: Guild) {
    const state = getState();
    const role = guild.roles.cache.find(r => r.name === config.roleName);
    const channel = guild.channels.cache.find(c => c.name === config.channelName) as TextChannel;

    if (!role) {
        console.error(`[ERR] Role "${config.roleName}" not found during sync.`);
        return;
    }

    // 1. Fetch all members with the role to see who current "has" it
    const membersWithRole = await guild.members.fetch().then(m => m.filter(mem => mem.roles.cache.has(role.id)));

    // 2. Determine who SHOULD have the role
    const dbKingId = state.king;

    // 3. Cleanup: Remove role from everyone who shouldn't have it
    for (const [id, member] of membersWithRole) {
        if (id !== dbKingId) {
            await member.roles.remove(role).catch(() => null);
            console.log(`[AUD] Removed stale King role from ${member.user.tag}`);
        }
    }

    // 4. Update the actual King
    if (dbKingId) {
        try {
            const kingMember = await guild.members.fetch(dbKingId);
            if (kingMember) {
                // Ensure they have the role
                if (!kingMember.roles.cache.has(role.id)) {
                    await kingMember.roles.add(role);
                    console.log(`[AUD] Restored King role to ${kingMember.user.tag}`);
                }
                // Update nickname streak
                await updateStreakNickname(kingMember, channel);
            }
        } catch (e) {
            console.error(`[ERR] Could not fetch DB King ${dbKingId} for sync.`);
        }
    }
}

/**
 * Updates the user's nickname with their current win streak.
 * Preserves server-specific aliases and avoids streak stacking.
 */
export async function updateStreakNickname(member: GuildMember, channel?: any) {
    const streak = getState().streak;
    // Remove existing [n] streak suffix if it exists
    const baseName = member.displayName.replace(/\s\[\d+\]$/, '');
    const newNick = `${baseName} [${streak}]`;

    if (member.nickname === newNick) return;

    try {
        await member.setNickname(newNick);
        console.log(`[AUD] Updated nickname for ${member.user.tag} to: ${newNick}`);
    } catch (err) {
        console.error(`[ERR] Nickname update failed for ${member.user.tag}`, err);
        if (channel && channel.isTextBased()) {
            await channel.send(`⚠️ (Note: Could not update <@${member.id}>'s nickname due to permissions)`);
        }
    }
}

/**
 * Checks for inactivity and handles Discord side effects if a revocation occurs.
 */
export async function checkAndHandleRevocation(guild: Guild) {
    const revokedId = checkAndRevoke();
    if (!revokedId) return;

    console.log(`[AUD] King revocation detected for ${revokedId}. Handling side effects...`);

    const role = guild.roles.cache.find(r => r.name === config.roleName);
    const channel = guild.channels.cache.find(c => c.name === config.channelName) as TextChannel;

    try {
        const member = await guild.members.fetch(revokedId).catch(() => null);
        if (member) {
            if (role) await member.roles.remove(role).catch(() => null);

            // Strip streak from nickname
            const baseName = member.displayName.replace(/\s\[\d+\]$/, '');
            if (member.nickname !== baseName) {
                await member.setNickname(baseName).catch(() => null);
            }
        }

        if (channel && channel.isTextBased()) {
            const timeoutHours = config.inactivityTimeoutHours || 72;
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle("⚖️ THE CROWN HAS BEEN REVOKED!")
                .setDescription(`<@${revokedId}> failed to respond to a challenge within ${timeoutHours} hours. The throne is now vacant!`)
                .setTimestamp();

            if ((config as any).announcementImagePath) {
                embed.setImage((config as any).announcementImagePath);
            }

            await channel.send({ embeds: [embed] });
        }
    } catch (e) {
        console.error('[ERR] Failed to handle King revocation side effects:', e);
    }
}
