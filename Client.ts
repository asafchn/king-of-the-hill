import { Client, GatewayIntentBits, Collection } from "discord.js";
import * as challengeCommand from "./commands/challenge";
import * as kingCommand from "./commands/king";
import * as setkingCommand from "./commands/setking";
import * as dashboardCommand from "./commands/dashboard";
import * as resetCommand from "./commands/reset";

export class ExtendedClient extends Client {
    public commands: Collection<string, any> = new Collection();
}

export const client = new ExtendedClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

export function registerCommands() {
    client.commands.set(challengeCommand.data.name, challengeCommand);
    client.commands.set(kingCommand.data.name, kingCommand);
    client.commands.set(setkingCommand.data.name, setkingCommand);
    client.commands.set(dashboardCommand.data.name, dashboardCommand);
    client.commands.set(resetCommand.data.name, resetCommand);
}
