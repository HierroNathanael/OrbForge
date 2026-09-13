import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCombatRound, generatePersonalInstancedLoot, calculateEffectiveStats } from '../src/game/combat/combatEngine.js';
import { generateMapTicket, generateEncounterMonsters } from '../src/game/maps/mapEngine.js';

test('Combat Engine — Option B Simultaneous Round Resolution', () => {
  const character = { _id: 'char_1', name: 'Thorin', className: 'Warrior', level: 10 };
  const stats = calculateEffectiveStats(character, [], {});

  const partyState = [
    { character, stats, currentHp: stats.maxHp, tauntTurns: 0, armorBuffPercent: 0 }
  ];

  const enemyList = [
    { id: 'm1', name: 'Goblin Guard', hp: 50, maxHp: 50, damage: 10, armor: 5, evasion: 0, isBoss: false }
  ];

  const actions = {
    'char_1': { type: 'attack' }
  };

  const result = resolveCombatRound(partyState, enemyList, actions);
  assert.ok(result.roundLogs.length > 0);
  assert.ok(enemyList[0].hp < 50); // Monster took damage
});

test('Combat Engine — Tier 0 Tutorial Dungeon generation and balance', () => {
  const ticket = generateMapTicket(0);
  assert.equal(ticket.tier, 0);
  assert.ok(ticket.name.includes('Tutorial Dungeon'));

  const monsters = generateEncounterMonsters(ticket);
  assert.ok(monsters.length >= 2, 'Expected 1 dummy + 1 boss');
  
  const dummy = monsters.find(m => !m.isBoss);
  const boss = monsters.find(m => m.isBoss);

  assert.ok(dummy.hp <= 35, `Dummy HP should be beginner friendly, got ${dummy.hp}`);
  assert.ok(dummy.damage <= 6, `Dummy damage should be low, got ${dummy.damage}`);
  assert.ok(boss.hp <= 80, `Boss HP should be defeatable by lvl 1, got ${boss.hp}`);
  assert.ok(boss.damage <= 10, `Boss damage should be survivable, got ${boss.damage}`);
});

test('Combat Engine — Level 1 Character can clear Tier 0 Tutorial Dungeon', () => {
  const character = { _id: 'char_newbie', name: 'Newbie', className: 'Warrior', level: 1 };
  const stats = calculateEffectiveStats(character, [], {}); // ~112 HP, ~12 Dmg
  
  const ticket = generateMapTicket(0);
  const monsters = generateEncounterMonsters(ticket);

  const partyState = [
    { character, stats, currentHp: stats.maxHp, tauntTurns: 0, armorBuffPercent: 0 }
  ];

  let rounds = 0;
  while (monsters.some(m => m.hp > 0) && partyState[0].currentHp > 0 && rounds < 20) {
    rounds++;
    resolveCombatRound(partyState, monsters, {
      'char_newbie': { type: 'attack' }
    });
  }

  assert.ok(partyState[0].currentHp > 0, 'Level 1 character should survive the tutorial dungeon');
  assert.ok(monsters.every(m => m.hp <= 0), 'All tutorial monsters should be defeated');
});

test('Combat Engine — previously-ignored tree stats are now applied', () => {
  const character = { _id: 'char_wired', name: 'Wired', className: 'Warrior', level: 1, baseStats: { strength: 10, dexterity: 10, intelligence: 10 } };
  const baseline = calculateEffectiveStats(character, [], {});

  const treeStats = {
    strength: 10,          // -> +10 armor
    dexterity: 10,         // -> +20 evasion
    intelligence: 10,      // -> +30 mana
    armor_percent: 0.5,    // +50% armor (after flat strength bonus)
    evasion_percent: 0.5,  // +50% evasion (after flat dexterity bonus)
    elemental_damage_percent: 0.2, // folds into damagePercent
    spell_crit: 0.1,       // folds into critChance
    block_chance: 0.3,
    heal_power_percent: 0.25
  };
  const wired = calculateEffectiveStats(character, [], treeStats);

  // Armor/evasion are rounded only after the flat strength/dexterity bonus
  // and the percent multiplier both apply — derive expected values from the
  // pre-rounding base, not from baseline.armor/evasion (already rounded).
  assert.equal(wired.armor, Math.round((6.5 + 10) * 1.5));
  assert.equal(wired.evasion, Math.round((5.5 + 20) * 1.5));
  assert.equal(wired.maxMana, baseline.maxMana + 30);
  assert.equal(wired.damage, Math.round(baseline.damage * 1.2));
  assert.ok(wired.critChance > baseline.critChance);
  assert.equal(wired.blockChance, 0.3);
  assert.equal(wired.healPowerPercent, 0.25);
});

