import test from 'node:test';
import assert from 'node:assert/strict';
import { getEligibleAscendNodes, allocateAscendNode, resolveAscendMilestones, accumulateAscendStats } from '../src/game/skillTree/ascendEngine.js';

test('Ascend Tree — resolveAscendMilestones grants nothing before ascending', () => {
  const character = {
    subclassName: null,
    level: 50,
    ascendPoints: { available: 0, spent: 0 }
  };

  const granted = resolveAscendMilestones(character);
  assert.equal(granted, 0);
  assert.equal(character.ascendPoints.available, 0);
});

test('Ascend Tree — resolveAscendMilestones grants the level-20 package on ascend', () => {
  const character = {
    subclassName: 'Berserker',
    level: 20,
    ascendPoints: { available: 0, spent: 0 }
  };

  const granted = resolveAscendMilestones(character);
  assert.equal(granted, 2);
  assert.equal(character.ascendPoints.available, 2);

  // Idempotent — calling again at the same level grants nothing more.
  const grantedAgain = resolveAscendMilestones(character);
  assert.equal(grantedAgain, 0);
  assert.equal(character.ascendPoints.available, 2);
});

test('Ascend Tree — resolveAscendMilestones backfills all passed milestones on a late ascend', () => {
  const character = {
    subclassName: 'Berserker',
    level: 60,
    ascendPoints: { available: 0, spent: 0 }
  };

  const granted = resolveAscendMilestones(character);
  assert.equal(granted, 6); // milestones 20, 40, 60 => 3 * 2
  assert.equal(character.ascendPoints.available, 6);
});

test('Ascend Tree — resolveAscendMilestones grants more after leveling past a new milestone', () => {
  const character = {
    subclassName: 'Berserker',
    level: 25,
    ascendPoints: { available: 0, spent: 2 } // already spent the level-20 grant
  };

  resolveAscendMilestones(character); // level 25 -> still just milestone 20, already granted (spent=2)
  assert.equal(character.ascendPoints.available, 0);

  character.level = 45; // crosses milestone 40
  const granted = resolveAscendMilestones(character);
  assert.equal(granted, 2);
  assert.equal(character.ascendPoints.available, 2);
});

test('Ascend Tree — allocateAscendNode requires having Ascended first', () => {
  const character = {
    subclassName: null,
    ascendPoints: { available: 5, spent: 0 },
    ascendTree: new Map()
  };

  assert.throws(() => {
    allocateAscendNode(character, 'asc_war_berserker_small_1');
  }, /Must Ascend/);
});

test('Ascend Tree — allocateAscendNode enforces prerequisites before a notable', () => {
  const character = {
    subclassName: 'Berserker',
    ascendPoints: { available: 5, spent: 0 },
    ascendTree: new Map()
  };

  assert.throws(() => {
    allocateAscendNode(character, 'war_asc_berserker_rage');
  }, /Prerequisites not met/);
});

test('Ascend Tree — allocateAscendNode rejects an unaffordable notable even with prereqs met', () => {
  const character = {
    subclassName: 'Berserker',
    ascendPoints: { available: 1, spent: 0 },
    ascendTree: new Map([['asc_war_berserker_small_1', 1], ['asc_war_berserker_small_2', 1]])
  };

  assert.throws(() => {
    allocateAscendNode(character, 'war_asc_berserker_rage');
  }, /Requires 2 Ascendancy Points/);
});

test('Ascend Tree — allocateAscendNode happy path deducts the correct pointCost and rejects re-allocation', () => {
  const character = {
    subclassName: 'Berserker',
    ascendPoints: { available: 5, spent: 0 },
    ascendTree: new Map()
  };

  const smallRes = allocateAscendNode(character, 'asc_war_berserker_small_1');
  assert.equal(smallRes.newRank, 1);
  assert.equal(character.ascendPoints.available, 4);
  assert.equal(character.ascendPoints.spent, 1);

  assert.throws(() => {
    allocateAscendNode(character, 'asc_war_berserker_small_1');
  }, /already allocated/);

  allocateAscendNode(character, 'asc_war_berserker_small_2');
  const notableRes = allocateAscendNode(character, 'war_asc_berserker_rage');
  assert.equal(notableRes.newRank, 1);
  assert.equal(character.ascendPoints.available, 1); // 5 - 1 - 1 - 2
  assert.equal(character.ascendPoints.spent, 4);

  const stats = accumulateAscendStats('Berserker', character.ascendTree);
  assert.equal(stats.flat_damage, 12);
  assert.equal(stats.lifesteal, 0.05);
  assert.equal(stats.damage_percent, 0.30);
});

test('Ascend Tree — getEligibleAscendNodes excludes unaffordable/locked notables, includes once ready', () => {
  const emptyTree = new Map();
  const eligibleAtStart = getEligibleAscendNodes('Berserker', emptyTree, 5);
  assert.ok(eligibleAtStart.every(n => n.tier === 'minor'), 'notables should not be eligible before any prereq is met');

  const withPrereqsLowPoints = new Map([['asc_war_berserker_small_1', 1], ['asc_war_berserker_small_2', 1]]);
  const eligibleLowPoints = getEligibleAscendNodes('Berserker', withPrereqsLowPoints, 1);
  assert.equal(eligibleLowPoints.some(n => n.id === 'war_asc_berserker_rage'), false);

  const eligibleEnoughPoints = getEligibleAscendNodes('Berserker', withPrereqsLowPoints, 2);
  assert.equal(eligibleEnoughPoints.some(n => n.id === 'war_asc_berserker_rage'), true);
});
