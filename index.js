import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import dotenv from 'dotenv';
import { connectDatabase } from './src/config/database.js';
import * as characterCmd from './src/discord/commands/character.js';
import * as treeCmd from './src/discord/commands/tree.js';
import * as forgeCmd from './src/discord/commands/forge.js';
import * as dungeonCmd from './src/discord/commands/dungeon.js';
import * as tutorialCmd from './src/discord/commands/tutorial.js';
import * as inventoryCmd from './src/discord/commands/inventory.js';
import * as tradeCmd from './src/discord/commands/trade.js';
import * as redeemCmd from './src/discord/commands/redeem.js';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

const commands = [characterCmd, treeCmd, forgeCmd, dungeonCmd, tutorialCmd, inventoryCmd, tradeCmd, redeemCmd];
for (const cmd of commands) {
  if (cmd.data && cmd.data.name) {
    client.commands.set(cmd.data.name, cmd);
  }
}

client.once(Events.ClientReady, c => {
  console.log(`\n========================================`);
  console.log(`[Orbforge] ⚔️ Bot online as ${c.user.tag}`);
  console.log(`[Orbforge] 📖 /tutorial & /dungeon are ready to use!`);
  console.log(`========================================\n`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[Error] Command ${interaction.commandName} execution error:`, error);
      const replyOptions = { 
        content: `❌ Command error: ${error.message.includes('buffering timed out') || error.message.includes('whitelist') ? 'Database connection not ready. Please ensure your IP is whitelisted in MongoDB Atlas!' : 'An error occurred while executing this command!'}`, 
        ephemeral: true 
      };
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
    if (interaction.customId.startsWith('combat:') || interaction.customId.startsWith('combat_')) {
      await dungeonCmd.handleCombatButton(interaction);
    } else if (interaction.customId.startsWith('dungeon:')) {
      await dungeonCmd.handleLobbyButton(interaction);
    } else if (interaction.customId.startsWith('trade:')) {
      await tradeCmd.handleTradeButton(interaction);
    } else if (interaction.customId.startsWith('tutorial:') || interaction.customId.startsWith('tutorial_')) {
      await tutorialCmd.handleTutorialButton(interaction);
    }
  }
});

async function main() {
  if (!process.env.DISCORD_TOKEN) {
    console.error('[Orbforge] ❌ Error: DISCORD_TOKEN is missing in .env!');
    process.exit(1);
  }

  // Attempt database connection in the background so bot can log in immediately
  connectDatabase().catch(err => {
    console.warn('[Orbforge] ⚠️ Database connection failed on startup. Commands requiring DB will wait or prompt.');
  });

  try {
    console.log('[Orbforge] Logging into Discord...');
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    console.error('[Orbforge] ❌ Discord login failure:', err);
  }
}

main();
