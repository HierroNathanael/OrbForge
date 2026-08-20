import test from 'node:test';
import assert from 'node:assert/strict';
import { addBoost, getActiveBoostMultiplier } from '../src/game/economy/boostEngine.js';

test('FIFO Boost Queue — Highest Multiplier Consumed First', () => {
  let boosts = [];

  // Add 1.5x boost for 4 days
  addBoost(boosts, 1.5, 4);
  assert.equal(getActiveBoostMultiplier(boosts), 1.5);

  // Add 2.0x boost for 1 day
  addBoost(boosts, 2.0, 1);
  // Highest multiplier (2.0x) must be active first!
  assert.equal(getActiveBoostMultiplier(boosts), 2.0);

  // Expire the 2.0x boost manually
  boosts[0].expiresAt = new Date(Date.now() - 1000);

  // Now it drops to 1.5x boost
  assert.equal(getActiveBoostMultiplier(boosts), 1.5);
});
