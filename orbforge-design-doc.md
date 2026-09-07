# Orbforge — Design Reference Doc (Brainstorm v1)

**Game Name: Orbforge** — confirmed. Checked against Steam titles and general game listings, no meaningful collision found (nearest hits: "Orb Quest," a 1982 tabletop microquest, and "Orb of Creation," an unrelated incremental game — neither a naming conflict). Ties directly to the game's core identity: **Orbs** (the named crafting currency, Section 5) used to **forge**/craft gear — the name describes the core loop rather than being purely decorative.

**Concept**: A Path of Exile 1–inspired, text/menu-based RPG running as a Discord bot.
**Stack**: JavaScript (discord.js) + MongoDB. Optional companion website added later (leaderboards only — no real-money currency, so no payment processing needed).

---

## 1. Core Identity

- Class + subclass system, deep crafting, build-defining skill tree.
- Turn-based / stat-check combat (no real-time twitch combat).
- Progression identity: power comes mainly from **skill tree + gear**, not infinite levels.
- Crafting is **PoE-style**: currency rerolls/adds affixes, items are never destroyed. No loss-based or destructive enchanting.

---

## 1b. Target Audience & Session Design

- **Target audience: 18+**, playing during work breaks / commute — not long uninterrupted sessions.
- **Explicitly not PoE-campaign-style** (hours-long speedrun + long grind sessions). Sessions should be **5–15 minutes** and still feel like real progress.
- Design implications for existing systems:
  - **Dungeon/map runs** should be short (~2–5 min per run via Option B simultaneous-round combat) — 1–3 runs fit a coffee break or commute leg.
  - Every short session should **bank tangible progress** (a completed map, a currency gain, a skill point) — avoid systems that require 30+ min of sustained play before any reward lands.
  - Crafting/trading are already instant actions — fine as-is for micro-sessions.
  - Consider soft diminishing returns (not a hard wall) past a certain amount of play per day — helps low-time players not feel like they're missing out vs. high-time players, and naturally discourages farming/RMT-adjacent bot behavior.

---

## 2. Classes & Subclasses — REVISED: 3 Base Classes

- **3 base classes** (revised down from 5): **Warrior, Ranger, Mage** — references: Ragnarok Online, Dragon Nest job-class structure. Simpler roster fits scope better and matches classic ARPG genre expectations more directly than an original 5-class roster.
- Each class unlocks **2 subclasses** (Ascendancy-style) at a level milestone.
- Subclass grants a small bonus node set (8–12 nodes), separate from the main tree.
- **Subclass choice is respec-able**, but at a higher cost than normal tree respec (see Respec Costs below) — keeps build identity meaningful without permanently bricking new players.

### Solo Viability Rule — Every Subclass Must Be Soloable
- **Design constraint**: dungeons must be clearable solo, not party-required. This changes how roles are assigned.
- **Party roles (DPS/Tank/Support) emerge from build/skill choices within a run, not from rigid class/subclass identity** — same philosophy as PoE (any build can solo; party specialization is a per-run choice, not a class contract).
- Every subclass must land in one of two solo-viable archetypes (avoid a third "neither" bucket):
  1. **Bypass (damage-check)**: kill fast enough that sustain barely matters — crit/burst-leaning subclasses.
  2. **Grind (sustain-check)**: survive via mitigation/leech/kiting, lower damage but stable — tanky/hybrid-leaning subclasses.
- "Support" is a **skill category** (heal/buff skills exist in the Skill Book pool, see 6b), not a locked class identity — a support-leaning subclass still has a real damage kit; in solo play a player leans damage-heavy, in party play they can rank up heal/buff skills instead.
- Example roster mapping:

| Class | Subclass A (bypass-leaning) | Subclass B (grind/hybrid-leaning) |
|---|---|---|
| Warrior | Berserker — high damage, lifesteal-style sustain | Guardian — mitigation/block/regen tank, still solo-clears (slower) |
| Ranger | Sharpshooter — burst single-target | Trapper — sustained/kiting, AoE + control |
| Mage | Elementalist — burst AoE damage | Battle Mage / hybrid caster — utility + heal/buff skills available, still damage-capable solo |

- Difficulty scaling assumes **solo-viable-but-slower, never solo-locked**; party play is an efficiency choice (faster clears, harder content access via party HP/damage scaling — Section 6), not a requirement.

---

## 3. Skill Tree (Torchlight-style ranked nodes)

