import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import * as challengeCommand from './commands/challenge';
import * as acceptCommand from './commands/accept';
import * as reportCommand from './commands/report';
import * as kingCommand from './commands/king';
import * as setkingCommand from './commands/setking';

dotenv.config();

const commands = [
    challengeCommand.data.toJSON(),
    acceptCommand.data.toJSON(),
    reportCommand.data.toJSON(),
    kingCommand.data.toJSON(),
    setkingCommand.data.toJSON(),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data: any = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
