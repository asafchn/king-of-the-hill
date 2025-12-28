import { Events, Client } from 'discord.js';
import { syncKingState } from '../utils/roleUtils';

export const name = Events.ClientReady;
export const execute = async (client: Client) => {
    console.log(`[BOT] Ready as ${client.user?.tag}`);

    // Sync state for the primary guild on startup
    const guild = client.guilds.cache.first();
    if (guild) {
        await syncKingState(guild);
    }
};
