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

test('Combat Engine — Personal Instanced Loot Generation', () => {
  const character = { _id: 'char_1', name: 'Thorin', level: 10 };
  const loot = generatePersonalInstancedLoot(character, 2);

  assert.ok(loot.gold > 0);
  assert.ok(loot.xp > 0);
  assert.ok(Array.isArray(loot.orbDrops));
  assert.ok(Array.isArray(loot.items));
});
