import dotenv from 'dotenv';
import * as readyEvent from './events/ready';
import * as interactionCreateEvent from './events/interactionCreate';
import { client, registerCommands } from './Client';

dotenv.config();
registerCommands();

client.once(readyEvent.name, (...args) => readyEvent.execute(...args));
client.on(interactionCreateEvent.name, (...args) => interactionCreateEvent.execute(...args));

client.login(process.env.DISCORD_TOKEN)
    .catch(err => console.error('[ERR] Login failed:', err.message));
