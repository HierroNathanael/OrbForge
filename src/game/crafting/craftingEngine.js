import { GAME_CONFIG } from '../../config/constants.js';

export const AFFIX_POOLS = {
  prefixes: [
    { name: 'Heavy', stat: 'flat_damage', baseValue: 8, perILvl: 2, maxTier: 5 },
    { name: 'Stout', stat: 'health', baseValue: 20, perILvl: 5, maxTier: 5 },
    { name: 'Armored', stat: 'armor', baseValue: 15, perILvl: 4, maxTier: 5 },
    { name: 'Elusive', stat: 'evasion', baseValue: 15, perILvl: 4, maxTier: 5 },
    { name: 'Radiant', stat: 'damage_percent', baseValue: 0.05, perILvl: 0.01, maxTier: 5 }
  ],
  suffixes: [
    { name: 'of Swiftness', stat: 'critical_strike', baseValue: 0.03, perILvl: 0.005, maxTier: 5 },
    { name: 'of Might', stat: 'strength', baseValue: 4, perILvl: 1, maxTier: 5 },
    { name: 'of Grace', stat: 'dexterity', baseValue: 4, perILvl: 1, maxTier: 5 },
    { name: 'of Brilliance', stat: 'intelligence', baseValue: 4, perILvl: 1, maxTier: 5 },
    { name: 'of Vampirism', stat: 'lifesteal', baseValue: 0.02, perILvl: 0.005, maxTier: 5 }
  ]
};

function generateRandomAffix(type, iLvl, existingAffixes = []) {
  const pool = AFFIX_POOLS[type];
  const available = pool.filter(aff => !existingAffixes.some(e => e.stat === aff.stat));
  if (available.length === 0) return null;

  const template = available[Math.floor(Math.random() * available.length)];
  const tier = Math.min(template.maxTier, Math.max(1, Math.floor(iLvl / 10) + 1));
  const rawValue = template.baseValue + (template.perILvl * (iLvl + tier));
  const value = typeof template.baseValue === 'number' && Number.isInteger(template.baseValue)
    ? Math.round(rawValue)
    : Number(rawValue.toFixed(3));

  return {
    name: template.name,
    stat: template.stat,
    value,
    tier
  };
}

function updateItemName(item) {
  if (item.rarity === 'Normal') {
    item.name = item.baseItemId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return;
  }

  const prefixName = item.prefixes.length > 0 ? item.prefixes[0].name : '';
  const suffixName = item.suffixes.length > 0 ? item.suffixes[0].name : '';
  const baseName = item.baseItemId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (item.rarity === 'Magic') {
    item.name = `${prefixName} ${baseName} ${suffixName}`.trim();
  } else if (item.rarity === 'Rare' || item.rarity === 'Legendary') {
    item.name = `${prefixName || 'Rare'} ${baseName} ${suffixName}`.trim();
  }
}

