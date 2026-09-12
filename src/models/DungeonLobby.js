import mongoose from 'mongoose';

const dungeonLobbySchema = new mongoose.Schema({
  lobbyId: { type: String, required: true, unique: true, index: true },
  tier: { type: Number, required: true },
  leaderId: { type: String, required: true },
  members: [{
    discordId: { type: String, required: true },
    characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true }
  }]
}, { timestamps: true });

export const DungeonLobby = mongoose.model('DungeonLobby', dungeonLobbySchema);
