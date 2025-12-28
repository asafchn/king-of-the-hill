import { Guild, GuildMember, TextChannel } from "discord.js";
import { getState } from '../gameState';
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
 * Updates the user's nickname with their current win streak
 */
export async function updateStreakNickname(member: GuildMember, channel?: any) {
    const streak = getState().streak;
    try {
        const baseName = member.user.username;
        const newNick = `${baseName} [${streak}]`;
        if (member.nickname !== newNick) {
            await member.setNickname(newNick);
            console.log(`[AUD] Updated nickname for ${baseName} to include streak [${streak}]`);
        }
    } catch (err) {
        if (channel && channel.isTextBased()) {
            await channel.send(`(Note: Could not update ${member.user.username}'s nickname due to permissions)`);
        }
    }
}
