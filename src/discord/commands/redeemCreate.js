import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { RedeemCode } from '../../models/RedeemCode.js';
import { GAME_CONFIG } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('redeem-create')
  .setDescription('Create a redeem code (admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(opt =>
    opt.setName('code')
      .setDescription('The code players will redeem')
      .setRequired(true))
  .addIntegerOption(opt =>
    opt.setName('gold')
      .setDescription('Gold reward')
      .setMinValue(0))
  .addStringOption(opt =>
    opt.setName('orb_type')
      .setDescription('Orb reward type')
      .addChoices(...Object.values(GAME_CONFIG.ORB_TYPES).map(value => ({ name: value, value }))))
  .addIntegerOption(opt =>
    opt.setName('orb_amount')
      .setDescription('Orb reward amount (requires orb_type)')
      .setMinValue(1))
  .addIntegerOption(opt =>
    opt.setName('max_redemptions')
      .setDescription('Max number of redemptions (omit for unlimited)')
      .setMinValue(1));

export async function execute(interaction) {
  const code = interaction.options.getString('code').trim().toUpperCase();
  const gold = interaction.options.getInteger('gold') ?? 0;
  const orbType = interaction.options.getString('orb_type');
  const orbAmount = interaction.options.getInteger('orb_amount') ?? 1;
  const maxRedemptions = interaction.options.getInteger('max_redemptions');

  const rewardOrbs = {};
  if (orbType) rewardOrbs[orbType] = orbAmount;

  try {
    await RedeemCode.create({
      code,
      rewardGold: gold,
      rewardOrbs,
      maxRedemptions: maxRedemptions ?? null
    });
  } catch (error) {
    if (error.code === 11000) {
      return interaction.reply({ content: `❌ Code **${code}** already exists.`, ephemeral: true });
    }
    throw error;
  }

  const rewardParts = [];
  if (gold > 0) rewardParts.push(`${gold} gold`);
  if (orbType) rewardParts.push(`${orbAmount}x ${orbType.replace(/_/g, ' ')}`);

  return interaction.reply({
    content: `✅ Created code **${code}** — rewards: ${rewardParts.join(', ') || '*nothing*'}. Max redemptions: ${maxRedemptions ?? 'unlimited'}.`,
    ephemeral: true
  });
}