test('Combat Engine — no treeStats produces identical output to the pre-fix baseline shape', () => {
  const character = { _id: 'char_plain', name: 'Plain', className: 'Ranger', level: 5 };
  const stats = calculateEffectiveStats(character, [], {});
  assert.equal(stats.blockChance, 0);
  assert.equal(stats.healPowerPercent, 0);
});

test('Combat Engine — healPowerPercent increases support-skill healing', () => {
  const healer = { _id: 'char_healer', name: 'Healer', className: 'Mage', level: 10 };
  const ally = { _id: 'char_ally', name: 'Ally', className: 'Warrior', level: 10 };

  const buildParty = (healPowerPercent) => {
    const healerStats = { ...calculateEffectiveStats(healer, [], {}), healPowerPercent };
    const allyStats = calculateEffectiveStats(ally, [], {});
    return [
      { character: healer, stats: healerStats, currentHp: 1, tauntTurns: 0, armorBuffPercent: 0 },
      { character: ally, stats: allyStats, currentHp: 1, tauntTurns: 0, armorBuffPercent: 0 }
    ];
  };

  const enemyList = [{ id: 'm1', name: 'Dummy', hp: 999, maxHp: 999, damage: 0, armor: 0, evasion: 100, isBoss: false }];

  const noBonusParty = buildParty(0);
  resolveCombatRound(noBonusParty, enemyList, { char_healer: { type: 'skill', skillId: 'divine_heal' } });
  const baselineHeal = noBonusParty[1].currentHp;

  const bonusParty = buildParty(0.5);
  resolveCombatRound(bonusParty, enemyList, { char_healer: { type: 'skill', skillId: 'divine_heal' } });
  const boostedHeal = bonusParty[1].currentHp;

  assert.ok(boostedHeal > baselineHeal, `Expected boosted heal (${boostedHeal}) > baseline heal (${baselineHeal})`);
});

test('Combat Engine — blockChance halves retaliate damage when triggered', () => {
  const character = { _id: 'char_blocker', name: 'Blocker', className: 'Warrior', level: 10 };
  const baseStats = calculateEffectiveStats(character, [], {});

  const enemy = { id: 'm1', name: 'Brute', hp: 999, maxHp: 999, damage: 100, armor: 0, evasion: 0, isBoss: false };

  const partyNoBlock = [{ character, stats: { ...baseStats, evasion: 0, blockChance: 0 }, currentHp: baseStats.maxHp, tauntTurns: 0, armorBuffPercent: 0 }];
  const partyFullBlock = [{ character, stats: { ...baseStats, evasion: 0, blockChance: 1 }, currentHp: baseStats.maxHp, tauntTurns: 0, armorBuffPercent: 0 }];

  resolveCombatRound(partyNoBlock, [{ ...enemy }], { char_blocker: { type: 'attack' } });
  const dmgTakenNoBlock = baseStats.maxHp - partyNoBlock[0].currentHp;

  resolveCombatRound(partyFullBlock, [{ ...enemy }], { char_blocker: { type: 'attack' } });
  const dmgTakenFullBlock = baseStats.maxHp - partyFullBlock[0].currentHp;

  assert.ok(dmgTakenFullBlock <= Math.ceil(dmgTakenNoBlock / 2) + 1, `Blocked damage (${dmgTakenFullBlock}) should be roughly half of unblocked (${dmgTakenNoBlock})`);
});

test('Combat Engine — Personal Instanced Loot Generation', () => {
  const character = { _id: 'char_1', name: 'Thorin', level: 10 };
  const loot = generatePersonalInstancedLoot(character, 2);

  assert.ok(loot.gold > 0);
  assert.ok(loot.xp > 0);
  assert.ok(Array.isArray(loot.orbDrops));
  assert.ok(Array.isArray(loot.items));
});
