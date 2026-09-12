import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { data as characterCmd } from './character.js';
import { data as treeCmd } from './tree.js';
import { data as forgeCmd } from './forge.js';
import { data as dungeonCmd } from './dungeon.js';
import { data as tutorialCmd } from './tutorial.js';
import { data as inventoryCmd } from './inventory.js';
import { data as tradeCmd } from './trade.js';
import { data as redeemCmd } from './redeem.js';
import { data as redeemCreateCmd } from './redeemCreate.js';

const allCommands = [
  characterCmd, treeCmd, forgeCmd, dungeonCmd, tutorialCmd,
  inventoryCmd, tradeCmd, redeemCmd, redeemCreateCmd
];

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('List all available commands');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📖 Orbforge Commands')
    .setColor('#3498db')
    .addFields(allCommands.map(cmd => ({ name: `/${cmd.name}`, value: cmd.description })));

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
