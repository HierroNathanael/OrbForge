export const MAP_TIERS = {
  0: { name: 'Novice Training Grounds (Tutorial)', baseLevel: 1, boss: 'Training Golem', minMonsters: 1, maxMonsters: 1 },
  1: { name: 'Verdant Forest', baseLevel: 5, boss: 'Gargantuan Treant', minMonsters: 1, maxMonsters: 2 },
  2: { name: 'Ruined Catacombs', baseLevel: 15, boss: 'Lich King Aegis', minMonsters: 2, maxMonsters: 3 },
  3: { name: 'Blazing Caldera', baseLevel: 30, boss: 'Magma Behemoth', minMonsters: 2, maxMonsters: 3 },
  4: { name: 'Frostbite Peak', baseLevel: 50, boss: 'Glacial Wyrm', minMonsters: 2, maxMonsters: 3 },
  5: { name: 'Abyssal Temple', baseLevel: 70, boss: 'Void Emperor', minMonsters: 2, maxMonsters: 3 },
  6: { name: 'Celestial Spire', baseLevel: 90, boss: 'Star-Eater Titan', minMonsters: 3, maxMonsters: 4 }
};

export const MAP_MODIFIERS = [
  { id: 'extra_damage', name: 'Deadly Foes', description: '+25% Monster Damage', expMultiplier: 1.15, dropMultiplier: 1.20 },
  { id: 'extra_hp', name: 'Armored Horde', description: '+40% Monster Health', expMultiplier: 1.15, dropMultiplier: 1.20 },
  { id: 'elemental_flame', name: 'Infernal Heat', description: 'Monsters deal bonus Fire Damage', expMultiplier: 1.20, dropMultiplier: 1.25 }
];

export function generateMapTicket(tier = 0) {
  const mapData = MAP_TIERS[tier] !== undefined ? MAP_TIERS[tier] : MAP_TIERS[0];
  const numMods = tier >= 3 ? (Math.random() < 0.5 ? 1 : 2) : 0;
  const mods = [];

  const availableMods = [...MAP_MODIFIERS];
  for (let i = 0; i < numMods; i++) {
    const chosenIdx = Math.floor(Math.random() * availableMods.length);
    mods.push(availableMods.splice(chosenIdx, 1)[0]);
  }

  const tierLabel = tier === 0 ? 'Tutorial Dungeon' : `Tier ${tier} Map`;

  return {
    tier,
    name: `${tierLabel}: ${mapData.name}`,
    baseLevel: mapData.baseLevel,
    bossName: mapData.boss,
    modifiers: mods
  };
}

export function generateEncounterMonsters(mapTicket) {
  const tier = mapTicket.tier ?? 0;
  const mapData = MAP_TIERS[tier] || MAP_TIERS[0];
  const baseLevel = mapTicket.baseLevel || mapData.baseLevel || 1;
  
  const minCount = mapData.minMonsters || 1;
  const maxCount = mapData.maxMonsters || 2;
  const numMonsters = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  
  const monsters = [];

  for (let i = 1; i <= numMonsters; i++) {
    const minionName = tier === 0 
      ? `Training Dummy #${i}` 
      : `Tier ${tier} Corrupted Guard #${i}`;

    const hp = Math.max(20, Math.round(20 + (baseLevel * 8) * (1 + (tier * 0.10))));
    const damage = Math.max(3, Math.round(3 + (baseLevel * 1.5) * (1 + (tier * 0.08))));
    const armor = Math.round(baseLevel * 0.7);
    const evasion = Math.round(baseLevel * 0.5);

    monsters.push({
      id: `monster_${i}`,
      name: minionName,
      hp,
      maxHp: hp,
      damage,
      armor,
      evasion,
      isBoss: false
    });
  }

  // Add Boss
  const bossHp = Math.max(50, Math.round(50 + (baseLevel * 18) * (1 + (tier * 0.15))));
  const bossDamage = Math.max(5, Math.round(5 + (baseLevel * 2.2) * (1 + (tier * 0.10))));
  const bossArmor = Math.round(2 + baseLevel * 1.0);
  const bossEvasion = Math.round(1 + baseLevel * 0.6);

  monsters.push({
    id: 'boss',
    name: `[BOSS] ${mapData.boss}`,
    hp: bossHp,
    maxHp: bossHp,
    damage: bossDamage,
    armor: bossArmor,
    evasion: bossEvasion,
    isBoss: true
  });

  return monsters;
}
