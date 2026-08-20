import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCraftingOrb } from '../src/game/crafting/craftingEngine.js';
import { GAME_CONFIG } from '../src/config/constants.js';

// ─── Helper: create a fresh base item ─────────────────────────────────────────
function makeItem(overrides = {}) {
  return {
    baseItemId: 'iron_sword',
    name: 'Iron Sword',
    type: 'weapon',
    rarity: 'Normal',
    iLvl: 10,
    prefixes: [],
    suffixes: [],
    ...overrides
  };
}

// ─── Orb of Kindling ─────────────────────────────────────────────────────────
test('Orb of Kindling — converts Normal to Magic and adds at least 1 affix', () => {
  const item = makeItem();
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.KINDLING);
  assert.equal(res.success, true, `Expected success, got: ${res.message}`);
  assert.equal(item.rarity, 'Magic');
  assert.ok(item.prefixes.length + item.suffixes.length >= 1, 'Expected at least 1 affix after Kindling');
});

test('Orb of Kindling — fails on non-Normal item', () => {
  const item = makeItem({ rarity: 'Magic' });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.KINDLING);
  assert.equal(res.success, false);
  assert.equal(item.rarity, 'Magic');
});

// ─── Orb of Tempering ────────────────────────────────────────────────────────
test('Orb of Tempering — adds affix to a Magic item with room', () => {
  const item = makeItem({ rarity: 'Magic', prefixes: [{ name: 'Heavy', stat: 'flat_damage', value: 10, tier: 1 }] });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.TEMPERING);
  assert.equal(res.success, true, `Expected success, got: ${res.message}`);
  assert.equal(item.prefixes.length + item.suffixes.length, 2, 'Expected 2 affixes after Tempering');
});

test('Orb of Tempering — fails when Magic item is already at max affixes', () => {
  const item = makeItem({
    rarity: 'Magic',
    prefixes: [{ name: 'Heavy', stat: 'flat_damage', value: 10, tier: 1 }],
    suffixes: [{ name: 'of Swiftness', stat: 'critical_strike', value: 0.05, tier: 1 }]
  });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.TEMPERING);
  assert.equal(res.success, false);
});

test('Orb of Tempering — fails on non-Magic item', () => {
  const item = makeItem();
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.TEMPERING);
  assert.equal(res.success, false);
});

// ─── Orb of Ascendance ───────────────────────────────────────────────────────
test('Orb of Ascendance — upgrades Normal to Rare with 4-6 affixes', () => {
  const item = makeItem();
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.ASCENDANCE);
  assert.equal(res.success, true, `Expected success, got: ${res.message}`);
  assert.equal(item.rarity, 'Rare');
  const total = item.prefixes.length + item.suffixes.length;
  assert.ok(total >= 4 && total <= 6, `Expected 4-6 affixes, got ${total}`);
});

test('Orb of Ascendance — fails on non-Normal item', () => {
  const item = makeItem({ rarity: 'Magic' });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.ASCENDANCE);
  assert.equal(res.success, false);
});

// ─── Orb of Unmaking ────────────────────────────────────────────────────────
test('Orb of Unmaking — rerolls all affixes on a Rare item', () => {
  const item = makeItem({
    rarity: 'Rare',
    prefixes: [{ name: 'Stout', stat: 'health', value: 30, tier: 1 }],
    suffixes: []
  });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.UNMAKING);
  assert.equal(res.success, true, `Expected success, got: ${res.message}`);
  assert.equal(item.rarity, 'Rare');
  const total = item.prefixes.length + item.suffixes.length;
  assert.ok(total >= 4, `Expected at least 4 new affixes after Unmaking, got ${total}`);
});

test('Orb of Unmaking — fails on non-Rare item', () => {
  const item = makeItem({ rarity: 'Magic' });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.UNMAKING);
  assert.equal(res.success, false);
});

// ─── Orb of Cleansing ────────────────────────────────────────────────────────
test('Orb of Cleansing — strips Magic item back to Normal with no affixes', () => {
  const item = makeItem({
    rarity: 'Magic',
    prefixes: [{ name: 'Heavy', stat: 'flat_damage', value: 10, tier: 1 }],
    suffixes: [{ name: 'of Swiftness', stat: 'critical_strike', value: 0.05, tier: 1 }]
  });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.CLEANSING);
  assert.equal(res.success, true, `Expected success, got: ${res.message}`);
  assert.equal(item.rarity, 'Normal');
  assert.equal(item.prefixes.length, 0);
  assert.equal(item.suffixes.length, 0);
});

test('Orb of Cleansing — strips Rare item back to Normal', () => {
  const item = makeItem({
    rarity: 'Rare',
    prefixes: [{ name: 'Stout', stat: 'health', value: 30, tier: 1 }],
    suffixes: [{ name: 'of Might', stat: 'strength', value: 5, tier: 1 }]
  });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.CLEANSING);
  assert.equal(res.success, true);
  assert.equal(item.rarity, 'Normal');
  assert.equal(item.prefixes.length + item.suffixes.length, 0);
});

// ─── Orb of Zenith ────────────────────────────────────────────────────────────
test('Orb of Zenith — adds a high-tier affix to a Rare item with space', () => {
  const item = makeItem({
    rarity: 'Rare',
    prefixes: [{ name: 'Heavy', stat: 'flat_damage', value: 10, tier: 1 }],
    suffixes: [{ name: 'of Swiftness', stat: 'critical_strike', value: 0.05, tier: 1 }]
  });
  const totalBefore = item.prefixes.length + item.suffixes.length;
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.ZENITH);
  assert.equal(res.success, true, `Expected success, got: ${res.message}`);
  assert.equal(item.rarity, 'Rare');
  assert.equal(item.prefixes.length + item.suffixes.length, totalBefore + 1, 'Expected +1 affix after Zenith');
});

test('Orb of Zenith — fails when Rare item is already at max affixes', () => {
  const item = makeItem({
    rarity: 'Rare',
    prefixes: [
      { name: 'Heavy', stat: 'flat_damage', value: 10, tier: 1 },
      { name: 'Stout', stat: 'health', value: 30, tier: 1 },
      { name: 'Armored', stat: 'armor', value: 15, tier: 1 }
    ],
    suffixes: [
      { name: 'of Swiftness', stat: 'critical_strike', value: 0.05, tier: 1 },
      { name: 'of Might', stat: 'strength', value: 5, tier: 1 },
      { name: 'of Vampirism', stat: 'lifesteal', value: 0.02, tier: 1 }
    ]
  });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.ZENITH);
  assert.equal(res.success, false);
});

test('Orb of Zenith — fails on non-Rare item', () => {
  const item = makeItem({ rarity: 'Magic' });
  const res = applyCraftingOrb(item, GAME_CONFIG.ORB_TYPES.ZENITH);
  assert.equal(res.success, false);
});

// ─── Sanity: Unknown Orb returns failure ─────────────────────────────────────
test('Unknown orb type — returns failure gracefully', () => {
  const item = makeItem();
  const res = applyCraftingOrb(item, 'orb_of_nonsense');
  assert.equal(res.success, false);
});
