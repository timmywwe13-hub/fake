# 🐾 Critter Quest — Update Log

All notable changes to the game are tracked here.
Format: newest version at the top. Unreleased ideas live in the Roadmap.

---
## v2.6.6 — Bug Fixes & Polish
- 🐛 Fixed: Antidote and Awakening items were never consumed from inventory when used in battle — they now correctly deduct one use per application
- 🐛 Fixed: the Run button could briefly allow a second action on success before the battle screen closed — input is now locked immediately on attempt
- 🐛 Fixed: admin panel teleport now properly resets the segment index when landing in a world that has no segments, preventing a stale segment reference
- 📱 Fixed: admin panel buttons (Unlock, Cancel, Close) were hidden behind the D-pad on mobile — added bottom padding so they're always tappable

## v2.4.5 — Safe Zones, Readable Maps & Portal Fixes
- 📊 **Stats screen**: new 📊 Stats button in the HUD — lifetime totals for total battles won, critters caught, coins earned, plus collection size and trainers defeated. Totals live in your save file and survive refreshes (older saves are migrated automatically)
- 🌐 **Online leaderboards**: shown right on the Stats screen as a beta placeholder — online play will be added later
- 🌀 **Portal fixes**: the 🌀 to 🌋 Ember Depths lives only in the 🌻 Sunflower & Hidden Glade segment; 🌑 Obsidian Hollow's entrance portal leads onward to ❄️ Frozen Peaks (no more being dumped back in the Meadowlands); 🌋 Ember Depths has a 🌀 gate home right beside where you arrive
- ⛺ Frozen Peaks arrivals land on the grass beside the heal tent instead of a lake pocket with a gate home right behind it
- 🏡 **Safe zones**: the Meadowlands starting meadow is a safe zone — no wild encounters, a pulsing green shield ring, an on-map "🏡 SAFE — no wild critters here" banner and a 🏡 SAFE HUD tag. Everywhere else shows ⚔️ WILD
- 🏕️ **Safe camps**: the pocket of tiles around every ⛺ heal tent is safe in every world and segment — tinted green on the map, shield ring + 🏡 SAFE tag while you stand in it, and trainers won't ambush you there
- 🗺️ **Readable maps**: tile emojis appear only on tiles where wild critters can appear (grass, forests, water, caves, ✨ patches) plus ⛺🏪🌀📜 service icons — clean open ground means safe, emoji patches mean critters lurk there
- 🏡 **New world: Harmony Hollow** — a small, entirely safe 2D town behind the always-open garden gate (🚪 **G** tile) in the Meadowlands' Sunflower & Hidden Glade segment. Cobblestone paths, flower beds, homes, a heal tent (⛺ **B** tile) and 🌀 portal home
- 📋 **Sidequests that pay**: Milo (battle 3 wild critters — 200 🪙), Professor Fern (catch 2 critters — 350 🪙) and Granny Rose (defeat 2 trainers — 500 🪙). Walk into ❗ townsfolk to accept, return at ❓ to get paid; the 📜 quest board (R tile) lists everything. Progress also works for rematches
- 💬 Townsfolk chat: press **E / Enter / Space** next to a townsfolk (or tap the 💬 Talk button on mobile). Tilly and Finn have flavor dialogue
- 🧭 Portals can target a specific segment (`seg:`), and fainting in town wakes you at the town tents
- ⚖️ Yin-Yang Realm trainers toned down from 1000 HP to 400 HP — the old HP wall made them effectively unbeatable; now it's hard but fair
- ☀️ Light (Mystic) critters roam the Yin-Yang Realm by day, and 🌙 dark (Shade) critters take over at night — the pools never mix; the mythical ☯️ YinYang still appears on ✨ tiles day or night
- 📜 The 🗺️ Roadmap now always sits at the top of the update log

