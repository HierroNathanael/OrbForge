import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';
import { generateMapTicket, generateEncounterMonsters } from '../../game/maps/mapEngine.js';
import { calculateEffectiveStats, resolveCombatRound, generatePersonalInstancedLoot } from '../../game/combat/combatEngine.js';
import { createCombatEmbed, createCombatActionButtons } from '../embeds/uiBuilders.js';
import { accumulateTreeStats } from '../../game/skillTree/treeEngine.js';
import { getActiveBoostMultiplier } from '../../game/economy/boostEngine.js';
import { getCharacterCombatSkills } from '../../game/skills/skillRegistry.js';

export const activeDungeonBattles = new Map();

export const data = new SlashCommandBuilder()
  .setName('dungeon')
  .setDescription('Enter Map Dungeons (Solo, Party, or Auto-Battle)')
  .addSubcommand(sub =>
    sub.setName('enter')
      .setDescription('Start a manual dungeon map run')
      .addIntegerOption(opt =>
        opt.setName('tier')
          .setDescription('Map Tier (0 = Tutorial Grounds, 1-6 = Dungeons)')
          .setMinValue(0)
          .setMaxValue(6)
          .setRequired(false)))
  .addSubcommand(sub =>
    sub.setName('auto')
      .setDescription('Auto-battle dungeon runs with 100% full normal rewards (Requires Auto-Battle Pass)')
      .addIntegerOption(opt =>
        opt.setName('tier')
          .setDescription('Map Tier (0 = Tutorial Grounds, 1-6 = Dungeons)')
          .setMinValue(0)
          .setMaxValue(6)
          .setRequired(false))
      .addIntegerOption(opt =>
        opt.setName('runs')
          .setDescription('Number of dungeon runs to auto-clear (1 to 10, default: 1)')
          .setMinValue(1)
          .setMaxValue(10)
          .setRequired(false)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const discordId = interaction.user.id;

  const user = await User.findOne({ discordId });
  if (!user || !user.activeCharacterId) {
    return interaction.reply({ 
      content: '❌ You need an active character first! Use `/character create` to make one.', 
      ephemeral: true 
    });
  }

  const character = await Character.findById(user.activeCharacterId);
  if (!character) {
    return interaction.reply({ content: '❌ Active character not found. Create one with `/character create`!', ephemeral: true });
  }

  const selectedTier = interaction.options.getInteger('tier');
  // Default to Tier 0 (Tutorial) if character level <= 2, otherwise Tier 1
  const tier = selectedTier !== null ? selectedTier : (character.level <= 2 ? 0 : 1);

  if (subcommand === 'auto') {
    // Check Auto-Battle Pass
    const isPassActive = user.autoBattlePass && user.autoBattlePass.active && user.autoBattlePass.expiresAt && new Date(user.autoBattlePass.expiresAt) > new Date();
    
    if (!isPassActive) {
      return interaction.reply({
        content: '❌ **Auto-Battle Pass Required!**\nAuto-battle allows hands-off dungeon clears with **100% full normal rewards** (no reduction).\nPurchase a 1-Day Auto-Battle Pass in `/shop buy item:auto_pass_1d` (💎 200 Gems)!',
        ephemeral: true
      });
    }

    const runsCount = interaction.options.getInteger('runs') || 1;
    const equippedItems = await Item.find({ characterId: character._id, isEquipped: true });
    const treeStats = accumulateTreeStats(character.className, character.passiveTree);
    const stats = calculateEffectiveStats(character, equippedItems, treeStats);

    const expMultiplier = getActiveBoostMultiplier(user.boosts?.exp || []);
    const dropMultiplier = getActiveBoostMultiplier(user.boosts?.drop || []);
    const boostMultipliers = { exp: expMultiplier, drop: dropMultiplier };

    let totalGold = 0;
    let totalXp = 0;
    const totalOrbs = {};
    const droppedItems = [];
    let successfulRuns = 0;

    const availableSkills = getCharacterCombatSkills(character);

    for (let r = 1; r <= runsCount; r++) {
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

      // Simulate combat with intelligent skill rotation
      let maxTurns = 30;
      let roundNum = 0;

      while (enemyList.some(e => e.hp > 0) && partyState[0].currentHp > 0 && maxTurns > 0) {
        maxTurns--;
        roundNum++;

        // Pick optimal action for auto-battle
        let action = { type: 'attack' };
        if (availableSkills.length > 0) {
          const chosenSkill = availableSkills[(roundNum - 1) % availableSkills.length];
          action = { type: 'skill', skillId: chosenSkill.id };
        }

        const actions = {
          [character._id.toString()]: action
        };

        const result = resolveCombatRound(partyState, enemyList, actions);
        if (result.allEnemiesDefeated) break;
        if (result.allPlayersDefeated) break;
      }

      if (enemyList.every(e => e.hp <= 0) && partyState[0].currentHp > 0) {
        successfulRuns++;
        // 100% full normal loot with no reduction
        const loot = generatePersonalInstancedLoot(character, tier, boostMultipliers);
        
        totalGold += loot.gold;
        totalXp += loot.xp;

        for (const orb of loot.orbDrops) {
          totalOrbs[orb] = (totalOrbs[orb] || 0) + 1;
        }

        for (const itemData of loot.items) {
          const created = await Item.create({
            characterId: character._id,
            ...itemData
          });
          droppedItems.push(created);
        }
      }
    }

    // Save aggregated rewards to character
    character.gold += totalGold;
    character.xp += totalXp;

    // Check level-ups (Level up every level * 200 XP)
    let levelsGained = 0;
    while (character.xp >= character.level * 200 && character.level < 100) {
      character.xp -= character.level * 200;
      character.level += 1;
      character.skillPoints.available += 1;
      levelsGained += 1;
    }

    // Add orbs
    for (const [orbKey, count] of Object.entries(totalOrbs)) {
      const cur = character.orbs.get ? character.orbs.get(orbKey) : (character.orbs[orbKey] || 0);
      if (character.orbs.set) character.orbs.set(orbKey, cur + count);
      else character.orbs[orbKey] = cur + count;
    }

    await character.save();
    await user.save();

    const orbSummary = Object.entries(totalOrbs)
      .map(([k, v]) => `• **${k.replace(/_/g, ' ')}**: +${v}`)
      .join('\n') || '*None*';

    const itemSummary = droppedItems
      .slice(0, 8)
      .map(i => `• **${i.name}** [${i.rarity}] — \`ID: ${i._id}\``)
      .join('\n') + (droppedItems.length > 8 ? `\n*...and ${droppedItems.length - 8} more items in /inventory*` : '') || '*None*';

    const embed = new EmbedBuilder()
      .setTitle(`⚡ Auto-Battle Results — ${successfulRuns}/${runsCount} Runs Cleared`)
      .setColor('#f1c40f')
      .setDescription(`Completed **${successfulRuns}** dungeon runs at **Tier ${tier}** with **100% full normal rewards**!`)
      .addFields(
        { name: '💰 Total Gold Earned', value: `+${totalGold.toLocaleString()} Gold`, inline: true },
        { name: '✨ Total XP Earned', value: `+${totalXp.toLocaleString()} XP${levelsGained > 0 ? ` (🎉 **+${levelsGained} Level Up!**)` : ''}`, inline: true },
        { name: '🔮 Crafting Orbs Dropped', value: orbSummary, inline: false },
        { name: '🗡️ Gear Items Dropped', value: itemSummary, inline: false }
      )
      .setFooter({ text: 'Auto-Battle Pass active • Full 100% normal drops applied' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // Subcommand === 'enter' (Manual run)
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

  // Remove any stale battles for this character
  for (const [id, state] of activeDungeonBattles.entries()) {
    if (state.partyState.some(m => m.character._id.toString() === character._id.toString())) {
      activeDungeonBattles.delete(id);
    }
  }

  const battleId = `battle_${character._id}_${Date.now()}`;
  const encounterState = {
    battleId,
    mapTicket,
    round: 1,
    partyState,
    enemyList,
    pendingActions: {},
    logs: [`⚔️ **Encounter Started**: Entering ${mapTicket.name}! Choose your action below:`]
  };

  activeDungeonBattles.set(battleId, encounterState);

  const embed = createCombatEmbed(encounterState);
  const actionRow = createCombatActionButtons(character);

  return interaction.reply({
    embeds: [embed],
    components: [actionRow]
  });
}

export async function handleCombatButton(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith('combat:') && !customId.startsWith('combat_')) return;

  // Support both 'combat:action:characterId' and legacy 'combat_action_characterId'
  let actionType = 'attack';
  let skillId = null;
  let characterId = '';

  if (customId.includes(':')) {
    const parts = customId.split(':');
    // Format: combat:attack:charId or combat:skill:heavy_strike:charId or combat:defend:charId
    if (parts[1] === 'skill') {
      actionType = 'skill';
      skillId = parts[2];
      characterId = parts[3];
    } else {
      actionType = parts[1];
      characterId = parts[2];
    }
  } else {
    // Legacy format
    const parts = customId.split('_');
    actionType = parts[1];
    characterId = parts[parts.length - 1];
    if (actionType === 'skill') {
      skillId = parts.slice(2, -1).join('_');
    }
  }

  // Find active battle containing this character
  let targetBattle = null;
  for (const [id, state] of activeDungeonBattles.entries()) {
    if (state.partyState.some(m => m.character._id.toString() === characterId)) {
      targetBattle = state;
      break;
    }
  }

  if (!targetBattle) {
    return interaction.reply({ 
      content: '⚠️ This dungeon battle session has finished or expired. Start a new run with `/dungeon enter`!', 
      ephemeral: true 
    });
  }

  targetBattle.pendingActions[characterId] = {
    type: actionType === 'skill' ? 'skill' : actionType,
    skillId
  };

  const livingPartyCount = targetBattle.partyState.filter(m => m.currentHp > 0).length;
  if (Object.keys(targetBattle.pendingActions).length >= livingPartyCount) {
    // Resolve simultaneous round!
    const roundResult = resolveCombatRound(targetBattle.partyState, targetBattle.enemyList, targetBattle.pendingActions);
    targetBattle.logs = roundResult.roundLogs;
    targetBattle.pendingActions = {}; // Reset for next round
    targetBattle.round += 1;

    if (roundResult.allEnemiesDefeated) {
      // Victory! Award personal instanced loot (100% full normal loot)
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
      const gearText = loot.items.map(i => `• **${i.name}** [${i.rarity}] (ID: \`${i.baseItemId}\`)`).join('\n') || '*None*';

      return interaction.update({
        content: `🏆 **VICTORY DEFEATED ALL MONSTERS!**\n\n💰 **Gold**: +${loot.gold}\n✨ **XP**: +${loot.xp}\n🔮 **Orbs Dropped**:\n${orbText}\n🗡️ **Gear Dropped**:\n${gearText}\n\n*Use \`/inventory\` to view gear and \`/tree allocate\` to spend skill points!*`,
        embeds: [],
        components: []
      });
    }

    if (roundResult.allPlayersDefeated) {
      activeDungeonBattles.delete(targetBattle.battleId);
      return interaction.update({
        content: `💀 **DEFEAT!** All party members fell in combat inside **${targetBattle.mapTicket.name}**.\n*Tip: Try Tier 0 (Novice Training Grounds) to level up first with \`/dungeon enter tier:0\`!*`,
        embeds: [],
        components: []
      });
    }

    // Battle continues
    const embed = createCombatEmbed(targetBattle);
    const actionRow = createCombatActionButtons(targetBattle.partyState[0].character);

    return interaction.update({
      embeds: [embed],
      components: [actionRow]
    });
  } else {
    return interaction.reply({ content: `✅ Action registered for this round. Waiting for party members...`, ephemeral: true });
  }
}
