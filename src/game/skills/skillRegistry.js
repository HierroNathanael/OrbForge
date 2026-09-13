export const SKILL_REGISTRY = {
  // ─── Warrior / Strength Skills ─────────────────────────────────────────────
  heavy_strike: {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    emoji: '💥',
    description: 'Deals heavy physical damage to a single enemy.',
    role: 'dps',
    target: 'single_enemy',
    requirements: { strength: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 1.6, cost: 0, cooldown: 0 },
      { rank: 2, damageMultiplier: 1.9, cost: 0, cooldown: 0 },
      { rank: 3, damageMultiplier: 2.3, cost: 0, cooldown: 0 },
      { rank: 4, damageMultiplier: 2.8, cost: 0, cooldown: 0 },
      { rank: 5, damageMultiplier: 3.4, cost: 0, cooldown: 0 }
    ]
  },
  shield_taunt: {
    id: 'shield_taunt',
    name: 'Shield Taunt',
    emoji: '🛡️',
    description: 'Draws enemy attacks while boosting armor for 2 turns.',
    role: 'tank',
    target: 'self_and_enemies',
    requirements: { strength: 10 },
    ranks: [
      { rank: 1, armorBonusPercent: 0.35, tauntTurns: 2, cost: 0, cooldown: 2 },
      { rank: 2, armorBonusPercent: 0.45, tauntTurns: 2, cost: 0, cooldown: 2 },
      { rank: 3, armorBonusPercent: 0.55, tauntTurns: 2, cost: 0, cooldown: 2 },
      { rank: 4, armorBonusPercent: 0.65, tauntTurns: 2, cost: 0, cooldown: 2 },
      { rank: 5, armorBonusPercent: 0.80, tauntTurns: 3, cost: 0, cooldown: 2 }
    ]
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind',
    emoji: '🪓',
    description: 'Spins weapon around, striking all enemies for area damage.',
    role: 'dps',
    target: 'all_enemies',
    requirements: { strength: 14 },
    ranks: [
      { rank: 1, damageMultiplier: 1.3, cost: 0, cooldown: 1 },
      { rank: 2, damageMultiplier: 1.6, cost: 0, cooldown: 1 },
      { rank: 3, damageMultiplier: 2.0, cost: 0, cooldown: 1 }
    ]
  },

  // ─── Ranger / Dexterity Skills ─────────────────────────────────────────────
  snipe: {
    id: 'snipe',
    name: 'Snipe Shot',
    emoji: '🏹',
    description: 'High-precision arrow strike with increased critical strike chance.',
    role: 'dps',
    target: 'single_enemy',
    requirements: { dexterity: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 1.8, critBonus: 0.20, cost: 0, cooldown: 1 },
      { rank: 2, damageMultiplier: 2.2, critBonus: 0.25, cost: 0, cooldown: 1 },
      { rank: 3, damageMultiplier: 2.7, critBonus: 0.30, cost: 0, cooldown: 1 },
      { rank: 4, damageMultiplier: 3.3, critBonus: 0.35, cost: 0, cooldown: 1 },
      { rank: 5, damageMultiplier: 4.0, critBonus: 0.40, cost: 0, cooldown: 1 }
    ]
  },
  poison_trap: {
    id: 'poison_trap',
    name: 'Poison Trap',
    emoji: '🪤',
    description: 'Triggers venomous area damage across all enemies.',
    role: 'dps',
    target: 'all_enemies',
    requirements: { dexterity: 10 },
    ranks: [
      { rank: 1, damageMultiplier: 1.3, cost: 0, cooldown: 1 },
      { rank: 2, damageMultiplier: 1.6, cost: 0, cooldown: 1 },
      { rank: 3, damageMultiplier: 2.0, cost: 0, cooldown: 1 }
    ]
  },
  piercing_arrow: {
    id: 'piercing_arrow',
    name: 'Piercing Arrow',
    emoji: '➶',
    description: 'A relentless shot that punches clean through enemy defenses.',
    role: 'dps',
    target: 'single_enemy',
    requirements: { dexterity: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 2.0, cost: 0, cooldown: 1 },
      { rank: 2, damageMultiplier: 2.5, cost: 0, cooldown: 1 },
      { rank: 3, damageMultiplier: 3.1, cost: 0, cooldown: 1 },
      { rank: 4, damageMultiplier: 3.8, cost: 0, cooldown: 1 },
      { rank: 5, damageMultiplier: 4.6, cost: 0, cooldown: 1 }
    ]
  },

  // ─── Mage / Intelligence Skills ────────────────────────────────────────────
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    emoji: '🔥',
    description: 'Launches a blazing orb dealing elemental AoE burn to all enemies.',
    role: 'dps',
    target: 'all_enemies',
    requirements: { intelligence: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 1.4, cost: 10, cooldown: 1 },
      { rank: 2, damageMultiplier: 1.8, cost: 14, cooldown: 1 },
      { rank: 3, damageMultiplier: 2.3, cost: 18, cooldown: 1 },
      { rank: 4, damageMultiplier: 2.9, cost: 22, cooldown: 1 },
      { rank: 5, damageMultiplier: 3.6, cost: 26, cooldown: 1 }
    ]
  },
  arcane_surge: {
    id: 'arcane_surge',
    name: 'Arcane Surge',
    emoji: '⚡',
    description: 'Concentrates intense arcane energy into a devastating single-target blast.',
    role: 'dps',
    target: 'single_enemy',
    requirements: { intelligence: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 2.0, cost: 12, cooldown: 1 },
      { rank: 2, damageMultiplier: 2.5, cost: 16, cooldown: 1 },
      { rank: 3, damageMultiplier: 3.1, cost: 20, cooldown: 1 }
    ]
  },
  divine_heal: {
    id: 'divine_heal',
    name: 'Divine Heal',
    emoji: '✨',
    description: 'Channels healing light to restore health to all party members.',
    role: 'support',
    target: 'all_allies',
    requirements: { intelligence: 10 },
    ranks: [
      { rank: 1, healAmount: 40, healPercent: 0.20, cost: 15, cooldown: 2 },
      { rank: 2, healAmount: 75, healPercent: 0.25, cost: 20, cooldown: 2 },
      { rank: 3, healAmount: 120, healPercent: 0.30, cost: 25, cooldown: 2 }
    ]
  }
};

