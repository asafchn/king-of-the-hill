import { Guild, GuildMember } from 'discord.js';
import config from '../config.json';

/**
 * Retrieves the current King by finding the member with the King role.
 * @param guild The Discord guild to search in.
 * @returns The GuildMember with the king role, or null if not found.
 */
export async function getCurrentKing(guild: Guild): Promise<GuildMember | null> {
    const role = guild.roles.cache.find(r => r.name === config.roleName);
    if (!role) return null;

    // Fetch all members with a safety timeout (requires GuildMembers intent)
    console.log(`[roleUtils] Fetching members for guild: ${guild.id}...`);
    try {
        const members = await guild.members.fetch({ time: 5000 }); // 5s timeout
        const kingMember = members.find(m => m.roles.cache.has(role.id));
        return kingMember || null;
    } catch (error) {
        console.error('[roleUtils] Error or timeout during member fetch:', error);
        // Fallback: try to find from cache if fetch fails
        return guild.members.cache.find(m => m.roles.cache.has(role.id)) || null;
    }
}
