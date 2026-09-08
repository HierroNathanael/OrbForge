import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { BASE_CLASSES } from '../../game/classes/classData.js';
import { SKILL_TREE_DATA } from '../../game/skillTree/treeData.js';
import { getEligibleNodes, accumulateTreeStats } from '../../game/skillTree/treeEngine.js';
import { calculateEffectiveStats } from '../../game/combat/combatEngine.js';
import { GAME_CONFIG, xpToNextLevel } from '../../config/constants.js';

function renderXpBar(current, max, segments = 10) {
  const ratio = max > 0 ? Math.min(1, current / max) : 1;
  const filled = Math.round(ratio * segments);
  return '▰'.repeat(filled) + '▱'.repeat(segments - filled);
}

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

  const atCap = character.level >= GAME_CONFIG.LEVEL_CAP;
  const xpNeeded = atCap ? null : xpToNextLevel(character.level);
  const xpText = atCap
    ? `**MAX LEVEL** (${character.xp.toLocaleString()} XP)`
    : `**${character.xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP**\n${renderXpBar(character.xp, xpNeeded)}`;

  return new EmbedBuilder()
    .setTitle(`🛡️ ${character.name} — Level ${character.level} ${character.className}${subclassName}`)
    .setColor('#9b59b6')
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3408/3408591.png')
    .addFields(
      { name: '📊 Class & Archetype', value: `**Class**: ${character.className}\n**Primary Stat**: ${classInfo.primaryStat.toUpperCase()}`, inline: true },
      { name: '❤️ HP / 🔷 Mana', value: `**HP**: ${stats.maxHp}\n**Mana**: ${stats.maxMana}`, inline: true },
      { name: '⚔️ Combat Stats', value: `**Damage**: ${stats.damage}\n**Armor**: ${stats.armor}\n**Evasion**: ${stats.evasion}\n**Crit**: ${(stats.critChance * 100).toFixed(0)}%`, inline: true },
      { name: '🪙 Gold', value: `${character.gold.toLocaleString()}`, inline: true },
      { name: '✨ Experience', value: xpText, inline: true },
      { name: '🔮 Crafting Orbs Inventory', value: orbList, inline: false },
      { name: '🌲 Skill Tree Progress', value: `Points Available: **${character.skillPoints.available}** | Spent: **${character.skillPoints.spent}**`, inline: false }
    )
    .setFooter({ text: 'Orbforge RPG • PoE-Inspired Discord Bot' })
    .setTimestamp();
}

const TREE_TIER_ORDER = ['small', 'keystone', 'subclass'];
const TREE_TIER_LABELS = { small: '🌱 Small Nodes', keystone: '💎 Keystone Nodes', subclass: '⭐ Subclass Nodes' };

function buildFullTreeText(character) {
  const className = character.className;
  const subclassName = character.subclassName;
  const allocatedMap = character.passiveTree instanceof Map ? Object.fromEntries(character.passiveTree) : (character.passiveTree || {});
  const tree = SKILL_TREE_DATA[className] || [];
  if (tree.length === 0) return '*No tree data for this class.*';

  let text = '';
  for (const tier of TREE_TIER_ORDER) {
    const nodesInTier = tree.filter(n => n.tier === tier);
    if (nodesInTier.length === 0) continue;

    text += `\n**${TREE_TIER_LABELS[tier]}**\n`;
    for (const node of nodesInTier) {
      const rank = allocatedMap[node.id] || 0;
      const prereqsMet = !node.prerequisites?.length || node.prerequisites.some(p => (allocatedMap[p] || 0) > 0);
      const subclassLocked = node.tier === 'subclass' && node.subclassName !== subclassName;

      let icon, status;
      if (rank >= node.maxRank) {
        icon = '✅';
        status = `MAXED — ${node.effects[rank - 1].label}`;
      } else if (rank > 0) {
        icon = '🟢';
        status = `Rank ${rank}/${node.maxRank} — ${node.effects[rank - 1].label} (next: ${node.effects[rank].label})`;
      } else if (subclassLocked) {
        icon = '🔒';
        status = `Requires Subclass: ${node.subclassName}`;
      } else if (!prereqsMet) {
        const reqNames = node.prerequisites.map(id => tree.find(n => n.id === id)?.name || id).join(', ');
        icon = '🔒';
        status = `Requires: ${reqNames}`;
      } else {
        icon = '⚪';
        status = `Unallocated — ${node.effects[0].label}`;
      }

      text += `${icon} **${node.name}** \`${node.id}\` — ${status}\n`;
    }
  }

  return text;
}

