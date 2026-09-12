import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';
import { createItemTooltip, buildInventoryEmbed, buildInventoryNavRow, INVENTORY_PAGE_SIZE } from '../embeds/uiBuilders.js';

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Manage your character inventory and equipment')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View your items, equipment, and item IDs'))
  .addSubcommand(sub =>
    sub.setName('equip')
      .setDescription('Equip an item from your inventory')
      .addStringOption(opt =>
        opt.setName('item_id')
          .setDescription('Item ID to equip')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('unequip')
      .setDescription('Unequip an equipped item')
      .addStringOption(opt =>
        opt.setName('item_id')
          .setDescription('Item ID to unequip')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('inspect')
      .setDescription('View full stats and affixes of an item')
      .addStringOption(opt =>
        opt.setName('item_id')
          .setDescription('Item ID to inspect')
          .setRequired(true)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const discordId = interaction.user.id;

  const user = await User.findOne({ discordId });
  if (!user || !user.activeCharacterId) {
    return interaction.reply({ content: '❌ You must have an active character. Use `/character create` first!', ephemeral: true });
  }

  const character = await Character.findById(user.activeCharacterId);
  if (!character) {
    return interaction.reply({ content: '❌ Active character not found.', ephemeral: true });
  }

  if (subcommand === 'view') {
    const items = await Item.find({ characterId: character._id });
    if (items.length === 0) {
      return interaction.reply({
        content: `🎒 **${character.name}'s Inventory is empty!**\nRun \`/dungeon enter\` to battle monsters and find your first gear and Orbs!`,
        ephemeral: true
      });
    }

    const embed = buildInventoryEmbed(character, items, 0);
    const unequippedCount = items.filter(i => !i.isEquipped).length;
    const totalPages = Math.max(1, Math.ceil(unequippedCount / INVENTORY_PAGE_SIZE));
    const components = totalPages > 1 ? [buildInventoryNavRow(0, totalPages, discordId)] : [];

    return interaction.reply({ embeds: [embed], components });
  }

  if (subcommand === 'inspect') {
    const itemId = interaction.options.getString('item_id');
    const item = await Item.findOne({ _id: itemId, characterId: character._id });
    if (!item) {
      return interaction.reply({ content: '❌ Item not found in your inventory.', ephemeral: true });
    }

    const embed = createItemTooltip(item);
    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'equip') {
    const itemId = interaction.options.getString('item_id');
    const item = await Item.findOne({ _id: itemId, characterId: character._id });
    if (!item) {
      return interaction.reply({ content: '❌ Item not found in your inventory.', ephemeral: true });
    }

    if (item.isEquipped) {
      return interaction.reply({ content: `⚠️ **${item.name}** is already equipped!`, ephemeral: true });
    }

    // Unequip any item currently in the same slot
    await Item.updateMany(
      { characterId: character._id, type: item.type, isEquipped: true },
      { $set: { isEquipped: false, slot: null } }
    );

    item.isEquipped = true;
    item.slot = item.type;
    await item.save();

    return interaction.reply({ 
      content: `✅ Equipped **${item.name}** to your **${item.type.toUpperCase()}** slot!` 
    });
  }

  if (subcommand === 'unequip') {
    const itemId = interaction.options.getString('item_id');
    const item = await Item.findOne({ _id: itemId, characterId: character._id });
    if (!item) {
      return interaction.reply({ content: '❌ Item not found in your inventory.', ephemeral: true });
    }

    if (!item.isEquipped) {
      return interaction.reply({ content: `⚠️ **${item.name}** is not currently equipped!`, ephemeral: true });
    }

    item.isEquipped = false;
    item.slot = null;
    await item.save();

    return interaction.reply({
      content: `📦 Unequipped **${item.name}** back to your inventory bag.`
    });
  }
}

export async function handleInventoryButton(interaction) {
  const [, , pageStr, ownerId] = interaction.customId.split(':');

  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: '❌ This inventory view belongs to someone else. Run `/inventory view` for your own!', ephemeral: true });
  }

  const user = await User.findOne({ discordId: ownerId });
  const character = await Character.findById(user.activeCharacterId);
  const items = await Item.find({ characterId: character._id });

  const unequippedCount = items.filter(i => !i.isEquipped).length;
  const totalPages = Math.max(1, Math.ceil(unequippedCount / INVENTORY_PAGE_SIZE));
  const page = Math.max(0, Math.min(parseInt(pageStr, 10), totalPages - 1));

  const embed = buildInventoryEmbed(character, items, page);
  const components = totalPages > 1 ? [buildInventoryNavRow(page, totalPages, ownerId)] : [];

  return interaction.update({ embeds: [embed], components });
}