export function applyCraftingOrb(item, orbType) {
  const limits = GAME_CONFIG.AFFIX_LIMITS;

  switch (orbType) {
    // ─────────────────────────────────────────────────────────────────────────
    // Orb of Cleansing — Strip all affixes back to Normal white base
    // ─────────────────────────────────────────────────────────────────────────
    case GAME_CONFIG.ORB_TYPES.CLEANSING: {
      item.rarity = 'Normal';
      item.prefixes = [];
      item.suffixes = [];
      updateItemName(item);
      return { success: true, message: 'Orb of Cleansing stripped the item clean back to its white base.' };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Orb of Kindling — Upgrade a normal (white) item to magic
    // ─────────────────────────────────────────────────────────────────────────
    case GAME_CONFIG.ORB_TYPES.KINDLING: {
      if (item.rarity !== 'Normal') {
        return { success: false, message: 'Orb of Kindling can only be used on Normal (white) items.' };
      }
      item.rarity = 'Magic';
      const numAffixes = Math.random() < 0.5 ? 1 : 2;
      if (numAffixes === 1) {
        if (Math.random() < 0.5) {
          const p = generateRandomAffix('prefixes', item.iLvl, item.prefixes);
          if (p) item.prefixes.push(p);
        } else {
          const s = generateRandomAffix('suffixes', item.iLvl, item.suffixes);
          if (s) item.suffixes.push(s);
        }
      } else {
        const p = generateRandomAffix('prefixes', item.iLvl, item.prefixes);
        const s = generateRandomAffix('suffixes', item.iLvl, item.suffixes);
        if (p) item.prefixes.push(p);
        if (s) item.suffixes.push(s);
      }
      updateItemName(item);
      return { success: true, message: `Orb of Kindling ignited the item into a Magic item: ${item.name}` };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Orb of Tempering — Add a random affix to a magic item
    // ─────────────────────────────────────────────────────────────────────────
    case GAME_CONFIG.ORB_TYPES.TEMPERING: {
      if (item.rarity !== 'Magic') {
        return { success: false, message: 'Orb of Tempering can only be used on Magic items.' };
      }
      const pCount = item.prefixes.length;
      const sCount = item.suffixes.length;
      if (pCount >= limits.MAGIC.MAX_PREFIX && sCount >= limits.MAGIC.MAX_SUFFIX) {
        return { success: false, message: 'Magic item already has maximum affixes (1 Prefix, 1 Suffix).' };
      }

      let added = null;
      if (pCount < limits.MAGIC.MAX_PREFIX && (sCount >= limits.MAGIC.MAX_SUFFIX || Math.random() < 0.5)) {
        added = generateRandomAffix('prefixes', item.iLvl, item.prefixes);
        if (added) item.prefixes.push(added);
      } else if (sCount < limits.MAGIC.MAX_SUFFIX) {
        added = generateRandomAffix('suffixes', item.iLvl, item.suffixes);
        if (added) item.suffixes.push(added);
      }

      if (!added) {
        return { success: false, message: 'No suitable affix could be tempered onto the item.' };
      }
      updateItemName(item);
      return { success: true, message: `Orb of Tempering added ${added.name} (+${added.value} ${added.stat})` };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Orb of Ascendance — Upgrade a normal item to rare with random affixes
    // ─────────────────────────────────────────────────────────────────────────
    case GAME_CONFIG.ORB_TYPES.ASCENDANCE: {
      if (item.rarity !== 'Normal') {
        return { success: false, message: 'Orb of Ascendance can only be used on Normal (white) items.' };
      }
      item.rarity = 'Rare';
      item.prefixes = [];
      item.suffixes = [];

      const pNum = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const sNum = Math.floor(Math.random() * 2) + 2; // 2 or 3

      for (let i = 0; i < pNum; i++) {
        const p = generateRandomAffix('prefixes', item.iLvl, item.prefixes);
        if (p) item.prefixes.push(p);
      }
      for (let i = 0; i < sNum; i++) {
        const s = generateRandomAffix('suffixes', item.iLvl, item.suffixes);
        if (s) item.suffixes.push(s);
      }

      updateItemName(item);
      return { success: true, message: `Orb of Ascendance elevated the item into a Rare with ${item.prefixes.length + item.suffixes.length} affixes!` };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Orb of Unmaking — Reroll all affixes on a rare item
    // ─────────────────────────────────────────────────────────────────────────
    case GAME_CONFIG.ORB_TYPES.UNMAKING: {
      if (item.rarity !== 'Rare') {
        return { success: false, message: 'Orb of Unmaking can only be used on Rare items.' };
      }
      item.prefixes = [];
      item.suffixes = [];

      const pNum = Math.floor(Math.random() * 2) + 2;
      const sNum = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < pNum; i++) {
        const p = generateRandomAffix('prefixes', item.iLvl, item.prefixes);
        if (p) item.prefixes.push(p);
      }
      for (let i = 0; i < sNum; i++) {
        const s = generateRandomAffix('suffixes', item.iLvl, item.suffixes);
        if (s) item.suffixes.push(s);
      }

      updateItemName(item);
      return { success: true, message: `Orb of Unmaking reforged all affixes on ${item.name}` };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Orb of Zenith — Add a high-tier affix to a rare item (rare, high-value)
    // ─────────────────────────────────────────────────────────────────────────
    case GAME_CONFIG.ORB_TYPES.ZENITH: {
      if (item.rarity !== 'Rare') {
        return { success: false, message: 'Orb of Zenith can only be used on Rare items.' };
      }
      const pCount = item.prefixes.length;
      const sCount = item.suffixes.length;

      if (pCount >= limits.RARE.MAX_PREFIX && sCount >= limits.RARE.MAX_SUFFIX) {
        return { success: false, message: 'Rare item already has max affixes (3 Prefixes, 3 Suffixes).' };
      }

      let added = null;
      if (pCount < limits.RARE.MAX_PREFIX && (sCount >= limits.RARE.MAX_SUFFIX || Math.random() < 0.5)) {
        added = generateRandomAffix('prefixes', item.iLvl + 5, item.prefixes); // +5 iLvl bonus for Zenith rolls
        if (added) item.prefixes.push(added);
      } else if (sCount < limits.RARE.MAX_SUFFIX) {
        added = generateRandomAffix('suffixes', item.iLvl + 5, item.suffixes);
        if (added) item.suffixes.push(added);
      }

      if (!added) {
        return { success: false, message: 'Could not add zenith affix.' };
      }

      updateItemName(item);
      return { success: true, message: `Orb of Zenith inscribed the pinnacle affix ${added.name} (+${added.value} ${added.stat})` };
    }

    default:
      return { success: false, message: `Unknown Orb type: ${orbType}` };
  }
}
