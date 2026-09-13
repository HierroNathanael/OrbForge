import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateNodePoint, respecNodePoint, accumulateTreeStats, getEligibleNodes, getTierPointsSpent, getPhaseGateStatus, ascendSubclass } from '../src/game/skillTree/treeEngine.js';
import { getSubclassChoicesForClass, getRespecChoicesForCharacter } from '../src/discord/commands/tree.js';
import { GAME_CONFIG } from '../src/config/constants.js';

test('Skill Tree — getSubclassChoicesForClass only returns that class\'s own subclasses', () => {
  const warriorChoices = getSubclassChoicesForClass('Warrior').map(c => c.value).sort();
  assert.deepEqual(warriorChoices, ['Berserker', 'Guardian']);

  const rangerChoices = getSubclassChoicesForClass('Ranger').map(c => c.value).sort();
  assert.deepEqual(rangerChoices, ['Sharpshooter', 'Trapper']);

  const mageChoices = getSubclassChoicesForClass('Mage').map(c => c.value).sort();
  assert.deepEqual(mageChoices, ['Battle Mage', 'Elementalist']);

  assert.deepEqual(getSubclassChoicesForClass('NotAClass'), []);
});

test('Skill Tree — getRespecChoicesForCharacter only lists currently-allocated nodes', () => {
  const character = {
    className: 'Warrior',
    passiveTree: new Map([['war_str_1', 2], ['war_hp_1', 1]])
  };

  const choices = getRespecChoicesForCharacter(character);
  const values = choices.map(c => c.value).sort();
  assert.deepEqual(values, ['war_hp_1', 'war_str_1']);

  const strChoice = choices.find(c => c.value === 'war_str_1');
  assert.ok(strChoice.name.includes('Physical Might'));
  assert.ok(strChoice.name.includes('Rank 2/3'));

  assert.deepEqual(getRespecChoicesForCharacter({ className: 'Warrior', passiveTree: new Map() }), []);
});

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

test('Skill Tree — getTierPointsSpent / getPhaseGateStatus', () => {
  const warriorTree = new Map([['war_str_1', 3], ['war_hp_1', 2]]);
  assert.equal(getTierPointsSpent('Warrior', warriorTree, 'small'), 5);
  assert.equal(getTierPointsSpent('Warrior', warriorTree, 'keystone'), 0);

  const belowGate = getPhaseGateStatus('Warrior', 'keystone', warriorTree);
  assert.equal(belowGate.applicable, true);
  assert.equal(belowGate.met, false);
  assert.equal(belowGate.current, 5);
  assert.equal(belowGate.required, GAME_CONFIG.SKILL_TREE_GATES.SMALL_POINTS_FOR_KEYSTONE);

  // Ranger only has one keystone node (max 3 pts) — asymmetric-content case.
  const rangerTree = new Map([['rng_dex_1', 3], ['rng_evasion_1', 3], ['rng_crit_1', 3]]);
  const rangerGate = getPhaseGateStatus('Ranger', 'keystone', rangerTree);
  assert.equal(rangerGate.met, true);
  assert.equal(rangerGate.current, 9);
});

test('Skill Tree — Small to Keystone phase gate blocks allocation below threshold, allows at/above it', () => {
  const character = {
    className: 'Warrior',
    subclassName: null,
    gold: 0,
    orbs: {},
    skillPoints: { available: 10, spent: 0 },
    passiveTree: new Map()
  };

  allocateNodePoint(character, 'war_str_1'); // small = 1
  assert.throws(() => {
    allocateNodePoint(character, 'war_keystone_bloodthirst');
  }, /Requires \d+ points spent in Small/);

  assert.equal(getEligibleNodes('Warrior', null, character.passiveTree).some(n => n.id === 'war_keystone_bloodthirst'), false);

  allocateNodePoint(character, 'war_str_1'); // small = 2
  allocateNodePoint(character, 'war_str_1'); // small = 3 (maxed)
  allocateNodePoint(character, 'war_hp_1');  // small = 4
  allocateNodePoint(character, 'war_hp_1');  // small = 5
  allocateNodePoint(character, 'war_hp_1');  // small = 6 (maxed) -> gate met
  allocateNodePoint(character, 'war_dmg_1'); // prereq war_hp_1, tier small, no self-gate

  assert.equal(getEligibleNodes('Warrior', null, character.passiveTree).some(n => n.id === 'war_keystone_bloodthirst'), true);
  const res = allocateNodePoint(character, 'war_keystone_bloodthirst');
  assert.equal(res.newRank, 1);
});

