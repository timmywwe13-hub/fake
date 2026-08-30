# 🐾 Critter Quest — Update Log

All notable changes to the game are tracked here.
Format: newest version at the top. Unreleased ideas live in the Roadmap.

---
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