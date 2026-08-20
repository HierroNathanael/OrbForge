import mongoose from 'mongoose';

const boostItemSchema = new mongoose.Schema({
  multiplier: { type: Number, required: true },
  expiresAt: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true, index: true },
  gems: { type: Number, default: 0, min: 0 },
  characterSlots: {
    base: { type: Number, default: 3 },
    purchased: { type: Number, default: 0 },
    max: { type: Number, default: 10 }
  },
  activeCharacterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null },
  boosts: {
    exp: [boostItemSchema],
    drop: [boostItemSchema]
  },
  autoBattlePass: {
    active: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null }
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
