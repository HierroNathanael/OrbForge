import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true, index: true },
  characterSlots: {
    base: { type: Number, default: 3 },
    purchased: { type: Number, default: 0 },
    max: { type: Number, default: 10 }
  },
  activeCharacterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
