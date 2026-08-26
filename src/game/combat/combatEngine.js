import { SKILL_REGISTRY } from '../skills/skillRegistry.js';
import { GAME_CONFIG } from '../../config/constants.js';

export function calculateEffectiveStats(character, equippedItems = [], treeStats = {}) {
  const baseClassGrowth = {
    Warrior: { hp: 12, damage: 2, armor: 1.5, evasion: 0.5 },
    Ranger: { hp: 9, damage: 2.5, armor: 0.5, evasion: 2.0 },
    Mage: { hp: 8, damage: 3.0, armor: 0.3, evasion: 0.8 }
  }[character.className] || { hp: 10, damage: 2, armor: 1, evasion: 1 };

  const level = character.level || 1;
  let maxHp = 100 + (level * baseClassGrowth.hp);
  let damage = 10 + (level * baseClassGrowth.damage);
  let armor = 5 + (level * baseClassGrowth.armor);
  let evasion = 5 + (level * baseClassGrowth.evasion);
  let critChance = 0.05;
  let critMultiplier = 1.50;
  let lifesteal = 0.0;
  let damagePercent = 0.0;

  // Add passive tree stats
  maxHp += treeStats.health || 0;
  damage += treeStats.flat_damage || 0;
  armor += treeStats.armor || 0;
  evasion += treeStats.evasion || 0;
  critChance += treeStats.critical_strike || 0;
  critMultiplier += treeStats.crit_multiplier || 0;
  lifesteal += treeStats.lifesteal || 0;
  damagePercent += treeStats.damage_percent || 0;

  // Add equipped item affixes and base stats
  for (const item of equippedItems) {
    if (!item) continue;
    if (item.baseStats) {
      damage += item.baseStats.damage || 0;
      armor += item.baseStats.armor || 0;
      evasion += item.baseStats.evasion || 0;
      maxHp += item.baseStats.health || 0;
    }
    const allAffixes = [...(item.prefixes || []), ...(item.suffixes || [])];
    for (const aff of allAffixes) {
      if (aff.stat === 'flat_damage') damage += aff.value;
      if (aff.stat === 'health') maxHp += aff.value;
      if (aff.stat === 'armor') armor += aff.value;
      if (aff.stat === 'evasion') evasion += aff.value;
      if (aff.stat === 'critical_strike') critChance += aff.value;
      if (aff.stat === 'lifesteal') lifesteal += aff.value;
      if (aff.stat === 'damage_percent') damagePercent += aff.value;
    }
  }

  damage = Math.round(damage * (1 + damagePercent));

  return {
    level,
    maxHp,
    currentHp: maxHp,
    damage,
    armor,
    evasion,
    critChance,
    critMultiplier,
    lifesteal
  };
}

