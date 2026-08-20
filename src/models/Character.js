import mongoose from 'mongoose';

const knownSkillSchema = new mongoose.Schema({
  skillId: { type: String, required: true },
  rank: { type: Number, default: 1, min: 1, max: 5 }
}, { _id: false });

const characterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  discordId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  className: { 
    type: String, 
    required: true, 
    enum: ['Warrior', 'Ranger', 'Mage'] 
  },
  subclassName: { 
    type: String, 
    enum: ['Berserker', 'Guardian', 'Sharpshooter', 'Trapper', 'Elementalist', 'Battle Mage', null],
    default: null 
  },
  level: { type: Number, default: 1, min: 1, max: 100 },
  xp: { type: Number, default: 0, min: 0 },
  gold: { type: Number, default: 100, min: 0 },
  orbs: {
    orb_of_kindling:   { type: Number, default: 5 }, // Normal -> Magic
    orb_of_tempering:  { type: Number, default: 5 }, // Add affix to magic
    orb_of_unmaking:   { type: Number, default: 0 }, // Reroll rare affixes
    orb_of_cleansing:  { type: Number, default: 2 }, // Strip to normal
    orb_of_ascendance: { type: Number, default: 1 }, // Normal -> Rare
    orb_of_zenith:     { type: Number, default: 0 }, // Add high-tier affix to rare
    orb_of_fate:       { type: Number, default: 0 }  // Subclass respec
  },
  baseStats: {
    strength: { type: Number, default: 10 },
    dexterity: { type: Number, default: 10 },
    intelligence: { type: Number, default: 10 }
  },
  passiveTree: { 
    type: Map, 
    of: Number, 
    default: {} 
  }, // nodeId -> rank (1..3)
  skillPoints: {
    available: { type: Number, default: 1 },
    spent: { type: Number, default: 0 }
  },
  knownSkills: [knownSkillSchema],
  storageSlots: {
    base: { type: Number, default: 20 },
    purchased: { type: Number, default: 0 },
    max: { type: Number, default: 100 }
  }
}, { timestamps: true });

export const Character = mongoose.model('Character', characterSchema);
