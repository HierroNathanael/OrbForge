import test from 'node:test';
import assert from 'node:assert/strict';

// Import the internal page data and builders by re-exporting them from tutorial.js
// We test the tutorial logic without needing Discord API access.

// ─── Inline re-implementation of the page/button logic for testing ────────────
// We need to import TUTORIAL_PAGES and the helper fns. Since tutorial.js doesn't
// export TUTORIAL_PAGES directly, we verify behavioural invariants instead.

import { data as tutorialCommand } from '../src/discord/commands/tutorial.js';

// ─── Slash Command Registration Tests ────────────────────────────────────────

test('Tutorial command — is named "tutorial"', () => {
  assert.equal(tutorialCommand.name, 'tutorial');
});

test('Tutorial command — has a description', () => {
  assert.ok(tutorialCommand.description && tutorialCommand.description.length > 5,
    'Expected a non-empty description');
});

test('Tutorial command — serializes to valid JSON without throwing', () => {
  assert.doesNotThrow(() => {
    const json = tutorialCommand.toJSON();
    assert.ok(json.name, 'JSON must have name');
    assert.ok(json.description, 'JSON must have description');
  });
});

test('Tutorial command — has an optional chapter option', () => {
  const json = tutorialCommand.toJSON();
  // Should have options defined
  assert.ok(Array.isArray(json.options), 'Expected options array');
  const chapterOpt = json.options.find(o => o.name === 'chapter');
  assert.ok(chapterOpt, 'Expected a "chapter" option');
  assert.equal(chapterOpt.required, false, 'chapter option should be optional');
});