## v2.4.3 — Yin-Yang Balance & Day/Night
- ⚖️ Yin-Yang Realm trainers toned down from 1000 HP to 400 HP — the old HP wall made them effectively unbeatable, so the final world now stays hard but fair
- ☀️ Light (Mystic) critters now roam the Yin-Yang Realm during the day, and 🌙 dark (Shade) critters take over at night — the pools never mix
- ☯️ The mythical YinYang critter is untouched: it can appear on ✨ tiles day or night, slightly more often at night (10% vs 8%)
- 📜 The 🗺️ Roadmap now always renders at the top of the in-game update log, above every version entry

## v2.4.2 — Mobile Admin & Ashfall Fixes
- 📱 Fixed the admin access code being impossible to enter on mobile — the PIN used tiny ▲/▼ steppers that required hover and had 48px tap targets. Touch devices now get direct typing plus a big on-screen number pad; desktop keeps the original steppers
- 📱 Menus and overlays are now viewport-fixed, so they cover the whole screen on mobile instead of being cut off when the page is scrolled (this is also why the PIN dialog could seem untappable)
- 🐛 Fixed the Team Eclipse Grunt in 🌋 Ashfall Peaks being unreachable — he stood at (10,8) inside the sealed volcanic cave (a closed ring of 🖤 walls with no entrance), so the cosmic gate could never be unlocked by playing normally. He now waits on open ground at (17,8)

## v2.4.1 — Refresh & Admin Teleport Fixes
- 🐛 Fixed the game crashing on the map screen (frozen map, missing player, empty inventory) — Blaze and Team Eclipse trainers were added to every world in v2.4.0 without character palettes, so drawing any world that contained them crashed the render. Every trainer now has a palette, plus a fallback so a future missing entry can never crash the map
- 🐛 Fixed admin panel teleports not being saved — refreshing the page after teleporting (e.g. to Yin-Yang Realm) snapped you back to where you were, which could funnel you into New Game and overwrite your save. Teleports now persist
- 🐛 Fixed New Game silently overwriting an existing save — it now asks for confirmation first, and actually resets the in-memory state when confirmed
- 🛡️ Save loading is now defensive: corrupt player/collection/team data is repaired on load instead of crashing, and save failures (full/blocked storage) show a warning instead of silently dying

## v2.4.0 — Rivals, Villains & Weather
- ✅ Day/night cycle now takes 160 steps to change (was 40) — longer days and nights for more immersive exploration
- ✅ New: Weather system — each world has its own weather patterns that change as you explore
- ✅ Weather affects encounter rates: Rain boosts water critters, Wind boosts forest finds, Storms increase mythical chances
- ✅ Weather indicator shown in the HUD alongside day/night status
- ✅ New: Rival character Blaze — a fiery trainer who follows you across all worlds, getting stronger each time
- ✅ Blaze appears in Meadowlands, Ember Depths, Frozen Peaks, and Yin-Yang Realm with progressively stronger teams
- ✅ New: Team Eclipse villain organization — dark-robed trainers seeking to capture all mythical critters
- ✅ Eclipse Grunt in Ashfall Peaks, Commander Nyx in Astral Expanse, and Leader Obsidian in Yin-Yang Realm
- ✅ Story cutscenes for meeting and defeating rivals and villains
- ✅ Critter Index on the title screen shows every critter name and where to find them
- ✅ Roadmap moved to the top of the Update Log

## v2.2.0 — Type Balance, Safe Paths & Visual Refresh
- 🐛 Fixed encounter bug in Worlds 4–6 (Ashfall Peaks, Astral Expanse, Yin-Yang Realm) — path tiles (`.`) no longer trigger random encounters, so walking on open ground is safe again like in Meadowlands and Ember Depths
- ✅ Shade type is now strong against Cosmic — the dark void of space counters cosmic power (Shade → Cosmic 2x, Cosmic → Shade 0.5x)
- ✅ Poison type rebalanced — now only effective against Grass and Poison (Water no longer weak to Poison)
- ✅ Poison status effect now only usable by Grass and Poison type critters — toxic spores, venomous vines, and toxic sap
- ✅ Rock type now strong against Poison — minerals neutralize toxins (Rock → Poison 2x, Poison → Rock 0.5x)
- ✅ Poison chance rates lowered: Poison types 25%, Grass types 3%
- ✅ Ashfall Peaks visually refreshed — new ashy gray color palette with fog wall deco, distinct from Ember Depths' warm volcanic browns
- ✅ Mythical ✨ tiles (`*`) added to Ashfall Peaks, Astral Expanse, and Yin-Yang Realm — 0.1% chance to encounter Lunastra, Solarion, or Glacialis