export function createSkillTreeEmbed(character) {
  const className = character.className;
  const fullTreeText = buildFullTreeText(character);

  return new EmbedBuilder()
    .setTitle(`🌲 Skill Tree — ${character.name} (${className})`)
    .setColor('#2ecc71')
    .setDescription(`Available Skill Points: **${character.skillPoints.available}**\nSpent Points: **${character.skillPoints.spent}**\n${fullTreeText}`)
    .setFooter({ text: '✅ Maxed · 🟢 Ranked · ⚪ Available · 🔒 Locked — /tree allocate to spend, /tree respec to reset.' });
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

export function createLobbyEmbed(lobby) {
  const memberList = lobby.members
    .map((m, i) => `${i === 0 ? '👑' : '🛡️'} **${m.character.name}** — Level ${m.character.level} ${m.character.className}`)
    .join('\n');

  return new EmbedBuilder()
    .setTitle('🏕️ Dungeon Party Lobby')
    .setColor('#3498db')
    .setDescription(`**Tier**: ${lobby.tier}\n**Party** (${lobby.members.length}/${GAME_CONFIG.PARTY_SIZE_MAX}):\n${memberList}`)
    .setFooter({ text: 'Party leader clicks Start Dungeon when ready. Others click Join Party!' });
}

export function createLobbyButtons(lobby) {
  const full = lobby.members.length >= GAME_CONFIG.PARTY_SIZE_MAX;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dungeon:join:${lobby.lobbyId}`)
      .setLabel(full ? 'Party Full' : 'Join Party 🤝')
      .setStyle(ButtonStyle.Success)
      .setDisabled(full),
    new ButtonBuilder()
      .setCustomId(`dungeon:start:${lobby.lobbyId}`)
      .setLabel('Start Dungeon ⚔️')
      .setStyle(ButtonStyle.Primary)
  );

  return [row];
}

function createSoloCombatActionButtons(character, currentMana, enemyList) {
  const characterId = character._id ? character._id.toString() : character.toString();
  const skills = typeof character === 'object' && character.className ? getCharacterCombatSkills(character) : [];
  const rows = [];

  const livingEnemies = enemyList.filter(e => e.hp > 0).slice(0, 5);
  const attackRow = new ActionRowBuilder();
  if (livingEnemies.length > 0) {
    for (const enemy of livingEnemies) {
      attackRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`combat:attack:${enemy.id}:${characterId}`)
          .setLabel(`${enemy.isBoss ? '👑' : '⚔️'} ${enemy.name} (${enemy.hp}/${enemy.maxHp})`.slice(0, 80))
          .setStyle(enemy.isBoss ? ButtonStyle.Danger : ButtonStyle.Primary)
      );
    }
  } else {
    // No enemy list supplied (or all dead) — fall back to an untargeted attack.
    attackRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`combat:attack:${characterId}`)
        .setLabel('Basic Attack ⚔️')
        .setStyle(ButtonStyle.Primary)
    );
  }
  rows.push(attackRow);

  const actionRow = new ActionRowBuilder();
  for (const skill of skills.slice(0, 2)) {
    const style = (skill.role === 'tank' || skill.role === 'support') ? ButtonStyle.Success : ButtonStyle.Danger;
    const cost = skill.ranks && skill.ranks[0] ? (skill.ranks[0].cost || 0) : 0;
    const disabled = currentMana < cost;

    // Single-target damage skills get one button per living enemy, same as Attack.
    // AoE/self/party skills (e.g. Shield Taunt, Fireball, Divine Heal) hit everyone
    // already, so a target picker would be meaningless — keep those as one button.
    if (skill.target === 'single_enemy' && livingEnemies.length > 0) {
      const skillRow = new ActionRowBuilder();
      for (const enemy of livingEnemies) {
        skillRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`combat:skill:${skill.id}:${enemy.id}:${characterId}`)
            .setLabel(`${skill.emoji || '✨'} ${skill.name} — ${enemy.name}${cost > 0 ? ` (${cost} MP)` : ''}`.slice(0, 80))
            .setStyle(style)
            .setDisabled(disabled)
        );
      }
      rows.push(skillRow);
      continue;
    }

    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`combat:skill:${skill.id}:${characterId}`)
        .setLabel(`${skill.name} ${skill.emoji || '✨'}${cost > 0 ? ` (${cost} MP)` : ''}`)
        .setStyle(style)
        .setDisabled(disabled)
    );
  }

  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`combat:defend:${characterId}`)
      .setLabel('Defend 🛡️')
      .setStyle(ButtonStyle.Secondary)
  );
  rows.push(actionRow);

  return rows;
}

// Party combat (2-3 members) has no component-row budget left for per-enemy
// target pickers (each member already needs its own row). Actions go out
// untargeted; resolveCombatRound() falls back to the first living enemy.
function createPartyMemberRow(member) {
  const character = member.character;
  const characterId = character._id.toString();
  const skills = getCharacterCombatSkills(character);
  const currentMana = member.currentMana ?? 0;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`combat:attack:${characterId}`)
      .setLabel(`${character.name}: Attack ⚔️`.slice(0, 80))
      .setStyle(ButtonStyle.Primary)
  );

  for (const skill of skills.slice(0, 2)) {
    const style = (skill.role === 'tank' || skill.role === 'support') ? ButtonStyle.Success : ButtonStyle.Danger;
    const cost = skill.ranks && skill.ranks[0] ? (skill.ranks[0].cost || 0) : 0;
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`combat:skill:${skill.id}:${characterId}`)
        .setLabel(`${skill.name} ${skill.emoji || '✨'}${cost > 0 ? ` (${cost} MP)` : ''}`.slice(0, 80))
        .setStyle(style)
        .setDisabled(currentMana < cost)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`combat:defend:${characterId}`)
      .setLabel(`${character.name}: Defend 🛡️`.slice(0, 80))
      .setStyle(ButtonStyle.Secondary)
  );

  return row;
}

export function createCombatActionButtons(partyState, enemyList = []) {
  const livingParty = partyState.filter(m => m.currentHp > 0);

  if (partyState.length === 1) {
    const member = partyState[0];
    return createSoloCombatActionButtons(member.character, member.currentMana, enemyList);
  }

  return livingParty.map(createPartyMemberRow);
}
