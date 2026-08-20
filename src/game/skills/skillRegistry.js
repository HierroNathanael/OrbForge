export const SKILL_REGISTRY = {
  heavy_strike: {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    description: 'Deals heavy physical damage to a single enemy.',
    role: 'dps',
    target: 'single_enemy',
    requirements: { strength: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 1.5, cost: 0, cooldown: 0 },
      { rank: 2, damageMultiplier: 1.8, cost: 0, cooldown: 0 },
      { rank: 3, damageMultiplier: 2.2, cost: 0, cooldown: 0 },
      { rank: 4, damageMultiplier: 2.7, cost: 0, cooldown: 0 },
      { rank: 5, damageMultiplier: 3.3, cost: 0, cooldown: 0 }
    ]
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches a burning orb dealing elemental AoE damage to all enemies.',
    role: 'dps',
    target: 'all_enemies',
    requirements: { intelligence: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 1.2, cost: 10, cooldown: 1 },
      { rank: 2, damageMultiplier: 1.5, cost: 14, cooldown: 1 },
      { rank: 3, damageMultiplier: 1.9, cost: 18, cooldown: 1 },
      { rank: 4, damageMultiplier: 2.4, cost: 22, cooldown: 1 },
      { rank: 5, damageMultiplier: 3.0, cost: 26, cooldown: 1 }
    ]
  },
  snipe: {
    id: 'snipe',
    name: 'Snipe Shot',
    description: 'High-precision arrow strike with increased critical chance.',
    role: 'dps',
    target: 'single_enemy',
    requirements: { dexterity: 12 },
    ranks: [
      { rank: 1, damageMultiplier: 1.8, critBonus: 0.15, cooldown: 1 },
      { rank: 2, damageMultiplier: 2.2, critBonus: 0.20, cooldown: 1 },
      { rank: 3, damageMultiplier: 2.7, critBonus: 0.25, cooldown: 1 },
      { rank: 4, damageMultiplier: 3.3, critBonus: 0.30, cooldown: 1 },
      { rank: 5, damageMultiplier: 4.0, critBonus: 0.35, cooldown: 1 }
    ]
  },
  shield_taunt: {
    id: 'shield_taunt',
    name: 'Shield Taunt',
    description: 'Draws enemy attacks while boosting armor for 2 turns.',
    role: 'tank',
    target: 'self_and_enemies',
    requirements: { strength: 15 },
    ranks: [
      { rank: 1, armorBonusPercent: 0.20, tauntTurns: 2, cooldown: 3 },
      { rank: 2, armorBonusPercent: 0.30, tauntTurns: 2, cooldown: 3 },
      { rank: 3, armorBonusPercent: 0.42, tauntTurns: 2, cooldown: 3 },
      { rank: 4, armorBonusPercent: 0.55, tauntTurns: 2, cooldown: 3 },
      { rank: 5, armorBonusPercent: 0.70, tauntTurns: 3, cooldown: 2 }
    ]
  },
  divine_heal: {
    id: 'divine_heal',
    name: 'Divine Heal',
    description: 'Restores health to all party members.',
    role: 'support',
    target: 'all_allies',
    requirements: { intelligence: 15 },
    ranks: [
      { rank: 1, healAmount: 40, healPercent: 0.15, cooldown: 2 },
      { rank: 2, healAmount: 75, healPercent: 0.20, cooldown: 2 },
      { rank: 3, healAmount: 120, healPercent: 0.25, cooldown: 2 },
      { rank: 4, healAmount: 180, healPercent: 0.30, cooldown: 2 },
      { rank: 5, healAmount: 260, healPercent: 0.35, cooldown: 2 }
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
