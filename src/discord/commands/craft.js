import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';
import { applyCraftingOrb } from '../../game/crafting/craftingEngine.js';
import { createItemTooltip } from '../embeds/uiBuilders.js';
import { GAME_CONFIG } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('craft')
  .setDescription('PoE-Style Crafting — Apply Orbs to modify item affixes')
  .addStringOption(opt =>
    opt.setName('orb')
      .setDescription('Select Orb currency to apply')
      .setRequired(true)
      .addChoices(
        { name: 'Orb of Kindling — Normal → Magic', value: GAME_CONFIG.ORB_TYPES.KINDLING },
        { name: 'Orb of Tempering — Add Affix to Magic', value: GAME_CONFIG.ORB_TYPES.TEMPERING },
        { name: 'Orb of Ascendance — Normal → Rare', value: GAME_CONFIG.ORB_TYPES.ASCENDANCE },
        { name: 'Orb of Unmaking — Reroll Rare Affixes', value: GAME_CONFIG.ORB_TYPES.UNMAKING },
        { name: 'Orb of Cleansing — Strip Affixes to White Base', value: GAME_CONFIG.ORB_TYPES.CLEANSING },
        { name: 'Orb of Zenith — Add High-Tier Affix to Rare', value: GAME_CONFIG.ORB_TYPES.ZENITH }
      ))
  .addStringOption(opt =>
    opt.setName('item_id')
      .setDescription('Item ID to forge')
      .setRequired(true));

export async function execute(interaction) {
  const discordId = interaction.user.id;
  const orbType = interaction.options.getString('orb');
  const itemId = interaction.options.getString('item_id');

  const user = await User.findOne({ discordId });
  if (!user || !user.activeCharacterId) {
    return interaction.reply({ content: '❌ You must have an active character. Use `/character create` first!', ephemeral: true });
  }

  const character = await Character.findById(user.activeCharacterId);
  if (!character) {
    return interaction.reply({ content: '❌ Active character not found.', ephemeral: true });
  }

  // Check currency
  const currentOrbs = character.orbs.get ? character.orbs.get(orbType) : (character.orbs[orbType] || 0);
  if (currentOrbs < 1) {
    return interaction.reply({ 
      content: `❌ You do not have any **${orbType.replace(/_/g, ' ')}** in your inventory! Earn Orbs in dungeon maps.`, 
      ephemeral: true 
    });
  }

  const item = await Item.findOne({ _id: itemId, characterId: character._id });
  if (!item) {
    return interaction.reply({ content: '❌ Item not found in your character inventory.', ephemeral: true });
  }

  // Apply PoE currency crafting logic
  const craftResult = applyCraftingOrb(item, orbType);
  if (!craftResult.success) {
    return interaction.reply({ content: `❌ Crafting failed: ${craftResult.message}`, ephemeral: true });
  }

  // Deduct 1 orb
  if (character.orbs.set) {
    character.orbs.set(orbType, currentOrbs - 1);
  } else {
    character.orbs[orbType] = currentOrbs - 1;
  }

  await character.save();
  await item.save();

  const tooltipEmbed = createItemTooltip(item);
  return interaction.reply({
    content: `🔮 **FORGE SUCCESSFUL!** ${craftResult.message}`,
    embeds: [tooltipEmbed]
  });
}
