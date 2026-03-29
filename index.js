require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();

// Load commands (single-export files)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const mod = require(path.join(commandsPath, file));

    // Single command export (name ada di root)
    if (mod.name) {
      client.commands.set(mod.name, mod);
      if (mod.aliases) mod.aliases.forEach(a => client.commands.set(a.replace(/^!/, ''), mod));
    }

    // Multi-command export (rpgtools.js dll) — object of commands
    if (!mod.name && typeof mod === 'object') {
      for (const cmd of Object.values(mod)) {
        if (cmd && cmd.name) {
          client.commands.set(cmd.name, cmd);
          if (cmd.aliases) cmd.aliases.forEach(a => client.commands.set(a.replace(/^!/, ''), cmd));
        }
      }
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

client.login(config.token);