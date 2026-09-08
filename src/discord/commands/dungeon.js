import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';
import { generateMapTicket, generateEncounterMonsters } from '../../game/maps/mapEngine.js';
import { calculateEffectiveStats, resolveCombatRound, generatePersonalInstancedLoot } from '../../game/combat/combatEngine.js';
import { createCombatEmbed, createCombatActionButtons, createLobbyEmbed, createLobbyButtons } from '../embeds/uiBuilders.js';
import { accumulateTreeStats } from '../../game/skillTree/treeEngine.js';
import { resolveLevelUps, GAME_CONFIG } from '../../config/constants.js';

export const activeDungeonBattles = new Map();
export const activeDungeonLobbies = new Map();

function clearStaleEntriesForCharacter(characterId) {
  const idStr = characterId.toString();
  for (const [id, lobby] of activeDungeonLobbies.entries()) {
    if (lobby.members.some(m => m.character._id.toString() === idStr)) {
      activeDungeonLobbies.delete(id);
    }
  }
  for (const [id, state] of activeDungeonBattles.entries()) {
    if (state.partyState.some(m => m.character._id.toString() === idStr)) {
      activeDungeonBattles.delete(id);
    }
  }
}

async function buildPartyState(members) {
  const partyState = [];
  for (const member of members) {
    const equippedItems = await Item.find({ characterId: member.character._id, isEquipped: true });
    const treeStats = accumulateTreeStats(member.character.className, member.character.passiveTree);
    const stats = calculateEffectiveStats(member.character, equippedItems, treeStats);
    partyState.push({
      character: member.character,
      stats,
      currentHp: stats.maxHp,
      currentMana: stats.maxMana,
      tauntTurns: 0,
      armorBuffPercent: 0
    });
  }
  return partyState;
}


