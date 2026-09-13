import test from 'node:test';
import assert from 'node:assert/strict';
import { getCharacterCombatSkills } from '../src/game/skills/skillRegistry.js';

test('Skill Registry — Ranger has only Snipe Shot before Ascending', () => {
  const character = { className: 'Ranger', subclassName: null };
  const skills = getCharacterCombatSkills(character);
  assert.deepEqual(skills.map(s => s.id), ['snipe']);
});

test('Skill Registry — Trapper unlocks Poison Trap as their subclass skill', () => {
  const character = { className: 'Ranger', subclassName: 'Trapper' };
  const skills = getCharacterCombatSkills(character);
  assert.deepEqual(skills.map(s => s.id), ['snipe', 'poison_trap']);
});

test('Skill Registry — Sharpshooter unlocks Piercing Arrow as their subclass skill', () => {
  const character = { className: 'Ranger', subclassName: 'Sharpshooter' };
  const skills = getCharacterCombatSkills(character);
  assert.deepEqual(skills.map(s => s.id), ['snipe', 'piercing_arrow']);
});

test('Skill Registry — Warrior/Mage core kits are unaffected by subclass', () => {
  const berserker = getCharacterCombatSkills({ className: 'Warrior', subclassName: 'Berserker' });
  assert.deepEqual(berserker.map(s => s.id), ['heavy_strike', 'shield_taunt']);

  const noSubclassWarrior = getCharacterCombatSkills({ className: 'Warrior', subclassName: null });
  assert.deepEqual(noSubclassWarrior.map(s => s.id), ['heavy_strike', 'shield_taunt']);

  const elementalist = getCharacterCombatSkills({ className: 'Mage', subclassName: 'Elementalist' });
  assert.deepEqual(elementalist.map(s => s.id), ['fireball', 'divine_heal']);
});
