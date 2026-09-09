import mongoose from 'mongoose';

const redeemCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  rewardGold: { type: Number, default: 0, min: 0 },
  rewardOrbs: {
    type: Map,
    of: Number,
    default: {}
  },
  maxRedemptions: { type: Number, default: null }, // null = unlimited
  active: { type: Boolean, default: true },
  redeemedByCharacterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }]
}, { timestamps: true });

export const RedeemCode = mongoose.model('RedeemCode', redeemCodeSchema);
