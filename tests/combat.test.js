import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCombatRound, generatePersonalInstancedLoot, calculateEffectiveStats } from '../src/game/combat/combatEngine.js';

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

test('Combat Engine — Personal Instanced Loot Generation', () => {
  const character = { _id: 'char_1', name: 'Thorin', level: 10 };
  const loot = generatePersonalInstancedLoot(character, 2);

  assert.ok(loot.gold > 0);
  assert.ok(loot.xp > 0);
  assert.ok(Array.isArray(loot.orbDrops));
  assert.ok(Array.isArray(loot.items));
});
