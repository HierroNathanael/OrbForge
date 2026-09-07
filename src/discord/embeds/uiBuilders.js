import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { BASE_CLASSES } from '../../game/classes/classData.js';
import { SKILL_TREE_DATA } from '../../game/skillTree/treeData.js';
import { getEligibleNodes, accumulateTreeStats } from '../../game/skillTree/treeEngine.js';
import { calculateEffectiveStats } from '../../game/combat/combatEngine.js';

export function createCharacterProfileEmbed(character, equippedItems = []) {
  const classInfo = BASE_CLASSES[character.className] || { primaryStat: 'strength' };
  const subclassName = character.subclassName ? ` (${character.subclassName})` : ' (No Subclass)';

  const treeStats = accumulateTreeStats(character.className, character.passiveTree);
  const stats = calculateEffectiveStats(character, equippedItems, treeStats);
  const orbsObj = character.orbs?.toObject ? character.orbs.toObject() : (character.orbs || {});

  const orbList = Object.entries(orbsObj)
    .filter(([k, qty]) => typeof qty === 'number' && qty > 0 && !k.startsWith('$') && k !== '_id')
    .map(([orbKey, qty]) => `• **${orbKey.replace(/_/g, ' ')}**: x${qty}`)
    .join('\n') || '• No Orbs';

  return new EmbedBuilder()
    .setTitle(`🛡️ ${character.name} — Level ${character.level} ${character.className}${subclassName}`)
    .setColor('#9b59b6')
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3408/3408591.png')
    .addFields(
      { name: '📊 Class & Archetype', value: `**Class**: ${character.className}\n**Primary Stat**: ${classInfo.primaryStat.toUpperCase()}`, inline: true },
      { name: '❤️ HP / 🔷 Mana', value: `**HP**: ${stats.maxHp}\n**Mana**: ${stats.maxMana}`, inline: true },
      { name: '⚔️ Combat Stats', value: `**Damage**: ${stats.damage}\n**Armor**: ${stats.armor}\n**Evasion**: ${stats.evasion}\n**Crit**: ${(stats.critChance * 100).toFixed(0)}%`, inline: true },
      { name: '🪙 Gold', value: `${character.gold.toLocaleString()}`, inline: true },
      { name: '✨ Experience', value: `**XP**: ${character.xp.toLocaleString()}`, inline: true },
      { name: '🔮 Crafting Orbs Inventory', value: orbList, inline: false },
      { name: '🌲 Skill Tree Progress', value: `Points Available: **${character.skillPoints.available}** | Spent: **${character.skillPoints.spent}**`, inline: false }
    )
    .setFooter({ text: 'Orbforge RPG • PoE-Inspired Discord Bot' })
    .setTimestamp();
}

export function createSkillTreeEmbed(character) {
  const className = character.className;
  const subclassName = character.subclassName;
  const allocatedMap = character.passiveTree instanceof Map ? Object.fromEntries(character.passiveTree) : (character.passiveTree || {});

  const tree = SKILL_TREE_DATA[className] || [];
  let allocatedText = '';

  for (const node of tree) {
    const rank = allocatedMap[node.id] || 0;
    if (rank > 0) {
      const effect = node.effects[rank - 1];
      allocatedText += `• **[Rank ${rank}/${node.maxRank}] ${node.name}**: ${effect.label}\n`;
    }
  }

  if (!allocatedText) allocatedText = '*No skill tree nodes allocated yet.*';

  return new EmbedBuilder()
    .setTitle(`🌲 Skill Tree — ${character.name} (${className})`)
    .setColor('#2ecc71')
    .setDescription(`Available Skill Points: **${character.skillPoints.available}**\nSpent Points: **${character.skillPoints.spent}**\n\n**Allocated Nodes:**\n${allocatedText}`)
    .setFooter({ text: 'Use /tree allocate to spend points or /tree respec to reset nodes.' });
}

