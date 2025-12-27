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

    // We fetch to ensure we have the most up-to-date member list
    const members = await guild.members.fetch();
    const kingMember = members.find(m => m.roles.cache.has(role.id));

    return kingMember || null;
}
