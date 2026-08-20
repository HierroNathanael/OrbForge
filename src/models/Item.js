import mongoose from 'mongoose';

const affixSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stat: { type: String, required: true }, // e.g. 'flat_damage', 'percent_health', 'critical_strike', 'armor', 'evasion', 'lifesteal'
  value: { type: Number, required: true },
  tier: { type: Number, default: 1 }
}, { _id: false });

const itemSchema = new mongoose.Schema({
  characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true, index: true },
  baseItemId: { type: String, required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet', 'map_ticket'] 
  },
  rarity: { 
    type: String, 
    required: true, 
    enum: ['Normal', 'Magic', 'Rare', 'Legendary'],
    default: 'Normal' 
  },
  iLvl: { type: Number, default: 1, min: 1 },
  baseStats: {
    damage: { type: Number, default: 0 },
    armor: { type: Number, default: 0 },
    evasion: { type: Number, default: 0 },
    health: { type: Number, default: 0 }
  },
  prefixes: [affixSchema],
  suffixes: [affixSchema],
  mapDetails: {
    tier: { type: Number, default: 1 },
    modifiers: [{ type: String }]
  },
  isEquipped: { type: Boolean, default: false },
  slot: { type: String, enum: ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet', null], default: null }
}, { timestamps: true });

export const Item = mongoose.model('Item', itemSchema);
