import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';
import { SKILL_REGISTRY, CLASS_CORE_SKILL } from '../../game/skills/skillRegistry.js';
import { learnSkillFromBook, equipSkill, rankUpSkill } from '../../game/skills/skillBookEngine.js';
import { createSkillsEmbed } from '../embeds/uiBuilders.js';

// A character can always equip their guaranteed core skill (clearing the
// 2nd slot) plus any skill they've learned from a book.
export function getEquipChoicesForCharacter(character) {
  const coreId = CLASS_CORE_SKILL[character.className];
  const coreSkill = SKILL_REGISTRY[coreId];
  const choices = coreSkill ? [{ name: `${coreSkill.name} (core, always active)`, value: coreId }] : [];

  for (const known of character.knownSkills || []) {
    if (known.skillId === coreId) continue;
    const skill = SKILL_REGISTRY[known.skillId];
    if (skill) choices.push({ name: `${skill.name} (Rank ${known.rank}/${skill.ranks.length})`, value: known.skillId });
  }

  return choices;
}

// Only skills below max rank, and only when there's a point to spend —
// mirrors getEligibleAscendNodes's affordability-filtering precedent.
export function getRankupChoicesForCharacter(character) {
  if (character.combatSkillPoints.available < 1) return [];

  return (character.knownSkills || [])
    .map(known => ({ known, skill: SKILL_REGISTRY[known.skillId] }))
    .filter(({ known, skill }) => skill && known.rank < skill.ranks.length)
    .map(({ known, skill }) => ({ name: `${skill.name} (Rank ${known.rank}/${skill.ranks.length})`, value: known.skillId }));
}

export const data = new SlashCommandBuilder()
  .setName('skills')
  .setDescription('Learn, rank up, and equip combat skills')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View your known skills, equipped loadout, and Combat Skill Points'))
  .addSubcommand(sub =>
    sub.setName('learn')
      .setDescription('Learn a skill from a Skill Book in your inventory')
      .addStringOption(opt =>
        opt.setName('item_id')
          .setDescription('Skill Book to consume')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(sub =>
    sub.setName('equip')
      .setDescription('Choose which known skill occupies your 2nd combat slot')
      .addStringOption(opt =>
        opt.setName('skill_id')
          .setDescription('Skill to equip')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(sub =>
    sub.setName('rankup')
      .setDescription('Spend a Combat Skill Point to rank up a known skill')
      .addStringOption(opt =>
        opt.setName('skill_id')
          .setDescription('Skill to rank up')
          .setRequired(true)
          .setAutocomplete(true)));

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
    return interaction.reply({ embeds: [createSkillsEmbed(character)] });
  }

  if (subcommand === 'learn') {
    const itemId = interaction.options.getString('item_id');
    const item = await Item.findOne({ _id: itemId, characterId: character._id, type: 'skill_book' });
    if (!item) {
      return interaction.reply({ content: '❌ Skill Book not found in your inventory.', ephemeral: true });
    }

    try {
      const res = learnSkillFromBook(character, item);
      await character.save();
      await Item.deleteOne({ _id: item._id });
      return interaction.reply({
        content: `📖 **${character.name}** learned **${SKILL_REGISTRY[res.skillId].name}**! Use \`/skills equip\` to slot it in.`
      });
    } catch (err) {
      return interaction.reply({ content: `❌ Learning failed: ${err.message}`, ephemeral: true });
    }
  }

  if (subcommand === 'equip') {
    const skillId = interaction.options.getString('skill_id');
    try {
      const res = equipSkill(character, skillId);
      await character.save();
      return interaction.reply({ content: `✅ Equipped **${SKILL_REGISTRY[res.skillId].name}**.` });
    } catch (err) {
      return interaction.reply({ content: `❌ Equip failed: ${err.message}`, ephemeral: true });
    }
  }

  if (subcommand === 'rankup') {
    const skillId = interaction.options.getString('skill_id');
    try {
      const res = rankUpSkill(character, skillId);
      await character.save();
      return interaction.reply({ content: `⬆️ **${SKILL_REGISTRY[res.skillId].name}** ranked up to **Rank ${res.newRank}**!` });
    } catch (err) {
      return interaction.reply({ content: `❌ Rank up failed: ${err.message}`, ephemeral: true });
    }
  }
}

export async function handleLearnAutocomplete(interaction) {
  const discordId = interaction.user.id;
  const user = await User.findOne({ discordId });
  const character = user?.activeCharacterId ? await Character.findById(user.activeCharacterId) : null;
  if (!character) return interaction.respond([]);

  const books = await Item.find({ characterId: character._id, type: 'skill_book' });
  const focused = interaction.options.getFocused().toLowerCase();
  const choices = books
    .map(book => ({ name: book.name, value: book._id.toString() }))
    .filter(c => c.name.toLowerCase().includes(focused));

  return interaction.respond(choices.slice(0, 25));
}

export async function handleEquipAutocomplete(interaction) {
  const discordId = interaction.user.id;
  const user = await User.findOne({ discordId });
  const character = user?.activeCharacterId ? await Character.findById(user.activeCharacterId) : null;
  if (!character) return interaction.respond([]);

  const focused = interaction.options.getFocused().toLowerCase();
  const choices = getEquipChoicesForCharacter(character).filter(c => c.name.toLowerCase().includes(focused));
  return interaction.respond(choices.slice(0, 25));
}

export async function handleRankupAutocomplete(interaction) {
  const discordId = interaction.user.id;
  const user = await User.findOne({ discordId });
  const character = user?.activeCharacterId ? await Character.findById(user.activeCharacterId) : null;
  if (!character) return interaction.respond([]);

  const focused = interaction.options.getFocused().toLowerCase();
  const choices = getRankupChoicesForCharacter(character).filter(c => c.name.toLowerCase().includes(focused));
  return interaction.respond(choices.slice(0, 25));
}
