export const SKILL_TREE_DATA = {
  Warrior: [
    // Small nodes
    {
      id: 'war_str_1',
      name: 'Physical Might',
      tier: 'small',
      maxRank: 3,
      prerequisites: [],
      effects: [
        { stat: 'strength', value: 5, label: '+5 Strength' },
        { stat: 'strength', value: 10, label: '+10 Strength' },
        { stat: 'strength', value: 18, label: '+18 Strength' }
      ]
    },
    {
      id: 'war_hp_1',
      name: 'Vigor of the Bear',
      tier: 'small',
      maxRank: 3,
      prerequisites: ['war_str_1'],
      effects: [
        { stat: 'health', value: 25, label: '+25 Health' },
        { stat: 'health', value: 60, label: '+60 Health' },
        { stat: 'health', value: 110, label: '+110 Health' }
      ]
    },
    {
      id: 'war_armor_1',
      name: 'Iron Clad',
      tier: 'small',
      maxRank: 3,
      prerequisites: ['war_str_1'],
      effects: [
        { stat: 'armor', value: 15, label: '+15 Armor' },
        { stat: 'armor', value: 35, label: '+35 Armor' },
        { stat: 'armor', value: 65, label: '+65 Armor' }
      ]
    },
    {
      id: 'war_dmg_1',
      name: 'Heavy Blows',
      tier: 'small',
      maxRank: 3,
      prerequisites: ['war_hp_1'],
      effects: [
        { stat: 'flat_damage', value: 8, label: '+8 Damage' },
        { stat: 'flat_damage', value: 18, label: '+18 Damage' },
        { stat: 'flat_damage', value: 32, label: '+32 Damage' }
      ]
    },
    // Keystones
    {
      id: 'war_keystone_unyielding',
      name: 'Unyyielding Titan',
      tier: 'keystone',
      maxRank: 3,
      prerequisites: ['war_armor_1'],
      effects: [
        { stat: 'armor_percent', value: 0.10, label: '+10% Armor' },
        { stat: 'armor_percent', value: 0.22, label: '+22% Armor' },
        { stat: 'armor_percent', value: 0.35, label: '+35% Armor' }
      ]
    },
    {
      id: 'war_keystone_bloodthirst',
      name: 'Bloodthirst Keystone',
      tier: 'keystone',
      maxRank: 3,
      prerequisites: ['war_dmg_1'],
      effects: [
        { stat: 'lifesteal', value: 0.03, label: '+3% Lifesteal' },
        { stat: 'lifesteal', value: 0.07, label: '+7% Lifesteal' },
        { stat: 'lifesteal', value: 0.12, label: '+12% Lifesteal' }
      ]
    }
  ],
  Ranger: [
    {
      id: 'rng_dex_1',
      name: 'Swiftness',
      tier: 'small',
      maxRank: 3,
      prerequisites: [],
      effects: [
        { stat: 'dexterity', value: 5, label: '+5 Dexterity' },
        { stat: 'dexterity', value: 10, label: '+10 Dexterity' },
        { stat: 'dexterity', value: 18, label: '+18 Dexterity' }
      ]
    },
    {
      id: 'rng_evasion_1',
      name: 'Wind Walker',
      tier: 'small',
      maxRank: 3,
      prerequisites: ['rng_dex_1'],
      effects: [
        { stat: 'evasion', value: 20, label: '+20 Evasion' },
        { stat: 'evasion', value: 45, label: '+45 Evasion' },
        { stat: 'evasion', value: 80, label: '+80 Evasion' }
      ]
    },
    {
      id: 'rng_crit_1',
      name: 'Eagle Eye',
      tier: 'small',
      maxRank: 3,
      prerequisites: ['rng_dex_1'],
      effects: [
        { stat: 'critical_strike', value: 0.03, label: '+3% Crit Chance' },
        { stat: 'critical_strike', value: 0.07, label: '+7% Crit Chance' },
        { stat: 'critical_strike', value: 0.12, label: '+12% Crit Chance' }
      ]
    },
    {
      id: 'rng_keystone_sniper',
      name: 'Lethal Precision',
      tier: 'keystone',
      maxRank: 3,
      prerequisites: ['rng_crit_1'],
      effects: [
        { stat: 'crit_multiplier', value: 0.15, label: '+15% Crit Damage' },
        { stat: 'crit_multiplier', value: 0.30, label: '+30% Crit Damage' },
        { stat: 'crit_multiplier', value: 0.50, label: '+50% Crit Damage' }
      ]
    }
  ],
  Mage: [
    {
      id: 'mag_int_1',
      name: 'Arcane Insight',
      tier: 'small',
      maxRank: 3,
      prerequisites: [],
      effects: [
        { stat: 'intelligence', value: 5, label: '+5 Intelligence' },
        { stat: 'intelligence', value: 10, label: '+10 Intelligence' },
        { stat: 'intelligence', value: 18, label: '+18 Intelligence' }
      ]
    },
    {
      id: 'mag_ele_1',
      name: 'Pyromania',
      tier: 'small',
      maxRank: 3,
      prerequisites: ['mag_int_1'],
      effects: [
        { stat: 'elemental_damage_percent', value: 0.05, label: '+5% Fire Damage' },
        { stat: 'elemental_damage_percent', value: 0.12, label: '+12% Fire Damage' },
        { stat: 'elemental_damage_percent', value: 0.20, label: '+20% Fire Damage' }
      ]
    },
    {
      id: 'mag_shield_1',
      name: 'Arcane Ward',
      tier: 'small',
      maxRank: 3,
      prerequisites: ['mag_int_1'],
      effects: [
        { stat: 'health', value: 20, label: '+20 Energy Shield' },
        { stat: 'health', value: 50, label: '+50 Energy Shield' },
        { stat: 'health', value: 90, label: '+90 Energy Shield' }
      ]
    },
    {
      id: 'mag_keystone_overload',
      name: 'Elemental Overload',
      tier: 'keystone',
      maxRank: 3,
      prerequisites: ['mag_ele_1'],
      effects: [
        { stat: 'elemental_damage_percent', value: 0.10, label: '+10% Spell Damage' },
        { stat: 'elemental_damage_percent', value: 0.25, label: '+25% Spell Damage' },
        { stat: 'elemental_damage_percent', value: 0.45, label: '+45% Spell Damage' }
      ]
    }
  ]
};