export function checkSkillUsability(character, skillId) {
  const skill = SKILL_REGISTRY[skillId];
  if (!skill) return { usable: false, reason: 'Skill does not exist.' };

  const baseStats = character.baseStats || { strength: 10, dexterity: 10, intelligence: 10 };
  for (const [stat, reqVal] of Object.entries(skill.requirements || {})) {
    if ((baseStats[stat] || 0) < reqVal) {
      return { 
        usable: false, 
        reason: `Requires ${reqVal} ${stat.toUpperCase()} (you have ${baseStats[stat] || 0}).` 
      };
    }
  }

  return { usable: true };
}

// The one guaranteed combat skill every character of a class starts with —
// everything else must be learned from a dropped Skill Book (see
// skillBookEngine.js) and equipped into the 2nd combat slot via /skills equip.
export const CLASS_CORE_SKILL = {
  Warrior: 'heavy_strike',
  Ranger: 'snipe',
  Mage: 'fireball'
};

// Every registry skill that isn't a guaranteed core skill — the book-drop
// pool. Not class-locked (per the design doc, any class can learn any book;
// stat requirements are what actually gate usability).
export function getBookLearnableSkillIds() {
  const coreIds = new Set(Object.values(CLASS_CORE_SKILL));
  return Object.keys(SKILL_REGISTRY).filter(id => !coreIds.has(id));
}

export function getSkillRankForCharacter(character, skillId) {
  const entry = (character.knownSkills || []).find(k => k.skillId === skillId);
  const skill = SKILL_REGISTRY[skillId];
  const rank = entry ? entry.rank : 1;
  return skill ? Math.min(rank, skill.ranks.length) : rank;
}

export function getCharacterCombatSkills(character) {
  const className = character.className || 'Warrior';
  const coreId = CLASS_CORE_SKILL[className] || 'heavy_strike';
  const knownIds = new Set((character.knownSkills || []).map(k => k.skillId));

  const slot2 = character.activeSkillLoadout?.[0];
  const loadout = [coreId, slot2 && knownIds.has(slot2) ? slot2 : null].filter(Boolean);

  return loadout.map(id => {
    const skill = SKILL_REGISTRY[id];
    if (!skill) return null;
    return { ...skill, currentRank: getSkillRankForCharacter(character, id) };
  }).filter(Boolean);
}
