import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../models/User.js';
import { Character } from '../../models/Character.js';
import { Item } from '../../models/Item.js';

export const activeTradeOffers = new Map();

export const data = new SlashCommandBuilder()
  .setName('trade')
  .setDescription('Trade items and gold with another player')
  .addSubcommand(sub =>
    sub.setName('offer')
      .setDescription('Offer a trade to another player')
      .addUserOption(opt =>
        opt.setName('target')
          .setDescription('Player to trade with')
          .setRequired(true))
      .addStringOption(opt =>
        opt.setName('give_item')
          .setDescription('Your item ID to give')
          .setRequired(false))
      .addIntegerOption(opt =>
        opt.setName('give_gold')
          .setDescription('Gold to give')
          .setMinValue(1)
          .setRequired(false))
      .addStringOption(opt =>
        opt.setName('for_item')
          .setDescription("Their item ID you want in return")
          .setRequired(false))
      .addIntegerOption(opt =>
        opt.setName('for_gold')
          .setDescription('Gold to request in return')
          .setMinValue(1)
          .setRequired(false)));

async function getActiveCharacter(discordId) {
  const user = await User.findOne({ discordId });
  if (!user || !user.activeCharacterId) return null;
  return Character.findById(user.activeCharacterId);
}

function clearStaleOffersFor(discordId) {
  for (const [id, offer] of activeTradeOffers.entries()) {
    if (offer.fromDiscordId === discordId || offer.toDiscordId === discordId) {
      activeTradeOffers.delete(id);
    }
  }
}

function tradeSummary(offer) {
  const giveText = [
    offer.giveItemName ? `**${offer.giveItemName}**` : null,
    offer.giveGold > 0 ? `${offer.giveGold} gold` : null
  ].filter(Boolean).join(' + ') || '*nothing*';

  const forText = [
    offer.forItemName ? `**${offer.forItemName}**` : null,
    offer.forGold > 0 ? `${offer.forGold} gold` : null
  ].filter(Boolean).join(' + ') || '*nothing*';

  return `**${offer.fromName}** offers ${giveText}\nfor **${offer.toName}**'s ${forText}`;
}

function tradeButtons(tradeId) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`trade:accept:${tradeId}`).setLabel('Accept ✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`trade:decline:${tradeId}`).setLabel('Decline ❌').setStyle(ButtonStyle.Danger)
  )];
}

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand !== 'offer') return;

  const fromDiscordId = interaction.user.id;
  const targetUser = interaction.options.getUser('target');

  if (targetUser.id === fromDiscordId) {
    return interaction.reply({ content: '❌ You cannot trade with yourself.', ephemeral: true });
  }
  if (targetUser.bot) {
    return interaction.reply({ content: '❌ You cannot trade with a bot.', ephemeral: true });
  }

  const fromCharacter = await getActiveCharacter(fromDiscordId);
  if (!fromCharacter) {
    return interaction.reply({ content: '❌ You need an active character first! Use `/character create`.', ephemeral: true });
  }
  const toCharacter = await getActiveCharacter(targetUser.id);
  if (!toCharacter) {
    return interaction.reply({ content: `❌ ${targetUser.username} has no active character to trade with.`, ephemeral: true });
  }

  const giveItemId = interaction.options.getString('give_item');
  const forItemId = interaction.options.getString('for_item');
  const giveGold = interaction.options.getInteger('give_gold') || 0;
  const forGold = interaction.options.getInteger('for_gold') || 0;

  if (!giveItemId && !forItemId && giveGold === 0 && forGold === 0) {
    return interaction.reply({ content: '❌ Offer at least an item or gold on one side.', ephemeral: true });
  }

  let giveItem = null;
  if (giveItemId) {
    giveItem = await Item.findOne({ _id: giveItemId, characterId: fromCharacter._id });
    if (!giveItem) {
      return interaction.reply({ content: '❌ You do not own that item.', ephemeral: true });
    }
    if (giveItem.isEquipped) {
      return interaction.reply({ content: `❌ Unequip **${giveItem.name}** before trading it.`, ephemeral: true });
    }
  }

  let forItem = null;
  if (forItemId) {
    forItem = await Item.findOne({ _id: forItemId, characterId: toCharacter._id });
    if (!forItem) {
      return interaction.reply({ content: `❌ ${targetUser.username} does not own that item.`, ephemeral: true });
    }
    if (forItem.isEquipped) {
      return interaction.reply({ content: `❌ **${forItem.name}** is equipped — ${targetUser.username} must unequip it first.`, ephemeral: true });
    }
  }

  if (giveGold > fromCharacter.gold) {
    return interaction.reply({ content: `❌ You only have ${fromCharacter.gold} gold.`, ephemeral: true });
  }

  clearStaleOffersFor(fromDiscordId);

  const tradeId = `trade_${fromCharacter._id}_${Date.now()}`;
  const offer = {
    tradeId,
    fromDiscordId,
    fromCharacterId: fromCharacter._id,
    fromName: fromCharacter.name,
    toDiscordId: targetUser.id,
    toCharacterId: toCharacter._id,
    toName: toCharacter.name,
    giveItemId: giveItem ? giveItem._id.toString() : null,
    giveItemName: giveItem ? giveItem.name : null,
    giveGold,
    forItemId: forItem ? forItem._id.toString() : null,
    forItemName: forItem ? forItem.name : null,
    forGold
  };
  activeTradeOffers.set(tradeId, offer);

  return interaction.reply({
    content: `🤝 **Trade Offer** — <@${targetUser.id}>, review below!\n${tradeSummary(offer)}`,
    components: tradeButtons(tradeId)
  });
}

