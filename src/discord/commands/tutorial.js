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
      '> *"In the depths of Orbforge, power is forged — not gifted."*',
      '',
      'Welcome, Exile. **Orbforge** is a deep, PoE-inspired RPG played entirely inside Discord.',
      'This tutorial will walk you through all core systems step-by-step.',
      '',
      '**📚 Tutorial Chapters:**',
      '```',
      '1. Creating your Character',
      '2. Choosing your Class & Subclass',
      '3. The Passive Skill Tree',
      '4. Combat & Dungeons',
      '5. Item Crafting & Orbs',
      '6. The Economy & Shop',
      '7. Quick-Reference Cheatsheet',
      '```',
      '',
      'Use the **◀ Prev** and **Next ▶** buttons below to navigate chapters.',
      '> 💡 **Tip**: You can jump to any chapter by clicking the numbered buttons when they appear!'
    ].join('\n'),
    fields: []
  },

  // Page 1 — Creating a Character
  {
    title: '📖 Chapter 1 — Creating Your Character',
    color: '#3498db',
    description: [
      'Before you can do anything, you need a character. Orbforge supports up to **3 character slots** by default (expandable to 10 via the Shop).',
      '',
      '**🛡️ Creating a Character:**',
      '```',
      '/character create name:<YourName> class:<Class>',
      '```',
      'Choose one of three base classes: `Warrior`, `Ranger`, or `Mage`.',
      '',
      '**🗂️ Managing Characters:**',
    ].join('\n'),
    fields: [
      {
        name: '📋 /character list',
        value: 'View all your characters. Your **active** character is marked with ⭐.',
        inline: false
      },
      {
        name: '👤 /character profile',
        value: 'View your active character\'s full stats, orb inventory, XP, and gold.',
        inline: false
      },
      {
        name: '⭐ Multiple Characters',
        value: 'You can own multiple characters with different classes. Your **active** character is the one used in all commands. Expand slots with `/shop buy item:slot_expansion` (💎 300 Gems).',
        inline: false
      }
    ]
  },

  // Page 2 — Classes & Subclasses
  {
    title: '📖 Chapter 2 — Classes & Subclasses',
    color: '#e67e22',
    description: [
      'Orbforge has **3 Base Classes**, each with **2 Ascendancy Subclasses** unlocked through the Skill Tree.',
    ].join('\n'),
    fields: [
      {
        name: '🛡️ Warrior — Strength & Physical Force',
        value: [
          '> **Primary Stat**: Strength  |  **Style**: Melee, Tanks, Lifesteal',
          '• **Berserker** *(Bypass)*: Damage & Lifesteal — trades survivability for relentless aggression.',
          '• **Guardian** *(Grind)*: Heavy mitigation, block chance, and health regen — the immovable wall.'
        ].join('\n'),
        inline: false
      },
      {
        name: '🏹 Ranger — Dexterity & Critical Strikes',
        value: [
          '> **Primary Stat**: Dexterity  |  **Style**: Burst, Evasion, Crits',
          '• **Sharpshooter** *(Bypass)*: Massive critical strike multipliers for single-target burst damage.',
          '• **Trapper** *(Grind)*: AoE elemental traps and high evasion for kiting fights.'
        ].join('\n'),
        inline: false
      },
      {
        name: '🔮 Mage — Intelligence & Elemental Spells',
        value: [
          '> **Primary Stat**: Intelligence  |  **Style**: AoE Spells, Shields, Support',
          '• **Elementalist** *(Bypass)*: Devastating elemental AoE spells that incinerate waves.',
          '• **Battle Mage** *(Grind)*: Arcane shields and powerful heals — solo and party endgame specialist.'
        ].join('\n'),
        inline: false
      },
      {
        name: '💡 Archetype Guide',
        value: '**Bypass** = End fights fast with raw damage output.\n**Grind** = Outlast enemies with defense, sustain, and utility.',
        inline: false
      }
    ]
  },

  // Page 3 — Skill Tree
  {
    title: '📖 Chapter 3 — The Passive Skill Tree',
    color: '#2ecc71',
    description: [
      'The Passive Tree is Orbforge\'s core character build system — inspired by Path of Exile. Each class has **40–60 unique nodes** organized into tiers.',
      '',
      '**🌳 Node Tiers:**',
      '```',
      'Small Nodes    — Stat bonuses (Strength, Health, Armor, etc.)',
      'Keystone Nodes — Powerful modifiers (e.g. +35% Armor, +12% Lifesteal)',
      'Subclass Nodes — Ascendancy powers locked to your chosen Subclass',
      '```',
    ].join('\n'),
    fields: [
      {
        name: '📈 Ranking System',
        value: 'Every node has **up to 3 Ranks**. Each rank costs **1 Skill Point** and increases the node\'s bonus.\n> e.g. *Physical Might: Rank 1 = +5 STR → Rank 2 = +10 STR → Rank 3 = +18 STR*',
        inline: false
      },
      {
        name: '🌲 /tree view',
        value: 'See all currently allocated nodes and your remaining Skill Points.',
        inline: false
      },
      {
        name: '✅ /tree allocate',
        value: 'Opens an interactive dropdown menu showing all eligible nodes you can spend a point on. Prerequisites must be met before accessing deeper nodes.',
        inline: false
      },
      {
        name: '🔄 /tree respec node_id:<id>',
        value: [
          'Remove a previously allocated node rank and refund 1 Skill Point.',
          '• Small nodes: 🪙 **100 Gold**',
          '• Keystone nodes: 🪙 **500 Gold**',
          '• Subclass nodes: 🔮 **1x Orb of Unmaking**'
        ].join('\n'),
        inline: false
      },
      {
        name: '💡 Tip',
        value: 'You gain **1 Skill Point per level-up**. Plan your build around your Subclass — allocate toward Keystone nodes to unlock Subclass Ascendancy nodes.',
        inline: false
      }
    ]
  },

  // Page 4 — Combat & Dungeons
  {
    title: '📖 Chapter 4 — Combat & Dungeons',
    color: '#e74c3c',
    description: [
      'Dungeons are the core gameplay loop. Enter a **tiered Map Run** and fight waves of monsters — culminating in a Boss battle for premium loot.',
      '',
      '**⚔️ Starting a Dungeon:**',
      '```',
      '/dungeon enter tier:<0-6>',
      '```',
      'Start with **Tier 0** (Novice Training Grounds) to gain your first levels, Orbs, and starter gear!',
    ].join('\n'),
    fields: [
      {
        name: '🗺️ Map Tiers',
        value: [
          '```',
          'Tier 0 — Novice Training Grounds (Level 1   Boss: Training Golem)',
          'Tier 1 — Verdant Forest         (Level 5   Boss: Gargantuan Treant)',
          'Tier 2 — Ruined Catacombs       (Level 15  Boss: Lich King Aegis)',
          'Tier 3 — Blazing Caldera        (Level 30  Boss: Magma Behemoth)',
          'Tier 4 — Frostbite Peak         (Level 50  Boss: Glacial Wyrm)',
          'Tier 5 — Abyssal Temple         (Level 70  Boss: Void Emperor)',
          'Tier 6 — Celestial Spire        (Level 90  Boss: Star-Eater Titan)',
          '```'
        ].join('\n'),
        inline: false
      },
      {
        name: '🎮 How Combat Works — Option B (Simultaneous Round Resolution)',
        value: [
          'Each round, **every party member submits an action** via Discord buttons:',
          '• **⚔️ Basic Attack** — Standard physical damage.',
          '• **💥 Heavy Strike** — High-damage melee skill (Warrior).',
          '• **🔥 Fireball** — AoE elemental spell (Mage).',
          '• **🛡️ Defend** — Halve incoming damage this round.',
          '',
          'Once all actions are submitted, the bot **resolves the full round simultaneously**: buffs apply → players attack → enemies retaliate. No waiting for turn queues!'
        ].join('\n'),
        inline: false
      },
      {
        name: '🎁 Personal Instanced Loot',
        value: 'Each player receives their own private loot roll — **independent of party members**. Loot includes Gold, XP, crafting Orbs, and gear items based on the map tier.',
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
      'Orbforge uses a **non-destructive, PoE-inspired crafting system**. Your items are **never destroyed** — Orbs simply modify their affixes.',
      '',
      '**🔮 Using Orbs:**',
      '```',
      '/craft orb:<OrbType> item_id:<ItemID>',
      '```',
      '> Find item IDs from `/inventory`. Orbs drop from dungeon runs.',
    ].join('\n'),
    fields: [
      {
        name: '🔥 Orb of Kindling',
        value: 'Upgrades a **Normal (white)** item to **Magic** with 1–2 random affixes.',
        inline: true
      },
      {
        name: '🌡️ Orb of Tempering',
        value: 'Adds **1 random affix** to a **Magic** item (if it has room for more).',
        inline: true
      },
      {
        name: '🌟 Orb of Ascendance',
        value: 'Upgrades a **Normal** item directly to **Rare** with 4–6 random affixes.',
        inline: true
      },
      {
        name: '🌀 Orb of Unmaking',
        value: '**Rerolls all affixes** on a **Rare** item — gamble for better rolls!',
        inline: true
      },
      {
        name: '🧹 Orb of Cleansing',
        value: 'Strips **all affixes** back to a clean **Normal (white)** base. Use to reset a bad item.',
        inline: true
      },
      {
        name: '✨ Orb of Zenith',
        value: 'Adds **one high-tier affix** to a **Rare** item. Rare and extremely powerful.',
        inline: true
      },
      {
        name: '📋 Affix Limits by Rarity',
        value: [
          '```',
          'Normal    →  0 prefixes | 0 suffixes',
          'Magic     →  1 prefix  | 1 suffix',
          'Rare      →  3 prefixes | 3 suffixes',
          'Legendary →  4 prefixes | 4 suffixes',
          '```'
        ].join('\n'),
        inline: false
      },
      {
        name: '💡 Crafting Strategy',
        value: [
          '1. Find a good **base type** in a dungeon.',
          '2. Use **Orb of Kindling** to make it Magic.',
          '3. **Orb of Ascendance** if you want to jump straight to Rare.',
          '4. Use **Orb of Unmaking** to re-roll bad Rare affixes.',
          '5. Use **Orb of Zenith** to add one pinnacle affix to a good Rare.'
        ].join('\n'),
        inline: false
      }
    ]
  },

  // Page 6 — Economy & Shop
  {
    title: '📖 Chapter 6 — The Economy & Shop',
    color: '#1abc9c',
    description: [
      'Orbforge has a **3-tier currency system** designed so that **premium Gems can never buy combat power directly**.',
    ].join('\n'),
    fields: [
      {
        name: '🪙 Gold (Soft Currency)',
        value: 'Earned from dungeon runs. Used for skill tree respec costs, vendor purchases, and services.',
        inline: false
      },
      {
        name: '🔮 Orbs (Crafting Currency)',
        value: 'Dropped exclusively in dungeons — **never sold in the shop**. Orbs are the only way to modify items.',
        inline: false
      },
      {
        name: '💎 Gems (Premium Currency)',
        value: [
          'Purchased or earned via milestones. Used **only** for convenience and account upgrades — never for loot boxes or direct power.',
          '',
          '**📦 /shop view** — See all available items.',
          '**🛍️ /shop buy item:<choice>** — Purchase an item.',
        ].join('\n'),
        inline: false
      },
      {
        name: '🛒 Shop Catalogue',
        value: [
          '```',
          '1-Day 2× EXP Boost           →  💎 100 Gems',
          '1-Day 2× Drop Boost          →  💎 150 Gems',
          '1-Day Auto-Battle Pass        →  💎 200 Gems',
          '+1 Character Slot            →  💎 300 Gems',
          '```'
        ].join('\n'),
        inline: false
      },
      {
        name: '⚡ EXP / Drop Boosts — FIFO Queue',
        value: 'Boosts are queued in order. The **highest multiplier always activates first**. For example: a 2× boost activates before a 1.5× boost, regardless of purchase order.',
        inline: false
      },
      {
        name: '🤖 Auto-Battle Pass',
        value: 'While active, your character can run dungeons automatically via `/dungeon auto` — earning **100% full normal XP, Gold, Orbs, and Gear drops with zero penalty or reduction**!',
        inline: false
      }
    ]
  },

  // Page 7 — Quick Reference Cheatsheet
  {
    title: '📖 Chapter 7 — Quick-Reference Cheatsheet',
    color: '#95a5a6',
    description: 'Everything you need to play Orbforge at a glance. Bookmark this page!',
    fields: [
      {
        name: '👤 Character Commands',
        value: [
          '`/character create name:<n> class:<c>` — Create character',
          '`/character profile` — View active character',
          '`/character list` — List all characters'
        ].join('\n'),
        inline: false
      },
      {
        name: '🌲 Skill Tree Commands',
        value: [
          '`/tree view` — View allocated nodes & available points',
          '`/tree allocate` — Open node selection menu',
          '`/tree respec node_id:<id>` — Remove a node rank (costs Gold / Orb of Unmaking)'
        ].join('\n'),
        inline: false
      },
      {
        name: '⚔️ Dungeon Commands',
        value: [
          '`/dungeon enter tier:<0-6>` — Enter a Map dungeon run (0 = Tutorial)',
          'Combat buttons: **Attack ⚔️** | **Heavy Strike 💥** | **Fireball 🔥** | **Defend 🛡️**'
        ].join('\n'),
        inline: false
      },
      {
        name: '🔮 Crafting Commands',
        value: [
          '`/craft orb:<type> item_id:<id>` — Apply a crafting Orb to an item',
          '`/inventory` — View your gear and item IDs'
        ].join('\n'),
        inline: false
      },
      {
        name: '💎 Shop Commands',
        value: [
          '`/shop view` — View all purchasable items',
          '`/shop buy item:<choice>` — Purchase with Gems'
        ].join('\n'),
        inline: false
      },
      {
        name: '📊 Combat Formula Cheat',
        value: [
          '`Hit   = 1 - evasion/(atk+evasion)` → min 20% chance',
          '`Dmg   = raw × (100/(100+armor))`',
          '`Crit  = damage × critMultiplier` (base 1.5×)',
          '`HP    = 100 + (level × classGrowth)`'
        ].join('\n'),
        inline: false
      },
      {
        name: '🔮 Orb Quick Reference',
        value: [
          '🔥 Kindling → Normal to Magic',
          '🌡️ Tempering → Add affix to Magic',
          '🌟 Ascendance → Normal to Rare',
          '🌀 Unmaking → Reroll Rare affixes',
          '🧹 Cleansing → Strip to white base',
          '✨ Zenith → Add high-tier affix to Rare'
        ].join('\n'),
        inline: false
      },
      {
        name: '🎉 You\'re Ready!',
        value: 'Start your journey:\n```\n/character create name:MyExile class:Warrior\n/dungeon enter tier:0\n```\nGood luck in Orbforge, Exile. May the Orbs be ever in your favour. ⚔️',
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
