import { Events, Client } from 'discord.js';
import { syncKingState, checkAndHandleRevocation } from '../utils/roleUtils';

export const name = Events.ClientReady;
export const execute = async (client: Client) => {
    console.log(`[BOT] Ready as ${client.user?.tag}`);

    // Sync state for the primary guild on startup
    const guild = client.guilds.cache.first();
    if (guild) {
        await syncKingState(guild);

        // Periodic inactivity check (hourly)
        console.log('[BOT] Starting background inactivity checker...');
        setInterval(async () => {
            await checkAndHandleRevocation(guild);
        }, 60 * 60 * 1000);
    }
};
