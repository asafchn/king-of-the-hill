import dotenv from 'dotenv';
import * as readyEvent from './events/ready';
import * as interactionCreateEvent from './events/interactionCreate';
import { client, registerCommands } from './Client';

console.log('🏁 Starting bot...');
dotenv.config();
console.log('📁 Environment variables loaded.');

registerCommands()
console.log('📜 Commands registered in client.');

// Register Events
client.once(readyEvent.name, (...args) => {
    console.log(`📡 Event registered: ${readyEvent.name}`);
    readyEvent.execute(...args);
});

client.on(interactionCreateEvent.name, (...args) => {
    // We don't log every interaction registration to avoid noise, 
    // but the handler itself has logging now.
    interactionCreateEvent.execute(...args);
});

console.log('🔌 Attempting to login to Discord...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('✅ client.login() call completed.'))
    .catch(err => console.error('❌ Failed to login to Discord:', err));
