import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { data as characterCmd } from './commands/character.js';
import { data as treeCmd } from './commands/tree.js';
import { data as craftCmd } from './commands/craft.js';
import { data as dungeonCmd } from './commands/dungeon.js';
import { data as shopCmd } from './commands/shop.js';
import { data as tutorialCmd } from './commands/tutorial.js';

dotenv.config();

const commands = [
  characterCmd.toJSON(),
  treeCmd.toJSON(),
  craftCmd.toJSON(),
  dungeonCmd.toJSON(),
  shopCmd.toJSON(),
  tutorialCmd.toJSON()
];

export async function deploySlashCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    console.warn('[Deploy] DISCORD_TOKEN or CLIENT_ID missing. Skipping live Discord slash command deployment.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`[Deploy] Refreshing ${commands.length} application (/) commands...`);

    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`[Deploy] Successfully deployed commands to Guild: ${guildId}`);
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('[Deploy] Successfully deployed commands globally.');
    }
  } catch (error) {
    console.error('[Deploy] Error deploying commands:', error);
  }
}

if (process.argv[1].endsWith('deployCommands.js')) {
  deploySlashCommands();
}
