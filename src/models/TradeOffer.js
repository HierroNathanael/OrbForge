import mongoose from 'mongoose';

const tradeOfferSchema = new mongoose.Schema({
  tradeId: { type: String, required: true, unique: true, index: true },
  fromDiscordId: { type: String, required: true },
  fromCharacterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
  fromName: { type: String, required: true },
  toDiscordId: { type: String, required: true },
  toCharacterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
  toName: { type: String, required: true },
  giveItemId: { type: String, default: null },
  giveItemName: { type: String, default: null },
  giveGold: { type: Number, default: 0 },
  forItemId: { type: String, default: null },
  forItemName: { type: String, default: null },
  forGold: { type: Number, default: 0 }
}, { timestamps: true });

export const TradeOffer = mongoose.model('TradeOffer', tradeOfferSchema);
