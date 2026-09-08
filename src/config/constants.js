export const GAME_CONFIG = {
  LEVEL_CAP: 100,
  XP_PER_LEVEL_FACTOR: 200, // XP needed to clear a level = level * this
  BASE_CHARACTER_SLOTS: 3,
  MAX_CHARACTER_SLOTS: 10,
  PARTY_SIZE_MAX: 3,
  COMBAT_TURN_TIMEOUT_MS: 45000,
  RESPEC_COSTS: {
    SMALL_NODE_GOLD: 100,
    KEYSTONE_GOLD: 500,
    SUBCLASS_ORB: 'orb_of_unmaking'
  },
  AFFIX_LIMITS: {
    MAGIC: { MAX_PREFIX: 1, MAX_SUFFIX: 1 },
    RARE: { MAX_PREFIX: 3, MAX_SUFFIX: 3 },
    LEGENDARY: { MAX_PREFIX: 4, MAX_SUFFIX: 4 }
  },
  CURRENCY_TYPES: {
    GOLD: 'gold',
    ORBS: 'orbs'
  },
  ORB_TYPES: {
    TEMPERING: 'orb_of_tempering',       // Add a random affix to a magic item
    KINDLING: 'orb_of_kindling',          // Upgrade a normal item to magic
    UNMAKING: 'orb_of_unmaking',          // Reroll all affixes on a rare item
    CLEANSING: 'orb_of_cleansing',        // Strip affixes back to base (white) item
    ASCENDANCE: 'orb_of_ascendance',      // Upgrade a normal item to rare with random affixes
    ZENITH: 'orb_of_zenith',              // Add a high-tier affix to a rare item
    FATE: 'orb_of_fate'                   // Subclass respec (kept for respec system)
  },
  // Orb type -> art file in the repo-root images/ folder (no art for FATE yet)
  ORB_IMAGES: {
    orb_of_tempering: 'Orb of Tempering.jpeg',
    orb_of_kindling: 'Orb of Kindling.jpeg',
    orb_of_unmaking: 'Orb of Unmaking.jpeg',
    orb_of_cleansing: 'Orb of Cleansing.jpeg',
    orb_of_ascendance: 'Orb of Ascendance.jpeg',
    orb_of_zenith: 'Orb of Zenith.jpeg'
  },
  RARITIES: {
    NORMAL: 'Normal',
    MAGIC: 'Magic',
    RARE: 'Rare',
    LEGENDARY: 'Legendary'
  },
  EQUIPMENT_SLOTS: ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet']
};

export function xpToNextLevel(level) {
  return level * GAME_CONFIG.XP_PER_LEVEL_FACTOR;
}

// Mutates character.level/xp/skillPoints.available to clear any backlog of
// earned-but-unresolved level-ups. Idempotent — safe to call on every read.
export function resolveLevelUps(character) {
  let levelsGained = 0;
  while (character.level < GAME_CONFIG.LEVEL_CAP && character.xp >= xpToNextLevel(character.level)) {
    character.xp -= xpToNextLevel(character.level);
    character.level += 1;
    character.skillPoints.available += 1;
    levelsGained += 1;
  }
  return levelsGained;
}
