import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { BASE_CLASSES } from '../../game/classes/classData.js';
import { createSkillTreeEmbed, createSkillTreeAllocateMenu, createAscendancyEmbed, createAscendancyAllocateMenu } from '../embeds/uiBuilders.js';
import { allocateNodePoint, respecNodePoint, getNodeById, ascendSubclass, getClassTree } from '../../game/skillTree/treeEngine.js';
import { allocateAscendNode, resolveAscendMilestones } from '../../game/skillTree/ascendEngine.js';

// Subclass choices are per-class (e.g. a Ranger should only ever see
// Sharpshooter/Trapper), but Discord slash-command `choices` are static and
// shown to every user regardless of class — so this list is served via
// autocomplete (handleAscendAutocomplete below) instead, filtered to the
// requesting user's actual class. Exported standalone so it's testable
// without mocking a Discord autocomplete interaction.
export function getSubclassChoicesForClass(className) {
  const classInfo = BASE_CLASSES[className];
  if (!classInfo) return [];
  return Object.values(classInfo.subclasses).map(s => ({ name: s.name, value: s.name }));
}

// The tree embed shows node names only (no raw IDs) now, so /tree respec's
// node_id option is served via autocomplete instead — labeled by name, still
// submits the id — scoped to this character's own currently-allocated nodes.
export function getRespecChoicesForCharacter(character) {
  const tree = getClassTree(character.className);
  const allocatedMap = character.passiveTree instanceof Map ? Object.fromEntries(character.passiveTree) : (character.passiveTree || {});
  return tree
    .filter(node => (allocatedMap[node.id] || 0) > 0)
    .map(node => ({ name: `${node.name} (Rank ${allocatedMap[node.id]}/${node.maxRank})`, value: node.id }));
}

