import { Client, GatewayIntentBits, Collection } from "discord.js";
import * as challengeCommand from "./commands/challenge";
import * as acceptCommand from "./commands/accept";
import * as reportCommand from "./commands/reportResult/reportResult";
import * as kingCommand from "./commands/king";
import * as setkingCommand from "./commands/setking";

export class ExtendedClient extends Client {
    public commands: Collection<string, any> = new Collection();
}

export const client = new ExtendedClient({ intents: [GatewayIntentBits.Guilds] });

export function registerCommands() {
    client.commands.set(challengeCommand.data.name, challengeCommand);
    client.commands.set(acceptCommand.data.name, acceptCommand);
    client.commands.set(reportCommand.data.name, reportCommand);
    client.commands.set(kingCommand.data.name, kingCommand);
    client.commands.set(setkingCommand.data.name, setkingCommand);
}
