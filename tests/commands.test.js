import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import * as characterCmd from '../src/discord/commands/character.js';
import * as treeCmd from '../src/discord/commands/tree.js';
import * as dungeonCmd from '../src/discord/commands/dungeon.js';
import * as inventoryCmd from '../src/discord/commands/inventory.js';
import * as forgeCmd from '../src/discord/commands/forge.js';
import * as tutorialCmd from '../src/discord/commands/tutorial.js';
import * as tradeCmd from '../src/discord/commands/trade.js';
import * as redeemCmd from '../src/discord/commands/redeem.js';
import { RedeemCode } from '../src/models/RedeemCode.js';
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
      getBoolean: (name) => options[name] ?? null,
      getUser: (name) => options[name] ?? null
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

  // 1. Enter Tier 0 tutorial dungeon (opens a party lobby)
  const enterInt = createMockInteraction(userId, { subcommand: 'enter', tier: 0 });
  await dungeonCmd.execute(enterInt);
  const enterReply = enterInt.getReply();
  assert.equal(enterReply.embeds.length, 1);
  assert.ok(enterReply.components.length > 0);

  const lobby = Array.from(dungeonCmd.activeDungeonLobbies.values())[0];
  assert.ok(lobby);

  // 2. Leader starts the dungeon solo
  const startInt = createMockInteraction(userId, {}, `dungeon:start:${lobby.lobbyId}`);
  await dungeonCmd.handleLobbyButton(startInt);
  assert.equal(dungeonCmd.activeDungeonLobbies.has(lobby.lobbyId), false, 'Lobby should close once started');

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

test('Discord Commands Flow — /dungeon party join, cap at 3, and leader-only start', async () => {
  const leaderId = 'party_leader';
  const mate1Id = 'party_mate_1';
  const mate2Id = 'party_mate_2';
  const mate3Id = 'party_mate_3';

  for (const [id, name] of [[leaderId, 'Leader'], [mate1Id, 'Mate1'], [mate2Id, 'Mate2'], [mate3Id, 'Mate3']]) {
    const createInt = createMockInteraction(id, { subcommand: 'create', name, class: 'Warrior' });
    await characterCmd.execute(createInt);
  }

  // Leader opens a lobby
  const enterInt = createMockInteraction(leaderId, { subcommand: 'enter', tier: 0 });
  await dungeonCmd.execute(enterInt);
  const lobby = Array.from(dungeonCmd.activeDungeonLobbies.values()).find(l => l.leaderId === leaderId);
  assert.ok(lobby);

  // Non-leader can't start an under-full lobby
  const earlyStartInt = createMockInteraction(mate1Id, {}, `dungeon:start:${lobby.lobbyId}`);
  await dungeonCmd.handleLobbyButton(earlyStartInt);
  assert.ok(earlyStartInt.getReply().content.includes('Only the party leader'));

  // Two teammates join, filling the party to GAME_CONFIG.PARTY_SIZE_MAX (3)
  const join1Int = createMockInteraction(mate1Id, {}, `dungeon:join:${lobby.lobbyId}`);
  await dungeonCmd.handleLobbyButton(join1Int);
  const join2Int = createMockInteraction(mate2Id, {}, `dungeon:join:${lobby.lobbyId}`);
  await dungeonCmd.handleLobbyButton(join2Int);
  assert.equal(lobby.members.length, GAME_CONFIG.PARTY_SIZE_MAX);

  // A 4th player is rejected — party is full
  const join3Int = createMockInteraction(mate3Id, {}, `dungeon:join:${lobby.lobbyId}`);
  await dungeonCmd.handleLobbyButton(join3Int);
  assert.ok(join3Int.getReply().content.includes('full'));
  assert.equal(lobby.members.length, GAME_CONFIG.PARTY_SIZE_MAX);

  // Leader starts the full party
  const startInt = createMockInteraction(leaderId, {}, `dungeon:start:${lobby.lobbyId}`);
  await dungeonCmd.handleLobbyButton(startInt);
  assert.equal(dungeonCmd.activeDungeonLobbies.has(lobby.lobbyId), false);

  const battle = Array.from(dungeonCmd.activeDungeonBattles.values()).find(b => b.partyState.length === GAME_CONFIG.PARTY_SIZE_MAX);
  assert.ok(battle, 'Battle should launch with all 3 party members');

  // Each living member can act; round resolves once every living member has submitted
  let maxRounds = 20;
  while (dungeonCmd.activeDungeonBattles.has(battle.battleId) && maxRounds > 0) {
    maxRounds--;
    for (const member of battle.partyState) {
      if (member.currentHp <= 0) continue;
      const attackInt = createMockInteraction(leaderId, {}, `combat:attack:${member.character._id.toString()}`);
      await dungeonCmd.handleCombatButton(attackInt);
      if (!dungeonCmd.activeDungeonBattles.has(battle.battleId)) break;
    }
  }

  assert.equal(dungeonCmd.activeDungeonBattles.has(battle.battleId), false, 'Party battle should resolve to victory or defeat');
});