export async function handleTradeButton(interaction) {
  const [, action, tradeId] = interaction.customId.split(':');
  const offer = activeTradeOffers.get(tradeId);

  if (!offer) {
    return interaction.reply({ content: '⚠️ This trade offer has expired or was already resolved.', ephemeral: true });
  }

  if (action === 'decline') {
    if (interaction.user.id !== offer.fromDiscordId && interaction.user.id !== offer.toDiscordId) {
      return interaction.reply({ content: '❌ This is not your trade to decline.', ephemeral: true });
    }
    activeTradeOffers.delete(tradeId);
    return interaction.update({ content: `❌ Trade between **${offer.fromName}** and **${offer.toName}** was declined.`, components: [] });
  }

  if (action === 'accept') {
    if (interaction.user.id !== offer.toDiscordId) {
      return interaction.reply({ content: '❌ Only the trade recipient can accept.', ephemeral: true });
    }

    activeTradeOffers.delete(tradeId);

    // Re-validate everything against fresh state — items/gold may have moved
    // in the time between the offer and this accept click.
    const fromCharacter = await Character.findById(offer.fromCharacterId);
    const toCharacter = await Character.findById(offer.toCharacterId);
    if (!fromCharacter || !toCharacter) {
      return interaction.update({ content: '❌ Trade failed — a character no longer exists.', components: [] });
    }

    let giveItem = null;
    if (offer.giveItemId) {
      giveItem = await Item.findOne({ _id: offer.giveItemId, characterId: fromCharacter._id, isEquipped: false });
      if (!giveItem) {
        return interaction.update({ content: `❌ Trade failed — **${offer.fromName}** no longer has that item (or it's now equipped).`, components: [] });
      }
    }
    let forItem = null;
    if (offer.forItemId) {
      forItem = await Item.findOne({ _id: offer.forItemId, characterId: toCharacter._id, isEquipped: false });
      if (!forItem) {
        return interaction.update({ content: `❌ Trade failed — **${offer.toName}** no longer has that item (or it's now equipped).`, components: [] });
      }
    }
    if (offer.giveGold > fromCharacter.gold) {
      return interaction.update({ content: `❌ Trade failed — **${offer.fromName}** no longer has enough gold.`, components: [] });
    }
    if (offer.forGold > toCharacter.gold) {
      return interaction.update({ content: `❌ Trade failed — **${offer.toName}** no longer has enough gold.`, components: [] });
    }

    fromCharacter.gold += offer.forGold - offer.giveGold;
    toCharacter.gold += offer.giveGold - offer.forGold;
    await fromCharacter.save();
    await toCharacter.save();

    if (giveItem) {
      giveItem.characterId = toCharacter._id;
      await giveItem.save();
    }
    if (forItem) {
      forItem.characterId = fromCharacter._id;
      await forItem.save();
    }

    return interaction.update({
      content: `✅ **Trade complete!**\n${tradeSummary(offer)}`,
      components: []
    });
  }
}
