import test from 'node:test';
import assert from 'node:assert/strict';
import { getGearTierFromILvl, getGearTierMinLevel } from '../src/config/constants.js';

test('getGearTierFromILvl — matches the design doc iLvl bands exactly', () => {
  assert.equal(getGearTierFromILvl(1), 1);
  assert.equal(getGearTierFromILvl(14), 1);
  assert.equal(getGearTierFromILvl(15), 2);
  assert.equal(getGearTierFromILvl(29), 2);
  assert.equal(getGearTierFromILvl(30), 3);
  assert.equal(getGearTierFromILvl(49), 3);
  assert.equal(getGearTierFromILvl(50), 4);
  assert.equal(getGearTierFromILvl(69), 4);
  assert.equal(getGearTierFromILvl(70), 5);
  assert.equal(getGearTierFromILvl(84), 5);
  assert.equal(getGearTierFromILvl(85), 6);
  assert.equal(getGearTierFromILvl(100), 6);
});

test('getGearTierMinLevel — T1 requires 10, T2 20, ... T6 60', () => {
  assert.equal(getGearTierMinLevel(1), 10);
  assert.equal(getGearTierMinLevel(2), 20);
  assert.equal(getGearTierMinLevel(3), 30);
  assert.equal(getGearTierMinLevel(4), 40);
  assert.equal(getGearTierMinLevel(5), 50);
  assert.equal(getGearTierMinLevel(6), 60);
});
