import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';
import { generateMapTicket, generateEncounterMonsters } from '../../game/maps/mapEngine.js';
import { calculateEffectiveStats, resolveCombatRound, generatePersonalInstancedLoot } from '../../game/combat/combatEngine.js';
import { createCombatEmbed, createCombatActionButtons } from '../embeds/uiBuilders.js';
import { accumulateTreeStats } from '../../game/skillTree/treeEngine.js';

const activeDungeonBattles = new Map();

export const data = new SlashCommandBuilder()
  .setName('dungeon')
  .setDescription('Enter Map Dungeons (Solo or Party)')
  .addSubcommand(sub =>
    sub.setName('enter')
      .setDescription('Start a dungeon map run')
      .addIntegerOption(opt =>
        opt.setName('tier')
          .setDescription('Map Tier (0 = Tutorial Grounds, 1-6 = Dungeons)')
          .setMinValue(0)
          .setMaxValue(6)
          .setRequired(false)));

export async function execute(interaction) {
  const discordId = interaction.user.id;

  const user = await User.findOne({ discordId });
  if (!user || !user.activeCharacterId) {
    return interaction.reply({ content: '❌ Active character required. Use `/character create` first!', ephemeral: true });
  }

  const character = await Character.findById(user.activeCharacterId);
  if (!character) {
    return interaction.reply({ content: '❌ Active character not found.', ephemeral: true });
  }

  const selectedTier = interaction.options.getInteger('tier');
  // Default to Tier 0 (Tutorial) if early level, or Tier 1
  const tier = selectedTier !== null ? selectedTier : (character.level <= 2 ? 0 : 1);

  const equippedItems = await Item.find({ characterId: character._id, isEquipped: true });
  const treeStats = accumulateTreeStats(character.className, character.passiveTree);
  const stats = calculateEffectiveStats(character, equippedItems, treeStats);

  const mapTicket = generateMapTicket(tier);
  const enemyList = generateEncounterMonsters(mapTicket);

  const partyState = [
    {
      character,
      stats,
      currentHp: stats.maxHp,
      tauntTurns: 0,
      armorBuffPercent: 0
    }
  ];

  const battleId = `battle_${character._id}_${Date.now()}`;
  const encounterState = {
    battleId,
    mapTicket,
    round: 1,
    partyState,
    enemyList,
    pendingActions: {},
    logs: [`⚔️ **Encounter Started**: Entering ${mapTicket.name}! Monsters engaged.`]
  };

  activeDungeonBattles.set(battleId, encounterState);

  const embed = createCombatEmbed(encounterState);
  const actionRow = createCombatActionButtons(character._id.toString());

  return interaction.reply({
    embeds: [embed],
    components: [actionRow]
  });
}

export async function handleCombatButton(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith('combat_')) return;

  const [_, actionType, ...rest] = customId.split('_');
  const characterId = rest[rest.length - 1];

  // Find active battle containing this character
  let targetBattle = null;
  for (const [id, state] of activeDungeonBattles.entries()) {
    if (state.partyState.some(m => m.character._id.toString() === characterId)) {
      targetBattle = state;
      break;
    }
  }

  if (!targetBattle) {
    return interaction.reply({ content: '❌ Dungeon battle session expired or not found.', ephemeral: true });
  }

  // Register action
  let skillId = null;
  if (actionType === 'skill') {
    skillId = customId.split('_')[2];
  }

  targetBattle.pendingActions[characterId] = {
    type: actionType === 'skill' ? 'skill' : actionType,
    skillId
  };

  // If all living party members submitted actions, resolve round!
  const livingPartyCount = targetBattle.partyState.filter(m => m.currentHp > 0).length;
  if (Object.keys(targetBattle.pendingActions).length >= livingPartyCount) {
    // Resolve Option B round!
    const roundResult = resolveCombatRound(targetBattle.partyState, targetBattle.enemyList, targetBattle.pendingActions);
    targetBattle.logs = roundResult.roundLogs;
    targetBattle.pendingActions = {}; // Reset for next round
    targetBattle.round += 1;

    if (roundResult.allEnemiesDefeated) {
      // Victory! Award personal instanced loot
      const loot = generatePersonalInstancedLoot(targetBattle.partyState[0].character, targetBattle.mapTicket.tier);
      
      const char = targetBattle.partyState[0].character;
      char.gold += loot.gold;
      char.xp += loot.xp;

      // Add Orbs
      for (const orbKey of loot.orbDrops) {
        const cur = char.orbs.get ? char.orbs.get(orbKey) : (char.orbs[orbKey] || 0);
        if (char.orbs.set) char.orbs.set(orbKey, cur + 1);
        else char.orbs[orbKey] = cur + 1;
      }

      await char.save();

      // Save gear items
      for (const itemData of loot.items) {
        await Item.create({
          characterId: char._id,
          ...itemData
        });
      }

      activeDungeonBattles.delete(targetBattle.battleId);

      const orbText = loot.orbDrops.map(o => `• **${o.replace(/_/g, ' ')}**`).join('\n') || '*None*';
      const gearText = loot.items.map(i => `• **${i.name}** [${i.rarity}]`).join('\n') || '*None*';

      return interaction.update({
        content: `🏆 **VICTORY DEFEATED ALL MONSTERS!**\n\n💰 **Gold**: +${loot.gold}\n✨ **XP**: +${loot.xp}\n🔮 **Orbs Dropped**:\n${orbText}\n🗡️ **Gear Dropped**:\n${gearText}`,
        embeds: [],
        components: []
      });
    }

    if (roundResult.allPlayersDefeated) {
      activeDungeonBattles.delete(targetBattle.battleId);
      return interaction.update({
        content: `💀 **DEFEAT!** All party members fell in combat inside ${targetBattle.mapTicket.name}.`,
        embeds: [],
        components: []
      });
    }

    // Battle continues
    const embed = createCombatEmbed(targetBattle);
    const actionRow = createCombatActionButtons(characterId);

    return interaction.update({
      embeds: [embed],
      components: [actionRow]
    });
  } else {
    return interaction.reply({ content: `✅ Action registered for this round. Waiting for party members...`, ephemeral: true });
  }
}
