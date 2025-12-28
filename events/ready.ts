import { Events, Client } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;
export const execute = (client: Client) => {
    console.log('--------------------------------------------------');
    console.log(`🚀 Bot is ONLINE!`);
    console.log(`🤖 Tag: ${client.user?.tag}`);
    console.log(`🆔 ID: ${client.user?.id}`);
    console.log(`📅 Time: ${new Date().toLocaleString()}`);
    console.log('--------------------------------------------------');
};
