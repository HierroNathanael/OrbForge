export const GAME_CONFIG = {
  LEVEL_CAP: 100,
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
    ORBS: 'orbs',
    GEMS: 'gems'
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
  RARITIES: {
    NORMAL: 'Normal',
    MAGIC: 'Magic',
    RARE: 'Rare',
    LEGENDARY: 'Legendary'
  },
  EQUIPMENT_SLOTS: ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet']
};
