// Per-subclass Ascendancy mini-tree. Unlike SKILL_TREE_DATA, every node here
// is unranked (maxRank: 1) and costs a variable number of Ascendancy Points
// (pointCost: 1 for minor nodes, 2 for notables) instead of the main tree's
// flat 1-point-per-allocation rule.
export const ASCEND_TREE_DATA = {
  Berserker: [
    {
      id: 'asc_war_berserker_small_1',
      name: 'Reckless Fury',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'flat_damage', value: 12, label: '+12 Damage' }]
    },
    {
      id: 'asc_war_berserker_small_2',
      name: 'Blood Frenzy',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'lifesteal', value: 0.05, label: '+5% Lifesteal' }]
    },
    {
      id: 'asc_war_berserker_small_3',
      name: 'Savage Momentum',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'damage_percent', value: 0.10, label: '+10% Damage' }]
    },
    {
      id: 'asc_war_berserker_small_4',
      name: "Berserker's Vigor",
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'health', value: 40, label: '+40 Health' }]
    },
    {
      id: 'war_asc_berserker_rage',
      name: 'Savage Rage',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_war_berserker_small_1', 'asc_war_berserker_small_2'],
      effects: [{ stat: 'damage_percent', value: 0.30, label: '+30% Attack Damage' }]
    },
    {
      id: 'asc_war_berserker_notable_2',
      name: 'Undying Wrath',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_war_berserker_small_3', 'asc_war_berserker_small_4'],
      effects: [{ stat: 'lifesteal', value: 0.15, label: '+15% Lifesteal' }]
    }
  ],
  Guardian: [
    {
      id: 'asc_war_guardian_small_1',
      name: 'Stone Skin',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'armor', value: 25, label: '+25 Armor' }]
    },
    {
      id: 'asc_war_guardian_small_2',
      name: 'Steadfast',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'block_chance', value: 0.05, label: '+5% Block Chance' }]
    },
    {
      id: 'asc_war_guardian_small_3',
      name: 'Bulwark',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'armor_percent', value: 0.10, label: '+10% Armor' }]
    },
    {
      id: 'asc_war_guardian_small_4',
      name: "Guardian's Resolve",
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'health', value: 50, label: '+50 Health' }]
    },
    {
      id: 'war_asc_guardian_aegis',
      name: 'Divine Aegis',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_war_guardian_small_1', 'asc_war_guardian_small_2'],
      effects: [{ stat: 'block_chance', value: 0.20, label: '+20% Block Chance' }]
    },
    {
      id: 'asc_war_guardian_notable_2',
      name: 'Immovable Object',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_war_guardian_small_3', 'asc_war_guardian_small_4'],
      effects: [{ stat: 'armor_percent', value: 0.30, label: '+30% Armor' }]
    }
  ],
  Sharpshooter: [
    {
      id: 'asc_rng_sharp_small_1',
      name: 'Deadeye',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'critical_strike', value: 0.05, label: '+5% Crit Chance' }]
    },
    {
      id: 'asc_rng_sharp_small_2',
      name: 'Killer Instinct',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'crit_multiplier', value: 0.15, label: '+15% Crit Damage' }]
    },
    {
      id: 'asc_rng_sharp_small_3',
      name: 'Precise Shot',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'flat_damage', value: 10, label: '+10 Damage' }]
    },
    {
      id: 'asc_rng_sharp_small_4',
      name: "Hawk's Focus",
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'dexterity', value: 8, label: '+8 Dexterity' }]
    },
    {
      id: 'rng_asc_sharpshooter_pierce',
      name: 'Heartseeker',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_rng_sharp_small_1', 'asc_rng_sharp_small_2'],
      effects: [{ stat: 'flat_damage', value: 35, label: '+35 Damage' }]
    },
    {
      id: 'asc_rng_sharp_notable_2',
      name: 'Executioner',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_rng_sharp_small_3', 'asc_rng_sharp_small_4'],
      effects: [{ stat: 'crit_multiplier', value: 0.35, label: '+35% Crit Damage' }]
    }
  ],
  Trapper: [
    {
      id: 'asc_rng_trap_small_1',
      name: 'Light Feet',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'evasion', value: 30, label: '+30 Evasion' }]
    },
    {
      id: 'asc_rng_trap_small_2',
      name: 'Camouflage',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'evasion_percent', value: 0.08, label: '+8% Evasion' }]
    },
    {
      id: 'asc_rng_trap_small_3',
      name: 'Quickdraw',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'dexterity', value: 8, label: '+8 Dexterity' }]
    },
    {
      id: 'asc_rng_trap_small_4',
      name: 'Survivalist',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'health', value: 40, label: '+40 Health' }]
    },
    {
      id: 'rng_asc_trapper_snare',
      name: 'Entangling Wire',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_rng_trap_small_1', 'asc_rng_trap_small_2'],
      effects: [{ stat: 'evasion_percent', value: 0.25, label: '+25% Evasion' }]
    },
    {
      id: 'asc_rng_trap_notable_2',
      name: 'Phantom Step',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_rng_trap_small_3', 'asc_rng_trap_small_4'],
      effects: [{ stat: 'evasion', value: 60, label: '+60 Evasion' }]
    }
  ],
  Elementalist: [
    {
      id: 'asc_mag_ele_small_1',
      name: 'Spark of Power',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'elemental_damage_percent', value: 0.08, label: '+8% Elemental Damage' }]
    },
    {
      id: 'asc_mag_ele_small_2',
      name: 'Arcane Focus',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'spell_crit', value: 0.05, label: '+5% Spell Crit' }]
    },
    {
      id: 'asc_mag_ele_small_3',
      name: 'Mind Overflow',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'intelligence', value: 8, label: '+8 Intelligence' }]
    },
    {
      id: 'asc_mag_ele_small_4',
      name: 'Combustion',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'flat_damage', value: 10, label: '+10 Damage' }]
    },
    {
      id: 'mag_asc_elementalist_cataclysm',
      name: 'Primeval Power',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_mag_ele_small_1', 'asc_mag_ele_small_2'],
      effects: [{ stat: 'spell_crit', value: 0.15, label: '+15% Spell Crit' }]
    },
    {
      id: 'asc_mag_ele_notable_2',
      name: 'Cataclysmic Surge',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_mag_ele_small_3', 'asc_mag_ele_small_4'],
      effects: [{ stat: 'elemental_damage_percent', value: 0.35, label: '+35% Elemental Damage' }]
    }
  ],
  'Battle Mage': [
    {
      id: 'asc_mag_battle_small_1',
      name: 'Warded Mind',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'health', value: 40, label: '+40 Health' }]
    },
    {
      id: 'asc_mag_battle_small_2',
      name: 'Mending Light',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'heal_power_percent', value: 0.08, label: '+8% Heal & Shield Power' }]
    },
    {
      id: 'asc_mag_battle_small_3',
      name: 'Iron Will',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'armor', value: 20, label: '+20 Armor' }]
    },
    {
      id: 'asc_mag_battle_small_4',
      name: 'Focused Casting',
      tier: 'minor',
      pointCost: 1,
      maxRank: 1,
      prerequisites: [],
      effects: [{ stat: 'intelligence', value: 8, label: '+8 Intelligence' }]
    },
    {
      id: 'mag_asc_battlemage_barrier',
      name: 'Arcane Fortress',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_mag_battle_small_1', 'asc_mag_battle_small_2'],
      effects: [{ stat: 'heal_power_percent', value: 0.25, label: '+25% Heal & Shield Power' }]
    },
    {
      id: 'asc_mag_battle_notable_2',
      name: 'Bulwark of Magic',
      tier: 'notable',
      pointCost: 2,
      maxRank: 1,
      prerequisites: ['asc_mag_battle_small_3', 'asc_mag_battle_small_4'],
      effects: [{ stat: 'armor_percent', value: 0.25, label: '+25% Armor' }]
    }
  ]
};
