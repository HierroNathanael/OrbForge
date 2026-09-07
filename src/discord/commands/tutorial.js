import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

// ─── Tutorial Pages Definition ───────────────────────────────────────────────
const TUTORIAL_PAGES = [
  // Page 0 — Welcome
  {
    title: '📖 Welcome to Orbforge — Path of Exile Inspired Discord RPG',
    color: '#9b59b6',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3408/3408591.png',
    description: [
      'Deep PoE-inspired RPG played inside Discord.',
      '',
      '**📚 Chapters:**',
      '```',
      '1. Character   5. Crafting & Orbs',
      '2. Class        6. Economy',
      '3. Skill Tree   7. Cheatsheet',
      '4. Combat & Dungeons',
      '```',
      'Use **◀ Prev** / **Next ▶** to navigate.'
    ].join('\n'),
    fields: []
  },

  // Page 1 — Creating a Character
  {
    title: '📖 Chapter 1 — Creating Your Character',
    color: '#3498db',
    description: [
      '3 character slots per account.',
      '```',
      '/character create name:<YourName> class:<Class>',
      '```',
      'Classes: `Warrior`, `Ranger`, `Mage`.',
    ].join('\n'),
    fields: [
      {
        name: 'Commands',
        value: [
          '`/character list` — all characters, active marked ⭐',
          '`/character profile` — active character stats, orbs, XP, gold',
        ].join('\n'),
        inline: false
      },
      {
        name: '⭐ Multiple Characters',
        value: 'Own several; **active** one used in all commands.',
        inline: false
      }
    ]
  },

  // Page 2 — Classes & Subclasses
  {
    title: '📖 Chapter 2 — Classes & Subclasses',
    color: '#e67e22',
    description: '3 base classes, each with 2 Ascendancy subclasses unlocked via Skill Tree.',
    fields: [
      {
        name: '🛡️ Warrior — STR, melee/tank/lifesteal',
        value: '• **Berserker** (Bypass): damage & lifesteal\n• **Guardian** (Grind): mitigation, block, regen',
        inline: false
      },
      {
        name: '🏹 Ranger — DEX, burst/evasion/crit',
        value: '• **Sharpshooter** (Bypass): crit multiplier burst\n• **Trapper** (Grind): AoE traps, evasion',
        inline: false
      },
      {
        name: '🔮 Mage — INT, AoE/shields/support',
        value: '• **Elementalist** (Bypass): elemental AoE\n• **Battle Mage** (Grind): shields & heals',
        inline: false
      },
      {
        name: '💡 Archetype',
        value: '**Bypass** = fast raw damage. **Grind** = defense, sustain, utility.',
        inline: false
      }
    ]
  },

  // Page 3 — Skill Tree
  {
    title: '📖 Chapter 3 — The Passive Skill Tree',
    color: '#2ecc71',
    description: [
      '40–60 nodes per class, tiered:',
      '```',
      'Small Nodes    — Stat bonuses',
      'Keystone Nodes — Major modifiers',
      'Subclass Nodes — Ascendancy, locked to chosen Subclass',
      '```',
    ].join('\n'),
    fields: [
      {
        name: '📈 Ranking',
        value: 'Up to 3 Ranks/node. 1 Skill Point/rank. 1 Skill Point per level-up.',
        inline: false
      },
      {
        name: 'Commands',
        value: [
          '`/tree view` — allocated nodes & remaining points',
          '`/tree allocate` — dropdown of eligible nodes (prereqs required)',
          '`/tree respec node_id:<id>` — refund 1 rank: 🪙100 (small) / 🪙500 (keystone) / 🔮1 Orb of Unmaking (subclass)'
        ].join('\n'),
        inline: false
      }
    ]
  },

  // Page 4 — Combat & Dungeons
  {
    title: '📖 Chapter 4 — Combat & Dungeons',
    color: '#e74c3c',
    description: [
      '```',
      '/dungeon enter tier:<0-6>',
      '```',
      'Start Tier 0 (Novice Training Grounds) for first levels/Orbs/gear.',
    ].join('\n'),
    fields: [
      {
        name: '🗺️ Map Tiers',
        value: [
          '```',
          'Tier 0 — Novice Training Grounds  (Lv 1   Boss: Training Golem)',
          'Tier 1 — Verdant Forest           (Lv 5   Boss: Gargantuan Treant)',
          'Tier 2 — Ruined Catacombs         (Lv 15  Boss: Lich King Aegis)',
          'Tier 3 — Blazing Caldera          (Lv 30  Boss: Magma Behemoth)',
          'Tier 4 — Frostbite Peak           (Lv 50  Boss: Glacial Wyrm)',
          'Tier 5 — Abyssal Temple           (Lv 70  Boss: Void Emperor)',
          'Tier 6 — Celestial Spire          (Lv 90  Boss: Star-Eater Titan)',
          '```'
        ].join('\n'),
        inline: false
      },
      {
        name: '🎮 Combat',
        value: 'Each round every party member picks: **Attack**, **Heavy Strike** (Warrior), **Fireball** (Mage), or **Defend** (halve damage). All actions resolve simultaneously.',
        inline: false
      },
      {
        name: '🔷 Mana',
        value: 'Skills cost Mana (MP). Not enough MP → skill button disabled, falls back to Attack. MP regens each round.',
        inline: false
      },
      {
        name: '🎁 Loot',
        value: 'Personal, private loot roll per player — independent of party.',
        inline: false
      },
      {
        name: '📊 Combat Formulas',
        value: [
          '```',
          'Hit Chance     = 1 - (enemy.evasion / (atk + enemy.evasion))',
          'Damage Dealt   = rawDamage × (100 / (100 + armor))',
          'Critical Hit   = rawDamage × critMultiplier',
          'Lifesteal Heal = damageDone × lifestealPercent',
          '```'
        ].join('\n'),
        inline: false
      }
    ]
  },

  // Page 5 — Crafting & Orbs
  {
    title: '📖 Chapter 5 — Item Crafting & The Orb System',
    color: '#f1c40f',
    description: [
      'Non-destructive crafting — Orbs modify affixes, never destroy items.',
      '```',
      '/craft orb:<OrbType> item_id:<ItemID>',
      '```',
      'Item IDs from `/inventory`. Orbs drop in dungeons.',
    ].join('\n'),
    fields: [
      { name: '🔥 Kindling', value: 'Normal → Magic (1–2 affixes)', inline: true },
      { name: '🌡️ Tempering', value: 'Add 1 affix to Magic item', inline: true },
      { name: '🌟 Ascendance', value: 'Normal → Rare (4–6 affixes)', inline: true },
      { name: '🌀 Unmaking', value: 'Reroll all Rare affixes', inline: true },
      { name: '🧹 Cleansing', value: 'Strip to Normal base', inline: true },
      { name: '✨ Zenith', value: 'Add 1 high-tier affix to Rare', inline: true },
      {
        name: '📋 Affix Limits',
        value: [
          '```',
          'Normal    →  0 prefixes | 0 suffixes',
          'Magic     →  1 prefix  | 1 suffix',
          'Rare      →  3 prefixes | 3 suffixes',
          'Legendary →  4 prefixes | 4 suffixes',
          '```'
        ].join('\n'),
        inline: false
      }
    ]
  },

  // Page 6 — Economy
  {
    title: '📖 Chapter 6 — The Economy',
    color: '#1abc9c',
    description: 'No real-money currency — everything is earned in-game.',
    fields: [
      { name: '🪙 Gold', value: 'From dungeons. Used for respec, vendor costs.', inline: false },
      { name: '🔮 Orbs', value: 'Dungeon drops only, never sold. Only way to modify items.', inline: false }
    ]
  },

  // Page 7 — Quick Reference Cheatsheet
  {
    title: '📖 Chapter 7 — Quick-Reference Cheatsheet',
    color: '#95a5a6',
    description: 'Bookmark this page.',
    fields: [
      {
        name: '👤 Character',
        value: '`/character create name:<n> class:<c>` · `/character profile` · `/character list`',
        inline: false
      },
      {
        name: '🌲 Skill Tree',
        value: '`/tree view` · `/tree allocate` · `/tree respec node_id:<id>`',
        inline: false
      },
      {
        name: '⚔️ Dungeon',
        value: '`/dungeon enter tier:<0-6>` — Attack ⚔️ / Heavy Strike 💥 / Fireball 🔥 / Defend 🛡️',
        inline: false
      },
      {
        name: '🔮 Crafting',
        value: '`/craft orb:<type> item_id:<id>` · `/inventory`',
        inline: false
      },
      {
        name: '📊 Combat Formula',
        value: [
          '`Hit  = 1 - evasion/(atk+evasion)` (min 20%)',
          '`Dmg  = raw × (100/(100+armor))`',
          '`Crit = damage × critMultiplier` (base 1.5×)',
          '`HP   = 100 + (level × classGrowth)`',
          '`MP   = 20 + (INT × 3) + (level × classGrowth)`'
        ].join('\n'),
        inline: false
      },
      {
        name: '🔮 Orbs',
        value: 'Kindling→Magic · Tempering→+affix · Ascendance→Rare · Unmaking→reroll · Cleansing→strip · Zenith→+high-tier affix',
        inline: false
      },
      {
        name: '🎉 Start',
        value: '```\n/character create name:MyExile class:Warrior\n/dungeon enter tier:0\n```',
        inline: false
      }
    ]
  }
];

