import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import dotenv from 'dotenv';
import { connectDatabase } from './src/config/database.js';
import * as characterCmd from './src/discord/commands/character.js';
import * as treeCmd from './src/discord/commands/tree.js';
import * as craftCmd from './src/discord/commands/craft.js';
import * as dungeonCmd from './src/discord/commands/dungeon.js';
import * as shopCmd from './src/discord/commands/shop.js';
import * as tutorialCmd from './src/discord/commands/tutorial.js';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

const commands = [characterCmd, treeCmd, craftCmd, dungeonCmd, shopCmd, tutorialCmd];
for (const cmd of commands) {
  if (cmd.data && cmd.data.name) {
    client.commands.set(cmd.data.name, cmd);
  }
}

client.once(Events.ClientReady, c => {
  console.log(`[Orbforge] ⚔️ Bot logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[Error] Command ${interaction.commandName} execution error:`, error);
      const replyOptions = { content: '❌ An error occurred while executing this command!', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'tree_allocate_select') {
      await treeCmd.handleTreeSelectMenu(interaction);
    }
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('combat_')) {
      await dungeonCmd.handleCombatButton(interaction);
    } else if (interaction.customId.startsWith('tutorial_')) {
      await tutorialCmd.handleTutorialButton(interaction);
    }
  }
});

async function main() {
  try {
    await connectDatabase();
    
    if (process.env.DISCORD_TOKEN) {
      await client.login(process.env.DISCORD_TOKEN);
    } else {
      console.warn('[Orbforge] Warning: DISCORD_TOKEN is missing in environment variables. Bot client not connected to live Discord network.');
    }
  } catch (err) {
    console.error('[Orbforge] Startup failure:', err);
  }
}

main();
