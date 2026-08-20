import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateNodePoint, respecNodePoint, accumulateTreeStats, getEligibleNodes } from '../src/game/skillTree/treeEngine.js';

test('Skill Tree — Allocation and Stat Accumulation', () => {
  const character = {
    className: 'Warrior',
    subclassName: 'Berserker',
    gold: 500,
    orbs: { orb_of_fate: 1 },
    skillPoints: { available: 3, spent: 0 },
    passiveTree: new Map()
  };

  // Allocate war_str_1
  const allocRes = allocateNodePoint(character, 'war_str_1');
  assert.equal(allocRes.newRank, 1);
  assert.equal(character.skillPoints.available, 2);
  assert.equal(character.skillPoints.spent, 1);

  const stats = accumulateTreeStats('Warrior', character.passiveTree);
  assert.equal(stats.strength, 5);
});

test('Skill Tree — Prerequisite Enforcement', () => {
  const character = {
    className: 'Warrior',
    subclassName: 'Berserker',
    skillPoints: { available: 5, spent: 0 },
    passiveTree: new Map()
  };

  // Attempt to allocate node without meeting prerequisite (war_hp_1 requires war_str_1)
  assert.throws(() => {
    allocateNodePoint(character, 'war_hp_1');
  }, /Prerequisites not met/);
});