## v2.1.0 — Level Cap & Endgame Challenge
- ✅ New: Max level cap of 120 for player critters — XP resets to 0 at cap, team screen shows 'MAX' instead of XP progress
- ✅ World 6 (Yin-Yang Realm) trainers now scaled to level 138-150 — a serious endgame challenge even at max level
- ✅ Zenithral's team reaches up to level 150, requiring strong type matchups and strategy to defeat
- 🐛 Fixed Yin-Yang Realm map having a stray Q tile that served no purpose

## v2.0.0 — Three New Worlds
- ✅ New: World 4 — 🌋 Ashfall Peaks with volcanic landscape, Fire/Rock critters, and 4 trainers led by champion Magmus
- ✅ New: World 5 — 🌌 Astral Expanse with cosmic landscape, brand-new Cosmic type, and 4 trainers led by champion Galaxius
- ✅ New: World 6 — ⚫⚪ Yin-Yang Realm with light/dark split landscape, Mystic/Shade critters, and 5 trainers led by final champion Zenithral
- ✅ 18 new species across the three worlds, each with evolutions at level milestones
- ✅ New type: Cosmic — strong against Fire and Rock
- ✅ Difficulty scaling: Ashfall Peaks (Lv 28-38) → Astral Expanse (Lv 33-43) → Yin-Yang Realm (Lv 38-52)
- ✅ Each world has its own portal chain, requiring all previous trainers to be defeated
- ✅ Story cutscenes for entering each new world and defeating each world's champion

## v1.4.3 — Day/Night Cycle
- ✅ New: a day/night cycle — the world darkens with a visible ☀️/🌙 indicator every 40 steps you take
- ✅ Some tiles now have different critters at night: Shade and Mystic types get much more common after dark in the Meadowlands, and Poison/Ice types shift in Ember Depths
- ✅ The Frozen Peaks mythical (Silklarva/Cocobright/Astromoth) is 3x more likely to appear at night, since it's a moth

## v1.4.2 — New Mythical: Astromoth Line
- ✅ New: a 3-stage mythical exclusive to Frozen Peaks — Silklarva (Lv 1-10) grows into Cocobright (Lv 11-20), then Astromoth (Lv 21-30)
- ✅ Found on a new hidden ✨ tile in Frozen Peaks as a young Silklarva — train it up through battles and it evolves on its own, just like a normal critter
- ✅ Mythical-rarity at every stage, so it's just as hard to catch as Lunastra, Solarion, or Glacialis
- ✅ Successfully catching a wild critter now also grants your active critter XP, same as knocking it out would

## v1.4.1 — Freeze Fix & Candy
- 🐛 Fixed freeze being inflictable by almost every element (Grass, Electric, Rock, Air, Mystic, and Shade critters all had a freeze-chance move by mistake) — only Water and Ice critters can freeze now
- 🐛 Bred hybrids can no longer inherit a freeze move from a Water/Ice parent unless the hybrid itself ends up Water or Ice type
- ✅ XP-to-level-up is now scaled by rarity: common critters unchanged, rare critters need 1.6x the XP per level, mythicals need 3x
- ✅ New: 🍬 Candy Bars — a shop item you can feed to any owned critter from the Team screen for an instant XP boost, no battle needed
- ✅ Team screen now shows each critter's current XP progress toward its next level

