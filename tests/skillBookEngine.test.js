import test from 'node:test';
import assert from 'node:assert/strict';
import { learnSkillFromBook, equipSkill, rankUpSkill } from '../src/game/skills/skillBookEngine.js';

test('Skill Book Engine — learnSkillFromBook happy path', () => {
  const character = { knownSkills: [{ skillId: 'heavy_strike', rank: 1 }] };
  const item = { type: 'skill_book', skillId: 'shield_taunt' };

  const res = learnSkillFromBook(character, item);
  assert.equal(res.skillId, 'shield_taunt');
  assert.deepEqual(character.knownSkills.map(k => k.skillId), ['heavy_strike', 'shield_taunt']);
  assert.equal(character.knownSkills[1].rank, 1);
  assert.equal(character.knownSkills[1].source, 'skillbook_drop');
});

test('Skill Book Engine — learnSkillFromBook rejects a non-book item', () => {
  const character = { knownSkills: [] };
  assert.throws(() => {
    learnSkillFromBook(character, { type: 'weapon', skillId: null });
  }, /Not a Skill Book/);
});

test('Skill Book Engine — learnSkillFromBook rejects an already-known skill', () => {
  const character = { knownSkills: [{ skillId: 'shield_taunt', rank: 1 }] };
  assert.throws(() => {
    learnSkillFromBook(character, { type: 'skill_book', skillId: 'shield_taunt' });
  }, /already know/);
});

test('Skill Book Engine — equipSkill happy path', () => {
  const character = { className: 'Warrior', knownSkills: [{ skillId: 'shield_taunt', rank: 1 }], activeSkillLoadout: [] };
  const res = equipSkill(character, 'shield_taunt');
  assert.equal(res.skillId, 'shield_taunt');
  assert.deepEqual(character.activeSkillLoadout, ['shield_taunt']);
});

test('Skill Book Engine — equipSkill rejects an unlearned skill', () => {
  const character = { className: 'Warrior', knownSkills: [], activeSkillLoadout: [] };
  assert.throws(() => {
    equipSkill(character, 'shield_taunt');
  }, /not learned/);
});

test('Skill Book Engine — equipping the core skill clears the loadout', () => {
  const character = { className: 'Warrior', knownSkills: [{ skillId: 'shield_taunt', rank: 1 }], activeSkillLoadout: ['shield_taunt'] };
  equipSkill(character, 'heavy_strike');
  assert.deepEqual(character.activeSkillLoadout, []);
});

test('Skill Book Engine — rankUpSkill happy path deducts a Combat Skill Point', () => {
  const character = {
    knownSkills: [{ skillId: 'heavy_strike', rank: 1 }],
    combatSkillPoints: { available: 3, spent: 0 }
  };
  const res = rankUpSkill(character, 'heavy_strike');
  assert.equal(res.newRank, 2);
  assert.equal(character.knownSkills[0].rank, 2);
  assert.equal(character.combatSkillPoints.available, 2);
  assert.equal(character.combatSkillPoints.spent, 1);
});

test('Skill Book Engine — rankUpSkill rejects insufficient points', () => {
  const character = {
    knownSkills: [{ skillId: 'heavy_strike', rank: 1 }],
    combatSkillPoints: { available: 0, spent: 0 }
  };
  assert.throws(() => {
    rankUpSkill(character, 'heavy_strike');
  }, /No available Combat Skill Points/);
});

test('Skill Book Engine — rankUpSkill rejects at max rank', () => {
  const character = {
    knownSkills: [{ skillId: 'heavy_strike', rank: 5 }],
    combatSkillPoints: { available: 5, spent: 0 }
  };
  assert.throws(() => {
    rankUpSkill(character, 'heavy_strike');
  }, /already at max rank/);
});

test('Skill Book Engine — rankUpSkill rejects an unlearned skill', () => {
  const character = { knownSkills: [], combatSkillPoints: { available: 5, spent: 0 } };
  assert.throws(() => {
    rankUpSkill(character, 'heavy_strike');
  }, /not learned/);
});