const TOTAL_PAGES = TUTORIAL_PAGES.length;

// ─── Build Embed from page data ───────────────────────────────────────────────
function buildPageEmbed(pageIndex) {
  const page = TUTORIAL_PAGES[pageIndex];
  const embed = new EmbedBuilder()
    .setTitle(page.title)
    .setColor(page.color)
    .setFooter({ text: `Orbforge Tutorial  •  Page ${pageIndex + 1} of ${TOTAL_PAGES}  •  Use buttons to navigate` })
    .setTimestamp();

  if (page.description) embed.setDescription(page.description);
  if (page.thumbnail) embed.setThumbnail(page.thumbnail);
  if (page.fields && page.fields.length > 0) embed.addFields(page.fields);

  return embed;
}

// ─── Build Navigation Buttons ─────────────────────────────────────────────────
function buildNavRow(currentPage, userId) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`tutorial:prev:${currentPage}:${userId}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),

    new ButtonBuilder()
      .setCustomId(`tutorial:page:0:${userId}`)
      .setLabel('🏠 Start')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0),

    new ButtonBuilder()
      .setCustomId(`tutorial:page:${Math.min(currentPage + 2, TOTAL_PAGES - 1)}:${userId}`)
      .setLabel(`Chapter ${Math.min(currentPage + 2, TOTAL_PAGES)} ↩`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === TOTAL_PAGES - 1),

    new ButtonBuilder()
      .setCustomId(`tutorial:next:${currentPage}:${userId}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Success)
      .setDisabled(currentPage === TOTAL_PAGES - 1)
  );

  return row;
}