- **Text/menu-based**, not a visual node map — navigated via Discord Select Menus.
- ~**40–60 nodes per class**, each node rankable up to **3 times** (escalating effect per rank) instead of 100+ single-purpose nodes.
  - Compresses content scope while preserving meaningful breadth-vs-depth choices.
- `/tree view` — embed showing allocated nodes/points, grouped by branch.
- `/tree allocate` — Select Menu shows only currently-eligible nodes (prereqs met); refreshes as points are spent.
- Node tiers: **Small node** (cheap) → **Keystone/major node** (moderate) → **Subclass/Ascendancy node** (expensive).

### Respec Costs (tiered)
| Node type | Respec cost | Rationale |
|---|---|---|
| Small/regular node | Cheap (Gold or low-tier Orb) | Frequent tweaking should be frictionless |
| Keystone/major node | Moderate | Bigger build-defining choice |
| Subclass/Ascendancy node | Expensive (rare currency) | Identity-level choice, shouldn't be casual |

---

## 4. Leveling

- **Level cap: 100** (matches PoE1's own design philosophy — endgame power comes from gear/tree, not infinite levels).
- Capping keeps stat formulas, monster scaling, and itemization math finite and balanceable.
- Optional future addition: post-cap **paragon/endless system** for small incremental bonuses, if "always something to grind" is wanted later. Not needed for MVP/mid-size scope.

---

## 5. Crafting — Orbforge-Style Currency (Final, PoE-inspired mechanics with original names)

- Base items + affix pool (prefixes/suffixes, gated by item level).
- **Currency applied to an item rerolls/adds affixes — items are never destroyed.** Worst case: wasted currency, item is untouched.
- **6 named currency types** (mechanics inspired by PoE-style crafting, names original to avoid direct copy of PoE's own iconic currency naming):

| Name | Effect |
|---|---|
| **Orb of Kindling** | Upgrade a normal (white) item to magic. |
| **Orb of Tempering** | Add a random affix to a magic item. |
| **Orb of Ascendance** | Upgrade a normal item to rare with random affixes. |
| **Orb of Unmaking** | Reroll all affixes on a rare item. |
| **Orb of Cleansing** | Strip affixes back to base (white) item. |
| **Orb of Zenith** | Add a high-tier affix to a rare item (rare, high-value). |

  Naming logic: Kindling → Tempering → Ascendance follows a forge/fire progression (spark → shape → completed form), tying back into the **Orbforge** name — these are literally the actions performed at the forge. Unmaking/Cleansing are distinct, unambiguous action names. Zenith signals "peak/rarest" currency tier.
- Currency is **earned only** (drops, dungeon rewards) — **not directly purchasable with real money**. This avoids loot-box-style regulatory and ethical issues (Belgium/NL precedent, etc.).
- Currency is tradeable between players → creates a live player-driven economy without needing separate "gold."
- Explicitly rejected: destructive/risk-based enchanting (e.g. Diablo 2-style item-destroying upgrades). Too punishing, higher regulatory/backlash risk — could revisit as an optional very-endgame sidegrade much later, not core.

---

## 5b. Skills, Gear, Stats & Affix System

### Skills per Class (learned via Skill Book, Section 6b)

**Warrior (STR)**
| Skill | Subclass lean | Type |
|---|---|---|
| Basic Attack | Both | Attack |
| Heavy Strike | Berserker | Attack, high damage |
| Rending Blow | Berserker | Attack, bleed DoT |
| Bloodlust | Berserker | Buff, lifesteal window |
| Shield Taunt | Guardian | Utility, forces enemy target |
| Fortify | Guardian | Buff, defense/block chance |
| Second Wind | Guardian | Heal/regen burst |
| Defend | Both | Utility, damage reduction this round |

**Ranger (DEX)**
| Skill | Subclass lean | Type |
|---|---|---|
| Basic Attack | Both | Attack |
| Snipe Shot | Sharpshooter | Attack, high crit chance |
| Piercing Arrow | Sharpshooter | Attack, hits through defense |
| Focus | Sharpshooter | Buff, next attack guaranteed crit |
| Poison Trap | Trapper | AoE, DoT over time |
| Snare Trap | Trapper | Control, reduces enemy action |
| Evasive Roll | Trapper | Buff, evasion window |
| Defend | Both | Utility, damage reduction this round |

**Mage (INT)**
| Skill | Subclass lean | Type |
|---|---|---|
| Basic Attack | Both | Attack |
| Fireball | Elementalist | Attack, AoE burst |
| Chain Lightning | Elementalist | Attack, multi-target |
| Arcane Overload | Elementalist | Buff, next spell damage boosted |
| Divine Heal | Battle Mage | Heal, single/party target |
| Arcane Shield | Battle Mage | Buff, damage absorb shield |
| Mana Ward | Battle Mage | Buff, party-wide mitigation |
| Defend | Both | Utility, damage reduction this round |

- All skills stat-gated (not class-locked) — consistent with Section 6b's "any class can learn any book, usability gated by stat requirement" rule.

### Gear Slots

| Slot | Notes |
|---|---|
| Weapon | Class-flavored (sword/axe, bow, staff/wand) but not hard-locked — stat requirements gate viability |
| Off-hand | Shield (Guardian-leaning), Quiver (Ranger), Focus/Orb (Mage) |
| Helmet | Armor slot |
| Chest | Armor slot |
| Gloves | Armor slot |
| Boots | Armor slot |
| Ring x2 | Accessory, affix-heavy |
| Amulet | Accessory, affix-heavy |
| Belt | Utility slot (potential future flask/charm capacity item) |

Gear follows the standard rarity progression: Normal (white, no affixes) → Magic (1–2 affixes, Orb of Kindling) → Rare (4–6 affixes, Orb of Ascendance).

### Core Stats

**Primary attributes**: Strength (melee damage, HP scaling — Warrior primary) · Dexterity (evasion, crit chance, ranged damage — Ranger primary) · Intelligence (spell damage, mana pool — Mage primary)

**Derived/combat stats**: HP, Mana/Resource, Attack Damage, Spell Damage, Armor, Resistance (elemental, optionally split by type), Evasion, Crit Chance / Crit Multiplier, Accuracy

**Affix-only stats** (Magic/Rare gear only, not on base character sheet): Life Leech %, Elemental Damage %, Cooldown Reduction, Resource Cost Reduction, flat +stat rolls, etc.

### Item Level (iLvl) Tier Gating — Confirmed Mechanic

- Each item drops with an **item level**, tied to the monster/dungeon or map tier it dropped from (Section 10b) — separate from character level. This determines which affix *tiers* are eligible to roll on that item.
- Crafting currency (Orb of Ascendance/Tempering/Zenith) only rolls from affix tiers unlocked by the item's iLvl — a low-iLvl item cannot roll a top-tier affix regardless of how much currency is spent on it. This is what makes map-tier progression (10b) matter for itemization, not just difficulty.
- Suggested iLvl bands (tune against the 1–100 level cap and map tiers):

| iLvl range | Affix tier unlocked | Roughly maps to |
|---|---|---|
| 1–14 | Tier 1 | Tutorial – early dungeons |
| 15–29 | Tier 2 | Early-mid |
| 30–49 | Tier 3 | Mid |
| 50–69 | Tier 4 | Mid-late |
| 70–84 | Tier 5 | Late |
| 85–100 | Tier 6 | Endgame / maps |

### Prefixes & Suffixes by Gear Slot

Convention: prefixes lean offense/utility, suffixes lean defense/resistance/misc (default, not a hard rule). Rare items can hold up to 3 prefixes + 3 suffixes (tune down for early game if a tighter affix count is wanted).

**Weapon (all classes)**
- Prefixes: Added Physical Damage (flat) · Added Elemental Damage (Fire/Cold/Lightning, pick one) · Attack Speed % · Critical Strike Chance %
- Suffixes: Accuracy Rating · Critical Strike Multiplier % · Life Leech % · Mana Leech % · Elemental Damage % (suffix variant)

**Off-hand (Shield / Quiver / Focus-Orb)**
- Prefixes: Added Armor (Shield) · Added Evasion (Quiver) · Added Spell Damage % (Focus/Orb) · Block Chance % (Shield only)
- Suffixes: Resistance (Fire/Cold/Lightning, pick one) · Maximum Mana · Cooldown Reduction % · Movement/Action Speed %

**Helmet / Chest / Gloves / Boots (Armor pieces)**
- Prefixes: Added Armor (flat) · Added Evasion (flat) · Added Energy Shield (flat, optional third defense layer) · Maximum Health %
- Suffixes: Resistance (Fire/Cold/Lightning) · Attribute bonus (+STR/+DEX/+INT, one per roll) · Movement Speed % (Boots-exclusive) · Stun/Freeze/Control Resistance %

**Ring**
- Prefixes: Added Elemental Damage % · Added Physical Damage % · Life Leech %
- Suffixes: Resistance (Fire/Cold/Lightning) · Attribute bonus · Maximum Mana %

**Amulet**
- Prefixes: Added Damage % (global, all types) · Critical Strike Chance % · Attribute bonus (larger roll than Ring, Amulet-exclusive)
- Suffixes: All Resistances % (small flat, Amulet-exclusive prize affix) · Experience Gain % · Cooldown Reduction %

**Belt**
- Prefixes: Maximum Health % · Flask/Charm capacity (if a consumable-charge item is added later)
- Suffixes: Resistance (Fire/Cold/Lightning) · Stun Resistance % · Physical Damage Reduction %

**Mana/Resource costs**: skills draw from the character's Mana pool (derived stat, Section 5b — scales with Intelligence + level). Physical Warrior/Ranger skills cost 0 Mana; Mage spells cost Mana per rank. A skill a caster can't afford downgrades to a Basic Attack for that round; Mana regenerates a percentage of max per round.

---

## 6. Combat & Party Structure

- Turn-based, stat-check resolution (attack roll vs evasion, damage vs armor mitigation).
- Dungeon/map runs presented via sequential embeds.
- **Party size cap: 3** (DPS / Tank / Support) — tighter and easier to balance than PoE's 6, realistic for Discord server concurrency.
- Enemies scale up (HP/damage) with party size; drop *quantity* (not odds) scales slightly with party size too.

### Combat Resolution Model — Confirmed: Option B (Simultaneous Round Resolution)
- Bot posts encounter state (enemy HP/intent) as an embed each round.
- Each party member picks an action (attack/skill/defend) via buttons/select within a time limit (e.g. 30–60s).
- Bot resolves the **entire round at once** (all player + enemy actions calculated together), posts a single summary embed, repeats until the fight ends.
- No-response default: basic attack or skip — prevents one AFK player stalling the whole party.
- Role synergy: Support heals / Tank taunts apply within the same round before damage resolves, so DPS/Tank/Support roles meaningfully interact.
- Rejected: sequential per-player turns (Option A) — too slow/async-unfriendly for Discord.

## 6b. Active Skills (separate from Passive Tree) — Confirmed: Hybrid (Skill Books + Ranking)

- **Skill Books** unlock a skill: dropped from monsters/dungeons or purchasable with Gold/Orbs, **tradeable** between players (fits existing economy).
- Once unlocked, a skill can be **ranked up (1–5)** using a separate **skill point pool** (earned via leveling, independent from passive tree points) — same ranking pattern as passive tree nodes, no new system to invent.
- Skills are **not class-locked by book type** — any character can learn any book they find — but **stat requirements gate usability** (e.g. a fire spell needs X Intelligence), same trick PoE uses to keep skill choice tied to build without hard class-locking.
- Chosen over full PoE-style independent gem-leveling (its own XP/leveling per skill gem) for **stability**: fewer compounding power-scaling systems (level + tree ranks + gear affixes + skill levels = too many balance vectors for a small team), no separate skill-XP economy to design, and flat capped ranks (1–5) are far easier to balance-test than open-ended gem leveling.
- Rejected: full independent skill-gem leveling (more authentic to PoE, but meaningfully higher build/maintenance complexity).

```js
knownSkills: [
  { skillId: "fireball", rank: 3, source: "skillbook_drop" }
],
skillPoints: { available: Number, spent: Number } // separate pool from passive tree points
```

## 6c. Paragon / Post-Cap System (Deferred, Not in MVP)

- Reference: Diablo III's Paragon system — past the level cap, XP no longer grants full levels but instead slow, uncapped fractional stat bonuses (e.g. +0.1% damage per Paragon point) via a small separate mini-tree.
- Purpose: gives completionist players "always something to grind" post-cap without breaking the carefully balanced 1–100 stat/itemization math.
- Status: **optional future addition**, not needed for MVP/mid-size scope — noted here so the idea isn't lost.

---

## 7. Looting

- **Personal instanced loot** (PoE-style): each party member gets independent drop rolls per kill.
- No need/greed rolls, no shared pool, no master looter — avoids friction/UI overhead entirely.
- Confirmed as final: simplest to build *and* most player-friendly — rare case where both align.

---

## 8. Characters & Slots

- **3 base character slots** per account (fixed — no real-money currency to purchase extra slots with; `characterSlots.purchased` stays a future-facing field, currently unused).
- Only **one character active/playable at a time** (no simultaneous multi-character sessions) — simplifies state handling for MVP.

```js
characterSlots: { base: 3, purchased: 0, max: 10 },
activeCharacterId: ObjectId
```

---

## 9. Economy — 2-Tier Currency (No Real-Money Currency)

**REVISED: the premium/hard-currency tier (Gems) is removed.** No real-money purchases, no top-ups, no supporter packs, no battle pass, no auto-battle pass, no Gem-bought EXP/Drop boosts. Everything below is earned entirely through play.

| Currency | Type | Source | Use |
|---|---|---|---|
| **Gold** | Soft | Dungeons, quests, selling items | Repairs, basic shop, cheap respec |
| **Orbs** | Crafting currency | Drops, dungeon rewards (earned only) | Crafting/rerolling gear — player economy |

- **Rationale**: keeps the game entirely F2P-clean with no monetization surface to design/regulate around — no loot-box, top-up, or pay-for-speed concerns at all.
- Character slots are fixed at 3 (Section 8) — no purchase path.
- `/shop`, the FIFO EXP/Drop boost queue, and the auto-battle pass are all removed along with the currency that funded them.
- **Cosmetics** (text-game-appropriate, no art needed), earned via play (milestones, seasonal goals — Section 10c), not purchased:
  - Titles (`[Bloodmoon Reaver] YourName`)
  - Embed accent colors per player
  - Profile icons/emoji next to name
- **Open question**: if a monetization layer is wanted later, revisit as a clean addition rather than resurrecting these removed sections — start from a fresh design pass, not by restoring the old Gems economy verbatim.

---

## 10b. Maps / Endgame Tier System — Confirmed

- Maps are **consumable items** ("tickets") — running a map consumes it.
- Obtained by: **grinding drops at the tier below** (standard progression gate), **buying with Gold/Orbs**, or **trading with other players**.
- Drop tables weighted toward same-tier maps with a small chance of tier+1, so progression is naturally "clear Tier N → earn tickets into Tier N+1."
- Higher tiers = harder enemies + better loot quantity/odds, using the existing personal-instanced-loot system per party member.
- Party play has a clear purpose here: a 3-person party can push higher map tiers than solo.

```js
mapItem: { tier: Number, modifiers: [...] } // consumed on use
// drop table per tier: weighted toward same tier, small chance of tier+1
```

---

## 10c. Late-Game Goals — Confirmed Model: Min-Max One Character (No Season/League Reset)

- **Season/league reset (PoE-style economy wipe) rejected.** Forcing existing players back to zero has little payoff for a small Discord community and actively punishes retention — not worth it at this scale.
- **Primary late-game loop: tweak/min-max the existing character**, not "make a new character." This fits what's already designed:
  - Push higher map tiers (10b) for better crafting currency drops
  - Chase perfect affix rolls via non-destructive crafting (Section 5) — this is the core PoE-style late-game chase and the system is already built for it
  - Iteratively min-max the passive tree (cheap respec on normal nodes supports this — Section 3)
  - Participate in the player-trade economy itself (selling crafted gear/currency) as a goal, not just a means
  - Earned seasonal cosmetic goals (titles, embed colors, icons — Section 9, no purchase involved) as a lighter "log in regularly" hook
- **Rolling a new class is optional/social variety**, not a forced end-game requirement — appropriate since there's no reset economy to justify forcing it.
- **Future endgame expansion (post-MVP, not required for launch): horizontal content growth instead of a reset.**
  - Raise level cap incrementally (e.g. 100 → 110 → 120) in content updates
  - Add new gear tiers / higher item levels to go with each cap raise
  - Add harder monsters and higher map tiers above the current ceiling
  - This preserves existing player progress (no wipe) while still giving long-term players new goals — standard live-service horizontal expansion, lower risk than a league-reset system.

---

## 11. Companion Website — Deferred

- Not needed for MVP — slash commands + embeds carry mid-size scope fine.
- Build **later**, scoped narrowly to:
  - Skill tree visualizer (read-only), leaderboards/stats dashboard
  - No payment processing needed — no real-money currency in the game (Section 9)
- Bot stays the core experience; website is a utility layer, not a parallel game client.

---

## 12. Open Questions — Working Answers (revisable)

- **Subclass-respec cost**: a dedicated rare currency (e.g. "Orb of Fate"), obtained from weekly/seasonal content or rare dungeon drops only — not vendor-purchasable. Keeps subclass changes meaningful without being pay-to-instant-switch.
- ~~**5-class roster**~~ — superseded, see Section 2 (revised to 3 classes: Warrior / Ranger / Mage).
- **Dungeon/endgame structure**: resolved — see Section 10b (map-tier ticket system).
- ~~**Real-money monetization (Gems, top-ups, supporter packs, battle pass)**~~ — removed entirely, see Section 9. Revisit only as a fresh design pass if ever wanted.

---

*This document reflects brainstorm decisions as of the conversation; treat as a living draft, not a locked spec.*