test('Skill Tree — ascendSubclass happy path', () => {
  const character = {
    className: 'Warrior',
    subclassName: null,
    level: 20,
    gold: 500,
    orbs: { orb_of_fate: 0 },
    skillPoints: { available: 0, spent: 0 },
    passiveTree: new Map([['war_keystone_bloodthirst', 2]])
  };

  const res = ascendSubclass(character, 'Berserker');
  assert.equal(res.subclassName, 'Berserker');
  assert.equal(character.subclassName, 'Berserker');
  assert.equal(character.gold, 500);
  assert.equal(character.orbs.orb_of_fate, 0);
});

test('Skill Tree — ascendSubclass rejects before gate met', () => {
  const character = {
    className: 'Warrior',
    subclassName: null,
    level: 20,
    skillPoints: { available: 0, spent: 0 },
    passiveTree: new Map([['war_keystone_bloodthirst', 1]])
  };

  assert.throws(() => {
    ascendSubclass(character, 'Berserker');
  }, /Requires \d+ points spent in Keystone/);
});

test('Skill Tree — ascendSubclass rejects below minimum level', () => {
  const belowLevel = {
    className: 'Warrior',
    subclassName: null,
    level: 5,
    skillPoints: { available: 0, spent: 0 },
    passiveTree: new Map([['war_keystone_bloodthirst', 2]])
  };
  assert.throws(() => {
    ascendSubclass(belowLevel, 'Berserker');
  }, /Requires Level \d+ to Ascend/);

  // No `level` field at all defaults to 1, same as the schema — not exempt.
  const noLevelField = {
    className: 'Warrior',
    subclassName: null,
    skillPoints: { available: 0, spent: 0 },
    passiveTree: new Map([['war_keystone_bloodthirst', 2]])
  };
  assert.throws(() => {
    ascendSubclass(noLevelField, 'Berserker');
  }, /Requires Level \d+ to Ascend/);
});

test('Skill Tree — ascendSubclass rejects re-ascend', () => {
  const character = {
    className: 'Warrior',
    subclassName: 'Berserker',
    skillPoints: { available: 0, spent: 0 },
    passiveTree: new Map([['war_keystone_bloodthirst', 2]])
  };

  assert.throws(() => {
    ascendSubclass(character, 'Guardian');
  }, /already Ascended/);
});

test('Skill Tree — ascendSubclass rejects invalid subclass for class (key/name mismatch case)', () => {
  const character = {
    className: 'Mage',
    subclassName: null,
    level: 20,
    skillPoints: { available: 0, spent: 0 },
    passiveTree: new Map([['mag_keystone_overload', 2]])
  };

  // classData.js key is "BattleMage" but the valid value is "Battle Mage" (with a space).
  const res = ascendSubclass(character, 'Battle Mage');
  assert.equal(res.subclassName, 'Battle Mage');

  const other = {
    className: 'Warrior',
    subclassName: null,
    skillPoints: { available: 0, spent: 0 },
    passiveTree: new Map([['war_keystone_bloodthirst', 2]])
  };
  assert.throws(() => {
    ascendSubclass(other, 'Sharpshooter'); // valid for Ranger, not Warrior
  }, /not a valid subclass for Warrior/);
});