test('Discord Commands Flow — /inventory view, equip, and /forge with dropped Orbs', async () => {
  const userId = 'user_123';

  // 1. /inventory view
  const invInt = createMockInteraction(userId, { subcommand: 'view' });
  await inventoryCmd.execute(invInt);
  const invReply = invInt.getReply();
  assert.ok(invReply.embeds.length > 0 || invReply.content.includes('Inventory'));

  // 2. /inventory inspect or equip first found item
  const char = await mongoose.model('Character').findOne({ discordId: userId });
  let item = await mongoose.model('Item').findOne({ characterId: char._id });
  // Gear drop from the prior dungeon run is a 50% RNG roll (combatEngine.js
  // generatePersonalInstancedLoot) — not guaranteed. This test only cares
  // about the equip/forge flow, so seed one deterministically if none dropped.
  if (!item) {
    item = await mongoose.model('Item').create({
      characterId: char._id,
      baseItemId: 'test_sword',
      name: 'Test Sword',
      type: 'weapon',
      rarity: 'Normal',
      iLvl: 1,
      baseStats: { damage: 5 }
    });
  }

  const equipInt = createMockInteraction(userId, { subcommand: 'equip', item_id: item._id.toString() });
  await inventoryCmd.execute(equipInt);
  assert.ok(equipInt.getReply().content.includes('Equipped'));

  // 3. /forge with Orb of Kindling
  item.rarity = 'Normal';
  await item.save();

  const forgeInt = createMockInteraction(userId, {
    orb: GAME_CONFIG.ORB_TYPES.KINDLING,
    item_id: item._id.toString()
  });
  await forgeCmd.execute(forgeInt);
  const forgeReply = forgeInt.getReply();
  assert.ok(forgeReply.embeds.length > 0 || forgeReply.content.includes('FORGE'));
});

test('Discord Commands Flow — /trade offer, accept swaps item + gold both ways', async () => {
  const sellerId = 'trader_seller';
  const buyerId = 'trader_buyer';

  await characterCmd.execute(createMockInteraction(sellerId, { subcommand: 'create', name: 'Seller', class: 'Warrior' }));
  await characterCmd.execute(createMockInteraction(buyerId, { subcommand: 'create', name: 'Buyer', class: 'Ranger' }));

  const seller = await mongoose.model('Character').findOne({ discordId: sellerId });
  const buyer = await mongoose.model('Character').findOne({ discordId: buyerId });

  const item = await mongoose.model('Item').create({
    characterId: seller._id,
    baseItemId: 'trade_test_bow',
    name: 'Trade Test Bow',
    type: 'weapon',
    rarity: 'Normal',
    iLvl: 1
  });

  const sellerGoldBefore = seller.gold;
  const buyerGoldBefore = buyer.gold;

  // Seller offers the item for 40 gold from buyer
  const offerInt = createMockInteraction(sellerId, {
    subcommand: 'offer',
    target: { id: buyerId, username: 'Buyer', bot: false },
    give_item: item._id.toString(),
    for_gold: 40
  });
  await tradeCmd.execute(offerInt);
  assert.ok(offerInt.getReply().components.length > 0, 'Offer should render Accept/Decline buttons');

  const offer = Array.from(tradeCmd.activeTradeOffers.values())[0];
  assert.ok(offer);

  // Buyer accepts
  const acceptInt = createMockInteraction(buyerId, {}, `trade:accept:${offer.tradeId}`);
  await tradeCmd.handleTradeButton(acceptInt);
  assert.ok(acceptInt.getReply().content.includes('Trade complete'));
  assert.equal(tradeCmd.activeTradeOffers.has(offer.tradeId), false, 'Offer should clear after accept');

  const updatedItem = await mongoose.model('Item').findById(item._id);
  assert.equal(updatedItem.characterId.toString(), buyer._id.toString(), 'Item should now belong to buyer');

  const updatedSeller = await mongoose.model('Character').findById(seller._id);
  const updatedBuyer = await mongoose.model('Character').findById(buyer._id);
  assert.equal(updatedSeller.gold, sellerGoldBefore + 40);
  assert.equal(updatedBuyer.gold, buyerGoldBefore - 40);
});