export function resolveCombatRound(partyState, enemyList, playerActions) {
  // partyState: array of { character, stats, currentHp, tauntTurns, armorBuffPercent }
  // enemyList: array of monster objects { id, name, hp, maxHp, damage, armor, evasion }
  // playerActions: object mapping characterId -> { type: 'attack'|'skill'|'defend', skillId: string }

  const roundLogs = [];

  // Phase 1: Support / Buff / Taunt skills
  for (const member of partyState) {
    const action = playerActions[member.character._id.toString()] || { type: 'attack' };

    if (action.type === 'skill' && action.skillId) {
      const skill = SKILL_REGISTRY[action.skillId];
      if (skill) {
        if (skill.role === 'support') {
          // Heal all allies
          const healVal = Math.round(member.stats.maxHp * 0.25 + 30);
          for (const ally of partyState) {
            ally.currentHp = Math.min(ally.stats.maxHp, ally.currentHp + healVal);
          }
          roundLogs.push(`✨ **${member.character.name}** cast **${skill.name}**, healing party for **${healVal} HP**!`);
        } else if (skill.role === 'tank') {
          // Shield Taunt
          member.tauntTurns = 2;
          member.armorBuffPercent = 0.35;
          roundLogs.push(`🛡️ **${member.character.name}** cast **${skill.name}**, taunting enemies and boosting armor!`);
        }
      }
    } else if (action.type === 'defend') {
      member.isDefending = true;
      roundLogs.push(`🛡️ **${member.character.name}** prepares to defend, reducing incoming damage by 50%.`);
    }
  }

  // Phase 2: Player Damage Actions against living enemies
  for (const member of partyState) {
    if (member.currentHp <= 0) continue;
    const action = playerActions[member.character._id.toString()] || { type: 'attack' };

    const targetEnemy = enemyList.find(e => e.hp > 0);
    if (!targetEnemy) break; // All enemies defeated

    let rawDamage = member.stats.damage;
    let isCrit = Math.random() < member.stats.critChance;
    if (isCrit) rawDamage = Math.round(rawDamage * member.stats.critMultiplier);

    let isAoE = false;
    if (action.type === 'skill' && action.skillId) {
      const skill = SKILL_REGISTRY[action.skillId];
      if (skill && skill.role === 'dps') {
        const mult = skill.ranks && skill.ranks[0] ? skill.ranks[0].damageMultiplier : 1.5;
        rawDamage = Math.round(rawDamage * mult);
        if (skill.target === 'all_enemies') isAoE = true;
      }
    }

    const targets = isAoE ? enemyList.filter(e => e.hp > 0) : [targetEnemy];

    for (const enemy of targets) {
      // Evasion check
      const hitChance = Math.max(0.3, 1 - (enemy.evasion / (member.stats.level * 40 + enemy.evasion)));
      if (Math.random() > hitChance) {
        roundLogs.push(`💨 **${member.character.name}** attacked **${enemy.name}** but MISSED!`);
        continue;
      }

      // Armor mitigation
      const mitigatedDamage = Math.max(1, Math.round(rawDamage * (100 / (100 + enemy.armor))));
      enemy.hp = Math.max(0, enemy.hp - mitigatedDamage);

      const critText = isCrit ? ' **CRITICAL HIT!**' : '';
      roundLogs.push(`⚔️ **${member.character.name}** struck **${enemy.name}** for **${mitigatedDamage} damage**!${critText}`);

      // Lifesteal
      if (member.stats.lifesteal > 0 && mitigatedDamage > 0) {
        const healAmt = Math.round(mitigatedDamage * member.stats.lifesteal);
        member.currentHp = Math.min(member.stats.maxHp, member.currentHp + healAmt);
      }

      if (enemy.hp <= 0) {
        roundLogs.push(`💥 **${enemy.name}** was DEFEATED!`);
      }
    }
  }

  // Phase 3: Living Enemies Retaliate
  for (const enemy of enemyList) {
    if (enemy.hp <= 0) continue;

    // Pick target (priority to taunted member)
    const tauntedMember = partyState.find(m => m.currentHp > 0 && m.tauntTurns > 0);
    const livingMembers = partyState.filter(m => m.currentHp > 0);
    if (livingMembers.length === 0) break; // All players defeated

    const targetPlayer = tauntedMember || livingMembers[Math.floor(Math.random() * livingMembers.length)];

    let effectiveArmor = targetPlayer.stats.armor;
    if (targetPlayer.armorBuffPercent) effectiveArmor *= (1 + targetPlayer.armorBuffPercent);

    let rawEnemyDmg = enemy.damage;
    if (targetPlayer.isDefending) rawEnemyDmg = Math.round(rawEnemyDmg * 0.5);

    const hitChance = Math.max(0.2, 1 - (targetPlayer.stats.evasion / (enemy.damage * 5 + targetPlayer.stats.evasion)));
    if (Math.random() > hitChance) {
      roundLogs.push(`🍃 **${enemy.name}** attacked **${targetPlayer.character.name}** but DODGED!`);
      continue;
    }

    const finalDamage = Math.max(1, Math.round(rawEnemyDmg * (100 / (100 + effectiveArmor))));
    targetPlayer.currentHp = Math.max(0, targetPlayer.currentHp - finalDamage);

    roundLogs.push(`🩸 **${enemy.name}** hit **${targetPlayer.character.name}** for **${finalDamage} damage**!`);
  }

  // Tick down taunt / temp buffs
  for (const member of partyState) {
    if (member.tauntTurns > 0) member.tauntTurns -= 1;
    member.isDefending = false;
  }

  const allEnemiesDefeated = enemyList.every(e => e.hp <= 0);
  const allPlayersDefeated = partyState.every(m => m.currentHp <= 0);

  return {
    roundLogs,
    allEnemiesDefeated,
    allPlayersDefeated
  };
}

export function generatePersonalInstancedLoot(character, mapTier = 1, boostMultipliers = { exp: 1.0, drop: 1.0 }) {
  const expMult = boostMultipliers.exp || 1.0;
  const dropMult = boostMultipliers.drop || 1.0;

  // Full normal base rewards (100% normal, no penalty)
  const gold = Math.round((50 + (mapTier * 45) + Math.random() * 30) * dropMult);
  const xp = Math.round((100 + (mapTier * 80)) * expMult);

  const items = [];
  const orbDrops = [];

  // Drop chance for new lore-named PoE currency Orbs
  const orbRoll = Math.random();
  if (orbRoll < 0.40 * dropMult) {
    orbDrops.push(GAME_CONFIG.ORB_TYPES.TEMPERING);
  }
  if (orbRoll < 0.25 * dropMult) {
    orbDrops.push(GAME_CONFIG.ORB_TYPES.KINDLING);
  }
  if (orbRoll < 0.10 * dropMult) {
    orbDrops.push(GAME_CONFIG.ORB_TYPES.CLEANSING);
  }
  if (orbRoll < 0.08 * dropMult) {
    orbDrops.push(GAME_CONFIG.ORB_TYPES.ASCENDANCE);
  }
  if (orbRoll < 0.03 * dropMult) {
    orbDrops.push(GAME_CONFIG.ORB_TYPES.UNMAKING);
  }
  if (orbRoll < 0.005 * dropMult) {
    orbDrops.push(GAME_CONFIG.ORB_TYPES.ZENITH);
  }

  // Drop chance for gear (100% full normal chance)
  if (Math.random() < 0.50 * dropMult) {
    const types = ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet'];
    const type = types[Math.floor(Math.random() * types.length)];
    const iLvl = Math.min(100, Math.max(1, mapTier * 10));

    items.push({
      baseItemId: `${type}_tier_${mapTier}`,
      name: `Base ${type.toUpperCase()}`,
      type,
      rarity: Math.random() < 0.2 ? 'Magic' : 'Normal',
      iLvl,
      baseStats: {
        damage: type === 'weapon' ? 10 + (mapTier * 5) : 0,
        armor: (type === 'helm' || type === 'chest' || type === 'boots') ? 8 + (mapTier * 4) : 0,
        health: (type === 'ring' || type === 'amulet') ? 15 + (mapTier * 8) : 0
      },
      prefixes: [],
      suffixes: []
    });
  }

  return {
    gold,
    xp,
    orbDrops,
    items
  };
}