## v1.3.0 — Frozen Peaks Portal
- ✅ New: a portal in Ember Depths now leads to Frozen Peaks (World 3) — it wasn't reachable before
- ✅ Sealed until you've defeated ALL trainers in BOTH Meadowlands and Ember Depths (all 10, not just a handful)
- ✅ Frozen Peaks now has its own portal back to Ember Depths
- 🐛 Fixed the Frozen Peaks map: two rows were the wrong width, which put the heal tent in the wrong spot and left the world with no portal at all
- 🐛 Fixed a crash on entering Frozen Peaks: its 3 trainers had no character colors defined, so drawing them threw an error mid-frame. This skipped drawing the player entirely (looked like a freeze, worst on mobile) and could leave the canvas transform/alpha state corrupted, which is why the purple portal tile sometimes stopped rendering on desktop too
- 🐛 Fixed Venomite, Sludgil, and Toxwing evolving into the exact same critters as Embercub, Aquafin, and Sproutle. They now evolve into their own unique Poison-type forms — Toxidrake, Bogleviathan, and Miasmawing

## v1.2.0 — Catch Rate by Rarity
- ✅ Catch chance is now scaled by species rarity instead of every critter sharing the same odds
- ✅ Common critters: unchanged (~25%-90% depending on remaining HP)
- ✅ Rare critters (World 3 exclusives + evolved forms): much tougher, ~5%-70% even with a top-tier orb
- ✅ Mythicals (Lunastra, Solarion, Glacialis): only ~0.3% on a fresh encounter with a basic orb — weakening them and using a Legend Orb is close to required
- ✅ Catch-chance log message now shows decimals below 1% so rare/mythical odds don't misleadingly round down to "0%"

## v1.1.0 — Breeding Exclusives Update
- ✅ New: 4 breed-exclusive critters — Steamurk ♨️, Voltvine 🌿⚡, Skycrag 🪨🕊️, Duskstar ✨🌑
- ✅ These 4 can ONLY be obtained by breeding — they never appear as wild encounters or on trainer teams
- ✅ Each one hatches from a specific pair of parent types (Fire+Water, Electric+Grass, Air+Rock, Mystic+Shade) instead of a random hybrid
- ✅ Breed menu now only lists unbred critters as selectable parents — a critter born from breeding can't be bred again, so it no longer shows up in the list

