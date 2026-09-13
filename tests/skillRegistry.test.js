import test from 'node:test';
import assert from 'node:assert/strict';
import { getCharacterCombatSkills, getSkillRankForCharacter, getBookLearnableSkillIds, CLASS_CORE_SKILL } from '../src/game/skills/skillRegistry.js';

test('Skill Registry — every class has exactly 1 guaranteed core skill, subclass-independent', () => {
  const warrior = getCharacterCombatSkills({ className: 'Warrior', subclassName: 'Berserker', knownSkills: [], activeSkillLoadout: [] });
  assert.deepEqual(warrior.map(s => s.id), ['heavy_strike']);

  const ranger = getCharacterCombatSkills({ className: 'Ranger', subclassName: null, knownSkills: [], activeSkillLoadout: [] });
  assert.deepEqual(ranger.map(s => s.id), ['snipe']);

  const mage = getCharacterCombatSkills({ className: 'Mage', subclassName: 'Elementalist', knownSkills: [], activeSkillLoadout: [] });
  assert.deepEqual(mage.map(s => s.id), ['fireball']);
});

test('Skill Registry — 2nd combat slot only appears once a skill is known and equipped', () => {
  const knownButNotEquipped = getCharacterCombatSkills({
    className: 'Ranger',
    knownSkills: [{ skillId: 'snipe', rank: 1 }, { skillId: 'poison_trap', rank: 1 }],
    activeSkillLoadout: []
  });
  assert.deepEqual(knownButNotEquipped.map(s => s.id), ['snipe']);

  const equipped = getCharacterCombatSkills({
    className: 'Ranger',
    knownSkills: [{ skillId: 'snipe', rank: 1 }, { skillId: 'poison_trap', rank: 1 }],
    activeSkillLoadout: ['poison_trap']
  });
  assert.deepEqual(equipped.map(s => s.id), ['snipe', 'poison_trap']);

  // Loadout referencing an unlearned skill is ignored defensively.
  const unlearnedInLoadout = getCharacterCombatSkills({
    className: 'Ranger',
    knownSkills: [{ skillId: 'snipe', rank: 1 }],
    activeSkillLoadout: ['piercing_arrow']
  });
  assert.deepEqual(unlearnedInLoadout.map(s => s.id), ['snipe']);
});

test('Skill Registry — getCharacterCombatSkills attaches currentRank', () => {
  const skills = getCharacterCombatSkills({
    className: 'Warrior',
    knownSkills: [{ skillId: 'heavy_strike', rank: 3 }],
    activeSkillLoadout: []
  });
  assert.equal(skills[0].currentRank, 3);
});

test('Skill Registry — getSkillRankForCharacter defaults to 1 and clamps to the skill\'s max rank', () => {
  assert.equal(getSkillRankForCharacter({ knownSkills: [] }, 'heavy_strike'), 1);
  assert.equal(getSkillRankForCharacter({ knownSkills: [{ skillId: 'heavy_strike', rank: 4 }] }, 'heavy_strike'), 4);
  // whirlwind only has 3 ranks defined — a stray rank 5 entry should clamp, not overrun the array.
  assert.equal(getSkillRankForCharacter({ knownSkills: [{ skillId: 'whirlwind', rank: 5 }] }, 'whirlwind'), 3);
});

test('Skill Registry — getBookLearnableSkillIds excludes only the 3 core skills', () => {
  const pool = getBookLearnableSkillIds();
  for (const coreId of Object.values(CLASS_CORE_SKILL)) {
    assert.equal(pool.includes(coreId), false);
  }
  assert.ok(pool.includes('poison_trap'));
  assert.ok(pool.includes('piercing_arrow'));
  assert.ok(pool.includes('shield_taunt'));
  assert.ok(pool.includes('divine_heal'));
});