// ─── Slash Command Definition ──────────────────────────────────────────────────
export const data = new SlashCommandBuilder()
  .setName('tutorial')
  .setDescription('📖 Interactive Orbforge tutorial — learn all game systems step by step')
  .addIntegerOption(opt =>
    opt.setName('chapter')
      .setDescription('Jump directly to a specific chapter (1–7)')
      .setMinValue(1)
      .setMaxValue(TOTAL_PAGES)
      .setRequired(false));

export async function execute(interaction) {
  const startChapter = (interaction.options.getInteger('chapter') ?? 1) - 1;
  const userId = interaction.user.id;

  const embed = buildPageEmbed(startChapter);
  const navRow = buildNavRow(startChapter, userId);

  await interaction.reply({
    embeds: [embed],
    components: [navRow]
  });
}

// ─── Button Interaction Handler ───────────────────────────────────────────────
export async function handleTutorialButton(interaction) {
  const { customId, user } = interaction;

  if (!customId.startsWith('tutorial:') && !customId.startsWith('tutorial_')) return false;

  let action = '';
  let param = '0';
  let ownerId = '';

  if (customId.includes(':')) {
    const parts = customId.split(':');
    action = parts[1];
    param = parts[2];
    ownerId = parts[3];
  } else {
    const parts = customId.split('_');
    action = parts[1];
    param = parts[2];
    ownerId = parts.slice(3).join('_');
  }

  // Only the original user can navigate their own tutorial
  if (user.id !== ownerId) {
    return interaction.reply({
      content: '❌ This tutorial session belongs to someone else. Run `/tutorial` to start your own!',
      ephemeral: true
    });
  }

  let currentPage;
  if (action === 'next') {
    currentPage = parseInt(param, 10);
    currentPage = Math.min(currentPage + 1, TOTAL_PAGES - 1);
  } else if (action === 'prev') {
    currentPage = parseInt(param, 10);
    currentPage = Math.max(currentPage - 1, 0);
  } else if (action === 'page') {
    currentPage = parseInt(param, 10);
    currentPage = Math.max(0, Math.min(currentPage, TOTAL_PAGES - 1));
  } else {
    return false;
  }

  const embed = buildPageEmbed(currentPage);
  const navRow = buildNavRow(currentPage, user.id);

  await interaction.update({
    embeds: [embed],
    components: [navRow]
  });

  return true;
}
