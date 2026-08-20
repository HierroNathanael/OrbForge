export const BASE_CLASSES = {
  Warrior: {
    name: 'Warrior',
    description: 'Melee juggernaut relying on Strength, Armor, and raw Physical force.',
    primaryStat: 'strength',
    baseStats: { strength: 15, dexterity: 8, intelligence: 7 },
    growthPerLevel: { health: 12, damage: 2, armor: 1.5, evasion: 0.5 },
    subclasses: {
      Berserker: {
        name: 'Berserker',
        archetype: 'Bypass (Damage & Lifesteal)',
        description: 'Trade defence for relentless attack speed and lifesteal.',
        bonusStats: { lifesteal: 0.08, flat_damage: 15, damage_percent: 0.15 }
      },
      Guardian: {
        name: 'Guardian',
        archetype: 'Grind (Mitigation & Regen)',
        description: 'Immovable fortress with heavy mitigation, taunts, and health regen.',
        bonusStats: { armor_percent: 0.25, block_chance: 0.12, health_regen: 10 }
      }
    }
  },
  Ranger: {
    name: 'Ranger',
    description: 'Agile marksman utilizing Dexterity, Evasion, and Critical Strikes.',
    primaryStat: 'dexterity',
    baseStats: { strength: 8, dexterity: 15, intelligence: 7 },
    growthPerLevel: { health: 9, damage: 2.5, armor: 0.5, evasion: 2.0 },
    subclasses: {
      Sharpshooter: {
        name: 'Sharpshooter',
        archetype: 'Bypass (Single-Target Burst)',
        description: 'Deadly precision focused on critical strike chance and critical multiplier.',
        bonusStats: { critical_strike: 0.15, crit_multiplier: 0.40, flat_damage: 10 }
      },
      Trapper: {
        name: 'Trapper',
        archetype: 'Grind (Control & AoE Kiting)',
        description: 'Control the battlefield with elemental traps and sustained area damage.',
        bonusStats: { evasion_percent: 0.20, aoe_damage_percent: 0.25, slow_chance: 0.15 }
      }
    }
  },
  Mage: {
    name: 'Mage',
    description: 'Master of elemental forces commanding high Intelligence and powerful Spells.',
    primaryStat: 'intelligence',
    baseStats: { strength: 7, dexterity: 8, intelligence: 15 },
    growthPerLevel: { health: 8, damage: 3.0, armor: 0.3, evasion: 0.8 },
    subclasses: {
      Elementalist: {
        name: 'Elementalist',
        archetype: 'Bypass (Burst AoE Spells)',
        description: 'Unleash devastating elemental magic that obliterates enemy waves.',
        bonusStats: { elemental_damage_percent: 0.30, spell_crit: 0.10, mana_regen: 5 }
      },
      BattleMage: {
        name: 'Battle Mage',
        archetype: 'Grind (Utility & Shield Sustain)',
        description: 'Weave defensive arcane shields with supportive magic to conquer solo or party runs.',
        bonusStats: { energy_shield: 50, heal_power_percent: 0.20, damage_reduction: 0.10 }
      }
    }
  }
};
