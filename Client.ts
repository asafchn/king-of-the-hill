import { Client, GatewayIntentBits, Collection } from "discord.js";
import * as challengeCommand from "./commands/challenge";
import * as acceptCommand from "./commands/accept";
import * as reportCommand from "./commands/report";
import * as kingCommand from "./commands/king";
import * as setkingCommand from "./commands/setking";

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Initialize the commands collection
client.commands = new Collection();

export function registerCommands() {
    client.commands.set(challengeCommand.data.name, challengeCommand);
    client.commands.set(acceptCommand.data.name, acceptCommand);
    client.commands.set(reportCommand.data.name, reportCommand);
    client.commands.set(kingCommand.data.name, kingCommand);
    client.commands.set(setkingCommand.data.name, setkingCommand);
}
