import { Guild, GuildMember } from "discord.js";
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
