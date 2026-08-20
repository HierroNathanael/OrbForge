import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { addBoost } from '../../game/economy/boostEngine.js';

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('Orbforge Gem Shop & Microtransactions')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View available shop items, boosts, and storage expansions'))
  .addSubcommand(sub =>
    sub.setName('buy')
      .setDescription('Purchase an item with Gems')
      .addStringOption(opt =>
        opt.setName('item')
          .setDescription('Select item to purchase')
          .setRequired(true)
          .addChoices(
            { name: '1-Day 2x EXP Boost (100 Gems)', value: 'exp_boost_1d' },
            { name: '1-Day 2x Drop Boost (150 Gems)', value: 'drop_boost_1d' },
            { name: '1-Day Auto-Battle Pass (200 Gems)', value: 'auto_pass_1d' },
            { name: '+1 Character Slot (300 Gems)', value: 'slot_expansion' }
          )));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const discordId = interaction.user.id;

  let user = await User.findOne({ discordId });
  if (!user) user = await User.create({ discordId });

  if (subcommand === 'view') {
    const embed = new EmbedBuilder()
      .setTitle('💎 Orbforge Gem Shop')
      .setColor('#f1c40f')
      .setDescription(`Your Gems: 💎 **${user.gems.toLocaleString()}**\n\n*Deterministic Spends Only — Gems Never Buy Loot Box Randomness.*`)
      .addFields(
        { name: '🚀 EXP Boosts', value: '• **1-Day 2x EXP Boost**: 💎 100 Gems\n*(FIFO Queue sorted by highest multiplier)*', inline: false },
        { name: '🎁 Drop Boosts', value: '• **1-Day 2x Drop Quantity Boost**: 💎 150 Gems\n*(Increases item & Orb drop quantities)*', inline: false },
        { name: '⚡ Auto-Battle Pass', value: '• **1-Day Auto-Battle Pass**: 💎 200 Gems\n*(Unlocks hands-off background dungeon loop while active)*', inline: false },
        { name: '📦 Account Upgrades', value: '• **+1 Extra Character Slot**: 💎 300 Gems (Max 10)', inline: false }
      )
      .setFooter({ text: 'Use /shop buy item:<choice> to purchase.' });

    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'buy') {
    const choice = interaction.options.getString('item');

    if (choice === 'exp_boost_1d') {
      if (user.gems < 100) return interaction.reply({ content: '❌ Not enough Gems! Requires 💎 100 Gems.', ephemeral: true });
      user.gems -= 100;
      user.boosts.exp = addBoost(user.boosts.exp || [], 2.0, 1);
      await user.save();
      return interaction.reply({ content: '✅ Purchased **1-Day 2x EXP Boost**! Multiplier queued in FIFO order.' });
    }

    if (choice === 'drop_boost_1d') {
      if (user.gems < 150) return interaction.reply({ content: '❌ Not enough Gems! Requires 💎 150 Gems.', ephemeral: true });
      user.gems -= 150;
      user.boosts.drop = addBoost(user.boosts.drop || [], 2.0, 1);
      await user.save();
      return interaction.reply({ content: '✅ Purchased **1-Day 2x Drop Quantity Boost**!' });
    }

    if (choice === 'auto_pass_1d') {
      if (user.gems < 200) return interaction.reply({ content: '❌ Not enough Gems! Requires 💎 200 Gems.', ephemeral: true });
      user.gems -= 200;
      const currentExpiry = (user.autoBattlePass && user.autoBattlePass.expiresAt && user.autoBattlePass.expiresAt > new Date())
        ? user.autoBattlePass.expiresAt.getTime()
        : Date.now();
      
      user.autoBattlePass = {
        active: true,
        expiresAt: new Date(currentExpiry + 24 * 60 * 60 * 1000)
      };
      await user.save();
      return interaction.reply({ content: '⚡ Purchased **1-Day Auto-Battle Pass**! Background dungeon loop activated.' });
    }

    if (choice === 'slot_expansion') {
      if (user.gems < 300) return interaction.reply({ content: '❌ Not enough Gems! Requires 💎 300 Gems.', ephemeral: true });
      const currentSlots = user.characterSlots.base + user.characterSlots.purchased;
      if (currentSlots >= user.characterSlots.max) {
        return interaction.reply({ content: '❌ You have already reached the maximum character slots (10)!', ephemeral: true });
      }
      user.gems -= 300;
      user.characterSlots.purchased += 1;
      await user.save();
      return interaction.reply({ content: `📦 Purchased **+1 Character Slot**! Total allowed slots: ${currentSlots + 1}.` });
    }
  }
}
