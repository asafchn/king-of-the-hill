import { Events, Client } from 'discord.js';

export const name = Events.ClientReady;
export const execute = (client: Client) => {
    console.log(`[BOT] Ready as ${client.user?.tag}`);
};