## v1.0.0 — Cleanup Update
- ✅ Removed the non-functional "Battle" HUD button (online battling isn't built yet — still on the roadmap)
- ✅ New: Deviant critters — a rare (~5%) stronger variant with +30% HP/ATK
- ✅ Deviants show a shimmering ✨ DEVIANT badge and gold glow wherever they appear
- ✅ Deviants only spawn from wild encounters; trainers never field deviant critters
- 🐛 Fixed a bug where buying a Great Orb or Ultra Orb broke catching (their owned count silently went invalid and the game always fell back to a basic Critter Orb)
- ✅ New: 🟣 Master Orb and ⚪ Legend Orb — 2 new catch orb tiers. Each orb is 40% better than the one before it: Great Orb → Ultra Orb → Master Orb → Legend Orb
- ✅ New: Breeding! A Breed screen lets you pick 2 owned critters (Lv 3+, 🪙60) to produce a baby
- ✅ Breeding two different species creates a unique hybrid — blended name, combined icon, a random parent type, and one move inherited from each parent
- ✅ Bred critters are marked with a 🧬 BRED badge wherever they're shown
- 🐛 Fixed a battle-freezing bug: when poison/burn wore off mid-fight, the game hit an error and locked up — no move, catch, or switch button would respond until you reloaded. Also added a safety net so a battle-turn error can never soft-lock the game again

## v9.1 — Mythical Creatures & Mobile Update
- ✅ Added 3 mythical creatures: Lunastra, Solarion, Glacialis
- ✅ Extremely rare encounters (1% chance) on special '*' tiles
- ✅ Hidden mythical tiles in each world for exploration
- ✅ Mythical creatures have superior stats and unique moves
- ✅ Mobile fix button: added a button to adjust controls and layout for mobile devices
- ✅ Improved UI: refined colors, spacing, and typography for a cleaner look
- ✅ Enhanced responsiveness: better scaling on various screen sizes
- ✅ Bug fixes: addressed touch input issues and menu alignment on mobile

## v0.6 — Elements & Status Effects
- **New world 2 exclusive elements**: ☠️ Poison and ❄️ Ice
- **Status effects system**:
  - Poison: lasts 2 rounds, deals 5 HP per round at the end of the victim's turn
  - Freeze: 40% chance on Ice moves, victim skips their turn
  - Statuses show as tags on the HP cards, cured by the ⛺ tent and at battle end
- **6 new critters** (Ember Depths only): Venomite 🦂, Sludgil 🐸, Toxwing 🦟,
   Frostcub 🐻‍❄️, Icyfin 🐧, Glacihorn 🦌
- Type chart updated: Fire melts Ice, Poison beats Grass/Water, Ice beats Grass/Air

## v0.5 — World Rework
- **Fit-to-screen map**: canvas now scales to the browser window (no more hidden bottom row)
- **Forest area** 🌳 added to Meadowlands with its own tougher encounter table
- **Sealed portal**: must defeat ALL Meadowlands trainers (Rex, Ivy, Cole) to unlock,
   with progress messages in the battle log
- **Ember Depths made harder**: wild critters now Lv 10-17, stronger trainer teams
- **4 new trainers in world 2**: Pyra 🔥, Onyx 🪨, Vex ⚡, and champion Magnus 👑 (7 total)

## v0.4 — Economy & Battle FX
- **Bigger maps**: both worlds expanded to 24x16 tiles
- **20 new critters** (28 total) spread across grass/water/cave encounter tables
- **Coins** 🪙 earned from battles (level x3 per KO, +50 trainer bonus)
- **Shop** 🏪 in both worlds: Critter Orbs (25), Potions (40), Big Potions (90)
- **Catching costs orbs**; potions usable in battle as a turn action
- **Animated attacks**: type projectiles (🔥💧⚡🍃🪨💨✨🌑) fly across the arena
   with a 💥 impact burst and target shake

## v0.3 — 3D Characters
- Player and trainers rendered as **3D-shaded canvas models**
   (gradient-lit bodies/heads, ground shadows, colored outfits, directional caps)
- Player flips to face walk direction; trainers turn to watch you; defeated trainers fade

## v0.2 — Two Worlds & Battle Arena
- **Second world**: 🌋 Ember Depths, connected via 🌀 portals
- Per-world maps, colors, encounters, trainers, and heal tents
- **Battle arena** with large 2D sprites of both fighters and world-themed backdrops
- Bigger tiles (40px) and a highlight ring under the player

## v0.1 — Initial Release
- Tile-based overworld (grass/water/cave zones) with WASD/arrow movement
- Random wild encounters and turn-based battles (attack, catch, switch, run)
- 8 original critters with types, levels, XP, and a type-effectiveness chart
- Catch chance scales with enemy HP; team/collection screen (max 6 in team)
- 3 NPC trainer battles, heal tent, blackout-on-loss
- localStorage save/load with auto-save

---
## 🗺️ Roadmap (future updates & reworks)

### Planned
- [ ] World 3 (ideas: ❄️ Frozen Peaks or 🌊 Sunken Isles) behind a second portal gate
- [ ] Critter evolutions (e.g., Embercub → higher form at Lv 16)
- [ ] More status effects: burn 🔥, paralysis ⚡, sleep 💤
- [ ] Better orbs in the shop (Great Orb / Ultra Orb with higher catch rates)
- [ ] Battle items: status cures (Antidote, Ice Melt), XP boosters
- [ ] Rematch defeated trainers for smaller rewards

### Reworks under consideration
- [ ] True 3D map + models using Three.js/WebGL
- [ ] Sprite sheet art to replace emoji critters
- [ ] Sound effects and background music
- [ ] Defense stat + per-move types (e.g., a Fire critter with a Rock move)
- [ ] Day/night cycle affecting which critters appear
- [ ] PC storage box UI for large collections

### Ideas parking lot
- Shiny/rare recolored critters
- Fishing rod item for water encounters
- Critter abilities (passives)
- Endless battle tower after beating Magnus