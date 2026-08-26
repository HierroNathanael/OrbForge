import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import * as characterCmd from '../src/discord/commands/character.js';
import * as treeCmd from '../src/discord/commands/tree.js';
import * as dungeonCmd from '../src/discord/commands/dungeon.js';
import * as inventoryCmd from '../src/discord/commands/inventory.js';
import * as craftCmd from '../src/discord/commands/craft.js';
import * as shopCmd from '../src/discord/commands/shop.js';
import * as tutorialCmd from '../src/discord/commands/tutorial.js';
import { GAME_CONFIG } from '../src/config/constants.js';

let mongoServer;

// Helper to create mock Discord interactions
function createMockInteraction(userId, options = {}, customId = null) {
  let repliedContent = null;
  let repliedEmbeds = [];
  let repliedComponents = [];
  let isEphemeral = false;
  let isUpdated = false;

  return {
    user: { id: userId },
    customId,
    values: options.values || [],
    options: {
      getSubcommand: () => options.subcommand || null,
      getString: (name) => options[name] ?? null,
      getInteger: (name) => options[name] ?? null,
      getBoolean: (name) => options[name] ?? null
    },
    reply: async (data) => {
      repliedContent = typeof data === 'string' ? data : data.content;
      repliedEmbeds = data.embeds || [];
      repliedComponents = data.components || [];
      isEphemeral = !!data.ephemeral;
      return true;
    },
    update: async (data) => {
      isUpdated = true;
      repliedContent = typeof data === 'string' ? data : data.content;
      repliedEmbeds = data.embeds || [];
      repliedComponents = data.components || [];
      return true;
    },
    getReply: () => ({ content: repliedContent, embeds: repliedEmbeds, components: repliedComponents, isEphemeral, isUpdated })
  };
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('Discord Commands Flow — /character create, profile, list, select', async () => {
  const userId = 'user_123';

  // 1. /character create
  const createInt = createMockInteraction(userId, { subcommand: 'create', name: 'Valerius', class: 'Warrior' });
  await characterCmd.execute(createInt);
  const createReply = createInt.getReply();
  assert.ok(createReply.content.includes('Successfully created character'));
  assert.equal(createReply.embeds.length, 1);

  // 2. /character profile
  const profileInt = createMockInteraction(userId, { subcommand: 'profile' });
  await characterCmd.execute(profileInt);
  const profileReply = profileInt.getReply();
  assert.equal(profileReply.embeds.length, 1);
  assert.ok(profileReply.embeds[0].data.title.includes('Valerius'));

  // 3. /character list
  const listInt = createMockInteraction(userId, { subcommand: 'list' });
  await characterCmd.execute(listInt);
  const listReply = listInt.getReply();
  assert.ok(listReply.content.includes('Valerius'));
  assert.ok(listReply.content.includes('ACTIVE'));
});

test('Discord Commands Flow — /tree view, allocate, respec', async () => {
  const userId = 'user_123';

  // 1. /tree view
  const viewInt = createMockInteraction(userId, { subcommand: 'view' });
  await treeCmd.execute(viewInt);
  assert.equal(viewInt.getReply().embeds.length, 1);

  // 2. /tree allocate (shows dropdown menu)
  const allocInt = createMockInteraction(userId, { subcommand: 'allocate' });
  await treeCmd.execute(allocInt);
  const allocReply = allocInt.getReply();
  assert.ok(allocReply.components.length > 0);

  // 3. Select menu interaction to allocate war_str_1
  const selectInt = createMockInteraction(userId, { values: ['war_str_1'] }, 'tree_allocate_select');
  await treeCmd.handleTreeSelectMenu(selectInt);
  assert.ok(selectInt.getReply().content.includes('Successfully allocated point'));

  // 4. /tree respec
  const respecInt = createMockInteraction(userId, { subcommand: 'respec', node_id: 'war_str_1' });
  await treeCmd.execute(respecInt);
  assert.ok(respecInt.getReply().content.includes('Successfully respecced'));
});

test('Discord Commands Flow — /dungeon enter and combat buttons to victory', async () => {
  const userId = 'user_123';

  // 1. Enter Tier 0 tutorial dungeon
  const enterInt = createMockInteraction(userId, { subcommand: 'enter', tier: 0 });
  await dungeonCmd.execute(enterInt);
  const enterReply = enterInt.getReply();
  assert.equal(enterReply.embeds.length, 1);
  assert.ok(enterReply.components.length > 0);

  // Get active battle and character ID
  const activeBattles = Array.from(dungeonCmd.activeDungeonBattles.values());
  assert.ok(activeBattles.length > 0);
  const battle = activeBattles[0];
  const charId = battle.partyState[0].character._id.toString();

  // 2. Click combat buttons until victory
  let maxRounds = 15;
  while (dungeonCmd.activeDungeonBattles.has(battle.battleId) && maxRounds > 0) {
    maxRounds--;
    const attackInt = createMockInteraction(userId, {}, `combat:attack:${charId}`);
    await dungeonCmd.handleCombatButton(attackInt);
  }

  // Dungeon should finish in victory and award gear/orbs
  assert.equal(dungeonCmd.activeDungeonBattles.has(battle.battleId), false, 'Battle should finish and clear from active state');
});

test('Discord Commands Flow — /dungeon auto with 100% full normal rewards', async () => {
  const userId = 'user_123';
  const user = await mongoose.model('User').findOne({ discordId: userId });

  // 1. Without active pass -> should prompt to buy pass
  const autoFailInt = createMockInteraction(userId, { subcommand: 'auto', tier: 0, runs: 1 });
  await dungeonCmd.execute(autoFailInt);
  assert.ok(autoFailInt.getReply().content.includes('Auto-Battle Pass Required'));

  // 2. Activate Auto-Battle Pass on user
  user.autoBattlePass = {
    active: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
  await user.save();

  // 3. Run /dungeon auto with active pass
  const autoSuccessInt = createMockInteraction(userId, { subcommand: 'auto', tier: 0, runs: 2 });
  await dungeonCmd.execute(autoSuccessInt);
  const reply = autoSuccessInt.getReply();
  assert.equal(reply.embeds.length, 1);
  assert.ok(reply.embeds[0].data.title.includes('Auto-Battle Results'));
  assert.ok(reply.embeds[0].data.description.includes('100% full normal rewards'));
});

test('Discord Commands Flow — /inventory view, equip, and /craft with dropped Orbs', async () => {
  const userId = 'user_123';

  // 1. /inventory view
  const invInt = createMockInteraction(userId, { subcommand: 'view' });
  await inventoryCmd.execute(invInt);
  const invReply = invInt.getReply();
  assert.ok(invReply.embeds.length > 0 || invReply.content.includes('Inventory'));

  // 2. /inventory inspect or equip first found item
  const char = await mongoose.model('Character').findOne({ discordId: userId });
  const item = await mongoose.model('Item').findOne({ characterId: char._id });
  assert.ok(item, 'Item should have dropped from dungeon');

  const equipInt = createMockInteraction(userId, { subcommand: 'equip', item_id: item._id.toString() });
  await inventoryCmd.execute(equipInt);
  assert.ok(equipInt.getReply().content.includes('Equipped'));

  // 3. /craft with Orb of Kindling
  item.rarity = 'Normal';
  await item.save();

  const craftInt = createMockInteraction(userId, { 
    orb: GAME_CONFIG.ORB_TYPES.KINDLING, 
    item_id: item._id.toString() 
  });
  await craftCmd.execute(craftInt);
  const craftReply = craftInt.getReply();
  assert.ok(craftReply.embeds.length > 0 || craftReply.content.includes('FORGE'));
});

test('Discord Commands Flow — /shop view and /tutorial chapters', async () => {
  const userId = 'user_123';

  // 1. /shop view
  const shopInt = createMockInteraction(userId, { subcommand: 'view' });
  await shopCmd.execute(shopInt);
  assert.equal(shopInt.getReply().embeds.length, 1);

  // 2. /tutorial
  const tutInt = createMockInteraction(userId, { chapter: 1 });
  await tutorialCmd.execute(tutInt);
  const tutReply = tutInt.getReply();
  assert.equal(tutReply.embeds.length, 1);
  assert.equal(tutReply.components.length, 1);

  // 3. /tutorial button next
  const tutBtnInt = createMockInteraction(userId, {}, `tutorial:next:0:${userId}`);
  await tutorialCmd.handleTutorialButton(tutBtnInt);
  assert.ok(tutBtnInt.getReply().isUpdated);
});