test('Discord Commands Flow — /trade decline leaves item and gold untouched', async () => {
  const sellerId = 'trader_seller_2';
  const buyerId = 'trader_buyer_2';

  await characterCmd.execute(createMockInteraction(sellerId, { subcommand: 'create', name: 'Seller2', class: 'Warrior' }));
  await characterCmd.execute(createMockInteraction(buyerId, { subcommand: 'create', name: 'Buyer2', class: 'Ranger' }));

  const seller = await mongoose.model('Character').findOne({ discordId: sellerId });
  const buyer = await mongoose.model('Character').findOne({ discordId: buyerId });

  const item = await mongoose.model('Item').create({
    characterId: seller._id,
    baseItemId: 'trade_test_shield',
    name: 'Trade Test Shield',
    type: 'chest',
    rarity: 'Normal',
    iLvl: 1
  });

  const offerInt = createMockInteraction(sellerId, {
    subcommand: 'offer',
    target: { id: buyerId, username: 'Buyer2', bot: false },
    give_item: item._id.toString(),
    for_gold: 10
  });
  await tradeCmd.execute(offerInt);
  const offer = Array.from(tradeCmd.activeTradeOffers.values()).find(o => o.fromDiscordId === sellerId);
  assert.ok(offer);

  const declineInt = createMockInteraction(buyerId, {}, `trade:decline:${offer.tradeId}`);
  await tradeCmd.handleTradeButton(declineInt);
  assert.ok(declineInt.getReply().content.includes('declined'));
  assert.equal(tradeCmd.activeTradeOffers.has(offer.tradeId), false);

  const untouchedItem = await mongoose.model('Item').findById(item._id);
  assert.equal(untouchedItem.characterId.toString(), seller._id.toString(), 'Item should stay with seller after decline');
});

test('Discord Commands Flow — /tutorial chapters', async () => {
  const userId = 'user_123';

  // 1. /tutorial
  const tutInt = createMockInteraction(userId, { chapter: 1 });
  await tutorialCmd.execute(tutInt);
  const tutReply = tutInt.getReply();
  assert.equal(tutReply.embeds.length, 1);
  assert.equal(tutReply.components.length, 1);

  // 2. /tutorial button next
  const tutBtnInt = createMockInteraction(userId, {}, `tutorial:next:0:${userId}`);
  await tutorialCmd.handleTutorialButton(tutBtnInt);
  assert.ok(tutBtnInt.getReply().isUpdated);
});

test('Discord Commands Flow — /redeem grants rewards once per character', async () => {
  const userId = 'redeemer_1';

  await characterCmd.execute(createMockInteraction(userId, { subcommand: 'create', name: 'Redeemer', class: 'Mage' }));
  const character = await mongoose.model('Character').findOne({ discordId: userId });
  const goldBefore = character.gold;
  const orbBefore = character.orbs.orb_of_kindling;

  await RedeemCode.create({
    code: 'WELCOME10',
    rewardGold: 50,
    rewardOrbs: { orb_of_kindling: 2 }
  });

  const redeemInt = createMockInteraction(userId, { code: 'welcome10' });
  await redeemCmd.execute(redeemInt);
  assert.ok(redeemInt.getReply().content.includes('redeemed'));

  const updated = await mongoose.model('Character').findById(character._id);
  assert.equal(updated.gold, goldBefore + 50);
  assert.equal(updated.orbs.orb_of_kindling, orbBefore + 2);

  // Redeeming again should be rejected
  const secondInt = createMockInteraction(userId, { code: 'WELCOME10' });
  await redeemCmd.execute(secondInt);
  assert.ok(secondInt.getReply().content.includes('already redeemed'));

  const unchanged = await mongoose.model('Character').findById(character._id);
  assert.equal(unchanged.gold, goldBefore + 50);
});

test('Discord Commands Flow — /redeem rejects invalid code', async () => {
  const userId = 'redeemer_2';
  await characterCmd.execute(createMockInteraction(userId, { subcommand: 'create', name: 'Redeemer2', class: 'Warrior' }));

  const invalidInt = createMockInteraction(userId, { code: 'NOPE' });
  await redeemCmd.execute(invalidInt);
  assert.ok(invalidInt.getReply().content.includes('not a valid code'));
});