export const data = new SlashCommandBuilder()
  .setName('dungeon')
  .setDescription('Enter Map Dungeons (Solo or Party)')
  .addSubcommand(sub =>
    sub.setName('enter')
      .setDescription('Start a manual dungeon map run')
      .addIntegerOption(opt =>
        opt.setName('tier')
          .setDescription('Map Tier (0 = Tutorial Grounds, 1-6 = Dungeons)')
          .setMinValue(0)
          .setMaxValue(6)
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

  // Subcommand === 'enter' — open a party lobby. Leader clicks Start to launch
  // the encounter immediately (solo) or once teammates have joined (party).
  clearStaleEntriesForCharacter(character._id);

  const lobbyId = `lobby_${character._id}_${Date.now()}`;
  const lobby = {
    lobbyId,
    tier,
    leaderId: discordId,
    members: [{ discordId, character }]
  };
  activeDungeonLobbies.set(lobbyId, lobby);

  return interaction.reply({
    embeds: [createLobbyEmbed(lobby)],
    components: createLobbyButtons(lobby)
  });
}

export async function handleLobbyButton(interaction) {
  const [, action, lobbyId] = interaction.customId.split(':');
  const lobby = activeDungeonLobbies.get(lobbyId);

  if (!lobby) {
    return interaction.reply({
      content: '⚠️ This party lobby has expired or already started. Use `/dungeon enter` to start a new one!',
      ephemeral: true
    });
  }

  if (action === 'join') {
    if (lobby.members.some(m => m.discordId === interaction.user.id)) {
      return interaction.reply({ content: '❌ You are already in this party.', ephemeral: true });
    }
    if (lobby.members.length >= GAME_CONFIG.PARTY_SIZE_MAX) {
      return interaction.reply({ content: `❌ Party is full (max ${GAME_CONFIG.PARTY_SIZE_MAX}).`, ephemeral: true });
    }

    const joinUser = await User.findOne({ discordId: interaction.user.id });
    if (!joinUser || !joinUser.activeCharacterId) {
      return interaction.reply({ content: '❌ You need an active character first! Use `/character create` to make one.', ephemeral: true });
    }
    const joinCharacter = await Character.findById(joinUser.activeCharacterId);
    if (!joinCharacter) {
      return interaction.reply({ content: '❌ Active character not found. Create one with `/character create`!', ephemeral: true });
    }

    lobby.members.push({ discordId: interaction.user.id, character: joinCharacter });

    return interaction.update({
      embeds: [createLobbyEmbed(lobby)],
      components: createLobbyButtons(lobby)
    });
  }

  if (action === 'start') {
    if (interaction.user.id !== lobby.leaderId) {
      return interaction.reply({ content: '❌ Only the party leader can start the dungeon.', ephemeral: true });
    }

    activeDungeonLobbies.delete(lobbyId);
    for (const member of lobby.members) clearStaleEntriesForCharacter(member.character._id);

    const partyState = await buildPartyState(lobby.members);
    const mapTicket = generateMapTicket(lobby.tier);
    const enemyList = generateEncounterMonsters(mapTicket);

    const battleId = `battle_${lobby.leaderId}_${Date.now()}`;
    const encounterState = {
      battleId,
      mapTicket,
      round: 1,
      partyState,
      enemyList,
      pendingActions: {},
      logs: [`⚔️ **Encounter Started**: Entering ${mapTicket.name} with a party of ${partyState.length}! Choose your action below:`]
    };

    activeDungeonBattles.set(battleId, encounterState);

    const embed = createCombatEmbed(encounterState);
    const actionRows = createCombatActionButtons(partyState, enemyList);

    return interaction.update({
      embeds: [embed],
      components: actionRows
    });
  }
}

export async function handleCombatButton(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith('combat:') && !customId.startsWith('combat_')) return;

  // Support both 'combat:action:characterId' and legacy 'combat_action_characterId'
  let actionType = 'attack';
  let skillId = null;
  let targetId = null;
  let characterId = '';

  if (customId.includes(':')) {
    const parts = customId.split(':');
    // Formats: combat:attack:targetId:charId | combat:skill:skillId:targetId:charId
    //        | combat:skill:skillId:charId (untargeted skill) | combat:defend:charId
    if (parts[1] === 'skill' && parts.length === 5) {
      actionType = 'skill';
      skillId = parts[2];
      targetId = parts[3];
      characterId = parts[4];
    } else if (parts[1] === 'skill') {
      actionType = 'skill';
      skillId = parts[2];
      characterId = parts[3];
    } else if (parts[1] === 'attack' && parts.length === 4) {
      actionType = 'attack';
      targetId = parts[2];
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
    skillId,
    targetId
  };

  const livingPartyCount = targetBattle.partyState.filter(m => m.currentHp > 0).length;
  if (Object.keys(targetBattle.pendingActions).length >= livingPartyCount) {
    // Resolve simultaneous round!
    const roundResult = resolveCombatRound(targetBattle.partyState, targetBattle.enemyList, targetBattle.pendingActions);
    targetBattle.logs = roundResult.roundLogs;
    targetBattle.pendingActions = {}; // Reset for next round
    targetBattle.round += 1;

    if (roundResult.allEnemiesDefeated) {
      // Victory! Every party member gets their own personal instanced loot roll (100% full normal loot).
      const summaries = [];
      for (const member of targetBattle.partyState) {
        const loot = generatePersonalInstancedLoot(member.character, targetBattle.mapTicket.tier);

        const char = member.character;
        char.gold += loot.gold;
        char.xp += loot.xp;
        const levelsGained = resolveLevelUps(char);

        for (const orbKey of loot.orbDrops) {
          const cur = char.orbs.get ? char.orbs.get(orbKey) : (char.orbs[orbKey] || 0);
          if (char.orbs.set) char.orbs.set(orbKey, cur + 1);
          else char.orbs[orbKey] = cur + 1;
        }

        await char.save();

        for (const itemData of loot.items) {
          await Item.create({
            characterId: char._id,
            ...itemData
          });
        }

        const orbText = loot.orbDrops.map(o => `• **${o.replace(/_/g, ' ')}**`).join('\n') || '*None*';
        const gearText = loot.items.map(i => `• **${i.name}** [${i.rarity}] (ID: \`${i.baseItemId}\`)`).join('\n') || '*None*';
        const levelText = levelsGained > 0 ? ` (🎉 **+${levelsGained} Level Up!** Now Level ${char.level})` : '';

        summaries.push(`**${char.name}** — 💰 +${loot.gold} Gold | ✨ +${loot.xp} XP${levelText}\n🔮 Orbs:\n${orbText}\n🗡️ Gear:\n${gearText}`);
      }

      activeDungeonBattles.delete(targetBattle.battleId);

      return interaction.update({
        content: `🏆 **VICTORY DEFEATED ALL MONSTERS!**\n\n${summaries.join('\n\n')}\n\n*Use \`/inventory\` to view gear and \`/tree allocate\` to spend skill points!*`,
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
    const actionRows = createCombatActionButtons(targetBattle.partyState, targetBattle.enemyList);

    return interaction.update({
      embeds: [embed],
      components: actionRows
    });
  } else {
    return interaction.reply({ content: `✅ Action registered for this round. Waiting for party members...`, ephemeral: true });
  }
}
