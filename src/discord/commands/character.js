import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';
import { BASE_CLASSES } from '../../game/classes/classData.js';
import { createCharacterProfileEmbed } from '../embeds/uiBuilders.js';
import { resolveLevelUps } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Manage your Orbforge characters')
  .addSubcommand(sub =>
    sub.setName('create')
      .setDescription('Create a new Orbforge character')
      .addStringOption(opt =>
        opt.setName('name')
          .setDescription('Character Name')
          .setRequired(true))
      .addStringOption(opt =>
        opt.setName('class')
          .setDescription('Select base class')
          .setRequired(true)
          .addChoices(
            { name: 'Warrior (Strength & Physical Juggernaut)', value: 'Warrior' },
            { name: 'Ranger (Dexterity & Critical Precision)', value: 'Ranger' },
            { name: 'Mage (Intelligence & Elemental Magic)', value: 'Mage' }
          )))
  .addSubcommand(sub =>
    sub.setName('profile')
      .setDescription('View your active character profile and stats'))
  .addSubcommand(sub =>
    sub.setName('list')
      .setDescription('List all your characters'))
  .addSubcommand(sub =>
    sub.setName('select')
      .setDescription('Switch your active character')
      .addStringOption(opt =>
        opt.setName('name')
          .setDescription('Name of character to make active')
          .setRequired(true)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const discordId = interaction.user.id;

  let user = await User.findOne({ discordId });
  if (!user) {
    user = await User.create({ discordId });
  }

  if (subcommand === 'create') {
    const name = interaction.options.getString('name');
    const className = interaction.options.getString('class');

    const characterCount = await Character.countDocuments({ userId: user._id });
    const maxAllowedSlots = user.characterSlots.base + user.characterSlots.purchased;

    if (characterCount >= maxAllowedSlots) {
      return interaction.reply({ 
        content: `❌ You have reached your maximum character slots (${characterCount}/${maxAllowedSlots}). Upgrade slots in \`/shop\`!`, 
        ephemeral: true 
      });
    }

    const classConfig = BASE_CLASSES[className];
    const newCharacter = await Character.create({
      userId: user._id,
      discordId,
      name,
      className,
      baseStats: classConfig.baseStats,
      skillPoints: { available: 1, spent: 0 }
    });

    user.activeCharacterId = newCharacter._id;
    await user.save();

    const embed = createCharacterProfileEmbed(newCharacter);
    return interaction.reply({
      content: `🎉 Successfully created character **${name}** standard class **${className}**!`,
      embeds: [embed]
    });
  }

  if (subcommand === 'profile') {
    if (!user.activeCharacterId) {
      return interaction.reply({ 
        content: '❌ You do not have an active character. Create one using `/character create`!', 
        ephemeral: true 
      });
    }

    const character = await Character.findById(user.activeCharacterId);
    if (!character) {
      return interaction.reply({ content: '❌ Active character not found. Create one with `/character create`!', ephemeral: true });
    }

    if (resolveLevelUps(character) > 0) {
      await character.save();
    }

    const equippedItems = await Item.find({ characterId: character._id, isEquipped: true });
    const embed = createCharacterProfileEmbed(character, equippedItems);
    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'list') {
    const characters = await Character.find({ userId: user._id });
    if (characters.length === 0) {
      return interaction.reply({ content: 'You have no characters yet. Create one with `/character create`!', ephemeral: true });
    }

    const listText = characters.map(c => {
      const activeMarker = user.activeCharacterId && user.activeCharacterId.toString() === c._id.toString() ? ' ⭐ **[ACTIVE]**' : '';
      return `• **${c.name}** — Level ${c.level} ${c.className}${c.subclassName ? ` (${c.subclassName})` : ''}${activeMarker}`;
    }).join('\n');

    return interaction.reply({
      content: `📜 **Your Characters (${characters.length}/${user.characterSlots.base + user.characterSlots.purchased})**:\n${listText}\n\n*Use \`/character select name:<name>\` to switch active character!*`
    });
  }

  if (subcommand === 'select') {
    const targetName = interaction.options.getString('name');
    const targetChar = await Character.findOne({ 
      userId: user._id, 
      name: { $regex: new RegExp(`^${targetName}$`, 'i') } 
    });

    if (!targetChar) {
      return interaction.reply({ 
        content: `❌ No character found with name "${targetName}". View your characters with \`/character list\`.`, 
        ephemeral: true 
      });
    }

    user.activeCharacterId = targetChar._id;
    await user.save();

    return interaction.reply({
      content: `⭐ Switched active character to **${targetChar.name}** (Level ${targetChar.level} ${targetChar.className})!`
    });
  }
}
