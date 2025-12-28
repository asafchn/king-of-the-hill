import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

import * as kingCommand from './commands/king';
import * as setkingCommand from './commands/setking';
import * as dashboardCommand from './commands/dashboard';
import * as resetCommand from './commands/reset';
import * as resetchallengeCommand from './commands/resetchallenge';

dotenv.config();

const commands = [
    kingCommand.data.toJSON(),
    setkingCommand.data.toJSON(),
    dashboardCommand.data.toJSON(),
    resetCommand.data.toJSON(),
    resetchallengeCommand.data.toJSON(),
];

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error('❌ Missing environment variables! Please check your .env file.');
    if (!token) console.error('   - DISCORD_TOKEN is missing');
    if (!clientId) console.error('   - CLIENT_ID is missing');
    if (!guildId) console.error('   - GUILD_ID is missing');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands:`);
        commands.forEach(cmd => console.log(`   - /${cmd.name}`));

        const data: any = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
