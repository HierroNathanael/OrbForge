import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { createSkillTreeEmbed, createSkillTreeAllocateMenu } from '../embeds/uiBuilders.js';
import { allocateNodePoint, respecNodePoint, getNodeById } from '../../game/skillTree/treeEngine.js';

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
          .setDescription('Node ID to respec')
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
