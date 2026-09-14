import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { RedeemCode } from '../../models/RedeemCode.js';
import { checkCooldown } from '../utils/cooldown.js';

export const data = new SlashCommandBuilder()
  .setName('redeem')
  .setDescription('Redeem a code for rewards')
  .addStringOption(opt =>
    opt.setName('code')
      .setDescription('The redeem code')
      .setRequired(true));

function rewardSummary(redeemCode) {
  const parts = [];
  if (redeemCode.rewardGold > 0) parts.push(`${redeemCode.rewardGold} gold`);
  for (const [orbType, amount] of redeemCode.rewardOrbs.entries()) {
    if (amount > 0) parts.push(`${amount}x ${orbType.replace(/_/g, ' ')}`);
  }
  return parts.join(', ') || '*nothing*';
}

export async function execute(interaction) {
  const discordId = interaction.user.id;

  const cooldown = checkCooldown(`redeem:${discordId}`, 10);
  if (cooldown.onCooldown) {
    return interaction.reply({ content: `⏳ Wait ${cooldown.remainingSeconds}s before trying another code.`, ephemeral: true });
  }

  const rawCode = interaction.options.getString('code');
  const code = rawCode.trim().toUpperCase();

  const user = await User.findOne({ discordId });
  if (!user || !user.activeCharacterId) {
    return interaction.reply({ content: '❌ You need an active character first! Use `/character create`.', ephemeral: true });
  }
  const character = await Character.findById(user.activeCharacterId);
  if (!character) {
    return interaction.reply({ content: '❌ You need an active character first! Use `/character create`.', ephemeral: true });
  }

  // Atomic find+update: the "not already redeemed" and "under the redemption
  // limit" checks are evaluated by MongoDB as part of the same operation that
  // pushes the redemption, so two different users racing the same
  // limited-use code can't both pass the check before either write lands.
  const redeemCode = await RedeemCode.findOneAndUpdate(
    {
      code,
      active: true,
      redeemedByCharacterIds: { $ne: character._id },
      $expr: {
        $or: [
          { $eq: ['$maxRedemptions', null] },
          { $lt: [{ $size: '$redeemedByCharacterIds' }, '$maxRedemptions'] }
        ]
      }
    },
    { $push: { redeemedByCharacterIds: character._id } },
    { new: true }
  );

  if (!redeemCode) {
    // Redetermine which case applied, purely for a clear error message.
    const existing = await RedeemCode.findOne({ code });
    if (!existing || !existing.active) {
      return interaction.reply({ content: `❌ **${code}** is not a valid code.`, ephemeral: true });
    }
    if (existing.redeemedByCharacterIds.some(id => id.equals(character._id))) {
      return interaction.reply({ content: `❌ You already redeemed **${code}**.`, ephemeral: true });
    }
    return interaction.reply({ content: `❌ **${code}** has reached its redemption limit.`, ephemeral: true });
  }

  character.gold += redeemCode.rewardGold;
  for (const [orbType, amount] of redeemCode.rewardOrbs.entries()) {
    character.orbs[orbType] = (character.orbs[orbType] || 0) + amount;
  }

  await character.save();

  return interaction.reply({
    content: `✅ **${code}** redeemed! You received: ${rewardSummary(redeemCode)}`,
    ephemeral: true
  });
}