export const data = new SlashCommandBuilder()
  .setName('tree')
  .setDescription('Manage your character skill tree')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View allocated passive tree nodes and available points'))
  .addSubcommand(sub =>
    sub.setName('allocate')
      .setDescription('Allocate available skill points to available tree nodes'))
  .addSubcommand(sub =>
    sub.setName('respec')
      .setDescription('Respec a previously allocated node')
      .addStringOption(opt =>
        opt.setName('node_id')
          .setDescription('Node to respec')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(sub =>
    sub.setName('ascend')
      .setDescription('Choose your subclass (free, one-time) once your Keystone gate is cleared')
      .addStringOption(opt =>
        opt.setName('subclass')
          .setDescription('Subclass to Ascend into')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(sub =>
    sub.setName('ascendancy')
      .setDescription('View and spend Ascendancy Points on your subclass mini-tree'));

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
    const embed = createSkillTreeEmbed(character);
    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'allocate') {
    if (character.skillPoints.available < 1) {
      return interaction.reply({ content: '❌ You have no available skill points left to allocate!', ephemeral: true });
    }

    const embed = createSkillTreeEmbed(character);
    const selectMenuRow = createSkillTreeAllocateMenu(character);

    if (!selectMenuRow) {
      return interaction.reply({ content: '❌ No eligible nodes currently available to allocate.', ephemeral: true });
    }

    return interaction.reply({
      embeds: [embed],
      components: [selectMenuRow]
    });
  }

  if (subcommand === 'respec') {
    const nodeId = interaction.options.getString('node_id');
    const node = getNodeById(character.className, nodeId);
    if (!node) {
      return interaction.reply({ content: `❌ Invalid node ID: ${nodeId}`, ephemeral: true });
    }

    try {
      const res = respecNodePoint(character, nodeId);
      await character.save();
      return interaction.reply({ 
        content: `🔄 Successfully respecced **${res.node.name}**! Restored 1 skill point.` 
      });
    } catch (err) {
      return interaction.reply({ content: `❌ Respec failed: ${err.message}`, ephemeral: true });
    }
  }

  if (subcommand === 'ascend') {
    const subclassName = interaction.options.getString('subclass');
    try {
      const res = ascendSubclass(character, subclassName);
      const granted = resolveAscendMilestones(character);
      await character.save();
      return interaction.reply({
        content: `⭐ **${character.name}** has Ascended into the **${res.subclassName}**! Granted **${granted}** Ascendancy Points — use \`/tree ascendancy\` to spend them.`
      });
    } catch (err) {
      return interaction.reply({ content: `❌ Ascend failed: ${err.message}`, ephemeral: true });
    }
  }

  if (subcommand === 'ascendancy') {
    if (!character.subclassName) {
      return interaction.reply({ content: '❌ You must `/tree ascend` into a subclass before spending Ascendancy Points.', ephemeral: true });
    }

    const embed = createAscendancyEmbed(character);
    const selectMenuRow = createAscendancyAllocateMenu(character);

    if (!selectMenuRow) {
      return interaction.reply({ content: '❌ No eligible/affordable Ascendancy nodes right now.', ephemeral: true });
    }

    return interaction.reply({
      embeds: [embed],
      components: [selectMenuRow]
    });
  }
}

export async function handleAscendAutocomplete(interaction) {
  const discordId = interaction.user.id;
  const user = await User.findOne({ discordId });
  const character = user?.activeCharacterId ? await Character.findById(user.activeCharacterId) : null;

  if (!character) {
    return interaction.respond([]);
  }

  return interaction.respond(getSubclassChoicesForClass(character.className));
}

export async function handleRespecAutocomplete(interaction) {
  const discordId = interaction.user.id;
  const user = await User.findOne({ discordId });
  const character = user?.activeCharacterId ? await Character.findById(user.activeCharacterId) : null;

  if (!character) {
    return interaction.respond([]);
  }

  const focused = interaction.options.getFocused().toLowerCase();
  const choices = getRespecChoicesForCharacter(character).filter(c => c.name.toLowerCase().includes(focused));
  return interaction.respond(choices.slice(0, 25));
}

export async function handleTreeSelectMenu(interaction) {
  if (interaction.customId !== 'tree_allocate_select') return;

  const discordId = interaction.user.id;
  const user = await User.findOne({ discordId });
  const character = await Character.findById(user?.activeCharacterId);

  if (!character) {
    return interaction.reply({ content: '❌ Character error.', ephemeral: true });
  }

  const selectedNodeId = interaction.values[0];
  try {
    const res = allocateNodePoint(character, selectedNodeId);
    await character.save();

    const embed = createSkillTreeEmbed(character);
    const selectMenuRow = createSkillTreeAllocateMenu(character);

    return interaction.update({
      content: `✅ Successfully allocated point into **${res.node.name}** (Rank ${res.newRank}/${res.node.maxRank})!`,
      embeds: [embed],
      components: selectMenuRow ? [selectMenuRow] : []
    });
  } catch (err) {
    return interaction.reply({ content: `❌ Allocation failed: ${err.message}`, ephemeral: true });
  }
}

export async function handleAscendancySelectMenu(interaction) {
  if (interaction.customId !== 'ascendancy_allocate_select') return;

  const discordId = interaction.user.id;
  const user = await User.findOne({ discordId });
  const character = await Character.findById(user?.activeCharacterId);

  if (!character) {
    return interaction.reply({ content: '❌ Character error.', ephemeral: true });
  }

  const selectedNodeId = interaction.values[0];
  try {
    const res = allocateAscendNode(character, selectedNodeId);
    await character.save();

    const embed = createAscendancyEmbed(character);
    const selectMenuRow = createAscendancyAllocateMenu(character);

    return interaction.update({
      content: `✅ Successfully allocated **${res.node.name}**!`,
      embeds: [embed],
      components: selectMenuRow ? [selectMenuRow] : []
    });
  } catch (err) {
    return interaction.reply({ content: `❌ Allocation failed: ${err.message}`, ephemeral: true });
  }
}
