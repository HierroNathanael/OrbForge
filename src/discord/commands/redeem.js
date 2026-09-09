import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { RedeemCode } from '../../models/RedeemCode.js';

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

  const redeemCode = await RedeemCode.findOne({ code });
  if (!redeemCode || !redeemCode.active) {
    return interaction.reply({ content: `❌ **${code}** is not a valid code.`, ephemeral: true });
  }
  if (redeemCode.redeemedByCharacterIds.some(id => id.equals(character._id))) {
    return interaction.reply({ content: `❌ You already redeemed **${code}**.`, ephemeral: true });
  }
  if (redeemCode.maxRedemptions !== null && redeemCode.redeemedByCharacterIds.length >= redeemCode.maxRedemptions) {
    return interaction.reply({ content: `❌ **${code}** has reached its redemption limit.`, ephemeral: true });
  }

  character.gold += redeemCode.rewardGold;
  for (const [orbType, amount] of redeemCode.rewardOrbs.entries()) {
    character.orbs[orbType] = (character.orbs[orbType] || 0) + amount;
  }
  redeemCode.redeemedByCharacterIds.push(character._id);

  await character.save();
  await redeemCode.save();

  return interaction.reply({
    content: `✅ **${code}** redeemed! You received: ${rewardSummary(redeemCode)}`,
    ephemeral: true
  });
}
