import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { BASE_CLASSES } from '../../game/classes/classData.js';
import { SKILL_TREE_DATA } from '../../game/skillTree/treeData.js';
import { getEligibleNodes, accumulateTreeStats } from '../../game/skillTree/treeEngine.js';

export function createCharacterProfileEmbed(character, userGems = 0) {
  const classInfo = BASE_CLASSES[character.className];
  const subclassName = character.subclassName ? ` (${character.subclassName})` : ' (No Subclass)';

  const treeStats = accumulateTreeStats(character.className, character.passiveTree);
  const orbList = Object.entries(character.orbs || {})
    .filter(([_, qty]) => qty > 0)
    .map(([orbKey, qty]) => `• **${orbKey.replace(/_/g, ' ')}**: x${qty}`)
    .join('\n') || '• No Orbs';

  return new EmbedBuilder()
    .setTitle(`🛡️ ${character.name} — Level ${character.level} ${character.className}${subclassName}`)
    .setColor('#9b59b6')
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3408/3408591.png')
    .addFields(
      { name: '📊 Class & Archetype', value: `**Class**: ${character.className}\n**Primary Stat**: ${classInfo.primaryStat.toUpperCase()}`, inline: true },
      { name: '💰 Currencies', value: `🪙 **Gold**: ${character.gold.toLocaleString()}\n💎 **Gems**: ${userGems.toLocaleString()}`, inline: true },
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
    .filter(([_, v]) => v > 0)
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
      { name: 'Rarity & Type', value: `**Rarity**: ${item.rarity}\n**Slot**: ${(item.type || 'item').toUpperCase()}`, inline: true },
      { name: 'Base Attributes', value: baseStatsText, inline: true },
      { name: 'Prefixes', value: prefixes, inline: false },
      { name: 'Suffixes', value: suffixes, inline: false }
    );
}

export function createCombatEmbed(encounterState) {
  const { mapTicket, round, partyState, enemyList, logs } = encounterState;

  const playerStatus = partyState.map(m => `🛡️ **${m.character.name}**: ${m.currentHp}/${m.stats.maxHp} HP`).join('\n');
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

export function createCombatActionButtons(characterId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`combat_attack_${characterId}`)
      .setLabel('Basic Attack ⚔️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`combat_skill_heavy_strike_${characterId}`)
      .setLabel('Heavy Strike 💥')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`combat_skill_fireball_${characterId}`)
      .setLabel('Fireball 🔥')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`combat_defend_${characterId}`)
      .setLabel('Defend 🛡️')
      .setStyle(ButtonStyle.Secondary)
  );
}
