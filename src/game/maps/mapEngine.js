export const MAP_TIERS = {
  1: { name: 'Verdant Forest', baseLevel: 10, boss: 'Gargantuan Treant' },
  2: { name: 'Ruined Catacombs', baseLevel: 20, boss: 'Lich King Aegis' },
  3: { name: 'Blazing Caldera', baseLevel: 35, boss: 'Magma Behemoth' },
  4: { name: 'Frostbite Peak', baseLevel: 50, boss: 'Glacial Wyrm' },
  5: { name: 'Abyssal Temple', baseLevel: 70, boss: 'Void Emperor' },
  6: { name: 'Celestial Spire', baseLevel: 90, boss: 'Star-Eater Titan' }
};

export const MAP_MODIFIERS = [
  { id: 'extra_damage', name: 'Deadly Foes', description: '+25% Monster Damage', expMultiplier: 1.15, dropMultiplier: 1.20 },
  { id: 'extra_hp', name: 'Armored Horde', description: '+40% Monster Health', expMultiplier: 1.15, dropMultiplier: 1.20 },
  { id: 'elemental_flame', name: 'Infernal Heat', description: 'Monsters deal bonus Fire Damage', expMultiplier: 1.20, dropMultiplier: 1.25 }
];

export function generateMapTicket(tier = 1) {
  const mapData = MAP_TIERS[tier] || MAP_TIERS[1];
  const numMods = tier >= 3 ? (Math.random() < 0.5 ? 1 : 2) : 0;
  const mods = [];

  const availableMods = [...MAP_MODIFIERS];
  for (let i = 0; i < numMods; i++) {
    const chosenIdx = Math.floor(Math.random() * availableMods.length);
    mods.push(availableMods.splice(chosenIdx, 1)[0]);
  }

  return {
    tier,
    name: `Tier ${tier} Map: ${mapData.name}`,
    baseLevel: mapData.baseLevel,
    bossName: mapData.boss,
    modifiers: mods
  };
}

export function generateEncounterMonsters(mapTicket) {
  const tier = mapTicket.tier || 1;
  const baseLevel = mapTicket.baseLevel || (tier * 10);
  const numMonsters = Math.floor(Math.random() * 2) + 2; // 2 to 3 monsters
  const monsters = [];

  for (let i = 1; i <= numMonsters; i++) {
    monsters.push({
      id: `monster_${i}`,
      name: `Tier ${tier} Corrupted Guard #${i}`,
      hp: Math.round(80 + baseLevel * 12 * (1 + (tier * 0.15))),
      maxHp: Math.round(80 + baseLevel * 12 * (1 + (tier * 0.15))),
      damage: Math.round(10 + baseLevel * 2.5 * (1 + (tier * 0.10))),
      armor: Math.round(5 + baseLevel * 1.5),
      evasion: Math.round(5 + baseLevel * 1.2),
      isBoss: false
    });
  }

  // Add Boss
  const mapData = MAP_TIERS[tier] || MAP_TIERS[1];
  monsters.push({
    id: 'boss',
    name: `[BOSS] ${mapData.boss}`,
    hp: Math.round((250 + baseLevel * 30) * (1 + (tier * 0.25))),
    maxHp: Math.round((250 + baseLevel * 30) * (1 + (tier * 0.25))),
    damage: Math.round((20 + baseLevel * 4.5) * (1 + (tier * 0.15))),
    armor: Math.round(15 + baseLevel * 3),
    evasion: Math.round(10 + baseLevel * 2),
    isBoss: true
  });

  return monsters;
}