export function createSkillTreeAllocateMenu(character) {
  const eligibleNodes = getEligibleNodes(character.className, character.subclassName, character.passiveTree);

  if (eligibleNodes.length === 0) {
    return null;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('tree_allocate_select')
    .setPlaceholder('Select a skill node to allocate/upgrade...');

  for (const node of eligibleNodes) {
    const allocatedMap = character.passiveTree instanceof Map ? Object.fromEntries(character.passiveTree) : (character.passiveTree || {});
    const currentRank = allocatedMap[node.id] || 0;
    const nextEffect = node.effects[currentRank];

    selectMenu.addOptions({
      label: `${node.name} (Rank ${currentRank + 1}/${node.maxRank})`,
      description: nextEffect ? nextEffect.label : 'Upgrade node',
      value: node.id
    });
  }

  return new ActionRowBuilder().addComponents(selectMenu);
}

export function createItemTooltip(item) {
  const prefixes = (item.prefixes || []).map(p => `🔹 *${p.name}*: +${p.value} ${p.stat.replace(/_/g, ' ')}`).join('\n') || '*None*';
  const suffixes = (item.suffixes || []).map(s => `🔸 *${s.name}*: +${s.value} ${s.stat.replace(/_/g, ' ')}`).join('\n') || '*None*';

  const baseStatsText = Object.entries(item.baseStats || {})
    .filter(([_, v]) => typeof v === 'number' && v > 0)
    .map(([k, v]) => `• **${k.toUpperCase()}**: +${v}`)
    .join('\n') || '• Base Item';

  const rarityColors = {
    Normal: '#ffffff',
    Magic: '#3498db',
    Rare: '#f1c40f',
    Legendary: '#e67e22'
  };

  return new EmbedBuilder()
    .setTitle(`🗡️ ${item.name} [iLvl ${item.iLvl}]`)
    .setColor(rarityColors[item.rarity] || '#ffffff')
    .addFields(
      { name: 'Rarity & Type', value: `**Rarity**: ${item.rarity}\n**Slot**: ${(item.type || 'item').toUpperCase()}${item.isEquipped ? ' 🛡️ **[EQUIPPED]**' : ''}`, inline: true },
      { name: 'Base Attributes', value: baseStatsText, inline: true },
      { name: 'Prefixes', value: prefixes, inline: false },
      { name: 'Suffixes', value: suffixes, inline: false },
      { name: 'Item ID (for crafting/equipping)', value: `\`${item._id}\``, inline: false }
    );
}

export function createCombatEmbed(encounterState) {
  const { mapTicket, round, partyState, enemyList, logs } = encounterState;

  const playerStatus = partyState.map(m => `🛡️ **${m.character.name}**: ${Math.max(0, m.currentHp)}/${m.stats.maxHp} HP | ${Math.max(0, m.currentMana ?? 0)}/${m.stats.maxMana} MP`).join('\n');
  const enemyStatus = enemyList.map(e => `${e.isBoss ? '👑' : '👾'} **${e.name}**: ${Math.max(0, e.hp)}/${e.maxHp} HP`).join('\n');
  const logText = logs.length > 0 ? logs.join('\n') : '*Battle has begun! Pick your actions for this round.*';

  return new EmbedBuilder()
    .setTitle(`⚔️ ${mapTicket ? mapTicket.name : 'Dungeon Battle'} — Round ${round}`)
    .setColor('#e74c3c')
    .addFields(
      { name: '👥 Party Status', value: playerStatus, inline: true },
      { name: '👹 Enemy Horde', value: enemyStatus, inline: true },
      { name: '📜 Round Action Logs', value: logText, inline: false }
    )
    .setFooter({ text: 'Option B Simultaneous Round Resolution • Turn-based ARPG' });
}

import { getCharacterCombatSkills } from '../../game/skills/skillRegistry.js';

export function createCombatActionButtons(character, currentMana = Infinity) {
  const characterId = character._id ? character._id.toString() : character.toString();
  const skills = typeof character === 'object' && character.className ? getCharacterCombatSkills(character) : [];

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`combat:attack:${characterId}`)
      .setLabel('Basic Attack ⚔️')
      .setStyle(ButtonStyle.Primary)
  );

  for (const skill of skills.slice(0, 2)) {
    const style = (skill.role === 'tank' || skill.role === 'support') ? ButtonStyle.Success : ButtonStyle.Danger;
    const cost = skill.ranks && skill.ranks[0] ? (skill.ranks[0].cost || 0) : 0;
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`combat:skill:${skill.id}:${characterId}`)
        .setLabel(`${skill.name} ${skill.emoji || '✨'}${cost > 0 ? ` (${cost} MP)` : ''}`)
        .setStyle(style)
        .setDisabled(currentMana < cost)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`combat:defend:${characterId}`)
      .setLabel('Defend 🛡️')
      .setStyle(ButtonStyle.Secondary)
  );

  return row;
}
