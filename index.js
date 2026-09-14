import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import * as characterCmd from './src/discord/commands/character.js';
import * as treeCmd from './src/discord/commands/tree.js';
import * as skillsCmd from './src/discord/commands/skills.js';
import * as forgeCmd from './src/discord/commands/forge.js';
import * as dungeonCmd from './src/discord/commands/dungeon.js';
import * as tutorialCmd from './src/discord/commands/tutorial.js';
import * as inventoryCmd from './src/discord/commands/inventory.js';
import * as tradeCmd from './src/discord/commands/trade.js';
import * as redeemCmd from './src/discord/commands/redeem.js';
import * as redeemCreateCmd from './src/discord/commands/redeemCreate.js';
import * as helpCmd from './src/discord/commands/help.js';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

const commands = [characterCmd, treeCmd, skillsCmd, forgeCmd, dungeonCmd, tutorialCmd, inventoryCmd, tradeCmd, redeemCmd, redeemCreateCmd, helpCmd];
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

// Shared failure path for anything that reaches here uncaught — every branch
// below wraps its handler in try/catch so one bad interaction (a DB hiccup, a
// null-deref) can never take the whole bot down, which used to be possible
// since only the chat-input-command branch had error handling.
async function replyWithError(interaction, error, context) {
  console.error(`[Error] ${context}:`, error);
  const replyOptions = {
    content: `❌ ${error.message?.includes('buffering timed out') || error.message?.includes('whitelist') ? 'Database connection not ready. Please ensure your IP is whitelisted in MongoDB Atlas!' : 'An error occurred while processing this action!'}`,
    ephemeral: true
  };
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  } catch (replyError) {
    console.error('[Error] Failed to send error reply to user:', replyError);
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isAutocomplete()) {
    try {
      if (interaction.commandName === 'tree') {
        const focusedName = interaction.options.getFocused(true).name;
        if (focusedName === 'subclass') {
          await treeCmd.handleAscendAutocomplete(interaction);
        } else if (focusedName === 'node_id') {
          await treeCmd.handleRespecAutocomplete(interaction);
        }
      } else if (interaction.commandName === 'skills') {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'learn') {
          await skillsCmd.handleLearnAutocomplete(interaction);
        } else if (subcommand === 'equip') {
          await skillsCmd.handleEquipAutocomplete(interaction);
        } else if (subcommand === 'rankup') {
          await skillsCmd.handleRankupAutocomplete(interaction);
        }
      }
    } catch (error) {
      // Autocomplete has no reply/followUp path — just log and let Discord
      // show an empty suggestion list rather than crash the process.
      console.error(`[Error] Autocomplete ${interaction.commandName}:`, error);
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      await replyWithError(interaction, error, `Command ${interaction.commandName} execution error`);
    }
  } else if (interaction.isStringSelectMenu()) {
    try {
      if (interaction.customId === 'tree_allocate_select') {
        await treeCmd.handleTreeSelectMenu(interaction);
      } else if (interaction.customId === 'ascendancy_allocate_select') {
        await treeCmd.handleAscendancySelectMenu(interaction);
      }
    } catch (error) {
      await replyWithError(interaction, error, `Select menu ${interaction.customId} error`);
    }
  } else if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith('combat:') || interaction.customId.startsWith('combat_')) {
        await dungeonCmd.handleCombatButton(interaction);
      } else if (interaction.customId.startsWith('dungeon:')) {
        await dungeonCmd.handleLobbyButton(interaction);
      } else if (interaction.customId.startsWith('trade:')) {
        await tradeCmd.handleTradeButton(interaction);
      } else if (interaction.customId.startsWith('tutorial:') || interaction.customId.startsWith('tutorial_')) {
        await tutorialCmd.handleTutorialButton(interaction);
      } else if (interaction.customId.startsWith('inventory:')) {
        await inventoryCmd.handleInventoryButton(interaction);
      }
    } catch (error) {
      await replyWithError(interaction, error, `Button ${interaction.customId} error`);
    }
  }
});

// Last-resort safety net — should rarely fire now that every interaction
// branch above has its own try/catch, but a crash-prone unhandled rejection
// anywhere else (e.g. a listener we forgot) must never take the bot offline.
process.on('unhandledRejection', (reason) => {
  console.error('[Error] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[Error] Uncaught exception:', error);
});

async function shutdown(signal) {
  console.log(`\n[Orbforge] Received ${signal}, shutting down gracefully...`);
  try {
    await disconnectDatabase();
  } catch (error) {
    console.error('[Orbforge] Error disconnecting database during shutdown:', error);
  }
  client.destroy();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function main() {
  if (!process.env.DISCORD_TOKEN) {
    console.error('[Orbforge] ❌ Error: DISCORD_TOKEN is missing in .env!');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('[Orbforge] ❌ Error: MONGODB_URI is missing in .env!');
    process.exit(1);
  }

  // Attempt database connection in the background so bot can log in immediately.
  // A missing env var is fatal above; a transient connection failure (e.g. an
  // Atlas IP-whitelist or network hiccup) is not — the bot still comes online
  // and DB-dependent commands surface a clear error per-call until it recovers.
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
