# 🐾 Critter Quest — Update Log

All notable changes to the game are tracked here.
Format: newest version at the top. Unreleased ideas live in the Roadmap.

---

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
