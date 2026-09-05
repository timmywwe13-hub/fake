"use strict";
/* =====================================================================
   CRITTER QUEST — sections:
   1. Data (34 species, types + statuses, WORLDS, trainers, shop, update log)
   2. Game state + save/load
   3. Overworld (3D characters, movement, encounters, gated portals, shop)
   4. Battle system (animated attacks, statuses, orbs, potions)
   5. Shop / Team / Updates UI
   6. Mobile touch controls
   ===================================================================== */

/* ============ 1. DATA ============ */

// Type effectiveness: attacker type -> types it is strong (2x) against.
// Reverse lookup gives 0.5x. Everything else is 1x.
const TYPE_CHART = {
  Fire:     ["Grass", "Ice"],
  Water:    ["Fire", "Rock"],
  Grass:    ["Water", "Rock"],
  Electric: ["Water", "Air"],
  Rock:     ["Fire", "Air", "Poison"],
  Air:      ["Grass"],
  Mystic:   ["Shade"],
  Shade:    ["Mystic", "Cosmic"],
  Poison:   ["Grass", "Poison"],  // world 2 exclusive — only effective vs Grass and itself
  Ice:      ["Grass", "Air"],    // world 2 exclusive
  Cosmic:   ["Fire", "Rock"],     // world 4 exclusive
  YinYang:  ["Shade", "Cosmic"], // world 6 exclusive — balance overcomes darkness and chaos
};

// Visual effect thrown for each attack type (plus the capture orb).
const FX = { Fire:"🔥", Water:"💧", Grass:"🍃", Electric:"⚡", Rock:"🪨",
             Air:"💨", Mystic:"✨", Shade:"🌑", Poison:"☠️", Ice:"❄️", Cosmic:"🌌", Orb:"🟠" };

// Status effects: poison ticks damage each round, freeze skips the victim's turn,
// burn does damage over time, paralysis may prevent action, sleep prevents action for set turns.
const STATUS_INFO = {
  poison: { icon:"☠️", dmg:5 },
  freeze: { icon:"❄️", dmg:0 },
  burn:   { icon:"🔥", dmg:4 },    // Damage over time
  paralyze:{ icon:"⚡", dmg:0 },    // May prevent action
  sleep:  { icon:"💤", dmg:0 },    // Prevents action for set turns
};

// Evolution system: certain critters evolve at specific levels
const EVOLUTIONS = [
  // Starter evolutions (Level 10)
  { from: 0, to: 38, level: 10 },   // Embercub -> Emberion
  { from: 1, to: 39, level: 10 },   // Aquafin -> Hydrokai
  { from: 2, to: 40, level: 10 },   // Sproutle -> Florabeast
  // World 2 critter evolutions (Level 20) — each gets its own unique evolved
  // form (previously these mistakenly pointed at the same targets as the
  // starter evolutions above, so a Venomite and an Embercub would evolve
  // into the exact same critter — fixed by giving them distinct forms)
  { from: 28, to: 48, level: 20 },  // Venomite -> Toxidrake
  { from: 29, to: 49, level: 20 },  // Sludgil -> Bogleviathan
  { from: 30, to: 50, level: 20 },  // Toxwing -> Miasmawing
  { from: 31, to: 34, level: 20 },  // Frostcub -> Glacifox
  { from: 32, to: 35, level: 20 },  // Icyfin -> FrostOwl
  { from: 33, to: 36, level: 20 },  // Glacihorn -> Crystalon
  // Final evolutions (Level 30)
  { from: 34, to: 37, level: 30 },  // Glacifox -> Blizzarena
  { from: 35, to: 37, level: 30 },  // FrostOwl -> Blizzarena
  { from: 36, to: 37, level: 30 },  // Crystalon -> Blizzarena
  // New Frozen Peaks-exclusive mythical line: grows through 3 stages as it levels
  { from: 51, to: 52, level: 11 },  // Silklarva -> Cocobright
  { from: 52, to: 53, level: 21 },  // Cocobright -> Astromoth
  // World 3 (Ashfall Peaks) evolutions
  { from: 54, to: 57, level: 25 },  // Magmox -> Pyrovast
  { from: 55, to: 58, level: 25 },  // Obsidrax -> Geodeclaw
  { from: 56, to: 59, level: 25 },  // Scorplate -> Cragshell
  // World 4 (Astral Expanse) evolutions
  { from: 60, to: 63, level: 30 },  // Nebulyx -> Quasarion
  { from: 61, to: 64, level: 30 },  // Stellark -> Cosmosaur
  { from: 62, to: 65, level: 30 },  // Voidwing -> Cosmira
  // World 5 (Yin-Yang Realm) evolutions
  { from: 66, to: 69, level: 35 },  // Lumivane -> Paradoxio
  { from: 67, to: 70, level: 35 },  // Umbraxis -> Equilibra
  { from: 68, to: 71, level: 35 },  // Harmonex -> Zenithral
];

// 34 original species (ids are array positions — never reorder, only append!).
// Moves can carry an `effect`: { type:'poison'|'freeze'|'burn'|'paralyze'|'sleep', turns, chance }.
const SPECIES = [
  { id:0,  name:"Embercub",  type:"Fire",     icon:"🦊", baseHP:22, baseAtk:11, moves:[{name:"Scorch Swipe",power:10},{name:"Cinder Pounce",power:13, effect:{type:"burn",turns:2,chance:0.5}}] },
  { id:1,  name:"Aquafin",   type:"Water",    icon:"🐟", baseHP:24, baseAtk:10, moves:[{name:"Bubble Jet",power:10},{name:"Tide Slap",power:12, effect:{type:"freeze",turns:1,chance:0.3}}] },
  { id:2,  name:"Sproutle",  type:"Grass",    icon:"🌱", baseHP:26, baseAtk:9,  moves:[{name:"Leaf Flick",power:9},{name:"Vine Lash",power:12, effect:{type:"poison",turns:2,chance:0.03}}] },
  { id:3,  name:"Zapmite",   type:"Electric", icon:"⚡", baseHP:20, baseAtk:12, moves:[{name:"Static Nip",power:10},{name:"Volt Skitter",power:13}] },
  { id:4,  name:"Rockadillo",type:"Rock",     icon:"🪨", baseHP:30, baseAtk:8,  moves:[{name:"Pebble Roll",power:9},{name:"Boulder Curl",power:12}] },
  { id:5,  name:"Gustwing",  type:"Air",      icon:"🕊️", baseHP:21, baseAtk:11, moves:[{name:"Wind Jab",power:10},{name:"Sky Dive",power:13}] },
  { id:6,  name:"Glimmoth",  type:"Mystic",   icon:"🦋", baseHP:23, baseAtk:11, moves:[{name:"Dream Dust",power:10},{name:"Prism Beam",power:13}] },
  { id:7,  name:"Fangroot",  type:"Shade",    icon:"🌑", baseHP:25, baseAtk:10, moves:[{name:"Gloom Bite",power:10},{name:"Root Snare",power:12}] },
  { id:8,  name:"Flarehop",  type:"Fire",     icon:"🐇", baseHP:20, baseAtk:12, moves:[{name:"Hot Hop",power:10},{name:"Blaze Kick",power:13, effect:{type:"burn",turns:2,chance:0.5}}] },
  { id:9,  name:"Cindertail",type:"Fire",     icon:"🦎", baseHP:23, baseAtk:11, moves:[{name:"Tail Torch",power:10},{name:"Lava Lick",power:13, effect:{type:"burn",turns:2,chance:0.4}}] },
  { id:10, name:"Puddlepaw", type:"Water",    icon:"🦦", baseHP:25, baseAtk:10, moves:[{name:"Splash Swat",power:10},{name:"River Rush",power:12, effect:{type:"freeze",turns:2,chance:0.5}}] },
  { id:11, name:"Coralisk",  type:"Water",    icon:"🐙", baseHP:26, baseAtk:9,  moves:[{name:"Ink Squirt",power:9},{name:"Tentacle Whip",power:13, effect:{type:"freeze",turns:1,chance:0.3}}] },
  { id:12, name:"Snailtide", type:"Water",    icon:"🐌", baseHP:31, baseAtk:7,  moves:[{name:"Slime Coat",power:8},{name:"Shell Surf",power:12, effect:{type:"freeze",turns:2,chance:0.5}}] },
  { id:13, name:"Thornbud",  type:"Grass",    icon:"🌵", baseHP:27, baseAtk:9,  moves:[{name:"Needle Jab",power:10},{name:"Spike Storm",power:12, effect:{type:"poison",turns:2,chance:0.03}}] },
  { id:14, name:"Fernfox",   type:"Grass",    icon:"🦔", baseHP:24, baseAtk:10, moves:[{name:"Frond Swipe",power:10},{name:"Bramble Roll",power:12, effect:{type:"poison",turns:2,chance:0.03}}] },
  { id:15, name:"Mosskit",   type:"Grass",    icon:"🐢", baseHP:32, baseAtk:7,  moves:[{name:"Moss Bash",power:9},{name:"Sap Cannon",power:12, effect:{type:"poison",turns:2,chance:0.03}}] },
  { id:16, name:"Voltbat",   type:"Electric", icon:"🦇", baseHP:21, baseAtk:12, moves:[{name:"Shock Wing",power:10},{name:"Thunder Screech",power:13}] },
  { id:17, name:"Sparkle",   type:"Electric", icon:"🐭", baseHP:19, baseAtk:13, moves:[{name:"Zap Nibble",power:10},{name:"Circuit Dash",power:13}] },
  { id:18, name:"Ampeel",    type:"Electric", icon:"🐍", baseHP:24, baseAtk:11, moves:[{name:"Coil Shock",power:10},{name:"Volt Squeeze",power:13}] },
  { id:19, name:"Cragclaw",  type:"Rock",     icon:"🦀", baseHP:28, baseAtk:9,  moves:[{name:"Pinch Slam",power:10},{name:"Stone Snip",power:12}] },
  { id:20, name:"Bouldern",  type:"Rock",     icon:"🐗", baseHP:32, baseAtk:8,  moves:[{name:"Gravel Charge",power:10},{name:"Quake Tusk",power:13}] },
  { id:21, name:"Zephyrix",  type:"Air",      icon:"🦅", baseHP:22, baseAtk:12, moves:[{name:"Gale Talon",power:10},{name:"Dive Bomb",power:14}] },
  { id:22, name:"Cloudle",   type:"Air",      icon:"🐑", baseHP:27, baseAtk:8,  moves:[{name:"Fluff Puff",power:9},{name:"Cyclone Spin",power:12}] },
  { id:23, name:"Buzzgale",  type:"Air",      icon:"🐝", baseHP:20, baseAtk:12, moves:[{name:"Sting Breeze",power:10},{name:"Swarm Rush",power:13}] },
  { id:24, name:"Lunaris",   type:"Mystic",   icon:"🦉", baseHP:24, baseAtk:11, moves:[{name:"Moon Glare",power:10},{name:"Astral Hoot",power:13}] },
  { id:25, name:"Starpuff",  type:"Mystic",   icon:"🐱", baseHP:22, baseAtk:11, moves:[{name:"Twinkle Tap",power:10},{name:"Nova Purr",power:13}] },
  { id:26, name:"Duskmaw",   type:"Shade",    icon:"🐺", baseHP:26, baseAtk:11, moves:[{name:"Night Fang",power:11},{name:"Howl of Dusk",power:13}] },
  { id:27, name:"Wraithvine",type:"Shade",    icon:"🕷️", baseHP:23, baseAtk:11, moves:[{name:"Web of Woe",power:10},{name:"Phantom Bite",power:13}] },
  // ---- World 2 exclusives: Poison + Ice (with status effects) ----
  { id:28, name:"Venomite",  type:"Poison", icon:"🦂", baseHP:24, baseAtk:11, moves:[{name:"Toxin Sting",power:9, effect:{type:"poison",turns:2,chance:0.25}},{name:"Venom Slash",power:12, effect:{type:"poison",turns:1,chance:0.25}}] },
  { id:29, name:"Sludgil",   type:"Poison", icon:"🐸", baseHP:27, baseAtk:9,  moves:[{name:"Sludge Spit",power:9, effect:{type:"poison",turns:2,chance:0.25}},{name:"Bog Slam",power:12, effect:{type:"poison",turns:1,chance:0.25}}] },
  { id:30, name:"Toxwing",   type:"Poison", icon:"🦟", baseHP:21, baseAtk:12, moves:[{name:"Plague Bite",power:10, effect:{type:"poison",turns:2,chance:0.25}},{name:"Miasma Dive",power:13, effect:{type:"poison",turns:2,chance:0.25}}] },
  { id:31, name:"Frostcub",  type:"Ice",    icon:"🐻‍❄️", baseHP:26, baseAtk:10, moves:[{name:"Frost Swipe",power:10, effect:{type:"freeze",turns:1,chance:0.4}},{name:"Snow Slam",power:13, effect:{type:"freeze",turns:2,chance:0.5}}] },
  { id:32, name:"Icyfin",    type:"Ice",    icon:"🐧", baseHP:23, baseAtk:11, moves:[{name:"Ice Shard",power:10, effect:{type:"freeze",turns:1,chance:0.4}},{name:"Glacier Slide",power:12, effect:{type:"freeze",turns:2,chance:0.5}}] },
  { id:33, name:"Glacihorn", type:"Ice",    icon:"🦌", baseHP:28, baseAtk:10, moves:[{name:"Chill Horn",power:10, effect:{type:"freeze",turns:1,chance:0.4}},{name:"Blizzard Charge",power:13, effect:{type:"freeze",turns:2,chance:0.5}}] },
  // ---- World 3 exclusives: New evolutions and ice-types ----
  { id:34, name:"Glacifox",   type:"Ice",     icon:"🦊❄️", baseHP:28, baseAtk:12, rarity:"rare", moves:[{name:"Ice Fang",power:11},{name:"Glacier Bite",power:14}] },
  { id:35, name:"FrostOwl",   type:"Ice",     icon:"🦉❄️", baseHP:25, baseAtk:14, rarity:"rare", moves:[{name:"Snow Veil",power:10},{name:"Blizzard Wing",power:13}] },
  { id:36, name:"Crystalon",  type:"Ice",     icon:"💎❄️", baseHP:30, baseAtk:10, rarity:"rare", moves:[{name:"Crystal Shard",power:9},{name:"Prism Burst",power:12}] },
  { id:37, name:"Blizzarena",type:"Ice",     icon:"🦌❄️", baseHP:32, baseAtk:11, rarity:"rare", moves:[{name:"Antler Rush",power:10},{name:"Ice Age",power:14}] },
  // Evolved forms (will be implemented via evolution system)
  { id:38, name:"Emberion",   type:"Fire",    icon:"🦁🔥", baseHP:35, baseAtk:16, rarity:"rare", moves:[{name:"Solar Flare",power:15},{name:"Phoenix Cry",power:18, effect:{type:"burn",turns:2,chance:0.5}}] },
  { id:39, name:"Hydrokai",   type:"Water",   icon:"🐬💧", baseHP:33, baseAtk:15, rarity:"rare", moves:[{name:"Tsunami Crash",power:14},{name:"Abyssal Pulse",power:16}] },
  { id:40, name:"Florabeast", type:"Grass",   icon:"🌳🌿", baseHP:38, baseAtk:12, rarity:"rare", moves:[{name:"Verdant Fury",power:13, effect:{type:"poison",turns:2,chance:0.03}},{name:"Photosynthesis",power:15}] },
  // Mythical creatures - extremely rare
  { id:41, name:"Lunastra",   type:"Mystic",  icon:"🐉✨", baseHP:50, baseAtk:25, rarity:"mythical", moves:[{name:"Moonlight Blast",power:20},{name:"Stardust Shower",power:25}] },
  { id:42, name:"Solarion",   type:"Fire",    icon:"🌞🔥", baseHP:55, baseAtk:28, rarity:"mythical", moves:[{name:"Solar Flare",power:22},{name:"Corona Pulse",power:28, effect:{type:"burn",turns:3,chance:0.6}}] },
  { id:43, name:"Glacialis",  type:"Ice",     icon:"❄️👑", baseHP:52, baseAtk:22, rarity:"mythical", moves:[{name:"Absolute Zero",power:20},{name:"Glacial Empire",power:26}] },
  // ---- Breed-exclusive species: NEVER placed in wild encounter pools or trainer
  // teams, so the only way to obtain one is breeding the right pair of parent types
  // together (see BREED_EXCLUSIVES below). ----
  { id:44, name:"Steamurk",  type:"Fire",     icon:"♨️", baseHP:32, baseAtk:15, moves:[{name:"Steam Burst",power:13},{name:"Scald Wave",power:16, effect:{type:"burn",turns:2,chance:0.45}}] },
  { id:45, name:"Voltvine",  type:"Electric", icon:"🌿⚡", baseHP:30, baseAtk:16, moves:[{name:"Static Bloom",power:13},{name:"Thorn Surge",power:16}] },
  { id:46, name:"Skycrag",   type:"Rock",     icon:"🪨🕊️", baseHP:35, baseAtk:13, moves:[{name:"Gale Slam",power:12},{name:"Boulder Gust",power:15}] },
  { id:47, name:"Duskstar",  type:"Mystic",   icon:"✨🌑", baseHP:31, baseAtk:16, moves:[{name:"Eclipse Beam",power:14},{name:"Umbral Flash",power:17}] },
  // ---- World 2 Poison evolutions (each Poison exclusive gets its own unique form) ----
  { id:48, name:"Toxidrake",   type:"Poison", icon:"🦂☠️", baseHP:32, baseAtk:15, rarity:"rare", moves:[{name:"Venom Fang",power:14, effect:{type:"poison",turns:2,chance:0.25}},{name:"Toxic Slash",power:17}] },
  { id:49, name:"Bogleviathan",type:"Poison", icon:"🐸☠️", baseHP:35, baseAtk:13, rarity:"rare", moves:[{name:"Sludge Wave",power:13, effect:{type:"poison",turns:2,chance:0.25}},{name:"Bog Slam",power:16}] },
  { id:50, name:"Miasmawing",  type:"Poison", icon:"🦟☠️", baseHP:29, baseAtk:16, rarity:"rare", moves:[{name:"Plague Dive",power:14, effect:{type:"poison",turns:2,chance:0.25}},{name:"Miasma Storm",power:17}] },
  // ---- Frozen Peaks-exclusive mythical: a 3-stage line that grows through
  // battle XP just like a normal critter, but is mythical-rarity at every
  // stage (extremely hard to catch, per RARITY_CATCH_MULT) and only ever
  // appears wild on the '*' tile in World 3. ----
  { id:51, name:"Silklarva",  type:"Mystic", icon:"🐛✨", baseHP:24, baseAtk:10, rarity:"mythical", moves:[{name:"Glimmer Nibble",power:9},{name:"Starlight Munch",power:12}] },
  { id:52, name:"Cocobright", type:"Mystic", icon:"🌰✨", baseHP:34, baseAtk:12, rarity:"mythical", moves:[{name:"Shell Guard",power:10},{name:"Mystic Pulse",power:13}] },
  { id:53, name:"Astromoth",  type:"Mystic", icon:"🦋✨", baseHP:52, baseAtk:24, rarity:"mythical", moves:[{name:"Starlight Wing",power:20},{name:"Astral Dust Storm",power:25}] },
  // ---- World 3 exclusives: Ashfall Peaks (Volcanic) ----
  { id:54, name:"Magmox",    type:"Fire",  icon:"🦊🌋", baseHP:30, baseAtk:13, moves:[{name:"Magma Paws",power:12},{name:"Volcanic Burst",power:15, effect:{type:"burn",turns:2,chance:0.5}}] },
  { id:55, name:"Obsidrax",  type:"Rock",  icon:"🦎🖤", baseHP:34, baseAtk:11, moves:[{name:"Obsidian Bite",power:12},{name:"Lava Scale",power:14}] },
  { id:56, name:"Scorplate", type:"Fire",  icon:"🐉🔥", baseHP:28, baseAtk:14, moves:[{name:"Fire Breath",power:13},{name:"Eruption",power:16, effect:{type:"burn",turns:2,chance:0.4}}] },
  { id:57, name:"Pyrovast",  type:"Fire",  icon:"🦁🔥", baseHP:38, baseAtk:16, rarity:"rare", moves:[{name:"Magma Roar",power:16},{name:"Inferno Charge",power:19, effect:{type:"burn",turns:3,chance:0.5}}] },
  { id:58, name:"Geodeclaw", type:"Rock",  icon:"🦀💎", baseHP:40, baseAtk:13, rarity:"rare", moves:[{name:"Crystal Crush",power:15},{name:"Geo Slam",power:18}] },
  { id:59, name:"Cragshell", type:"Rock",  icon:"🐢🪨", baseHP:42, baseAtk:14, rarity:"rare", moves:[{name:"Shell Quake",power:14},{name:"Boulder Bash",power:18}] },
  // ---- World 4 exclusives: Astral Expanse (Cosmic) ----
  { id:60, name:"Nebulyx",   type:"Cosmic", icon:"🐱🌌", baseHP:32, baseAtk:15, moves:[{name:"Nebula Claw",power:14},{name:"Star Burst",power:17}] },
  { id:61, name:"Stellark",  type:"Cosmic", icon:"🦅⭐", baseHP:30, baseAtk:16, moves:[{name:"Stellar Dive",power:15},{name:"Cosmic Ray",power:18}] },
  { id:62, name:"Voidwing",  type:"Cosmic", icon:"🦋🕳️", baseHP:34, baseAtk:14, moves:[{name:"Void Flutter",power:13},{name:"Dark Matter",power:17}] },
  { id:63, name:"Quasarion", type:"Cosmic", icon:"🦊💫", baseHP:42, baseAtk:18, rarity:"rare", moves:[{name:"Quasar Blaze",power:18},{name:"Gravity Crush",power:21}] },
  { id:64, name:"Cosmosaur", type:"Cosmic", icon:"🦕✨", baseHP:46, baseAtk:16, rarity:"rare", moves:[{name:"Starfall",power:16},{name:"Galaxy Crush",power:20}] },
  { id:65, name:"Cosmira",   type:"Cosmic", icon:"🦌🌟", baseHP:44, baseAtk:17, rarity:"rare", moves:[{name:"Cosmic Glow",power:17},{name:"Astral Storm",power:20}] },
  // ---- World 5 exclusives: Yin-Yang Realm (Mystic/Shade) ----
  { id:66, name:"Lumivane",  type:"Mystic", icon:"🌿✨", baseHP:36, baseAtk:17, moves:[{name:"Light Beam",power:16},{name:"Holy Pulse",power:19}] },
  { id:67, name:"Umbraxis",  type:"Shade",  icon:"🐺🌑", baseHP:38, baseAtk:18, moves:[{name:"Shadow Fang",power:17},{name:"Dark Howl",power:20}] },
  { id:68, name:"Harmonex",  type:"Mystic", icon:"🎵💫", baseHP:34, baseAtk:17, moves:[{name:"Harmony Wave",power:15},{name:"Sonic Light",power:19}] },
  { id:69, name:"Paradoxio", type:"Mystic", icon:"🌀✨", baseHP:46, baseAtk:20, rarity:"rare", moves:[{name:"Paradox Pulse",power:19},{name:"Reality Warp",power:23}] },
  { id:70, name:"Equilibra", type:"Shade",  icon:"⚖️🌑", baseHP:48, baseAtk:21, rarity:"rare", moves:[{name:"Balance Slash",power:20},{name:"Void Strike",power:24}] },
  { id:71, name:"Zenithral", type:"Shade",  icon:"👁️🖤", baseHP:50, baseAtk:22, rarity:"rare", moves:[{name:"Zenith Gaze",power:21},{name:"Eternal Dark",power:25}] },
  // ---- World 6 exclusive: YinYang balance critter ----
  { id:72, name:"YinYang",   type:"YinYang", icon:"☯️✨", baseHP:42, baseAtk:20, rarity:"mythical",
    yinYangBonus:1.06,
    moves:[{name:"Balance Strike",power:18},{name:"Harmony Blast",power:22}] },
  // ---- Meadowlands new critters (IDs 73-92) ----
  // Legendary (2)
  { id:91, name:"Ancientreant", type:"Grass",  icon:"🌳", baseHP:55, baseAtk:24, rarity:"legendary",
    sprite:{body:'#2d5a1e',head:'#3a7a28',shape:'tree',size:1.3,eyes:{c:'#ffd700',s:0.4},glow:{c:'rgba(100,255,100,0.3)',r:1.4}},
    moves:[{name:"Verdant Wrath",power:22},{name:"Ancient Roots",power:26,effect:{type:"poison",turns:3,chance:0.3}}] },
  { id:92, name:"Crystalphoenix", type:"Fire",  icon:"🔥", baseHP:50, baseAtk:26, rarity:"legendary",
    sprite:{body:'#ff4500',head:'#ffd700',shape:'bird',size:1.3,stripes:{c:'#ff8c00',n:3},wings:{c:'rgba(255,200,0,0.6)',s:0.8},eyes:{c:'#fff',s:0.35},glow:{c:'rgba(255,150,0,0.3)',r:1.4}},
    moves:[{name:"Prism Inferno",power:24},{name:"Ember Rebirth",power:28,effect:{type:"burn",turns:3,chance:0.5}}] },
  // Rare (6)
  { id:81, name:"Meadowlark", type:"Air", icon:"🐦", baseHP:26, baseAtk:12, rarity:"rare",
    sprite:{body:'#c9a030',head:'#8b6914',shape:'bird',size:0.9,wings:{c:'rgba(200,200,200,0.5)',s:0.6},eyes:{c:'#222',s:0.35}},
    moves:[{name:"Gust Song",power:11},{name:"Tailwind",power:14}] },
  { id:82, name:"Glowfly", type:"Mystic", icon:"✨", baseHP:24, baseAtk:13, rarity:"rare",
    sprite:{body:'#ffe066',head:'#333',shape:'round',size:0.7,wings:{c:'rgba(200,220,255,0.5)',s:0.5},eyes:{c:'#222',s:0.3},glow:{c:'rgba(255,255,100,0.4)',r:1.5}},
    moves:[{name:"Fairy Dust",power:12},{name:"Luminous Burst",power:15}] },
  { id:83, name:"Brookling", type:"Water", icon:"💧", baseHP:30, baseAtk:10, rarity:"rare",
    sprite:{body:'#4a90d9',head:'#2a6ab0',shape:'round',size:0.85,eyes:{c:'#fff',s:0.35},glow:{c:'rgba(100,180,255,0.3)',r:1.3}},
    moves:[{name:"Ripple Rush",power:10},{name:"Tidal Whip",power:13}] },
  { id:84, name:"Mossturtle", type:"Grass", icon:"🐢", baseHP:34, baseAtk:9, rarity:"rare",
    sprite:{body:'#3e8948',head:'#2a6030',shape:'diamond',size:0.9,eyes:{c:'#222',s:0.3}},
    moves:[{name:"Moss Shield",power:9},{name:"Vine Crush",power:12,effect:{type:"poison",turns:2,chance:0.03}}] },
  { id:85, name:"Foxglove", type:"Grass", icon:"🌺", baseHP:25, baseAtk:12, rarity:"rare",
    sprite:{body:'#d94f8c',head:'#2d5a1e',shape:'round',size:0.8,stripes:{c:'#ff69b4',n:5},eyes:{c:'#222',s:0.3}},
    moves:[{name:"Petal Slice",power:11},{name:"Spore Cloud",power:14,effect:{type:"poison",turns:2,chance:0.2}}] },
  { id:86, name:"Shadehopper", type:"Shade", icon:"🐇", baseHP:22, baseAtk:14, rarity:"rare",
    sprite:{body:'#2a1a3a',head:'#3a2a4a',shape:'round',size:0.75,eyes:{c:'#ff3366',s:0.35},glow:{c:'rgba(100,50,150,0.3)',r:1.3}},
    moves:[{name:"Shadow Pounce",power:13},{name:"Dusk Kick",power:16}] },
  // Common (12)
  { id:73, name:"Pollenbee", type:"Electric", icon:"🐝", baseHP:19, baseAtk:12,
    sprite:{body:'#ffd700',head:'#333',shape:'round',size:0.65,stripes:{c:'#222',n:3},wings:{c:'rgba(255,255,255,0.5)',s:0.5},eyes:{c:'#ff0000',s:0.3}},
    moves:[{name:"Static Sting",power:10},{name:"Buzz Shock",power:13}] },
  { id:74, name:"Puddlejump", type:"Water", icon:"🐸", baseHP:23, baseAtk:10,
    sprite:{body:'#3e8948',head:'#2a6030',shape:'round',size:0.7,eyes:{c:'#fff',s:0.35}},
    moves:[{name:"Splash Hop",power:10},{name:"Pond Slam",power:12}] },
  { id:75, name:"Dewdrop", type:"Water", icon:"💧", baseHP:21, baseAtk:11,
    sprite:{body:'#6cb4ee',head:'#4a90d9',shape:'round',size:0.6,eyes:{c:'#fff',s:0.3},glow:{c:'rgba(100,180,255,0.25)',r:1.2}},
    moves:[{name:"Droplet Dash",power:9},{name:"Rain Burst",power:12}] },
  { id:76, name:"Fernwhisker", type:"Grass", icon:"🐱", baseHP:24, baseAtk:11,
    sprite:{body:'#3e8948',head:'#2a6030',shape:'cat',size:0.75,eyes:{c:'#ffd700',s:0.35}},
    moves:[{name:"Leaf Swipe",power:10},{name:"Fern Whip",power:13}] },
  { id:77, name:"Mushpuff", type:"Grass", icon:"🍄", baseHP:28, baseAtk:8,
    sprite:{body:'#cc3333',head:'#fff',shape:'round',size:0.7,stripes:{c:'#fff',n:3},eyes:{c:'#222',s:0.3}},
    moves:[{name:"Spore Toss",power:8},{name:"Cap Bash",power:11}] },
  { id:78, name:"Cottontail", type:"Grass", icon:"🐰", baseHP:22, baseAtk:11,
    sprite:{body:'#fff',head:'#e8e0d0',shape:'round',size:0.7,eyes:{c:'#ff69b4',s:0.3}},
    moves:[{name:"Hop Nip",power:10},{name:"Carrot Crunch",power:12}] },
  { id:79, name:"Froggit", type:"Water", icon:"🐸", baseHP:25, baseAtk:10,
    sprite:{body:'#4a90d9',head:'#2a6ab0',shape:'round',size:0.7,eyes:{c:'#fff',s:0.35}},
    moves:[{name:"Tongue Lash",power:9},{name:"Mud Splash",power:12}] },
  { id:80, name:"Bramblepup", type:"Grass", icon:"🐕", baseHP:23, baseAtk:11,
    sprite:{body:'#6b4226',head:'#8b5a2b',shape:'cat',size:0.75,eyes:{c:'#ffd700',s:0.3},stripes:{c:'#3e8948',n:2}},
    moves:[{name:"Thorn Bite",power:10},{name:"Bramble Dash",power:13}] },
  { id:87, name:"Mosquito", type:"Poison", icon:"🦟", baseHP:18, baseAtk:13,
    sprite:{body:'#555',head:'#333',shape:'round',size:0.55,wings:{c:'rgba(200,200,200,0.4)',s:0.5},eyes:{c:'#ff0000',s:0.3}},
    moves:[{name:"Proboscis Jab",power:11},{name:"Plague Buzz",power:14,effect:{type:"poison",turns:2,chance:0.2}}] },
  { id:88, name:"Dragonfly", type:"Air", icon:"🪶", baseHP:20, baseAtk:12,
    sprite:{body:'#1e90ff',head:'#0066cc',shape:'long',size:0.7,wings:{c:'rgba(200,220,255,0.4)',s:0.6},eyes:{c:'#222',s:0.3}},
    moves:[{name:"Wing Slash",power:10},{name:"Dive Sting",power:13}] },
  { id:89, name:"Geckolet", type:"Fire", icon:"🦎", baseHP:22, baseAtk:11,
    sprite:{body:'#ff6600',head:'#cc4400',shape:'long',size:0.7,stripes:{c:'#ff8c00',n:4},eyes:{c:'#222',s:0.3}},
    moves:[{name:"Ember Dash",power:10},{name:"Flame Flick",power:13,effect:{type:"burn",turns:1,chance:0.3}}] },
  { id:90, name:"Snailbit", type:"Rock", icon:"🐌", baseHP:30, baseAtk:7,
    sprite:{body:'#8b7355',head:'#6b5340',shape:'shell',size:0.75,eyes:{c:'#222',s:0.3}},
    moves:[{name:"Shell Roll",power:8},{name:"Pebble Spit",power:11}] },

];

/* ---- 2D Sprite Drawing System ---- */
function drawCreatureSprite(ctx, cx, cy, size, sp) {
  if (!sp) return;
  var s = size * (sp.size || 1);
  ctx.save(); ctx.translate(cx, cy);
  if (sp.glow) { ctx.beginPath(); ctx.arc(0, 0, s * sp.glow.r, 0, Math.PI * 2); ctx.fillStyle = sp.glow.c; ctx.fill(); }
  if (sp.wings) { var ws = s * sp.wings.s; ctx.globalAlpha = 0.6; ctx.fillStyle = sp.wings.c;
    ctx.beginPath(); ctx.ellipse(-s*0.7, -s*0.3, ws*0.7, ws*0.4, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s*0.7, -s*0.3, ws*0.7, ws*0.4, 0.3, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.fillStyle = sp.body;
  if (sp.shape === "round") { ctx.beginPath(); ctx.arc(0, s*0.15, s*0.55, 0, Math.PI*2); ctx.fill(); }
  else if (sp.shape === "cat") { ctx.beginPath(); ctx.ellipse(0, s*0.1, s*0.45, s*0.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s*0.25,-s*0.35); ctx.lineTo(-s*0.4,-s*0.7); ctx.lineTo(-s*0.05,-s*0.45); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s*0.25,-s*0.35); ctx.lineTo(s*0.4,-s*0.7); ctx.lineTo(s*0.05,-s*0.45); ctx.fill(); }
  else if (sp.shape === "bird") { ctx.beginPath(); ctx.ellipse(0, s*0.1, s*0.4, s*0.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = sp.head; ctx.beginPath(); ctx.arc(0,-s*0.4,s*0.25,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ff8c00"; ctx.beginPath(); ctx.moveTo(s*0.15,-s*0.45); ctx.lineTo(s*0.4,-s*0.42); ctx.lineTo(s*0.15,-s*0.35); ctx.fill(); }
  else if (sp.shape === "long") { ctx.beginPath(); ctx.ellipse(0, 0, s*0.35, s*0.65, 0, 0, Math.PI*2); ctx.fill(); }
  else if (sp.shape === "diamond") { ctx.beginPath(); ctx.moveTo(0,-s*0.55); ctx.lineTo(s*0.45,0); ctx.lineTo(0,s*0.55); ctx.lineTo(-s*0.45,0); ctx.closePath(); ctx.fill(); }
  else if (sp.shape === "shell") { ctx.beginPath(); ctx.ellipse(-s*0.1,s*0.1,s*0.45,s*0.4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = sp.head; ctx.beginPath(); ctx.arc(s*0.3,-s*0.1,s*0.22,0,Math.PI*2); ctx.fill(); }
  else if (sp.shape === "tree") { ctx.fillStyle = "#5a3a1a"; ctx.fillRect(-s*0.1,-s*0.1,s*0.2,s*0.7);
    ctx.fillStyle = sp.body; ctx.beginPath(); ctx.arc(0,-s*0.3,s*0.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = sp.head; ctx.beginPath(); ctx.arc(-s*0.2,-s*0.5,s*0.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s*0.25,-s*0.4,s*0.18,0,Math.PI*2); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, 0, s*0.5, 0, Math.PI*2); ctx.fill(); }
  if (sp.stripes) { ctx.fillStyle = sp.stripes.c; for (var i=0;i<sp.stripes.n;i++) {
    var sy = -s*0.3+(i*s*0.6/sp.stripes.n); ctx.fillRect(-s*0.3,sy,s*0.6,s*0.06); } }
  if (!sp.eyes && sp.shape !== "tree") { ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-s*0.15,-s*0.1,s*0.1,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s*0.15,-s*0.1,s*0.1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-s*0.13,-s*0.1,s*0.05,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s*0.17,-s*0.1,s*0.05,0,Math.PI*2); ctx.fill(); }
  else if (sp.eyes && sp.shape !== "tree") { var es = sp.eyes.s; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-s*0.15,-s*0.15,es*s,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s*0.15,-s*0.15,es*s,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = sp.eyes.c; ctx.beginPath(); ctx.arc(-s*0.13,-s*0.15,es*s*0.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s*0.17,-s*0.15,es*s*0.5,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
}
/* Tile legend: '#'=wall '.'=path ','=grass 'f'=forest '~'=water/lava
   'c'=cave 'H'=heal 'S'=shop 'P'=portal */
const WORLDS = [
  { // ---------- WORLD 0: MEADOWLANDS (24x16) ----------
    name: "🌿 Meadowlands",
    // The starting meadow is a SAFE ZONE: no wild encounters, a visible shield
    // ring around the player, and a 🏡 SAFE tag in the HUD. The Sunflower &
    // Hidden Glade segment (segment 1) is NOT safe — critters lurk there.
    safe: true,
    map: [
      "########################",
      "#..,,,...#.....~~~~....#",
      "#..,,,...#.....~~~~....#",
      "#**......#......~~.....#",
      "#..,,,.................#",
      "#..,,,...H...S.........#",
      "#........######....,,..",
      "#ff......#cccc#....,,,.",
      "#fff.....#cccc#.........",
      "#fff.....#ccc.#.........",
      "#ffff.....##..#....,,...",
      "#ffff......#..#....,,...",
      "#fff.......#..#.........",
      "#ff....................#",
      "#.....................,#", // NOTE: no P here — the 🌀 portal to Ember Depths lives in the LAST segment only
      "########################",
    ],
    colors: { "#":"#2e4d2e", ".":"#c9b47c", ",":"#3e8948", "f":"#1f5c2d", "~":"#3a6ec9", "c":"#5a5560", "H":"#c9b47c", "S":"#c9b47c", "P":"#7b3fd4", "*":"#ffff00" },
    deco:   { "#":"🌲", ",":"𓆸", "f":"🌳", "~":"≈", "H":"⛺", "S":"🏪", "P":"🌀", "*":"✨" },
    encounters: {
      ",": { chance:0.15, pool:[2,3,5,17,22,25],   nightPool:[7,24,25,6,17],   lvl:[2,5] },
      "f": { chance:0.17, pool:[13,14,15,7,23,26], nightPool:[7,26,27,24,6],   lvl:[3,6] }, // deep forest
      "~": { chance:0.12, pool:[1,10,11,12],       lvl:[3,6] },
      "c": { chance:0.18, pool:[4,0,16,19,24,26],  nightPool:[26,27,7,24,19],  lvl:[5,8] },
      "*": { chance:0.01, pool:[41,42,43],         lvl:[20,30] },
    },
    trainers: [
      { id:0, name:"Rex",  x:4,  y:8,  team:[[2,4],[10,5]],       quote:"My critters love a scrap!" },
      { id:1, name:"Ivy",  x:17, y:4,  team:[[3,5],[22,5],[5,6]], quote:"Feel the storm!" },
      { id:2, name:"Cole", x:20, y:12, team:[[4,7],[0,7],[6,8]],  quote:"Only the strong pass me." },
      { id:200, name:"Blaze", x:12, y:10, team:[[8,6],[9,6]], quote:"I'm gonna be the best critter master!", storyOnMeet:"rivalMeet" },
    ],
    healSpot: { x:9, y:5 },
    // Each world can have any number of portal tiles. `tile` is the map
    // character that triggers it, `dest` is where stepping through leads,
    // and `requires` is the list of trainer ids that must be in
    // state.defeated before it will let you through (empty = always open).
    portals: [
      { tile:"P", dest:{ world:1, x:2, y:14 }, requires:[0, 1, 2] }, // 🌀 sealed until Rex, Ivy and Cole are all beaten
      { tile:"G", dest:{ world:6, x:2, y:14 }, requires:[] },        // 🏡 always-open side gate to Harmony Hollow town
    ],
    battleBg: "",
    segments: [
      // Segment 0: Meadow - reference to top-level data (null = use parent)
      null,
      // Segment 1: Sunflower Fields + Hidden Glade (formerly 2 segments)
      {
        name: "\u{1F33B} Sunflower & Hidden Glade",
        map: [
          "########################",
          "#,,,,,,...........,,,,,#",
          "#,,,,,,.gg..gg....,,,,,#",
          "#,,......gg..gg......,,#",
          "#........gg..gg.....,,,#",
          "#...H....gg..gg...S..,,#",
          ".gggg.........gggg..,,.",
          ".gggg..,,,,,..gggg.....",
          ".gg....,,,,,...gg......",
          ".gg.............gg.....",
          ".gggg..,,,,,..gggg.....",
          ".gggg..,,,,,..gggg.....",
          ".gg..............gg....",
          "#..ff..gg..gg..ff......#",
          "#PGf....****.....f.....#", // P = 🌀 to Ember Depths · G = 🏡 gate to Harmony Hollow (both in this LAST segment only)
          "########################",
        ],
        // Hidden Glade was folded into this segment (v2.4.4): one southern
        // grove now holds the ✨ mythical patch, and the 🌀 P portal to Ember
        // Depths lives HERE — the LAST segment of the Meadowlands, never in
        // segment 0 (v2.4.5 removed the stray P from the Meadow map).
        colors: {"#":"#2e4d2e",".":"#c9b47c",",":"#3e8948","f":"#1f5c2d","~":"#3a6ec9","c":"#5a5560","H":"#c9b47c","S":"#c9b47c","P":"#7b3fd4","*":"#ffff00","g":"#e8c840","G":"#58dc78"},
        deco:   {"#":"\u{1F332}","\u{1F338}":"\u{1F338}","f":"\u{1F333}","~":"\u2248","H":"\u26FA","S":"\u{1F3EA}","P":"\u{1F300}","*":"\u2728","g":"\u{1F33B}","G":"\u{1F3E1}"},
        encounters: {
          ",": { chance:0.14, pool:[2,3,5,73,78,80,14,22], nightPool:[7,24,86,25,17], lvl:[5,8] },
          "g": { chance:0.13, pool:[73,78,13,81,82,23], nightPool:[82,86,24], lvl:[6,10] },
          "f": { chance:0.15, pool:[76,80,14,15,85,86,7], nightPool:[7,26,86,24], lvl:[8,12] },
          "c": { chance:0.14, pool:[90,4,19,24,26], nightPool:[26,27,87], lvl:[9,13] },
          "*": { chance:0.02, nightChance:0.03, pool:[91,92,41,42,43], lvl:[15,25] },
        },
        trainers: [
          { id:100, name:"Lily",   x:10, y:8,  team:[[78,6],[13,7]],       quote:"The sunflowers guide my path!" },
          { id:101, name:"Clover", x:6,  y:12, team:[[80,7],[76,8],[73,7]], quote:"Lucky four-leaf, ready to fight!" },
          { id:102, name:"Sage",   x:18, y:10, team:[[14,8],[81,9],[22,8]], quote:"Wisdom comes from the fields." },
          { id:103, name:"Bramble",    x:7,  y:14, team:[[80,10],[14,11]],         quote:"The thorns will stop you!" },
          { id:104, name:"Elder Root", x:14, y:13, team:[[76,12],[85,13],[86,11]], quote:"The forest remembers all." },
        ],
        healSpot: { x:4, y:5 },
        shopItems: ["orb","greatorb","ultraorb","masterorb","legendorb","potion","bigpotion","antidote","awakening","candy","supercandy","megacandy"],
      },
    ],
  },
  { // ---------- WORLD 1: EMBER DEPTHS (24x16, much harder) ----------
    name: "🌋 Ember Depths",
    map: [
      "########################",
      "#~~#~~#.............cc.#",
      "#~~#~~#.............cc.#",
      "#~~#...................#",
      "#......................#",
      "#........H....S.......#",
      "#.....c...########.....#",
      "#.....c...#cccccc#.....#",
      "#.........cc....#.....#",
      "#.........cc.c..#.....#",
      "#.........########......",
      "#.......................",
      "#..,,..........,,....*..",
      "#..,,..............c....",
      "#P.....................#", // 🌀 P gate home to the Meadowlands — sits beside where you arrive from the Meadowlands so the ride back is obvious (v2.4.5)
      "########################",
    ],
    // The P gate-home tile lives on the main map (row 14, far left — beside
    // where you arrive from the Meadowlands, so the ride back is obvious).
    // The Q gate to Frozen Peaks sits in the LAST segment (Obsidian Hollow
    // below). Rows 10-13 have an open right edge — walk off it to enter
    // Obsidian Hollow.
    colors: { "#":"#3a2a2a", ".":"#6b5344", ",":"#8a5a2a", "~":"#c94a1e", "c":"#454050", "H":"#6b5344", "S":"#6b5344", "P":"#7b3fd4", "Q":"#4fd7ff", "*":"#ff00ff" },
    deco:   { "#":"🪨", ",":"🍂", "~":"🔥", "c":"🖤", "H":"⛺", "S":"🏪", "P":"🌀", "Q":"🌀", "*":"💥" },
    encounters: {
      "~": { chance:0.14, pool:[0,8,9,20],                     lvl:[12,16] },
      ",": { chance:0.16, pool:[8,9,14,23,27,28,29,30],        nightPool:[27,28,29,30,26], lvl:[10,14] },
      "c": { chance:0.18, pool:[4,16,19,24,26,27,28,31,32,33], nightPool:[31,32,33,26,27], lvl:[12,17] },
      "*": { chance:0.01, pool:[41,42,43],                     lvl:[25,35] },
    },
    trainers: [
      { id:3, name:"Nova",   x:3,  y:10, team:[[9,11],[16,12]],                  quote:"Things get hot down here!" },
      { id:4, name:"Drake",  x:19, y:3,  team:[[19,13],[8,14],[26,15]],          quote:"The Depths bow to me." },
      { id:6, name:"Pyra",   x:4,  y:3,  team:[[0,12],[8,13]],                   quote:"Everything burns eventually." },
      { id:8, name:"Vex",    x:15, y:11, team:[[16,13],[3,14],[18,15]],          quote:"Feel the current course through you!" },
      { id:201, name:"Blaze", x:10, y:8, team:[[9,14],[38,15]], quote:"My critters have evolved — round two!", storyOnMeet:"rivalMeet2" },
    ],
    healSpot: { x:9, y:5 },
    // Portal DEFINITIONS are world-level — the P tile (row 14, far left of the
    // main area) leads home to the Meadowlands, and the Q *tile* sits in
    // Obsidian Hollow (segment 1, the LAST segment). Sealed until EVERY
    // trainer in BOTH Meadowlands (world 1) and Ember Depths (world 2) has
    // been defeated — 3 + 7 = all 10.
    portals: [
      { tile:"P", dest:{ world:0, x:20, y:14 }, requires:[] }, // 🌀 going home is always allowed
      { tile:"Q", dest:{ world:2, x:9, y:4 }, requires:[0,1,2,3,4,5,6,7,8,9],
        sealedMsg:"🌀 The frozen gate is sealed! Defeat every trainer in the Meadowlands AND Ember Depths first" },
    ],
    battleBg: "emberBg",
    segments: [
      // Segment 0: Ember Depths proper (null = use the world data above)
      null,
      // Segment 1: Obsidian Hollow — the deep vault holding the frozen gate.
      // Entered by walking off the RIGHT edge of segment 0.
      {
        name: "🌑 Obsidian Hollow",
        map: [
          "########################",
          "#..~~..............~~..#",
          "#..~~....,,,,,.....~~..#",
          "#.....,,,,,,,,,,.......#",
          "#..H...,,,,,,,,,....S..#",
          "#.....,,,,,,,,,,,......#",
          "#..,,....######....,...#",
          "#..,,...##c**c##....,,.#",
          "#.......##cccc##....,,.#",
          "#..,,....##..##......,.#",
          ".......................#",
          "...,,..........,,....*.#",
          "...,,..............c...#",
          "....,,.....cc....,,,..P#",
          "#Q.....................#", // 🌀 Q gate home to the Meadowlands (moved here from segment 0)
          "########################",
        ],
        // A sealed ✨ den (enter through the gap in its south wall), the frozen
        // gate 🌀 guarded by champion Magnus, and the 🌀 Q gate home. The LEFT
        // edge is open on rows 10-13 — walk off it to return to Ember Depths.
        colors: { "#":"#141018", ".":"#2b2333", ",":"#3a2f47", "~":"#ff5a1e", "c":"#0d0b12", "H":"#2b2333", "S":"#2b2333", "P":"#7b3fd4", "Q":"#4fd7ff", "*":"#ff00ff" },
        deco:   { "#":"🌑", ".":"🕯️", ",":"🍂", "~":"🔥", "c":"🖤", "H":"⛺", "S":"🏪", "P":"🌀", "Q":"🌀", "*":"💥" },
        encounters: {
          "~": { chance:0.14, pool:[0,8,9,20],                     lvl:[12,16] },
          ",": { chance:0.16, pool:[8,9,14,23,27,28,29,30],        nightPool:[27,28,29,30,26], lvl:[11,15] },
          "c": { chance:0.18, pool:[4,16,19,24,26,27,28,31,32,33], nightPool:[31,32,33,26,27], lvl:[13,17] },
          "*": { chance:0.01, pool:[41,42,43],                     lvl:[25,35] },
        },
        trainers: [
          { id:7, name:"Onyx",   x:5,  y:12, team:[[20,13],[19,14]],                 quote:"Hard as stone, twice as mean." },
          { id:5, name:"Sable",  x:9,  y:12, team:[[28,13],[26,14],[27,15]],         quote:"The shadows fight for me." },
          { id:9, name:"Magnus", x:14, y:13, team:[[31,15],[20,15],[24,16],[26,17]], quote:"I am the champion of the Depths!" },
        ],
        healSpot: { x:3, y:4 },
        // Portal tiles on THIS last-segment map: 'Q' (row 13, far right) is
        // the frozen gate to Frozen Peaks — the same side you enter from, so
        // walking straight through the entrance portal takes you onward (the
        // v2.4.5 fix: the entrance used to be the gate HOME, dumping players
        // back in the Meadowlands). The gate home to the Meadowlands now also
        // lives on the main Ember Depths map (v2.4.5), so you never have to
        // cross the Hollow just to go back.
      },
    ],
  },
    { // ---------- WORLD 2: FROZEN PEAKS (UNLOCKABLE) ----------
      name: "❄️ Frozen Peaks",
      map: [
        "########################",
        "#~~~#.........,,....cc.#",
        "#~~~#.........,,....cc.#",
        "#~~~.....H....,,......#",
        "#............,,......S#",
        "#....c..~~~~~~~~~~....#",
        "#....c..~~~~~~~~~~....#",
        "#......~~~~~~~~~~.....#",
        "#......~~~~~~~~~~.....#",
        "#..........,,,........#",
        "#......................#",
        "#..,,,,............,,.#",
        "#..,,,,............,,.#",
        "#......................#",
        "#P....................Q#",
        "########################",
      ],
      colors: { "#":"#2a2a3a", ".":"#e0e6f0", "~":"#a8d0e6", ",":"#d0dce8", "c":"#5a5560", "H":"#e0e6f0", "S":"#e0e6f0", "P":"#7b3fd4", "Q":"#7b3fd4", "*":"#c48dff" },
      deco:   { "#":"🧊", ".":"❄️", "~":"≈", ",":"❄️", "c":"🪨", "H":"⛺", "S":"🏪", "P":"🌀", "Q":"🌀", "*":"✨" },
      encounters: {
        ",": { chance:0.12, pool:[31,32,33,34,35,36,37], nightPool:[31,32,33], lvl:[15,22] },
        "~": { chance:0.14, pool:[34,35,36,37,1,10,11], nightPool:[31,32,33], lvl:[18,24] },
        "c": { chance:0.15, pool:[34,35,36,37,28,29,30], nightPool:[31,32,33,34,35], lvl:[18,24] },
        // Frozen Peaks-exclusive mythical — only ever found on this tile, as
        // its young Lv1-10 Silklarva stage. Train it up and it'll grow into
        // Cocobright, then eventually Astromoth, on its own through XP.
        // Being a moth, it's drawn out more at night.
        "*": { chance:0.01, nightChance:0.03, pool:[51], lvl:[5,10] },
      },
      trainers: [
        { id:10, name:"Glacia", x:5, y:10, team:[[34,18],[35,20]], quote:"Feel the chill of eternity!" },
        { id:11, name:"Boreal", x:18, y:3, team:[[36,22],[37,24]], quote:"Ice shapes all destinies." },
        { id:12, name:"Crystal", x:13, y:12, team:[[34,20],[35,22],[36,18]], quote:"Only the pure of heart may pass." },
        { id:202, name:"Blaze", x:8, y:6, team:[[38,22],[39,23]], quote:"I trained with Ice masters — this time I win!", storyOnMeet:"rivalMeet3" },
      ],
      healSpot: { x:9, y:3 },
      // v2.4.5 — Frozen Peaks arrivals now land on the grass beside the heal
      // tent (⛺ at 9,3). The old arrival square (2,1) was a dead pocket walled
      // in by lake, so players stepped out of the gate and immediately got
      // funneled into the 🌀 P "gate home" behind them — looking like the
      // portal to Frozen Peaks had dumped them back in the Meadowlands.
      portals: [
        { tile:"P", dest:{ world:1, x:2, y:14 }, requires:[] },
        { tile:"Q", dest:{ world:3, x:2, y:14 }, requires:[0,1,2,3,4,5,6,7,8,9,10,11,12],
          sealedMsg:"🌀 The volcanic gate is sealed! Defeat every trainer in the Meadowlands, Ember Depths, and Frozen Peaks first" },
      ],
      battleBg: "",
    },
    { // ---------- WORLD 3: ASHFALL PEAKS (VOLCANIC) ----------
      name: "🌋 Ashfall Peaks",
      map: [
        "########################",
        "#cc....~~~~...cc..,,...#",
        "#cc....~~~~...cc..,,...#",
        "#.....~~~~.............#",
        "#..,,.....,,..cc..,,...#",
        "#..,,.H....,,.cc..,,...#",
        "#..,,.S........,,......#",
        "#.....########.........#",
        "#.....#cccccc#.........#",
        "#.....#cccccc#.........#",
        "#.....#.cccc.#.........#",
        "#.....########..,,.....#",
        "#...................,,*#",
        "#..~~~~............,,.Q#",
        "#P..~~~~...............#",
        "########################",
      ],
      colors: { "#":"#2a2a2a", ".":"#8a8a7a", ",":"#5a5a4a", "~":"#ff3300", "c":"#1a1a1a", "H":"#8a8a7a", "S":"#8a8a7a", "P":"#7b3fd4", "Q":"#7b3fd4", "*":"#ff6600" },
      deco:   { "#":"🌫️", ",":"🪨", "~":"🔥", "c":"🖤", "H":"⛺", "S":"🏪", "P":"🌀", "Q":"🌀", "*":"💥" },
      encounters: {
        ",": { chance:0.16, pool:[54,55,56], nightPool:[55,56,26,27], lvl:[30,35] },
        "~": { chance:0.13, pool:[54,56,0,8,9], lvl:[30,36] },
        "c": { chance:0.17, pool:[55,58,59,4,19], nightPool:[55,58,59,26,27], lvl:[32,38] },
        "*": { chance:0.01, pool:[41,42,43], lvl:[35,45] },
      },
      trainers: [
        { id:13, name:"Ember",   x:5,  y:10, team:[[54,28],[56,30]],                        quote:"Feel the heat of the peaks!" },
        { id:14, name:"Obsidian",x:18, y:5,  team:[[55,30],[59,32]],                        quote:"Hard as the mountain itself." },
        { id:15, name:"Cindra",  x:12, y:13, team:[[54,32],[56,33],[58,30]],                quote:"Ashes to ashes..." },
        { id:16, name:"Magmus",  x:20, y:12, team:[[57,35],[59,36],[58,33],[55,32]],       quote:"I am the volcanic lord!" },
        { id:210, name:"Eclipse Grunt", x:17, y:8, team:[[56,30],[54,31]], quote:"Team Eclipse will capture all mythicals!", storyOnMeet:"villainMeet" }, // reachable open ground — (10,8) was inside the sealed cave
      ],
      healSpot: { x:6, y:5 },
      portals: [
        { tile:"P", dest:{ world:2, x:2, y:14 }, requires:[] }, // 🌀 back to Frozen Peaks, always allowed
        { tile:"Q", dest:{ world:4, x:2, y:14 }, requires:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
          sealedMsg:"🌀 The cosmic gate is sealed! Defeat every trainer in all previous worlds first" },
      ],
      battleBg: "ashfallBg",
    },
    { // ---------- WORLD 4: ASTRAL EXPANSE (COSMIC) ----------
      name: "🌌 Astral Expanse",
      map: [
        "########################",
        "#cc..............cc....#",
        "#cc..............cc....#",
        "#......................#",
        "#......................#",
        "#..........H...S.......#",
        "#........########......#",
        "#........#~~~~~~#......#",
        "#........#~~~~~~#......#",
        "#........#~....~#......#",
        "#........########......#",
        "#......................#",
        "#....................*.#",
        "#...................,,Q#",
        "#P.....................#",
        "########################",
      ],
      colors: { "#":"#0a0a2a", ".":"#2a2a5a", "~":"#6a3aaa", "c":"#4a4a8a", "H":"#2a2a5a", "S":"#2a2a5a", "P":"#7b3fd4", "Q":"#7b3fd4", ",":"#1a1a3a", "*":"#ffff00" },
      deco:   { "#":"🌌", ".":"✨", "~":"🪐", "c":"💎", "H":"⛺", "S":"🏪", "P":"🌀", "Q":"🌀", ",":"🌑", "*":"💥" },
      encounters: {
        "~": { chance:0.16, pool:[60,61,62], nightPool:[60,62,61,24,25], lvl:[35,40] },
        "c": { chance:0.17, pool:[60,61,62], lvl:[36,42] },
        ",": { chance:0.13, pool:[61,62,60], nightPool:[60,61,62,7,26], lvl:[34,40] },
        "*": { chance:0.01, pool:[41,42,43], lvl:[40,50] },
      },
      trainers: [
        { id:17, name:"Stella",   x:4,  y:10, team:[[60,35],[61,37]],                       quote:"The stars guide my way." },
        { id:18, name:"Cosmo",    x:18, y:6,  team:[[62,37],[63,38]],                       quote:"I've seen the edge of space." },
        { id:19, name:"Astrid",   x:12, y:13, team:[[60,39],[62,40],[61,37]],               quote:"A supernova awaits!" },
        { id:20, name:"Galaxius", x:20, y:12, team:[[63,42],[64,43],[65,40],[62,39]],       quote:"I am the cosmic sovereign!" },
        { id:211, name:"Commander Nyx", x:10, y:8, team:[[63,40],[64,41],[62,42]], quote:"Feel the power of the Eclipse!", storyOnMeet:"villainCommander" },
      ],
      healSpot: { x:10, y:5 },
      portals: [
        { tile:"P", dest:{ world:3, x:2, y:14 }, requires:[] }, // 🌀 back to Ashfall Peaks, always allowed
        { tile:"Q", dest:{ world:5, x:2, y:14 }, requires:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
          sealedMsg:"🌀 The balance gate is sealed! Defeat every trainer in all previous worlds first" },
      ],
      battleBg: "astralBg",
    },
    { // ---------- WORLD 5: YIN-YANG REALM (FINAL) ----------
      name: "⚫⚪ Yin-Yang Realm",
      map: [
        "########################",
        "#,,,,,...,,............#",
        "#,,,,,..,,.............#",
        "#,,,,,,.,,.............#",
        "#,,,,,,,.,.............#",
        "#,,,,,,H.,..S..........#",
        "#,,,,,,,,..............#",
        "#,,,,,,,,,.............#",
        "#,,,,,,,,..............#",
        "#,,,,,,,...............#",
        "#,,,,,,................#",
        "#,,,,.................,#",
        "#,,,.................*#",
        "#,,....................#",
        "#P.....................#",
        "########################",
      ],
      colors: { "#":"#1a1a1a", ".":"#e8e8f0", ",":"#2a2a3a", "H":"#808090", "S":"#808090", "P":"#7b3fd4", "Q":"#7b3fd4", "*":"#ff00ff" },
      deco:   { "#":"☯️", ".":"✨", ",":"🌑", "H":"⛺", "S":"🏪", "P":"🌀", "Q":"🌀", "*":"💥" },
      encounters: {
        // Yin-Yang Realm: light (Mystic) critters roam by day, dark (Shade)
        // critters take over at night — the pools never mix. The mythical
        // YinYang (☯️, id 72) embodies both sides, so it can appear at any hour.
        ",": { chance:0.16, pool:[66,68,24],        nightPool:[67,26,27],        lvl:[40,45] },
        "~": { chance:0.15, pool:[66,68,69],       nightPool:[67,70,71],       lvl:[40,48] },
        "*": { chance:0.08, nightChance:0.10, pool:[72,66,68,69], nightPool:[72,67,70,71], lvl:[45,55] },
      },
      trainers: [
        { id:21, name:"Lumina",   x:6,  y:7,  team:[[66,138],[67,140]],                     quote:"Light always prevails." },
        { id:22, name:"Erebos",   x:17, y:8,  team:[[68,140],[69,142]],                     quote:"Darkness is inevitable." },
        { id:23, name:"Karma",    x:10, y:12, team:[[66,142],[68,144],[67,140]],             quote:"Balance is everything." },
        { id:24, name:"Duality",  x:14, y:5,  team:[[70,144],[71,146]],                      quote:"Two sides, one coin." },
        { id:25, name:"Zenithral",x:11, y:13, team:[[70,148],[71,150],[66,146],[68,148]],    quote:"I am the Yin-Yang master!" },
        { id:203, name:"Blaze",   x:5,  y:13, team:[[38,45],[39,46],[69,48]],               quote:"Final round — I won't lose!", storyOnMeet:"rivalFinal" },
        { id:212, name:"Obsidian", x:18, y:13, team:[[70,50],[71,52],[69,48],[72,55]],      quote:"I am the Eclipse Leader!", storyOnMeet:"villainLeader" },
      ],
      healSpot: { x:9, y:5 },
      portals: [
        { tile:"P", dest:{ world:4, x:2, y:14 }, requires:[] }, // 🌀 back to Astral Expanse, always allowed
      ],
      battleBg: "yinyangBg",
    },
    { // ---------- WORLD 6: HARMONY HOLLOW (SAFE QUEST TOWN) ----------
      // A cozy little 2D town, reachable from the 🏡 gate in the Sunflower &
      // Hidden Glade. Entirely SAFE: no wild encounters, no wild trainers.
      // Money comes from the quest board 📋 and townsfolk with ❗ over their
      // heads — walk into them to chat, accept and turn in sidequests.
      name: "🏡 Harmony Hollow",
      safe: true,
      map: [
        "########################",
        "#..........HH..........#",
        "#....HH...HHHH....HH...#",
        "#....HH....HH.....HH...#",
        "#......................#",
        "#..HH..,........,..HH..#",
        "#..HH...,,....,,...HH..#",
        "#........,....,........#",
        "#......,........,......#",
        "#........,..R.,........#", // 📜 R = quest board — stand on it and press E to read all sidequests
        "#..HH....,....,....HH..#",
        "#..HH.....,,,,.....HH..#",
        "#......................#",
        "#......HH......HH......#",
        "#......HH..B...HH......#",
        "#P.....................#",
        "########################",
      ],
      colors: { "#":"#3a3a2a", ".":"#d9c89e", ",":"#7aa05a", "H":"#8a5a3a", "T":"#c9b47c", "B":"#5a8ac9", "P":"#7b3fd4", "Q":"#7b3fd4", "R":"#c9b47c" },
      deco:   { "#":"🌳", ".":"·", ",":"🌷", "H":"🏠", "T":"🏪", "B":"⛺", "P":"🌀", "Q":"🌀", "R":"📜" },
      safeTiles: ["T", "B", "R"], // belt-and-braces: town is fully safe anyway
      encounters: {}, // no wild critters in town
      trainers: [],   // nobody here wants to battle — townsfolk are quest NPCs
      healSpot: { x:11, y:14 },
      portals: [
        // 🌀 gate home — seg:1 lands you in the Sunflower & Hidden Glade
        // segment at (3,14), one step right of the gate tile (there's no gate
        // in segment 0).
        { tile:"P", dest:{ world:0, x:3, y:14, seg:1 }, requires:[] },
      ],
      battleBg: "",
      // Townsfolk — no battles, just flavor and (for the ❗ trio) paid quests.
      npcs: [
        { name:"Milo",          x:7,  y:4,  line:"The flowers sure are pretty today!", quest:true },
        { name:"Professor Fern", x:16, y:7,  line:"Science waits for no one!", quest:true },
        { name:"Granny Rose",    x:5,  y:10, line:"Back in my day, critters respected their elders.", quest:true },
        { name:"Tilly",         x:12, y:4,  line:"Welcome to Harmony Hollow — the safest town in all the lands!" },
        { name:"Finn",          x:18, y:11, line:"I'm training to be a critter chef. Critters hate that.", quest:false },
      ],
    }
  ];

const TILE = 60, MAP_W = 24, MAP_H = 16;

// Normalize every map (each world AND each segment) to exactly MAP_W columns.
// Several hand-written maps have ragged rows (23 chars instead of 24), which
// used to create invisible "void" columns that rendered black and behaved as
// walkable. Short rows are padded with their own last tile — that keeps the
// intentionally OPEN edge rows (the walk-off-the-map segment exits) open,
// while wall-bordered rows stay sealed. Overlong rows are trimmed.
(function normalizeMaps() {
  const fixRow = r => {
    let row = r;
    if (row.length < MAP_W) {
      const pad = row.charAt(row.length - 1) || "#";
      row = row + pad.repeat(MAP_W - row.length);
    } else if (row.length > MAP_W) {
      const endsWall = row.endsWith("#");
      row = row.slice(0, MAP_W);
      if (endsWall) row = row.slice(0, MAP_W - 1) + "#"; // keep sealed borders sealed
    }
    return row;
  };
  const fixMap = m => m.map(fixRow);
  for (const w of WORLDS) {
    w.map = fixMap(w.map);
    if (w.segments) for (const s of w.segments) if (s && s.map) s.map = fixMap(s.map);
  }
})();

// Day/night cycle: driven by steps taken (not the system clock), so it's a
// visible, testable in-game cycle rather than tied to real-world time.
const DAY_NIGHT_STEPS = 160; // steps per half-cycle (one full day+night = 320 steps)
function isNight() { return Math.floor((state.steps || 0) / DAY_NIGHT_STEPS) % 2 === 1; }

// ---- Weather system ----
// Weather changes every WEATHER_STEPS steps. Each world has its own set of
// possible weather types, and weather affects encounter rates.
const WEATHER_STEPS = 50;
const WEATHER_TYPES = {
  sunny:  { icon: "☀️", name: "Sunny",  encMult: { ",": 1.0, "f": 1.0, "~": 0.8, "c": 1.0, "*": 1.0 } },
  rainy:  { icon: "🌧️", name: "Rainy",  encMult: { ",": 0.9, "f": 1.1, "~": 1.4, "c": 1.2, "*": 1.0 } },
  stormy: { icon: "⛈️", name: "Stormy", encMult: { ",": 0.7, "f": 0.8, "~": 1.6, "c": 1.3, "*": 1.2 } },
  snowy:  { icon: "❄️", name: "Snowy",  encMult: { ",": 0.8, "f": 0.9, "~": 1.1, "c": 1.0, "*": 1.3 } },
  windy:  { icon: "💨", name: "Windy",  encMult: { ",": 1.2, "f": 1.3, "~": 0.9, "c": 0.8, "*": 1.0 } },
  foggy:  { icon: "🌫️", name: "Foggy",  encMult: { ",": 1.1, "f": 1.4, "~": 1.0, "c": 1.1, "*": 1.5 } },
  clear:  { icon: "🌙", name: "Clear Night", encMult: { ",": 1.0, "f": 1.0, "~": 1.0, "c": 1.0, "*": 1.4 } },
};
// Which weather can occur in each world (indices into WORLDS)
const WORLD_WEATHER = [
  ["sunny", "rainy", "windy", "foggy"],         // 0: Meadowlands
  ["sunny", "stormy", "clear"],                   // 1: Ember Depths
  ["snowy", "windy", "clear"],                    // 2: Frozen Peaks
  ["foggy", "stormy", "sunny"],                   // 3: Ashfall Peaks
  ["clear", "foggy", "sunny"],                    // 4: Astral Expanse
  ["foggy", "clear", "stormy"],                   // 5: Yin-Yang Realm
];
function getWeather() {
  if (!state.weather) state.weather = "sunny";
  return state.weather;
}
function getWeatherInfo() { return WEATHER_TYPES[getWeather()] || WEATHER_TYPES.sunny; }
function tickWeather() {
  var weatherIdx = Math.floor((state.steps || 0) / WEATHER_STEPS);
  if (state.lastWeatherIdx !== weatherIdx) {
    state.lastWeatherIdx = weatherIdx;
    var pool = WORLD_WEATHER[state.world] || WORLD_WEATHER[0];
    // Use a seeded pick based on weatherIdx so it's deterministic per step window
    state.weather = pool[weatherIdx % pool.length];
    var wInfo = getWeatherInfo();
    if (state.steps > 0) hudMsg(wInfo.icon + " The weather shifted to " + wInfo.name + "!");
  }
}
function weatherEncMult(tile) {
  var wInfo = getWeatherInfo();
  return (wInfo.encMult && wInfo.encMult[tile] !== undefined) ? wInfo.encMult[tile] : 1.0;
}

// Catch orbs — each tier is 40% better than the one before it.
// (Also drives the shop listing, the HUD, and the catch-attempt logic below.)
const ORB_TIERS = [
  { key:"orb",       label:"🟠 Critter Orb", price:25,  mult:1,     cures:false },
  { key:"greatorb",  label:"🟡 Great Orb",   price:75,  mult:1.4,   cures:false },
  { key:"ultraorb",  label:"🔴 Ultra Orb",   price:150, mult:1.96,  cures:true  },
  { key:"masterorb", label:"🟣 Master Orb",  price:280, mult:2.744, cures:true  },
  { key:"legendorb", label:"⚪ Legend Orb",  price:480, mult:3.8416,cures:true  },
];
function orbDesc(i) {
  if (i === 0) return "Needed to throw a catch attempt";
  const prevName = ORB_TIERS[i-1].label.replace(/^\S+\s/, "");
  const article = /^[AEIOU]/.test(prevName) ? "an" : "a";
  const base = `40% better catch rate than ${article} ${prevName}`;
  return ORB_TIERS[i].cures ? base + " + cures status" : base;
}

// Rarity multiplier applied to a critter's base catch chance (before the orb
// bonus). Species default to "common" when they have no `rarity` field.
// Mythicals are meant to feel almost impossible without weakening them and
// using a top-tier orb — a fresh, full-HP mythical is only ~0.3% with a
// basic Critter Orb.
const RARITY_CATCH_MULT = {
  common:  1,
  rare:    0.2,    // World 3 exclusives + evolved forms
  epic:    0.08,   // Epic critters — hard to catch, between rare and mythical
  legendary:0.006, // Ancientreant / Crystalphoenix
  mythical:0.012,  // Lunastra / Solarion / Glacialis
};
function speciesRarity(s) { return s.rarity || "common"; }

// XP needed to level up is scaled by rarity too — rarer critters (evolved
// forms, World 3 exclusives, mythicals) take noticeably more XP per level
// than a common critter of the same level.
const XP_RARITY_MULT = {
  common:  1,
  rare:    1.6,
  epic:    2,
  legendary:4,
  mythical:3,
};
function xpNeeded(creature) {
  const mult = XP_RARITY_MULT[speciesRarity(spec(creature))] ?? 1;
  return Math.round(creature.level * 30 * mult);
}

// 🍬 Candy: feeds a chunk of XP straight to a critter outside of battle
// (see feedCandy() in the Team screen). Rarer critters still need more XP
// per level, so a candy goes further on a common critter than a rare one.
const CANDY_XP = 40;
const SUPER_CANDY_XP = 200;
const MEGA_CANDY_XP = 500;
const MAX_LEVEL = 120;

// Shop stock — add more items here.
const SHOP_ITEMS = [
  ...ORB_TIERS.map((o, i) => ({ key:o.key, label:o.label, desc:orbDesc(i), price:o.price })),
  { key:"potion",    label:"🧪 Potion",      desc:"Restores 30 HP in battle",        price:40 },
  { key:"bigpotion", label:"⚗️ Big Potion",  desc:"Fully restores HP in battle",     price:90 },
  { key:"antidote",  label:"🧪 Antidote",    desc:"Cures poison/burn",             price:20 },
  { key:"awakening", label:"⏰ Awakening",   desc:"Cures paralysis/sleep",         price:20 },
  { key:"candy",     label:"🍬 Candy Bar",   desc:`Feed a critter (+${CANDY_XP} XP) from the Team screen — no battle needed`, price:35 },
  { key:"supercandy", label:"🍬 Super Candy", desc:`Feed a critter (+${SUPER_CANDY_XP} XP) from the Team screen`, price:120 },
  { key:"megacandy",  label:"🍬 Mega Candy",  desc:`Feed a critter (+${MEGA_CANDY_XP} XP) from the Team screen`, price:300 },
];

// ---- Update log shown by the in-game "Updates" button ----
// Add a new entry BELOW the roadmap whenever we ship something new.
const UPDATE_LOG = [
  { version:"v2.4.6 — Bug Fixes & Polish", notes:[
    "🐛 Fixed: Antidote and Awakening items were never consumed from inventory when used in battle — they now correctly deduct one use per application",
    "🐛 Fixed: the Run button could briefly allow a second action on success before the battle screen closed — input is now locked immediately on attempt",
    "🐛 Fixed: admin panel teleport now properly resets the segment index when landing in a world that has no segments, preventing a stale segment reference",
    "📱 Fixed: admin panel buttons (Unlock, Cancel, Close) were hidden behind the D-pad on mobile — added bottom padding so they're always tappable",
    "📱 Fixed: admin PIN entry on mobile now shows only the numpad — removed the old ▲/▼ steppers and redundant text input that cluttered the screen; numpad buttons are bigger and fully touch-friendly",
    "📱 Fixed: admin overlay now has z-index above the D-pad so all buttons are always reachable on mobile",
  ]},
  { version:"v2.4.5 — Safe Zones, Readable Maps & Portal Fixes", notes:[
    "📊 STATS SCREEN: new 📊 Stats button in the HUD — track your lifetime totals: total battles won, critters caught, coins earned, collection size and trainers defeated",
    "🌐 ONLINE LEADERBOARDS: in beta and coming later — the Stats screen will compare your totals with other players once it ships",
    "🌀 PORTAL FIXES: the 🌀 to Ember Depths lives only in the Sunflower & Hidden Glade segment; Obsidian Hollow's entrance portal leads onward to ❄️ Frozen Peaks (no more being dumped back in the Meadowlands); Ember Depths has a 🌀 gate home right beside where you arrive",
    "⛺ Arrivals in Frozen Peaks land on the grass beside the heal tent instead of a lake pocket with a gate home right behind it",
    "🏡 SAFE ZONES: the Meadowlands starting meadow is a safe zone — no wild encounters, a green shield ring, a 🏡 SAFE banner and HUD tag; everywhere else shows ⚔️ WILD",
    "🏕️ SAFE CAMPS: the pocket around every ⛺ heal tent is safe in every world and segment — tinted green on the map, and trainers won't ambush you there",
    "🗺️ READABLE MAPS: emojis appear ONLY where wild critters can appear (grass, forests, water, caves, ✨ patches) plus ⛺🏪🌀📜 services — clean ground means safe, emoji patches mean critters",
    "🏡 NEW WORLD: Harmony Hollow — a fully safe quest town behind the garden gate (🚪 G) in Sunflower & Hidden Glade, with a heal tent, shop and 🌀 portal home",
    "📋 SIDEQUESTS: Milo, Professor Fern and Granny Rose pay coins for tasks — talk to ❗ townsfolk, return when the ❓ shows, or read the 📜 quest board; press E to chat",
    "⚖️ Yin-Yang Realm trainers toned down from 1000 HP to 400 HP — the old HP wall made them effectively unbeatable; now it's hard but fair",
    "☀️🌙 Light (Mystic) critters roam the Yin-Yang Realm by day, dark (Shade) at night — the mythical YinYang still appears on ✨ tiles day or night",
    "📜 The 🗺️ Roadmap now always sits at the top of this update log",
  ]},
  { version:"v2.4.2 — Mobile Admin & Ashfall Fixes", notes:[
    "📱 Fixed: the admin access code can now be entered on mobile — type it or tap the big on-screen number pad (the old ▲/▼ steppers were too small to tap)",
    "📱 Menus and overlays now cover the whole screen on mobile instead of being cut off when the page is scrolled",
    "🐛 Fixed: the Team Eclipse Grunt in Ashfall Peaks was unreachable — he stood inside a sealed cave; he now waits on open ground beside it",
  ]},
  { version:"v2.4.1 — Refresh & Admin Teleport Fixes", notes:[
    "🐛 Fixed: the map could freeze mid-draw (no player, empty inventory) when a world contained Blaze or a Team Eclipse trainer",
    "🐛 Fixed: admin panel teleports are now saved — refreshing the page no longer snaps you back",
    "🐛 Fixed: New Game asks before overwriting an existing save and properly resets the game state",
    "🛡️ Corrupt saves are repaired on load instead of crashing",
  ]},
  { version:"v2.4.0 — Rivals, Villains & Weather", notes:[
    "✅ Day/night cycle now takes 160 steps to change (was 40) — longer days and nights for more immersive exploration",
    "✅ New: Weather system — each world has its own weather patterns that change as you explore",
    "✅ Weather affects encounter rates: Rain boosts water critters, Wind boosts forest finds, Storms increase mythical chances",
    "✅ Weather indicator shown in the HUD alongside day/night status",
    "✅ New: Rival character Blaze — a fiery trainer who follows you across all worlds, getting stronger each time",
    "✅ Blaze appears in Meadowlands, Ember Depths, Frozen Peaks, and Yin-Yang Realm with progressively stronger teams",
    "✅ New: Team Eclipse villain organization — dark-robed trainers seeking to capture all mythical critters",
    "✅ Eclipse Grunt in Ashfall Peaks, Commander Nyx in Astral Expanse, and Leader Obsidian in Yin-Yang Realm",
    "✅ Story cutscenes for meeting and defeating rivals and villains",
  ]},
  { version:"🗺️ Roadmap (coming soon)", future:true, notes:[
    "Character customization: outfits and accessories",
    "Post-game content: Battle Tower and Legendary hunts",
    "Voiced/animated cutscene panels instead of static slides",
    "Paralysis/sleep/freeze visuals in the overworld, not just in battle",
    "Trainer rematch cooldowns (once per in-game day) instead of unlimited back-to-back rematches",
    "Leaderboards/stats screen now LIVE: open 📊 Stats in the HUD to see total battles won, critters caught, coins earned (online board is in beta — coming later)",
    "Achievements with in-game badges",
    "Online/local trading (currently a beta placeholder)",
    "Reworks considered: true 3D (Three.js), sprite art, sound, defense stat",
  ]},
  { version:"v2.3.1 - Segment Fixes & Admin Panel", notes:[
    "🐛 Fixed: wild encounters, heal tents and shops now work inside Meadowlands segments",
    "🐛 Fixed: segment trainers (Lily, Clover, Sage, Bramble, Elder Root) now appear and battle",
    "🐛 Fixed: ragged segment maps — no more invisible walls or getting stuck at segment borders",
    "🛠️ Admin: the access code now opens a full Admin Panel — teleport anywhere, unlock everything, resources, all critters, heal",
    "🍬 Super Candy and Mega Candy are now stocked in the shop",
  ]},
  { version:"v2.3.0 - Meadowlands Remake", notes:[
    "Meadowlands remade with 3 segments: Meadow, Sunflower Fields, Hidden Glade",
    "Walk to map edges to seamlessly transition between segments",
    "20 new critters with 2D canvas sprite rendering",
    "New rarity: Legendary - Ancientreant and Crystalphoenix",
    "New candy tiers: Super Candy (+200 XP) and Mega Candy (+500 XP)",
    "5 new trainers across Sunflower Fields and Hidden Glade",
    "Legendary critters found on Hidden Glade mythical tiles",
  ]},
  { version:"v2.2.0 — Type Balance, Safe Paths & Visual Refresh", notes:[
    "🐛 Fixed encounter bug in Worlds 4–6 (Ashfall Peaks, Astral Expanse, Yin-Yang Realm) — path tiles no longer trigger random encounters",
    "✅ Shade type is now strong against Cosmic — the dark void of space counters cosmic power",
    "✅ Poison type rebalanced — now only effective against Grass and Poison",
    "✅ Poison status effect now only usable by Grass and Poison type critters",
    "✅ Rock type now strong against Poison — minerals neutralize toxins",
    "✅ Poison chance rates lowered: Poison types 25%, Grass types 3%",
    "✅ Ashfall Peaks visually refreshed — new ashy gray palette, no longer looks like Ember Depths",
    "✅ Mythical tiles added to Ashfall Peaks, Astral Expanse, and Yin-Yang Realm — 0.1% chance to find a mythical",
    "✅ New: YinYang ☯️✨ — mythical balance critter exclusive to Yin-Yang Realm",
    "✅ YinYang type strong against Shade and Cosmic, with permanent 6% damage bonus",
    "✅ 8% encounter chance on mythical tiles in Yin-Yang Realm (1% for other mythicals)",
    "✅ Frozen Peaks (World 2) redesigned — upper middle rock entrance leads to hidden cave",
    "✅ Portal to Ashfall Peaks now inside the cave behind the rock",
    "✅ World 6 trainer critters get 1,000 HP for endgame challenge",
  ]},
  { version:"v2.1.0 — Level Cap & Endgame Challenge", notes:[
    "✅ New: Max level cap of 120 for player critters — XP resets to 0 at cap, team screen shows 'MAX' instead of XP progress",
    "✅ World 6 (Yin-Yang Realm) trainers now scaled to level 138-150 — a serious endgame challenge even at max level",
    "✅ Zenithral's team reaches up to level 150, requiring strong type matchups and strategy to defeat",
    "🐛 Fixed Yin-Yang Realm map having a stray Q tile that served no purpose",
  ]},
  { version:"v2.0.0 — Three New Worlds", notes:[
    "✅ New: World 4 — 🌋 Ashfall Peaks with volcanic landscape, Fire/Rock critters, and 4 trainers led by champion Magmus",
    "✅ New: World 5 — 🌌 Astral Expanse with cosmic landscape, brand-new Cosmic type, and 4 trainers led by champion Galaxius",
    "✅ New: World 6 — ⚫⚪ Yin-Yang Realm with light/dark split landscape, Mystic/Shade critters, and 5 trainers led by final champion Zenithral",
    "✅ 18 new species across the three worlds, each with evolutions at level milestones",
    "✅ New type: Cosmic — strong against Fire and Rock",
    "✅ Difficulty scaling: Ashfall Peaks (Lv 28-38) → Astral Expanse (Lv 33-43) → Yin-Yang Realm (Lv 38-52)",
    "✅ Each world has its own portal chain, requiring all previous trainers to be defeated",
    "✅ Story cutscenes for entering each new world and defeating each world's champion",
  ]},
  { version:"v1.4.3 — Day/Night Cycle", notes:[
     "✅ New: a day/night cycle — the world darkens with a visible ☀️/🌙 indicator every 40 steps you take",
     "✅ Some tiles now have different critters at night: Shade and Mystic types get much more common after dark in the Meadowlands, and Poison/Ice types shift in Ember Depths",
     "✅ The Frozen Peaks mythical (Silklarva/Cocobright/Astromoth) is 3x more likely to appear at night, since it's a moth",
   ]},
  { version:"v1.4.2 — New Mythical: Astromoth Line", notes:[
     "✅ New: a 3-stage mythical exclusive to Frozen Peaks — Silklarva (Lv 1-10) grows into Cocobright (Lv 11-20), then Astromoth (Lv 21-30)",
     "✅ Found on a new hidden ✨ tile in Frozen Peaks as a young Silklarva — train it up through battles and it evolves on its own, just like a normal critter",
     "✅ Mythical-rarity at every stage, so it's just as hard to catch as Lunastra, Solarion, or Glacialis",
     "✅ Successfully catching a wild critter now also grants your active critter XP, same as knocking it out would",
   ]},
  { version:"v1.4.1 — Freeze Fix & Candy", notes:[
     "🐛 Fixed freeze being inflictable by almost every element — only Water and Ice moves (and Water/Ice hybrids bred from them) can freeze now",
     "✅ Leveling up now takes more XP the rarer a critter is: common critters are unchanged, rare critters need 1.6x the XP per level, mythicals need 3x",
     "✅ New: 🍬 Candy Bars — buy them in the shop, then feed one to any critter from the Team screen for an instant XP boost, no battle required",
     "✅ Team screen now shows each critter's current XP progress toward its next level",
   ]},
  { version:"v1.4.0 — Rematches & Story Mode", notes:[
     "✅ New: Trainer rematches — walk into any trainer you've already beaten to fight them again",
     "✅ Each rematch scales their team up by 5 levels (capped at +40) and pays a smaller 20-coin bonus instead of the original 50",
     "✅ New: Story mode — short cinematic cutscenes with lore, shown when you start a new game, first enter Ember Depths or Frozen Peaks, and after beating each world's champion",
     "✅ New: Burn 🔥 is now a real status effect on Fire-type attacks (Embercub, Flarehop, Cindertail, Emberion, Solarion, Steamurk) — deals damage over time, cured by the ⛺ tent or an Antidote",
   ]},
  { version:"v1.3.0 — Frozen Peaks Portal", notes:[
     "✅ New: a portal in Ember Depths now leads to Frozen Peaks (World 3) — previously there was no way to actually get there",
     "✅ Sealed until you've defeated ALL trainers in BOTH Meadowlands and Ember Depths (all 10)",
     "✅ Frozen Peaks now has its own portal back to Ember Depths",
     "🐛 Fixed the Frozen Peaks map: two malformed rows put the heal tent in the wrong spot and left the world with no portal at all",
     "🐛 Fixed a crash when entering Frozen Peaks: its trainers (Glacia, Boreal, Crystal) had no character colors defined, which threw an error mid-draw — this hid the player sprite (looked like a freeze, worst on mobile) and could leave the canvas in a corrupted state where colors like the portal's purple stopped showing up",
     "🐛 Fixed Venomite, Sludgil, and Toxwing evolving into the exact same critters as Embercub, Aquafin, and Sproutle — they now evolve into their own unique Poison-type forms (Toxidrake, Bogleviathan, Miasmawing) instead",
   ]},
  { version:"v1.2.0 — Catch Rate by Rarity", notes:[
     "✅ Catch chance is now scaled by species rarity instead of every critter sharing the same odds",
     "✅ Common critters: unchanged (~25%-90% depending on remaining HP)",
     "✅ Rare critters (World 3 exclusives + evolved forms): much tougher — ~5%-70% even with a top-tier orb",
     "✅ Mythicals (Lunastra, Solarion, Glacialis): only ~0.3% on a fresh encounter with a basic orb",
     "✅ The catch-chance message now shows decimals below 1% so rare/mythical odds don't misleadingly show as '0%'",
   ]},
  { version:"v1.1.0 — Breeding Exclusives Update", notes:[
     "✅ New: 4 breed-exclusive critters — Steamurk ♨️, Voltvine 🌿⚡, Skycrag 🪨🕊️, Duskstar ✨🌑",
     "✅ These 4 can ONLY be obtained by breeding — they never appear as wild encounters or on trainer teams",
     "✅ Each hatches from a specific pair of parent types (Fire+Water, Electric+Grass, Air+Rock, Mystic+Shade) instead of a random hybrid",
     "✅ The Breed screen now only lists unbred critters as selectable parents — a critter born from breeding can't be bred again, so it won't show up in the list",
   ]},
  { version:"v1.0.0 — Cleanup Update", notes:[
     "✅ Removed the non-functional 'Battle' HUD button (online battling isn't built yet — it's still on the roadmap)",
     "✅ New: Deviant critters! A rare (~5%) stronger variant with boosted HP/ATK",
     "✅ Deviants are marked with a shimmering ✨ DEVIANT badge and a gold glow so you can spot them at a glance",
     "✅ Deviants can only appear on wild encounters — trainers never field deviant critters",
     "🐛 Fixed a bug where buying a Great Orb or Ultra Orb broke catching — their owned count silently became invalid and the game always fell back to a basic Critter Orb",
     "✅ New: 🟣 Master Orb and ⚪ Legend Orb — 2 new catch orb tiers, each 40% better than the one before it (Great Orb → Ultra Orb → Master Orb → Legend Orb)",
     "✅ New: Breeding! A new Breed screen lets you pick 2 owned critters (Lv 3+, 🪙60) to produce a baby",
     "✅ Breeding two different species creates a unique hybrid — blended name, combined icon, a random parent type, and one move inherited from each parent",
     "✅ Bred critters are marked with a 🧬 BRED badge wherever they're shown",
     "🐛 Fixed a battle-freezing bug: when poison/burn wore off mid-fight, the game hit an error and locked up — no move, catch, or switch button would respond until you reloaded. Also added a safety net so a battle-turn error can never soft-lock the game again",
   ]},
  { version:"v9.1 — Mythical Creatures Update", notes:[
     "✅ Added 3 mythical creatures: Lunastra, Solarion, Glacialis",
     "✅ Extremely rare encounters (1% chance) on special '*' tiles",
     "✅ Hidden mythical tiles in each world for exploration",
     "✅ Mythical creatures have superior stats and unique moves",
   ]},
  { version:"v0.9 — Major Expansion", notes:[
    "✅ World 3: Frozen Peaks behind second portal gate",
    "✅ Critter evolutions at level milestones (Lv 10, 20, 30)",
    "✅ New statuses: burn 🔥, paralysis ⚡, sleep 💤",
    "✅ Great/Ultra Orbs with higher catch rates",
    "✅ Status cure items: Antidote, Awakening",
  ]},
  { version:"v0.8.2 — Visibility Improvements", notes:[
    "Increased game resolution and tile size for better visibility",
    "Distinguished player appearance from trainers",
  ]},
  { version:"v0.8.1 — Mobile D-pad Fix", notes:[
    "Fixed D-pad not appearing on some phones/tablets",
    "Now uses JavaScript touch detection as a fallback when the browser misreports its pointer type",
  ]},
  { version:"v0.8 — Mobile Support", notes:[
    "Play on phones and tablets! On-screen D-pad with hold-to-walk",
    "Swipe on the map to move; bigger tap targets everywhere",
    "Responsive battle screen and no accidental pinch/double-tap zoom",
  ]},
  { version:"v0.7 — Update Log", notes:[
    "New Updates button in the HUD showing this changelog in-game",
    "Roadmap section so you always know what's planned next",
  ]},
  { version:"v0.6 — Elements & Status Effects", notes:[
    "New world 2 exclusive elements: ☠️ Poison and ❄️ Ice",
    "Poison: 2 rounds, 5 HP damage per round · Freeze: 40% chance, victim skips a turn",
    "6 new critters in the Ember Depths: Venomite, Sludgil, Toxwing, Frostcub, Icyfin, Glacihorn",
    "Type chart updated: Fire melts Ice, Poison beats Grass/Water, Ice beats Grass/Air",
  ]},
  { version:"v0.5 — World Rework", notes:[
    "Map now scales to fit your screen — no more hidden bottom row",
    "New 🌳 forest area in Meadowlands with tougher encounters",
    "Portal sealed until you defeat all Meadowlands trainers",
    "Ember Depths harder (Lv 10-17) with 4 new trainers: Pyra, Onyx, Vex, champion Magnus",
  ]},
  { version:"v0.4 — Economy & Battle FX", notes:[
    "Bigger 24x16 maps and 20 new critters (28 total)",
    "Coins 🪙, shop 🏪 with orbs and potions — catching now costs orbs",
    "Animated attacks: type projectiles fly across the arena with 💥 impacts",
  ]},
  { version:"v0.3 — 3D Characters", notes:[
    "Player and trainers rendered as 3D-shaded models with unique outfits",
    "Characters face your direction; defeated trainers fade out",
  ]},
  { version:"v0.2 — Two Worlds & Battle Arena", notes:[
    "Second world: 🌋 Ember Depths, connected by 🌀 portals",
    "Battle arena with big sprites of both fighters",
  ]},
  { version:"v0.1 — Initial Release", notes:[
    "Overworld, wild encounters, catching, 8 critters, trainer battles, team screen, saving",
  ]},
];

// ---- Story mode: short cutscene slideshows shown at key story beats.
// Each key plays once ever (tracked in state.storySeen) then never again.
const STORY_EVENTS = {
  intro: [
    { icon:"🌍", title:"The World of Critters", text:"Long ago, humans and wild critters learned to fight and grow side by side, bonded by trust rather than chains." },
    { icon:"🌿", title:"Meadowlands", text:"You've just arrived in the peaceful Meadowlands — home to gentle grass, water, and cave-dwelling critters, and the first step of a much longer journey." },
    { icon:"❓", title:"Your Journey Begins", text:"Rumors speak of hidden worlds beyond the horizon: scorched depths, frozen peaks, each sealed behind trials only the strongest trainers can clear. Choose your first partner, and begin." },
  ],
  enterWorld1: [
    { icon:"🌋", title:"Ember Depths", text:"The portal hums open and scorching heat rolls over you. Ember Depths has been sealed for generations — until now." },
    { icon:"🔥", title:"A Harsher Land", text:"Only the toughest critters survive down here. Seven trainers guard the way further in, led by the champion Magnus." },
  ],
  enterWorld2: [
    { icon:"❄️", title:"Frozen Peaks", text:"Beyond the frozen gate lies a land of eternal ice. Legends whisper of a mythical guardian who once ruled these peaks before vanishing." },
    { icon:"🦌❄️", title:"Whispers of Ice", text:"Only Ice-type critters make their home here now. Three trainers — Glacia, Boreal, and Crystal — test everyone who dares enter." },
  ],
  enterWorld6: [
    { icon:"🏡", title:"Harmony Hollow", text:"You push open the creaky garden gate and follow a cobblestone path into Harmony Hollow — a peaceful little town far from the wild grass." },
    { icon:"📋", title:"A Town in Need", text:"Townsfolk with ❗ over their heads need help. Walk into them to chat and take on paid sidequests, or check the 📜 quest board by the well. No wild critters ever wander in here." },
  ],
  beatMagnus: [
    { icon:"👑", title:"Champion Fallen", text:"Magnus lowers his head. \"The Depths bow to a new challenger now,\" he says, with a respectful nod." },
    { icon:"🌀", title:"The Frozen Gate", text:"With every trainer in the Meadowlands and Ember Depths defeated, the ice-crusted gate at last shudders open." },
  ],
  beatCrystal: [
    { icon:"❄️👑", title:"Peak Ascended", text:"Crystal steps aside. \"You've proven your heart is as strong as the ice itself,\" she says quietly." },
    { icon:"🌋", title:"The Volcanic Gate", text:"With every trainer in all three worlds defeated, the volcanic portal rumbles open, revealing rivers of fire beyond." },
  ],
  enterWorld3: [
    { icon:"🌋", title:"Ashfall Peaks", text:"The portal opens to a world of fire and fury. Volcanic mountains stretch endlessly, rivers of lava carving through obsidian rock." },
    { icon:"🔥", title:"Land of Fire", text:"Only the strongest Fire and Rock critters thrive here. Four trainers — Ember, Obsidian, Cindra, and the volcanic lord Magmus — guard the path forward." },
  ],
  enterWorld4: [
    { icon:"🌌", title:"Astral Expanse", text:"You step through into a realm beyond the stars. Floating islands drift through cosmic nebulae, and the ground sparkles with stardust." },
    { icon:"⭐", title:"Cosmic Frontier", text:"Cosmic critters unlike anything you've seen inhabit this strange dimension. Stella, Cosmo, Astrid, and the cosmic sovereign Galaxius test all who enter." },
  ],
  enterWorld5: [
    { icon:"⚫⚪", title:"Yin-Yang Realm", text:"The final world is a land of perfect balance — half light, half darkness, separated by an ethereal boundary." },
    { icon:"⚖️", title:"The Great Balance", text:"Mystic and Shade critters coexist in perfect harmony here. Lumina, Erebos, Karma, Duality, and the ultimate master Zenithral stand between you and the summit." },
  ],
  beatMagmus: [
    { icon:"🌋👑", title:"Volcanic Lord Falls", text:"Magmus raises his fist in respect. 'The mountains acknowledge a new ruler,' he declares, bowing his head." },
    { icon:"🌀", title:"The Cosmic Gate", text:"With every trainer in all four worlds defeated, the cosmic portal shimmers open, revealing a pathway among the stars." },
  ],
  beatGalaxius: [
    { icon:"🌌👑", title:"Cosmic Sovereign Defeated", text:"Galaxius gazes at you with newfound respect. 'You've crossed dimensions and conquered the stars themselves.'" },
    { icon:"🌀", title:"The Balance Gate", text:"The final gate — a shimmering divide between light and darkness — parts before you." },
  ],
  beatZenithral: [
    { icon:"⚫⚪👑", title:"Yin-Yang Master Conquered", text:"Zenithral smiles serenely. 'You have found perfect balance within yourself. The realm acknowledges your mastery.'" },
    { icon:"🏆", title:"Champion of All Realms", text:"Across six worlds and countless battles, you have proven yourself the greatest trainer of all time. The journey is complete — but the world of critters will always welcome you back." },
  ],
  world0Greeting: [
    { icon:"🌿", title:"Welcome to the Meadowlands", text:"The gentle breeze carries the scent of wildflowers. This is where every trainer's journey begins — a peaceful land of grass, water, and hidden caves." },
    { icon:"🗺️", title:"How to Explore", text:"Use arrow keys or WASD to walk. Explore the grass, forests, and caves to find wild critters! Walk to the edge of the map to discover new areas within the Meadowlands." },
    { icon:"⚔️", title:"Battle & Catch", text:"Wild critters appear as you walk — battle them and use Critter Orbs to catch them! Visit the 🏪 shop to buy orbs and potions. Talk to trainers to test your skills." },
  ],
  // ---- Rival character: Blaze ----
  rivalMeet: [
    { icon:"🦊", title:"A Rival Appears", text:"A fiery-haired trainer blocks your path. 'Hey! You must be the new trainer everyone's talking about. I'm Blaze — and I'm going to be the greatest critter master the world has ever seen!'" },
    { icon:"⚔️", title:"Rival Battle!", text:"Blaze grins confidently. 'Let's see if you're worth the hype. My critters are ready — are yours?'" },
  ],
  rivalBeat1: [
    { icon:"😤", title:"Blaze Defeated", text:"Blaze clenches his fist. 'Not bad... but I'll get stronger. Next time we meet, I won't go easy on you!'" },
    { icon:"🔥", title:"The Rivalry Begins", text:"Blaze walks away, determined. 'I'm heading to Ember Depths to train. Try to keep up!'" },
  ],
  rivalMeet2: [
    { icon:"🔥", title:"Blaze Returns", text:"Blaze appears from the shadows of Ember Depths. 'Told you I'd get stronger! My Fire critters have evolved — ready for round two?'" },
  ],
  rivalBeat2: [
    { icon:"😡", title:"Blaze Frustrated", text:"Blaze slams his fist against a rock. 'How?! How are you always one step ahead?!' He storms off toward Frozen Peaks." },
  ],
  rivalMeet3: [
    { icon:"❄️", title:"Frozen Rivalry", text:"Blaze stands at the edge of Frozen Peaks, his breath visible in the cold air. 'I've trained with the Ice masters. This time, I WILL beat you!'" },
  ],
  rivalBeat3: [
    { icon:"😢", title:"Blaze's Resolve", text:"Blaze falls to one knee. 'I... I can't believe it. You're really that strong.' He looks up with determination. 'I won't give up. I'll find a way to surpass you, even if it takes everything I have.'" },
  ],
  rivalFinal: [
    { icon:"⚫⚪", title:"Final Rivalry", text:"Blaze appears in the Yin-Yang Realm, his critters glowing with power. 'I've mastered both light and dark. This is our final battle — no holding back!'" },
  ],
  rivalFinalBeat: [
    { icon:"🤝", title:"Rivals Forever", text:"Blaze smiles, extending his hand. 'You win. Fair and square. I've learned so much from fighting you.' He shakes your hand firmly. 'But don't get comfortable — I'll be back even stronger next time!'" },
    { icon:"🌟", title:"A Bond Forged", text:"Through battles and rivalry, you and Blaze have forged an unbreakable bond. True rivals push each other to greatness." },
  ],
  // ---- Villain team: Team Eclipse ----
  villainMeet: [
    { icon:"🌑", title:"Team Eclipse", text:"Dark-robed figures emerge from the shadows. 'We are Team Eclipse. We seek to capture all mythical critters and bend them to our will. You cannot stop us!" },
    { icon:"⚔️", title:"Villain Attack!", text:"An Eclipse Grunt throws a dark orb. 'Your critters will make fine additions to our collection!'" },
  ],
  villainGruntBeat: [
    { icon:"💪", title:"Grunt Defeated", text:"The Eclipse Grunt staggers back. 'Impossible! But don't think this changes anything — the Eclipse Commanders are far stronger than me!'" },
  ],
  villainCommander: [
    { icon:"🌑", title:"Eclipse Commander", text:"A tall figure in ornate dark armor steps forward. 'I am Commander Nyx of Team Eclipse. You've defeated my grunts, but you won't get past me.'" },
    { icon:"⚡", title:"Commander Battle!", text:"Nyx raises a hand crackling with dark energy. 'Feel the power of the Eclipse!'" },
  ],
  villainCommanderBeat: [
    { icon:"😱", title:"Commander Shocked", text:"Nyx's eyes widen. 'You... you actually defeated me? The Eclipse Leader will not be pleased.' She vanishes into a cloud of dark smoke." },
  ],
  villainLeader: [
    { icon:"🖤", title:"Eclipse Leader", text:"A imposing figure sits on a throne of dark crystals. 'I am Eclipse Leader Obsidian. You've come far, but your journey ends here. I will capture every mythical critter and reshape this world!'" },
    { icon:"💀", title:"Leader Battle!", text:"Obsidian stands, his presence overwhelming. 'Witness the true power of Team Eclipse!'" },
  ],
  villainLeaderBeat: [
    { icon:"✨", title:"Eclipse Shattered", text:"Obsidian falls to his knees. 'No... how? The Eclipse was supposed to be invincible...' He looks up at you with grudging respect. 'Perhaps I was wrong. Power isn't everything.'" },
    { icon:"🌅", title:"A New Dawn", text:"Team Eclipse dissolves as trainers across the land celebrate your victory. The mythical critters are free, and peace returns to the world. You've become not just a champion, but a legend." },
  ],
};
function storyKeyForTrainer(id) {
  if (id === 9)  return "beatMagnus";
  if (id === 12) return "beatCrystal";
  if (id === 16) return "beatMagmus";
  if (id === 20) return "beatGalaxius";
  if (id === 25) return "beatZenithral";
  if (id === 200) return "rivalBeat1";
  if (id === 201) return "rivalBeat2";
  if (id === 202) return "rivalBeat3";
  if (id === 203) return "rivalFinalBeat";
  if (id === 210) return "villainGruntBeat";
  if (id === 211) return "villainCommanderBeat";
  if (id === 212) return "villainLeaderBeat";
  return null;
}

let storyQueue = null, storyIdx = 0, storyOnDone = null;

// Plays a story event's slides one at a time. No-ops (and just calls onDone)
// if this event has already been seen, or doesn't exist.
function playStory(key, onDone) {
  if (!STORY_EVENTS[key] || state.storySeen[key]) { if (onDone) onDone(); return; }
  state.storySeen[key] = true;
  storyQueue = STORY_EVENTS[key];
  storyIdx = 0;
  storyOnDone = onDone || null;
  inMenu = true;
  $("storyScreen").classList.remove("hidden");
  renderStorySlide();
}
function renderStorySlide() {
  const slide = storyQueue[storyIdx];
  $("storyIcon").textContent = slide.icon;
  $("storyTitle").textContent = slide.title;
  $("storyText").textContent = slide.text;
  $("storyDots").textContent = `${storyIdx + 1} / ${storyQueue.length}`;
  $("storyNextBtn").textContent = (storyIdx === storyQueue.length - 1) ? "Continue ▶" : "Next ▶";
}
function storyNext() {
  storyIdx++;
  if (storyIdx >= storyQueue.length) { closeStory(); return; }
  renderStorySlide();
}
function closeStory() {
  $("storyScreen").classList.add("hidden");
  inMenu = false;
  storyQueue = null;
  saveGame(false);
  const cb = storyOnDone; storyOnDone = null;
  if (cb) cb();
}

/* ============ 2. GAME STATE + SAVE/LOAD ============ */

const SAVE_KEY = "critterQuestSave";

// Every purchasable item starts owned at 0, except the starting Critter Orbs/Potions.
// Building this from SHOP_ITEMS means a new shop item can never again be "missing"
// from state.items (that was the bug behind orbs silently not working).
function defaultItems() {
  const items = {};
  for (const it of SHOP_ITEMS) items[it.key] = 0;
  items.orb = 5;
  items.potion = 2;
  return items;
}

function freshState() {
  return {
    world: 0,
    currentSegment: 0,
    player: { x:2, y:13 },
    collection: [],
    teamIdx: [],
    defeated: [],
    coins: 150,
    items: defaultItems(),
    rematches: {},   // trainer id -> number of rematches won
    storySeen: {},   // story event key -> true once its cutscene has played
    steps: 0,        // total tiles moved — drives the day/night cycle
    quests: {},      // quest key -> { stage:"active"|"done", n:number } — sidequest progress
    // 📊 Lifetime stats for the Stats screen (v2.4.5). Kept in the save so the
    // board survives refreshes; migrated to defaults for older saves on load.
    stats: { battlesWon: 0, crittersCaught: 0, coinsEarned: 0 },
  };
}
let state = freshState();

// "Deviant" critters are a rare, stronger variant (~5% chance) that can only appear
// on WILD encounters — trainers always field normal critters, never deviants.
const DEVIANT_CHANCE = 0.05;
const DEVIANT_MULT = 1.3; // +30% HP and ATK

function makeCreature(speciesId, level, allowDeviant = false) {
  const s = SPECIES[speciesId];
  const isDeviant = allowDeviant && Math.random() < DEVIANT_CHANCE;
  let maxHp = s.baseHP + level * 3;
  let atk = s.baseAtk + level * 2;
  if (isDeviant) {
    maxHp = Math.round(maxHp * DEVIANT_MULT);
    atk = Math.round(atk * DEVIANT_MULT);
  }
  return { speciesId, level, xp:0, maxHp, hp:maxHp, atk, status:null, deviant:isDeviant };
}
// Normal critters look up their species by id; bred hybrids carry their own
// generated species-like data (name/type/icon/moves) directly on the critter.
const spec  = c => c.hybridSpec || SPECIES[c.speciesId];
const world = () => WORLDS[state.world];
function seg() { var w = world(); return (w.segments && w.segments[state.currentSegment]) ? w.segments[state.currentSegment] : w; }

/* ---- Safe zones ----
   Some areas are peaceful: no wild encounters, a visible shield ring while
   you stand inside, and a 🏡 SAFE tag in the HUD. Players kept asking which
   areas were safe, so safety is now explicit and impossible to miss.
   - `safe: true` on a world or segment marks the WHOLE area safe.
   - `safeTiles: ["t", "T"]` marks only those tile characters safe (roads,
     town squares...). Wild critters can still lurk in that area's grass.
   The Meadowlands starting field and all of Harmony Hollow are safe. */
function isSafeArea() {
  const w = world(), s = seg();
  return !!(s.safe || (s === w && w.safe));
}
function isSafeTile(t) {
  if (isSafeArea()) return true;
  const st = seg().safeTiles || world().safeTiles;
  return !!st && st.indexOf(t) !== -1;
}

/* ---- Safe camp spots (v2.4.5) ----
   EVERY world and segment has one guaranteed safe pocket: the tiles around
   its ⛺ heal-spot camp. Wild encounters never trigger there, and trainers
   standing in a camp pocket are politely ignored instead of ambushing you —
   so every area has a spot where you can catch your breath. Memoized per
   segment: the map data never changes after load, so the radius is computed
   once. */
const CAMP_SAFE_RADIUS = 1;
const campSafeCache = new Map();
function campSafeTiles() {
  const w = world(), s = seg();
  const key = state.world + ":" + state.currentSegment;
  if (!campSafeCache.has(key)) {
    const map = s.map || w.map;
    const hs = s.healSpot || w.healSpot;
    const set = [];
    if (hs && map) {
      for (var dy = -CAMP_SAFE_RADIUS; dy <= CAMP_SAFE_RADIUS; dy++) {
        for (var dx = -CAMP_SAFE_RADIUS; dx <= CAMP_SAFE_RADIUS; dx++) {
          const yy = hs.y + dy, xx = hs.x + dx;
          if (yy >= 0 && yy < MAP_H && xx >= 0 && xx < MAP_W && map[yy][xx] !== "#") set.push(xx + "," + yy);
        }
      }
    }
    campSafeCache.set(key, set);
  }
  return campSafeCache.get(key);
}
function isCampSafe(x, y) {
  if (isSafeArea()) return true;
  return campSafeTiles().indexOf(x + "," + y) !== -1;
}

/* ---- Sidequests (money from the town, not from wild grass) ----
   Each quest: key, npc (id + display name), stages "available" → "active"
   → "done". Progress lives in state.quests[key] = { stage, n }. Walk into a
   townsperson to talk: pick up ❗ quests, hand in finished ones for coins. */
const QUESTS = [
  {
    key: "bugs", npc: "Milo", icon: "🐛",
    offer: "Milo: The garden's crawling with critters! Battle 3 wild critters for me and I'll pay you 200 coins!",
    progress: n => `Milo's garden pest patrol — wild critters battled: ${n}/3`,
    doneMsg: "Milo: You handled those critters! Here's 200 coins as promised.", reward: 200,
  },
  {
    key: "catch3", npc: "Professor Fern", icon: "🎓",
    offer: "Prof. Fern: My research needs specimens! Catch 2 wild critters and I'll fund you 350 coins.",
    progress: n => `Fern's field study — critters caught: ${n}/2`,
    doneMsg: "Prof. Fern: Fascinating specimens! The grant money is yours — 350 coins.", reward: 350,
  },
  {
    key: "champ", npc: "Granny Rose", icon: "👵",
    offer: "Granny Rose: Prove yourself — defeat any 2 trainers out there and this old lady will hand over 500 coins.",
    progress: n => `Rose's champion trial — trainers defeated: ${n}/2`,
    doneMsg: "Granny Rose: A true trainer, just as I thought! 500 coins, well earned.", reward: 500,
  },
];
const questState = key => (state.quests && state.quests[key]) || { stage: "available", n: 0 };
function setQuest(key, patch) { if (!state.quests) state.quests = {}; state.quests[key] = Object.assign(questState(key), patch); }
// Called when a quest wants progress tracked (battles, catches, trainer wins).
function questEvent(type) {
  let justFinished = null;
  for (const q of QUESTS) {
    const qs = questState(q.key);
    if (qs.stage !== "active" || q.type !== type) continue;
    qs.n++;
    if (qs.n >= q.goal) { justFinished = q; }
    setQuest(q.key, { n: qs.n });
  }
  if (justFinished) hudMsg(`📜 Quest ready to turn in: ${justFinished.npc} (${justFinished.icon}) is waiting in town!`);
}
// Attach goal/type/goal counts to the quest defs (kept off the literals above
// so the table stays readable).
QUESTS[0].type = "battle"; QUESTS[0].goal = 3;
QUESTS[1].type = "catch";  QUESTS[1].goal = 2;
QUESTS[2].type = "trainer"; QUESTS[2].goal = 2;

// Interaction with townsfolk/quest NPCs: press E/Space/Enter while standing
// next to one (or tap the 💬 Talk button on mobile).
function npcAt(x, y) {
  const w = world(), s = seg();
  return ((s.npcs || w.npcs) || []).find(n => n.x === x && n.y === y) || null;
}
function adjacentNpc() {
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const n = npcAt(state.player.x + dx, state.player.y + dy);
    if (n) return n;
  }
  return null;
}
function tryTalk() {
  const npc = adjacentNpc();
  if (!npc) return false;
  talkToNpc(npc);
  return true;
}
function talkToNpc(npc) {
  const q = QUESTS.find(qq => qq.npc === npc.name);
  if (!q) { hudMsg(`${npc.name}: ${npc.line || "Lovely weather in the Hollow, isn't it?"}`); return; }
  const qs = questState(q.key);
  if (qs.stage === "available") {
    setQuest(q.key, { stage: "active", n: 0 });
    hudMsg(`📜 Quest accepted: ${q.icon} ${q.progress(0)} — reward ${q.reward} 🪙`);
  } else if (qs.stage === "active" && qs.n >= q.goal) {
    state.coins += q.reward;
    setQuest(q.key, { stage: "done" });
    hudMsg(`💰 ${q.doneMsg} (+${q.reward} 🪙)`);
    saveGame(false);
  } else {
    hudMsg(`📜 ${q.progress(qs.n)} — reward ${q.reward} 🪙`);
  }
  updateHUD();
  draw();
}

// Find the nearest walkable tile to (x, y) on map `m` (spiral search) so a
// spawn/teleport never strands the player inside a wall.
function findWalkable(m, x, y) {
  const solid = (tx, ty) => ty < 0 || ty >= MAP_H || tx < 0 || tx >= MAP_W || m[ty][tx] === "#";
  if (!solid(x, y)) return { x, y };
  for (let r = 1; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (!solid(x + dx, y + dy)) return { x: x + dx, y: y + dy };
    }
  }
  return { x, y };
}

/* ---- Breeding: combine two owned critters into a new baby critter ---- */
const BREED_COST = 60;      // 🪙 coins spent per breed
const BREED_MIN_LEVEL = 3;  // both parents must be at least this level

// Breeding two parents whose TYPES match one of these pairs always produces the
// listed breed-exclusive species (see SPECIES ids 44-47) instead of a random
// hybrid. Key = the two types sorted alphabetically and joined with "|", so
// combo order doesn't matter (Fire+Water breeds the same as Water+Fire).
const BREED_EXCLUSIVES = {
  "Fire|Water":     44, // Steamurk
  "Electric|Grass": 45, // Voltvine
  "Air|Rock":       46, // Skycrag
  "Mystic|Shade":   47, // Duskstar
};

// Mash two names together so the baby's name feels like a genuine blend of both parents.
function blendName(nameA, nameB) {
  const cut = Math.max(2, Math.min(nameA.length - 1, Math.ceil(nameA.length * 0.55)));
  const prefix = nameA.slice(0, cut);
  const suffix = nameB.slice(Math.floor(nameB.length * 0.45)).toLowerCase();
  const combined = prefix + suffix;
  return combined.charAt(0).toUpperCase() + combined.slice(1);
}

// Build the offspring of two critters WITHOUT touching game state — used both
// for the breeding-screen preview and for the real breed (which then pushes it).
function makeHybridCreature(parentA, parentB, level = 1) {
  const sa = spec(parentA), sb = spec(parentB);
  // Two of the exact same species just have a normal baby of that species.
  if (parentA.speciesId !== null && parentA.speciesId === parentB.speciesId
      && !parentA.hybridSpec && !parentB.hybridSpec) {
    const baby = makeCreature(parentA.speciesId, level, false);
    baby.bred = true;
    return baby;
  }
  // Certain parent TYPE combos always produce one of a handful of breed-exclusive
  // species (see BREED_EXCLUSIVES) — these species can ONLY be obtained this way,
  // never from wild encounters or trainer battles.
  const comboKey = [sa.type, sb.type].sort().join("|");
  if (BREED_EXCLUSIVES[comboKey] !== undefined) {
    const baby = makeCreature(BREED_EXCLUSIVES[comboKey], level, false);
    baby.bred = true;
    return baby;
  }
  // Different species (or hybrid parents) produce a brand-new unique combination.
  const type = Math.random() < 0.5 ? sa.type : sb.type;
  const icon = `${sa.icon}${sb.icon}`;
  const name = blendName(sa.name, sb.name);
  const baseHP  = Math.round((sa.baseHP  + sb.baseHP)  / 2);
  const baseAtk = Math.round((sa.baseAtk + sb.baseAtk) / 2);
  let moves = [sa.moves[0], sb.moves[Math.min(1, sb.moves.length - 1)]];
  // Only Water/Ice critters are allowed to freeze — a parent's freeze move
  // can't carry over onto a hybrid that ends up some other type.
  if (type !== "Water" && type !== "Ice") {
    moves = moves.map(m => m.effect && m.effect.type === "freeze" ? { name:m.name, power:m.power } : m);
  }
  const hybridSpec = { name, type, icon, baseHP, baseAtk, moves };
  return {
    speciesId: null, level, xp:0,
    maxHp: baseHP + level * 3, hp: baseHP + level * 3,
    atk: baseAtk + level * 2,
    status:null, deviant:false, bred:true, hybridSpec,
  };
}
const cur   = () => state.collection[battle.activeIdx];

function saveGame(announce) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (announce) hudMsg("💾 Game saved!");
  } catch (e) {
    console.error("Save failed:", e);
    if (announce) hudMsg("⚠️ Save failed — storage may be full or blocked.");
  }
}
function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return false;
    state = parsed;
    state.world = state.world || 0;
     // FIX: Validate world index and player position to prevent black screen
     if (state.world < 0 || state.world >= WORLDS.length) state.world = 0;
     const w = WORLDS[state.world];
     // Repair a missing/corrupt player object instead of throwing (a throw here
     // used to make loadGame() report "no save" and push players into New Game,
     // silently overwriting their real progress).
     if (!state.player || typeof state.player !== "object") state.player = { x: w.healSpot.x, y: w.healSpot.y };
     if (state.player.x < 0 || state.player.x >= MAP_W || state.player.y < 0 || state.player.y >= MAP_H) {
       state.player = { x: w.healSpot.x, y: w.healSpot.y };
     }
    if (state.coins === undefined) state.coins = 150;
    // Validate the segment index, then make sure the player isn't stranded
    // inside a wall on the CURRENT SEGMENT's map (not just the world's).
    if (typeof state.currentSegment !== "number" || Number.isNaN(state.currentSegment)) state.currentSegment = 0;
    if (w.segments) state.currentSegment = Math.max(0, Math.min(state.currentSegment, w.segments.length - 1));
    else state.currentSegment = 0;
    const segMap = seg().map || w.map;
    if (state.player.y < 0 || state.player.y >= MAP_H || state.player.x < 0 || state.player.x >= MAP_W
        || segMap[state.player.y][state.player.x] === "#") {
      const hs = seg().healSpot || w.healSpot;
      state.player = findWalkable(segMap, hs.x, hs.y);
    }
    // Collection/team repair: drop corrupt entries and team slots that point
    // outside the collection so battle/team code can never crash on load.
    if (!Array.isArray(state.collection)) state.collection = [];
    state.collection = state.collection.filter(c => c && typeof c === "object");
    if (!Array.isArray(state.teamIdx)) state.teamIdx = [];
    state.teamIdx = state.teamIdx.filter(i => Number.isInteger(i) && i >= 0 && i < state.collection.length);
    if (!state.rematches) state.rematches = {};
    // 📊 Stats migration: older saves predate the stats system (v2.4.5) —
    // backfill missing counters so the Stats screen never crashes on them.
    if (!state.stats || typeof state.stats !== "object") state.stats = {};
    if (!Number.isInteger(state.stats.battlesWon)) state.stats.battlesWon = 0;
    if (!Number.isInteger(state.stats.crittersCaught)) state.stats.crittersCaught = 0;
    if (!Number.isInteger(state.stats.coinsEarned)) state.stats.coinsEarned = 0;
    if (!state.storySeen) state.storySeen = {};
    if (!state.quests) state.quests = {}; // v2.4.5 saves predate the quest system
    if (typeof state.steps !== "number" || Number.isNaN(state.steps)) state.steps = 0;
    if (!state.weather) state.weather = "sunny";
    if (typeof state.lastWeatherIdx !== "number") state.lastWeatherIdx = 0;
    if (!state.items) state.items = defaultItems();
    else {
      // Repair any item key that's missing or corrupted (e.g. NaN from the old
      // orb-purchase bug, where buying an uninitialized orb tier gave undefined++ = NaN).
      const def = defaultItems();
      for (const k of Object.keys(def)) {
        if (typeof state.items[k] !== "number" || Number.isNaN(state.items[k])) state.items[k] = 0;
      }
    }
    return true;
  } catch { return false; }
}
function resetGame() {
  if (confirm("Delete save and restart?")) { localStorage.removeItem(SAVE_KEY); location.reload(); }
}

/* ---- Admin / PIN unlock ---- */
const ADMIN_PIN = "2020";
let pinDigits = [0,0,0,0];
let pinLen = 0; // how many digits have been entered (0-4)

function openAdmin() {
  inMenu = true;
  pinDigits = [0,0,0,0];
  pinLen = 0;
  $("adminPanel").classList.add("hidden");
  $("adminScreen").classList.remove("hidden");
  renderPin();
  setupPinEntry();
}
function closeAdmin() {
  $("adminScreen").classList.add("hidden");
  $("adminPanel").classList.add("hidden");
  hidePinEntry();
  inMenu = false;
}
function renderPin() {
  const el = $("pinDisplay");
  el.innerHTML = "";
  if (isTouchDevice) {
    el.style.justifyContent = "center";
    for (let i = 0; i < 4; i++) {
      const filled = i < pinLen;
      const box = document.createElement("div");
      box.style.cssText = "width:54px;height:60px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:bold;color:#ffd76a;background:var(--bg-card);border:2px solid " + (filled ? "#ffd76a" : "#555") + ";border-radius:10px;";
      box.textContent = filled ? pinDigits[i] : "";
      el.appendChild(box);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;user-select:none;-webkit-user-select:none;opacity:0.6;";

      const up = document.createElement("div");
      up.textContent = "▲"; up.style.cssText = "font-size:20px;color:#aaa;";
      up.onclick = (e) => { e.stopPropagation(); pinDigits[i] = (pinDigits[i] + 1) % 10; if (i >= pinLen) pinLen = i + 1; renderPin(); };

      const digit = document.createElement("div");
      digit.textContent = pinDigits[i];
      digit.style.cssText = "font-size:48px;font-weight:bold;color:#ffd76a;width:60px;text-align:center;border-bottom:3px solid #555;padding-bottom:4px;";

      const down = document.createElement("div");
      down.textContent = "▼"; down.style.cssText = "font-size:20px;color:#aaa;";
      down.onclick = (e) => { e.stopPropagation(); pinDigits[i] = (pinDigits[i] + 9) % 10; if (i >= pinLen) pinLen = i + 1; renderPin(); };

      col.appendChild(up); col.appendChild(digit); col.appendChild(down);
      col.onclick = () => { renderPin(); };
      el.appendChild(col);
    }
  }
}
function adminUnlock() {
  if (pinLen < 4) {
    $("pinMsg").textContent = "❌ Enter all 4 digits first.";
    return;
  }
  const attempt = pinDigits.join("");
  if (attempt === ADMIN_PIN) {
    $("pinMsg").textContent = "";
    pinDigits = [0,0,0,0];
    pinLen = 0;
    hidePinEntry();
    openAdminPanel();
    return;
  }
  $("pinMsg").textContent = "❌ Wrong code. Try again.";
  pinDigits = [0,0,0,0];
  pinLen = 0;
  renderPin();
}

/* Mobile PIN entry: the tiny ▲/▼ steppers are impossible to tap on a phone,
   so touch devices get a big on-screen numpad instead. */
function setupPinEntry() {
  const row = $("pinKeyboardRow"), pad = $("pinNumpad"), kb = $("pinKeyInput");
  if (!row || !pad || !kb) return;
  $("pinMsg").textContent = "";
  if (isTouchDevice) {
    row.classList.add("hidden");
    kb.value = "";
    pad.innerHTML = "";
    for (const key of ["1","2","3","4","5","6","7","8","9","⌫","0","✓"]) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = key;
      b.onclick = () => pinNumpadKey(key);
      pad.appendChild(b);
    }
    pad.style.display = "grid";
  } else {
    row.classList.add("hidden");
    pad.style.display = "none";
    pad.innerHTML = "";
  }
}
function hidePinEntry() {
  const row = $("pinKeyboardRow"), pad = $("pinNumpad"), kb = $("pinKeyInput");
  if (!row || !pad || !kb) return;
  kb.value = "";
  pad.innerHTML = "";
  row.classList.add("hidden");
  pad.style.display = "none";
}
function pinNumpadKey(key) {
  if (key === "⌫") {
    if (pinLen > 0) { pinLen--; pinDigits[pinLen] = 0; renderPin(); }
  } else if (key === "✓") { commitPinInput(); return; }
  else if (pinLen < 4) {
    pinDigits[pinLen] = parseInt(key);
    pinLen++;
    renderPin();
  }
}
// Reads the typed/tapped code and unlocks (shared by the Go button and Enter key).
function commitPinInput() {
  if (isTouchDevice) {
    if (pinLen < 4) {
      $("pinMsg").textContent = "❌ Enter all 4 digits first.";
      return;
    }
    const attempt = pinDigits.join("");
    if (attempt === ADMIN_PIN) {
      $("pinMsg").textContent = "";
      pinDigits = [0,0,0,0];
      pinLen = 0;
      hidePinEntry();
      openAdminPanel();
      return;
    }
    $("pinMsg").textContent = "❌ Wrong code. Try again.";
    pinDigits = [0,0,0,0];
    pinLen = 0;
    renderPin();
    return;
  }
  const kb = $("pinKeyInput");
  const digits = (kb.value || "").replace(/\D/g, "");
  if (digits.length < 4) {
    $("pinMsg").textContent = "❌ Enter all 4 digits first.";
    return;
  }
  kb.value = "";
  pinDigits = digits.split("").map(Number);
  adminUnlock();
}

// One-click unlock: beat every trainer, max resources, and add every species at Lv 120.
function adminUnlockAll() {
  // Unlock everything
  for (const t of WORLDS) {
      for (const tr of (t.trainers || [])) {
        if (!state.defeated.includes(tr.id)) state.defeated.push(tr.id);
      }
    }
    state.coins = 99999;
    for (const k of Object.keys(state.items)) state.items[k] = 99;
    // Add every species to collection (one of each) at level 120
    const haveIds = new Set(state.collection.map(c => c.speciesId).filter(id => id !== null));
    for (const s of SPECIES) {
      if (!haveIds.has(s.id)) {
        const c = makeCreature(s.id, MAX_LEVEL, false);
        // Max out stats for admin power
        c.maxHp = s.baseHP + MAX_LEVEL * 3;
        c.hp = c.maxHp;
        c.atk = s.baseAtk + MAX_LEVEL * 2;
        c.xp = 0;
        state.collection.push(c);
      }
    }
    // Level up ALL existing critters to 120 and max stats
    for (const c of state.collection) {
      const s = spec(c);
      c.level = MAX_LEVEL;
      c.xp = 0;
      c.maxHp = s.baseHP + MAX_LEVEL * 3;
      c.hp = c.maxHp;
      c.atk = s.baseAtk + MAX_LEVEL * 2;
      c.status = null;
    }
    // Put first 6 in team
    state.teamIdx = state.collection.slice(0, Math.min(6, state.collection.length)).map((_, i) => i);
    saveGame(false);
    hudMsg("🔓 Admin mode activated! All critters at Lv 120 with max stats!");
    updateHUD();
    draw();
}

/* ---- Admin panel: god-mode toolkit unlocked by the PIN ---- */
function openAdminPanel() {
  inMenu = true;
  $("adminScreen").classList.add("hidden");
  $("adminPanel").classList.remove("hidden");
  renderAdminPanel();
}
function closeAdminPanel() {
  $("adminPanel").classList.add("hidden");
  inMenu = false;
  draw();
}
function renderAdminPanel() {
  const w = world();
  const area = w.segments ? (seg().name || w.name) : w.name;
  $("adminInfo").textContent = `📍 ${area}  ·  🪙 ${state.coins}  ·  ${state.collection.length} critters`;
  const box = $("adminButtons"); box.innerHTML = "";
  const addBtn = (label, desc, fn) => {
    const b = document.createElement("button");
    b.innerHTML = `<b>${label}</b><small style="display:block;font-weight:400;color:var(--muted)">${desc}</small>`;
    b.onclick = () => { fn(); saveGame(false); updateHUD(); renderAdminPanel(); };
    box.appendChild(b);
  };
  addBtn("⚡ Unlock Everything", "Beat all trainers · 99,999 coins · 99 items · every critter at Lv 120", adminUnlockAll);
  addBtn("🌀 Open All Portals", "Mark every trainer in every world as defeated", adminOpenPortals);
  addBtn("💰 +10,000 Coins", "Instant riches", () => { state.coins += 10000; });
  addBtn("🎒 Max Items", "99 of every orb, potion, antidote and candy", adminMaxItems);
  addBtn("🦊 Add All Critters", "One of every missing species (Lv 50)", () => { adminAddAllCritters(50); });
  addBtn("⛺ Heal Everything", "Full HP and no statuses for the whole collection", adminHealAll);

  // Teleport buttons: one per world, plus each Meadowlands segment.
  const tpWrap = document.createElement("div");
  tpWrap.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-top:6px;";
  tpWrap.innerHTML = `<small style="color:var(--muted)">Teleport to:</small>`;
  const tpRow = document.createElement("div");
  tpRow.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;justify-content:center;";
  WORLDS.forEach((wd, wi) => {
    const spots = wd.segments
      ? wd.segments.map((s, si) => ({ label: (s && s.name) || wd.name, si }))
      : [{ label: wd.name, si: 0 }];
    for (const sp of spots) {
      const b = document.createElement("button");
      b.textContent = sp.label;
      if (wi === state.world && sp.si === state.currentSegment) b.style.outline = "2px solid #22c55e";
      b.onclick = () => { adminTeleport(wi, sp.si); renderAdminPanel(); };
      tpRow.appendChild(b);
    }
  });
  tpWrap.appendChild(tpRow);
  box.appendChild(tpWrap);
}
function adminOpenPortals() {
  for (const t of WORLDS) for (const tr of (t.trainers || []))
    if (!state.defeated.includes(tr.id)) state.defeated.push(tr.id);
  hudMsg("🌀 All portals are now open!");
}
function adminMaxItems() {
  for (const k of Object.keys(defaultItems())) state.items[k] = 99;
  hudMsg("🎒 All items maxed out!");
}
function adminAddAllCritters(level) {
  const haveIds = new Set(state.collection.map(c => c.speciesId).filter(id => id !== null));
  let added = 0;
  for (const s of SPECIES) {
    if (haveIds.has(s.id)) continue;
    state.collection.push(makeCreature(s.id, level || 50, false));
    added++;
  }
  hudMsg(added ? `🦊 Added ${added} critters to your collection!` : "🦊 You already have every critter!");
}
function adminHealAll() {
  for (const c of state.collection) { c.hp = c.maxHp; c.status = null; }
  hudMsg("⛺ Your whole collection was fully healed!");
}
function adminTeleport(wi, si) {
  if (wi < 0 || wi >= WORLDS.length) return;
  const wd = WORLDS[wi];
  state.world = wi;
  if (wd.segments && si > 0 && si < wd.segments.length) {
    state.currentSegment = si;
  } else {
    state.currentSegment = 0;
  }
  const m = seg().map || wd.map;
  const hs = seg().healSpot || wd.healSpot;
  state.player = findWalkable(m, hs.x, hs.y);
  hudMsg(`🛠️ Teleported to ${seg().name || wd.name}!`);
  draw();
  saveGame(false); // persist the teleport so a refresh doesn't snap you back
}

/* ============ 3. OVERWORLD ============ */

const ctx = document.getElementById("map").getContext("2d");
let inBattle = false, inMenu = false;
let facing = 1;

const PLAYER_PALETTE = { skin:"#e8b88a", shirt:"#3b82f6", pants:"#1e293b", hat:"#22c55e" };
const TRAINER_PALETTES = {
  0: { skin:"#e8b88a", shirt:"#8a5a2a", pants:"#4a3520", hat:"#a97142" }, // Rex
  1: { skin:"#d9a06b", shirt:"#5a3f9e", pants:"#332255", hat:"#5a3f9e" }, // Ivy
  2: { skin:"#c98d5f", shirt:"#333333", pants:"#222222", hat:"#333333" }, // Cole
  3: { skin:"#e8b88a", shirt:"#c94a1e", pants:"#7a2f10", hat:"#f0c020" }, // Nova
  4: { skin:"#9fd06b", shirt:"#2a6b3a", pants:"#1a4525", hat:"#2a6b3a" }, // Drake
  5: { skin:"#b58ad1", shirt:"#3d2b52", pants:"#241a33", hat:"#3d2b52" }, // Sable
  6: { skin:"#e8a06b", shirt:"#e0512f", pants:"#8a2510", hat:"#e0512f" }, // Pyra
  7: { skin:"#c9c9c9", shirt:"#4a4a55", pants:"#2c2c33", hat:"#4a4a55" }, // Onyx
  8: { skin:"#e8d08a", shirt:"#c9a51e", pants:"#7a6510", hat:"#c9a51e" }, // Vex
  9: { skin:"#e8b88a", shirt:"#b01030", pants:"#500818", hat:"#ffd700" }, // Magnus (champion)
  10:{ skin:"#e8d0d8", shirt:"#3f6fa8", pants:"#274a75", hat:"#eaf4ff" }, // Glacia
  11:{ skin:"#dce7ef", shirt:"#2c4f6b", pants:"#1a3448", hat:"#7fc8e8" }, // Boreal
  12:{ skin:"#f0f6fb", shirt:"#5aa9d6", pants:"#2f5f80", hat:"#ffffff" }, // Crystal
  // ---- World 3: Ashfall Peaks trainers ----
  13:{ skin:"#e8b88a", shirt:"#c94a1e", pants:"#7a2f10", hat:"#ff6600" }, // Ember
  14:{ skin:"#8b6b4f", shirt:"#333333", pants:"#1a1a1a", hat:"#555555" }, // Obsidian
  15:{ skin:"#e8a06b", shirt:"#ff4500", pants:"#8b0000", hat:"#ff6347" }, // Cindra
  16:{ skin:"#ff8c00", shirt:"#8b0000", pants:"#4a0000", hat:"#ffd700" }, // Magmus (champion)
  // ---- World 4: Astral Expanse trainers ----
  17:{ skin:"#e8d0e8", shirt:"#9370db", pants:"#4b0082", hat:"#dda0dd" }, // Stella
  18:{ skin:"#c0d0e0", shirt:"#191970", pants:"#0d0d2b", hat:"#4169e1" }, // Cosmo
  19:{ skin:"#f0e6ff", shirt:"#6a5acd", pants:"#2f2f6f", hat:"#b0c4de" }, // Astrid
  20:{ skin:"#e0e0ff", shirt:"#000080", pants:"#000040", hat:"#ffd700" }, // Galaxius (champion)
  // ---- World 5: Yin-Yang Realm trainers ----
  21:{ skin:"#fff8dc", shirt:"#ffd700", pants:"#daa520", hat:"#ffffff" }, // Lumina
  22:{ skin:"#2f2f2f", shirt:"#1a1a2e", pants:"#0f0f1a", hat:"#4a4a6a" }, // Erebos
  23:{ skin:"#e8e0d0", shirt:"#808080", pants:"#404040", hat:"#c0c0c0" }, // Karma
  24:{ skin:"#d0d0d0", shirt:"#333333", pants:"#1a1a1a", hat:"#e0e0e0" }, // Duality
  25:{ skin:"#1a1a1a", shirt:"#ffd700", pants:"#000000", hat:"#ffffff" }, // Zenithral (champion)
  100:{ skin:"#f8d0e0", shirt:"#e84393", pants:"#c0392b", hat:"#fd79a8" }, // Lily
  101:{ skin:"#d4a574", shirt:"#27ae60", pants:"#1e8449", hat:"#2ecc71" }, // Clover
  102:{ skin:"#b8c9a3", shirt:"#7d6b5d", pants:"#5a4a3a", hat:"#8d7b68" }, // Sage
  103:{ skin:"#6b8f4a", shirt:"#2d5a1e", pants:"#1a3a0f", hat:"#3e8948" }, // Bramble
  104:{ skin:"#c4a882", shirt:"#5d4e37", pants:"#3e2f1e", hat:"#8b7355" }, // Elder Root
  // Rival Blaze (one per world, escalating) and Team Eclipse — these ids were
  // added to world trainer lists in v2.4.0 without palette entries, so drawing
  // ANY world that contains them crashed the map render.
  200:{ skin:"#e8b88a", shirt:"#e0512f", pants:"#7a2f10", hat:"#f0c020" }, // Blaze (Meadowlands)
  201:{ skin:"#e8a06b", shirt:"#c94a1e", pants:"#8a2510", hat:"#ff6600" }, // Blaze (Ember Depths)
  202:{ skin:"#e8d0d8", shirt:"#3f6fa8", pants:"#274a75", hat:"#eaf4ff" }, // Blaze (Frozen Peaks)
  203:{ skin:"#e8d0e8", shirt:"#6a5acd", pants:"#2f2f6f", hat:"#b0c4de" }, // Blaze (Yin-Yang Realm)
  210:{ skin:"#c9a58a", shirt:"#1a1a2e", pants:"#0f0f1a", hat:"#2f2f4a" }, // Eclipse Grunt
  211:{ skin:"#d9b8a8", shirt:"#2c2c54", pants:"#16162e", hat:"#8a8acd" }, // Commander Nyx
  212:{ skin:"#b8a090", shirt:"#0f0f1e", pants:"#08080f", hat:"#4a3f7a" }, // Eclipse Leader Obsidian
};

// Fallback so a trainer added without a palette can never crash the map render.
const DEFAULT_TRAINER_PALETTE = { skin:"#e8b88a", shirt:"#8a5a2a", pants:"#4a3520", hat:"#a97142" };
// Harmony Hollow townsfolk (visual only — key = npc name).
const NPC_PALETTES = {
  "Milo":          { skin:"#e8c8a0", shirt:"#4a9a4a", pants:"#3a5a2a", hat:"#7ac47a" },
  "Professor Fern": { skin:"#e8b88a", shirt:"#e8e8f0", pants:"#4a4a5a", hat:"#c9c9d9" },
  "Granny Rose":    { skin:"#e8c0b0", shirt:"#c95a7a", pants:"#6a3a4a", hat:"#e8d0d8" },
  "Tilly":          { skin:"#e8c8a0", shirt:"#5a8ac9", pants:"#2a3a5a", hat:"#a8c8e8" },
  "Finn":           { skin:"#e8b88a", shirt:"#c9884a", pants:"#4a3520", hat:"#e8c88a" },
};

// Lighten (+amt) or darken (-amt) a hex color — fakes 3D lighting.
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

// 3D-shaded character model (shadow, cylinder body, sphere head, cap).
function drawCharacter(cx, cy, pal, face = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(face, 1);

  ctx.beginPath(); ctx.ellipse(0, 16, 12, 4, 0, 0, Math.PI*2);
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fill();

  ctx.fillStyle = shade(pal.pants, -20); ctx.fillRect(-6, 7, 5, 9);
  ctx.fillStyle = pal.pants;             ctx.fillRect(1, 7, 5, 9);

  const bodyG = ctx.createLinearGradient(-8, 0, 8, 0);
  bodyG.addColorStop(0, shade(pal.shirt, 35));
  bodyG.addColorStop(0.5, pal.shirt);
  bodyG.addColorStop(1, shade(pal.shirt, -35));
  ctx.fillStyle = bodyG; roundRect(-8, -6, 16, 14, 5);

  ctx.fillStyle = shade(pal.shirt, -25); roundRect(-12, -4, 4, 10, 2);
  ctx.fillStyle = shade(pal.shirt, 15);  roundRect(8, -4, 4, 10, 2);

  const headG = ctx.createRadialGradient(-3, -16, 2, 0, -13, 9);
  headG.addColorStop(0, shade(pal.skin, 40));
  headG.addColorStop(1, shade(pal.skin, -25));
  ctx.beginPath(); ctx.arc(0, -13, 8, 0, Math.PI*2); ctx.fillStyle = headG; ctx.fill();

  ctx.fillStyle = "#222";
  ctx.beginPath(); ctx.arc(2, -13.5, 1.3, 0, Math.PI*2); ctx.arc(5.5, -13.5, 1.3, 0, Math.PI*2); ctx.fill();

  const hatG = ctx.createLinearGradient(-8, -22, 8, -16);
  hatG.addColorStop(0, shade(pal.hat, 30));
  hatG.addColorStop(1, shade(pal.hat, -30));
  ctx.beginPath(); ctx.arc(0, -16, 8.5, Math.PI, 0); ctx.fillStyle = hatG; ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, -16, 6, 2.5, 0, 0, Math.PI*2);
  ctx.fillStyle = shade(pal.hat, -15); ctx.fill();

  ctx.restore();
}

function draw() {
  const w = world(); var sm = seg();
  const night = isNight();
  document.getElementById("worldName").textContent = `${(sm.name || w.name)}  ${night ? "🌙 Night" : "☀️ Day"}`;
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const t = sm.map[y][x];
    ctx.fillStyle = (sm.colors || w.colors)[t] || "#000";
    ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
    const d = (sm.deco || w.deco)[t];
    // v2.4.5 — decluttered maps: tile emojis appear ONLY where wild critters
    // can appear (the encounter tiles: grass, forests, water, caves, ✨ patches)
    // plus service tiles (⛺ heal, 🏪 shop, 🌀 portal, 📜 board, 🏡 gate).
    // Walls, paths and plain ground no longer spam filler emojis, so a patch
    // of emojis now literally means "critters lurk here" — and clean ground
    // means safe.
    if (d && ((sm.encounters || w.encounters)[t] || "HBSTGPRQ".indexOf(t) !== -1)) {
      ctx.font = "24px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffffaa";
      ctx.fillText(d, x*TILE+TILE/2, y*TILE+TILE/2);
    }
  }
  // 🏕️ Camp pocket tint: the safe spot around every ⛺ camp is washed green so
  // players can SEE where wild critters can't reach (full safe zones like the
  // starting meadow and Harmony Hollow are already safe everywhere, so no
  // tint is needed there).
  if (!isSafeArea()) {
    ctx.fillStyle = "rgba(88,220,120,0.14)";
    for (const key of campSafeTiles()) {
      const parts = key.split(",");
      ctx.fillRect((+parts[0])*TILE, (+parts[1])*TILE, TILE, TILE);
    }
  }
  for (const t of (sm.trainers || w.trainers)) {
    const beaten = state.defeated.includes(t.id);
    const faceDir = state.player.x >= t.x ? 1 : -1;
    drawCharacter(t.x*TILE+TILE/2, t.y*TILE+TILE/2, TRAINER_PALETTES[t.id] || DEFAULT_TRAINER_PALETTE, faceDir, beaten ? 0.45 : 1);
  }
  const px = state.player.x*TILE+TILE/2, py = state.player.y*TILE+TILE/2;
  ctx.beginPath(); ctx.arc(px, py+12, 15, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,215,106,.45)"; ctx.fill();
  drawCharacter(px, py, PLAYER_PALETTE, facing);

  // Townsfolk NPCs (Harmony Hollow): drawn like trainers, but nobody here
  // battles. Quest givers wear a bobbing ❗ (or ❓ when ready to turn in).
  for (const n of (sm.npcs || w.npcs || [])) {
    drawCharacter(n.x*TILE+TILE/2, n.y*TILE+TILE/2, NPC_PALETTES[n.name] || DEFAULT_TRAINER_PALETTE, state.player.x >= n.x ? 1 : -1);
    const q = QUESTS.find(qq => qq.npc === n.name);
    if (q) {
      const qs = questState(q.key);
      if (qs.stage !== "done") {
        const ready = qs.stage === "active" && qs.n >= q.goal;
        ctx.font = "16px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = ready ? "#ffd76a" : "#ff5a5a";
        ctx.fillText(ready ? "❓" : "❗", n.x*TILE+TILE/2, n.y*TILE - 20 + Math.sin(Date.now()/250)*3);
      }
    }
  }
  // 💬 hint when standing next to a townsfolk
  const nearNpc = adjacentNpc();
  if (nearNpc) {
    ctx.font = "12px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText("💬 E to talk", nearNpc.x*TILE+TILE/2, nearNpc.y*TILE - 2);
  }

  // 🛡️ Safe-zone visuals: a pulsing green shield ring around the player plus a
  // banner — you always KNOW when you're standing somewhere safe. In wild
  // worlds the same visuals mark the ⛺ camp pocket (v2.4.5): every world and
  // segment has one guaranteed safe spot around its heal tent.
  if (isSafeArea() || isCampSafe(state.player.x, state.player.y)) {
    const t = Date.now()/400;
    ctx.beginPath(); ctx.arc(px, py+8, 24 + Math.sin(t)*2, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(88, 220, 120, " + (0.55 + Math.sin(t)*0.25).toFixed(3) + ")";
    ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py+8, 31, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(88, 220, 120, 0.18)"; ctx.lineWidth = 6; ctx.stroke();
    const cx2 = MAP_W*TILE/2;
    ctx.font = "bold 13px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(20,60,30,0.78)";
    roundRect(cx2-110, 8, 220, 22, 10); ctx.fill();
    ctx.fillStyle = "#8ef0a8";
    ctx.fillText(isSafeArea() ? "🏡 SAFE — no wild critters here"
                              : "🏕️ Camp safe zone — no wild critters here", cx2, 19);
  }

  // Segment transition arrows — drawn at rows where the map edge is actually
  // open (computed from the current segment's map, not hardcoded rows).
  if (world().segments) {
    var curSeg = state.currentSegment;
    var totalSegs = world().segments.length;
    var smap = sm.map || world().map;
    var openRightRows = [], openLeftRows = [];
    for (var yy = 0; yy < MAP_H; yy++) {
      if (smap[yy][MAP_W - 1] !== "#") openRightRows.push(yy);
      if (smap[yy][0] !== "#") openLeftRows.push(yy);
    }
    var arrowSize = 18 + Math.sin(Date.now() / 300) * 4; // pulsing
    ctx.save();
    ctx.font = arrowSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Right arrow (to next segment) at the middle open right-edge row
    if (curSeg < totalSegs - 1 && openRightRows.length) {
      var midR = openRightRows[Math.floor(openRightRows.length / 2)];
      var rx = (MAP_W - 1) * TILE + TILE / 2;
      var ry = midR * TILE + TILE / 2;
      ctx.fillStyle = "rgba(255, 215, 106, " + (0.5 + Math.sin(Date.now()/400)*0.3) + ")";
      ctx.fillText("➡", rx, ry);
      // Hint text when the player is near an open exit row
      if (Math.abs(state.player.x - (MAP_W-1)) < 4 && openRightRows.some(function(r){ return Math.abs(state.player.y - r) < 3; })) {
        ctx.font = "11px Nunito, sans-serif";
        ctx.fillStyle = "rgba(255, 215, 106, 0.9)";
        var nextName = world().segments[curSeg + 1].name || "next area";
        ctx.fillText("Walk right → " + nextName, rx, ry - 18);
      }
    }
    // Left arrow (to previous segment) at the middle open left-edge row
    if (curSeg > 0 && openLeftRows.length) {
      var midL = openLeftRows[Math.floor(openLeftRows.length / 2)];
      var lx = TILE / 2;
      var ly = midL * TILE + TILE / 2;
      ctx.fillStyle = "rgba(88, 166, 255, " + (0.5 + Math.sin(Date.now()/400)*0.3) + ")";
      ctx.fillText("⬅", lx, ly);
      if (state.player.x < 4 && openLeftRows.some(function(r){ return Math.abs(state.player.y - r) < 3; })) {
        ctx.font = "11px Nunito, sans-serif";
        ctx.fillStyle = "rgba(88, 166, 255, 0.9)";
        var prevName = curSeg === 2 ? "Sunflower Fields" : "Meadow";
        ctx.fillText("Walk left → " + prevName, lx + 20, ly - 18);
      }
    }
    ctx.restore();
  }

  // Night tint: a soft blue-purple overlay dims the whole map, drawn last so
  // it sits over tiles/characters without touching any of their own colors.
  if (night) {
    ctx.fillStyle = "rgba(15,15,45,0.42)";
    ctx.fillRect(0, 0, MAP_W*TILE, MAP_H*TILE);
  }
  refreshTalkBtn();
  updateHUD();
}

function hudMsg(txt) { document.getElementById("hudMsg").textContent = txt; }
function updateHUD() {
  const orbBits = ORB_TIERS.filter(o => state.items[o.key] > 0)
    .map(o => `${o.label.split(" ")[0]} ${state.items[o.key]}`).join(" ");
  var weatherInfo = getWeatherInfo();
  var nightTag = isNight() ? " 🌙" : " ☀️";
  var safeTag = isCampSafe(state.player.x, state.player.y) ? " · 🏡 SAFE" : " · ⚔️ WILD";
  document.getElementById("inventory").textContent =
    `${weatherInfo.icon} · 🪙 ${state.coins}  ·  ${orbBits || "🟠 0"}  ·  🧪 ${state.items.potion}  ·  ⚗️ ${state.items.bigpotion}  ·  🍬 ${state.items.candy}${nightTag}${safeTag}`;
}

document.addEventListener("keydown", e => {
  if (inBattle || inMenu) return;
  const k = e.key.toLowerCase();
  let dx = 0, dy = 0;
  if (k === "arrowup"    || k === "w") dy = -1;
  else if (k === "arrowdown"  || k === "s") dy = 1;
  else if (k === "arrowleft"  || k === "a") dx = -1;
  else if (k === "arrowright" || k === "d") dx = 1;
  else if (k === "e" || k === "enter" || k === " ") {
    e.preventDefault();
    if (tryTalk()) return;
    // 📋 Quest board in Harmony Hollow: read it to see every sidequest at once.
    const t = (seg().map || world().map)[state.player.y][state.player.x];
    if (t === "R") { showQuestLog(); return; }
    return;
  }
  else return;
  e.preventDefault();
  tryMove(dx, dy);
});

function doSegmentTransition(dir) {
  // dir: 1 = next segment, -1 = previous segment
  const w_ = world();
  if (!w_ || !w_.segments) return false;
  var cur = state.currentSegment;
  var total = w_.segments.length;
  if (dir === 1 && cur < total - 1) {
    state.currentSegment++;
    state.player = findWalkable(seg().map || w_.map, 0, Math.min(state.player.y, MAP_H - 1));
  } else if (dir === -1 && cur > 0) {
    state.currentSegment--;
    state.player = findWalkable(seg().map || w_.map, MAP_W - 1, Math.min(state.player.y, MAP_H - 1));
  } else {
    return false;
  }
  draw();
  hudMsg("You entered " + seg().name + "!");
  saveGame(false);
  return true;
}

function tryMove(dx, dy) {
  if (dx !== 0) facing = dx;
  const w = world();
  const sm = seg(); // FIX: `sm` was never defined here — every step threw a ReferenceError before the encounter roll
  const map = sm.map || w.map;
  const nx = state.player.x + dx, ny = state.player.y + dy;

  // Walking off the LEFT/RIGHT edge transitions between segments.
  // (Vertical transitions removed: bumping the top/bottom border used to
  // accidentally skip segments.)
  if (nx < 0 || nx >= MAP_W) {
    if (w.segments && doSegmentTransition(nx < 0 ? -1 : 1)) return true;
    return false;
  }
  if (ny < 0 || ny >= MAP_H) return false;

  // FIX: collision now uses the CURRENT SEGMENT's map, not the parent world's
  const tile = map[ny][nx];
  if (tile === "#") return false; // segment exits are the open-edge rows

  // FIX: trainers now come from the current segment too (Lily, Clover, Sage,
  // Bramble and Elder Root never appeared or battled before this fix)
  const trainer = (sm.trainers || w.trainers).find(t => t.x === nx && t.y === ny);
  if (trainer && !isCampSafe(nx, ny)) {
    // Trainers never ambush you on a ⛺ camp's safe pocket (v2.4.5) — camps are
    // rest stops, not battlegrounds. Their dialogue/story is preserved, so the
    // encounter still fires the moment you step off the camp tiles.
    // Play story on first meeting this trainer (if they have one)
    if (trainer.storyOnMeet && !state.storySeen[trainer.storyOnMeet]) {
      playStory(trainer.storyOnMeet, () => { startTrainerBattle(trainer); });
    } else {
      startTrainerBattle(trainer); // defeated trainers offer an immediate, scaled-up rematch
    }
    return false;
  }

  // Portal: sealed until every required trainer (possibly spanning multiple
  // worlds) has been defeated.    // Special rock tile 'X' in World 2 (Frozen Peaks): teleports into inner cave
  if (tile === "X" && state.world === 1) {
    state.player = { x:10, y:3 };
    draw();
    hudMsg("🪨 You squeeze through the rock and find a hidden cave!");
    return false;
  }

  const portal = (w.portals || []).find(p => p.tile === tile);
  if (portal) {
    const need = portal.requires || [];
    const beaten = need.filter(id => state.defeated.includes(id)).length;
    if (beaten < need.length) {
      const sealedMsg = portal.sealedMsg || "🌀 The portal is sealed! Defeat all trainers in this world first";
      hudMsg(`${sealedMsg} (${beaten}/${need.length}).`);
      return false;
    }
    const d = portal.dest;
    state.world = d.world;
    // Arrivals land in a world's first area unless the portal says otherwise
    // (e.g. the Harmony Hollow gate drops you in the Sunflower segment where
    // the gate tile actually lives).
    state.currentSegment = (d.seg !== undefined) ? d.seg : 0;
    state.player = { x:d.x, y:d.y };
    draw();
    hudMsg(`🌀 You stepped through the portal into ${world().name}!`);
    saveGame(false);
    if (d.world === 1) playStory("enterWorld1");
    else if (d.world === 2) playStory("enterWorld2");
    else if (d.world === 3) playStory("enterWorld3");
    else if (d.world === 4) playStory("enterWorld4");
    else if (d.world === 5) playStory("enterWorld5");
    else if (d.world === 6) playStory("enterWorld6");
    return false;
  }

  state.player.x = nx; state.player.y = ny;
  const wasNight = isNight();
  state.steps = (state.steps || 0) + 1;
  tickWeather();
  if (isNight() !== wasNight) hudMsg(isNight() ? "🌙 Night has fallen — different critters are stirring." : "☀️ The sun rises over the land.");
  draw();

  if (tile === "H") { healTeam(); hudMsg("⛺ Your critters were fully healed!"); return true; }
  if (tile === "B") { healTeam(); hudMsg("⛺ Rested at the town tents — your critters are fully healed!"); return true; }
  if (tile === "S") { openShop(seg().shopItems); return true; }

  const enc = (sm.encounters || w.encounters)[tile];
  const chance = (isNight() && enc && enc.nightChance !== undefined) ? enc.nightChance : (enc && enc.chance);
  const weatherMult = weatherEncMult(tile);
  const finalChance = chance ? chance * weatherMult : 0;
  // SAFE ZONES: safe areas (towns, the starting meadow), explicitly safe
  // tiles, and the pocket around every ⛺ camp (v2.4.5) never trigger wild
  // encounters — you can always catch your breath by the heal tent.
  const tileSafe = isSafeTile(tile) || isCampSafe(nx, ny);
  if (enc && !tileSafe && state.teamIdx.length && Math.random() < finalChance) {
    questEvent("battle"); // 📜 a wild encounter started — counts toward battle quests
    // YinYang realm (world 5) * tile: 8% chance to encounter YinYang, else 1% for other mythicals
    if (state.world === 5 && tile === "*" && Math.random() < 0.08) {
      const lvl = enc.lvl[0] + Math.floor(Math.random()*(enc.lvl[1]-enc.lvl[0]+1));
      startWildBattle(makeCreature(72, lvl, true));
    } else {
      // Some tiles have a separate nightPool of critters that only show up
      // after dark; falls back to the normal pool if none is defined.
      const pool = (isNight() && enc.nightPool) ? enc.nightPool : enc.pool;
      const sid = pool[Math.floor(Math.random()*pool.length)];
      const lvl = enc.lvl[0] + Math.floor(Math.random()*(enc.lvl[1]-enc.lvl[0]+1));
      startWildBattle(makeCreature(sid, lvl, true));
    }
  }
  return true;
}

function healTeam() {
  for (const i of state.teamIdx) {
    const c = state.collection[i];
    c.hp = c.maxHp;
    c.status = null; // healing also cures poison/freeze
  }
  saveGame(false);
}

/* ============ 4. BATTLE SYSTEM ============ */

let battle = null;
let busy = false; // true while an attack animation plays (blocks input)
const $ = id => document.getElementById(id);

function firstAliveIdx() { return state.teamIdx.find(i => state.collection[i].hp > 0); }

function startWildBattle(enemy) {
  const a = firstAliveIdx();
  if (a === undefined) { hudMsg("All your critters have fainted! Visit the ⛺ tent."); return; }
  battle = { mode:"wild", enemy, enemyQueue:[], trainer:null, activeIdx:a, over:false };
  openBattle(`A wild ${enemy.deviant ? "✨ DEVIANT " : ""}${spec(enemy).name} (Lv ${enemy.level}) appeared!`);
}

// Rematches: every trainer you've already beaten can be fought again by
// walking into them. Each rematch scales their team a bit higher than the
// last (capped so it doesn't spiral out of control), but pays out a smaller
// coin bonus than the very first win.
const REMATCH_LEVEL_STEP = 5;   // levels added per rematch attempt
const REMATCH_LEVEL_CAP  = 40;  // max total levels a rematch team can gain
const REMATCH_BONUS = 20;       // coin bonus for a rematch win (vs 50 the first time)

function startTrainerBattle(trainer) {
  const a = firstAliveIdx();
  if (a === undefined) { hudMsg("Heal your team at the ⛺ tent before battling!"); return; }
  const isRematch = state.defeated.includes(trainer.id);
  const rematchNum = (state.rematches[trainer.id] || 0) + 1; // this attempt's number, if it's a rematch
  const levelBonus = isRematch ? Math.min(REMATCH_LEVEL_STEP * rematchNum, REMATCH_LEVEL_CAP) : 0;
  const queue = trainer.team.map(([sid,lvl]) => {
    const c = makeCreature(sid, lvl + levelBonus, false); // trainers never get deviants
    // World 6 (Yin-Yang Realm, index 5) trainers get boosted HP for endgame
    // challenge — 400 HP: tough but beatable (the old 1000 HP wall made the
    // champion fights effectively unkillable even at max level)
    if (state.world === 5) {
      c.maxHp = 400;
      c.hp = 400;
    }
    return c;
  });
  battle = { mode:"trainer", enemy:queue.shift(), enemyQueue:queue, trainer, isRematch, activeIdx:a, over:false };
  const prefix = isRematch ? `🔁 Rematch! ` : "";
  openBattle(`${prefix}${trainer.name}: "${trainer.quote}" — sent out ${spec(battle.enemy).name} (Lv ${battle.enemy.level})!`);
}

function openBattle(introTxt) {
  inBattle = true; busy = false;
  $("battleLog").innerHTML = "";
  $("battleScreen").classList.remove("hidden");
  $("arena").className = "";
  if (world().battleBg) $("arena").classList.add(world().battleBg);
  log(introTxt);
  renderBattle();
}

function log(txt) {
  const d = document.createElement("div");
  d.textContent = txt;
  $("battleLog").appendChild(d);
  $("battleLog").scrollTop = 1e9;
}

/* ---- Attack animation: a type emoji flies from attacker to target,
   pops an impact burst, then `done()` applies the damage. ---- */
function animateAttack(fromId, toId, fxKey, done) {
  const arena = $("arena");
  const r = arena.getBoundingClientRect();
  const a = $(fromId).getBoundingClientRect();
  const b = $(toId).getBoundingClientRect();
  const p = document.createElement("span");
  p.className = "projectile";
  p.textContent = FX[fxKey] || "💥";
  p.style.left = (a.left - r.left + a.width/2 - 18) + "px";
  p.style.top  = (a.top  - r.top  + a.height/2 - 18) + "px";
  arena.appendChild(p);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    p.style.left = (b.left - r.left + b.width/2 - 18) + "px";
    p.style.top  = (b.top  - r.top  + b.height/2 - 18) + "px";
  }));
  setTimeout(() => {
    p.remove();
    const boom = document.createElement("span");
    boom.className = "boom";
    boom.textContent = "💥";
    boom.style.left = (b.left - r.left + b.width/2 - 22) + "px";
    boom.style.top  = (b.top  - r.top  + b.height/2 - 22) + "px";
    arena.appendChild(boom);
    setTimeout(() => boom.remove(), 300);
    // Safety net: if anything inside the turn callback throws, don't leave the
    // game permanently soft-locked (busy stuck true, no button responds) —
    // recover so the player can keep playing instead of reloading the page.
    try {
      done();
    } catch (err) {
      console.error("Battle turn error — recovered:", err);
      busy = false;
      if (inBattle && battle) renderBattle();
    }
  }, 380);
}

function animateHit(spriteId) {
  const el = $(spriteId);
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

// Small gold "✨ DEVIANT" badge shown anywhere a deviant critter is displayed.
function deviantTag(c) {
  return c.deviant ? ` <span class="deviantTag">✨ DEVIANT</span>` : "";
}
// Teal "🧬 BRED" badge for critters born from the breeding screen.
function bredTag(c) {
  return c.bred ? ` <span class="bredTag">🧬 BRED</span>` : "";
}
function cardHTML(c, label) {
  const pct = Math.max(0, c.hp / c.maxHp * 100);
  const st = c.status ? ` <span class="typeTag">${STATUS_INFO[c.status.type].icon} ${c.status.type}</span>` : "";
  return `<div class="nm">${spec(c).icon} ${spec(c).name} <span class="typeTag">${spec(c).type}</span>${deviantTag(c)}${bredTag(c)}${st}</div>
    <div style="font-size:12px;color:#aaa">${label} · Lv ${c.level}</div>
    <div class="hpbarOuter"><div class="hpbarInner ${pct<30?'low':''}" style="width:${pct}%"></div></div>
    <div style="font-size:12px">${Math.max(0,c.hp)} / ${c.maxHp} HP</div>`;
}
function spriteHTML(c) {
  return `<span class="spriteEmoji${c.deviant ? ' deviantGlow' : ''}">${spec(c).icon}</span>
    <div class="platform"></div>
    <div class="spriteName">${c.deviant ? '✨ ' : ''}${spec(c).name} Lv${c.level}</div>`;
}

function updateCards() {
  const me = cur();
  $("playerCard").innerHTML = cardHTML(me, "Your critter");
  $("enemyCard").innerHTML  = cardHTML(battle.enemy, battle.mode === "wild" ? "Wild" : battle.trainer.name + "'s");
  $("playerSprite").style.opacity = me.hp > 0 ? 1 : 0.25;
  $("enemySprite").style.opacity  = battle.enemy.hp > 0 ? 1 : 0.25;
}

function renderBattle() {
  const me = cur();
  updateCards();
  $("playerSprite").innerHTML = spriteHTML(me);
  $("enemySprite").innerHTML  = spriteHTML(battle.enemy);
  $("playerSprite").style.opacity = me.hp > 0 ? 1 : 0.25;
  $("enemySprite").style.opacity  = battle.enemy.hp > 0 ? 1 : 0.25;
  renderActions();
}

// Calculate estimated damage for UI feedback
function estimateDamage(attacker, defender, move) {
  const eff = effectiveness(spec(attacker).type, spec(defender).type);
  // Average multiplier (0.85 + 0.15) = 1.0. Using this for prediction.
  return Math.max(1, Math.round(attacker.atk * move.power / 22 * eff));
}

function renderActions() {
  const box = $("battleActions"); box.innerHTML = "";
  if (battle.over) { addBtn(box, "Continue", endBattle); return; }
  const me = cur();
  for (const mv of spec(me).moves) {
    const est = estimateDamage(me, battle.enemy, mv);
    addBtn(box, `⚔️ ${mv.name} (~${est} dmg)`, () => playerAttack(mv));
  }
  if (battle.mode === "wild") {
    let catchText = "🟠 Critter Orb (0)";
    for (let i = ORB_TIERS.length - 1; i >= 0; i--) {
      const o = ORB_TIERS[i];
      if (state.items[o.key] > 0) { catchText = `${o.label} (${state.items[o.key]})`; break; }
    }
    addBtn(box, catchText, tryCatch);
  }
  if (state.items.potion    > 0) addBtn(box, `🧪 Potion (${state.items.potion})`,        () => usePotion("potion"));
  if (state.items.bigpotion > 0) addBtn(box, `⚗️ Big Potion (${state.items.bigpotion})`, () => usePotion("bigpotion"));
  if (state.items.antidote  > 0) addBtn(box, `🧪 Antidote (${state.items.antidote})`,    () => usePotion("antidote"));
  if (state.items.awakening > 0) addBtn(box, `⏰ Awakening (${state.items.awakening})`,   () => usePotion("awakening"));
  addBtn(box, "🔄 Switch", showSwitchMenu);
  if (battle.mode === "wild") addBtn(box, "🏃 Run", tryRun);
}

function addBtn(parent, label, fn) {
  const b = document.createElement("button");
  b.textContent = label; b.onclick = fn; parent.appendChild(b);
}

function effectiveness(atkType, defType) {
  if (TYPE_CHART[atkType].includes(defType)) return 2;
  if (TYPE_CHART[defType].includes(atkType)) return 0.5;
  return 1;
}

function dealDamage(attacker, defender, move) {
  const eff = effectiveness(spec(attacker).type, spec(defender).type);
  const bonus = (spec(attacker).yinYangBonus || 1);
  const dmg = Math.max(1, Math.round(attacker.atk * move.power / 22 * eff * bonus * (0.85 + Math.random()*0.3)));
  defender.hp -= dmg;
  let msg = `${spec(attacker).name} used ${move.name}! (${dmg} dmg)`;
  if (eff === 2)   msg += " It's super effective!";
  if (eff === 0.5) msg += " It's not very effective...";
  log(msg);
}

/* ---- Status effect helpers ---- */

// Try to apply a move's status effect to the defender (one status at a time).
function applyMoveEffect(move, defender) {
  const eff = move.effect;
  if (!eff || defender.hp <= 0 || defender.status) return;
  if (Math.random() < eff.chance) {
    defender.status = { type: eff.type, turns: eff.turns };
    let effectMsg = "";
    switch(eff.type) {
      case "poison": effectMsg = "poisoned"; break;
      case "freeze": effectMsg = "frozen solid"; break;
      case "burn": effectMsg = "set ablaze"; break;
      case "paralyze": effectMsg = "paralyzed"; break;
      case "sleep": effectMsg = "fallen asleep"; break;
      default: effectMsg = `affected by ${eff.type}`;
    }
    log(`${STATUS_INFO[eff.type].icon} ${spec(defender).name} was ${effectMsg}!`);
  }
}

// Status effects tick at the end of the victim's turn.
// Returns true if the status caused a faint, false otherwise.
// For freeze/paralyze/sleep: returns true if turn should be skipped.
function tickStatus(c, spriteId) {
  if (!c.status) return false;
  
  switch(c.status.type) {
    case "poison":
      c.hp = Math.max(0, c.hp - STATUS_INFO.poison.dmg);
      log(`☠️ ${spec(c).name} takes ${STATUS_INFO.poison.dmg} poison damage!`);
      animateHit(spriteId);
      break;
    case "burn":
      c.hp = Math.max(0, c.hp - STATUS_INFO.burn.dmg);
      log(`🔥 ${spec(c).name} burns for ${STATUS_INFO.burn.dmg} damage!`);
      animateHit(spriteId);
      break;
    case "freeze":
    case "paralyze":
    case "sleep":
      // These statuses don't do damage but may prevent action
      // We'll handle the action prevention in is* functions
      break;
    default:
      return false;
  }
  
  // Decrease turns and check if status should be removed
  c.status.turns--;
  if (c.status.turns <= 0) {
    const curedMessages = {
      poison: `${spec(c).name} shook off the poison!`,
      burn: `${spec(c).name}'s flames died out!`,
      freeze: `${spec(c).name} thawed out!`,
      paralyze: `${spec(c).name} is no longer paralyzed!`,
      sleep: `${spec(c).name} woke up!`
    };
    const statusType = c.status.type; // capture the type BEFORE clearing it
    c.status = null;
    log(curedMessages[statusType] || `${spec(c).name} recovered!`);
  }
  
  updateCards();
  return c.hp <= 0;
}

// Frozen creatures lose their action. Returns true if the turn is skipped.
function isFrozen(c) {
  if (!c.status || c.status.type !== "freeze") return false;
  log(`❄️ ${spec(c).name} is frozen solid and can't move!`);
  c.status.turns--;
  if (c.status.turns <= 0) { c.status = null; log(`${spec(c).name} thawed out!`); }
  return true;
}

// Paralyzed creatures may lose their action. Returns true if the turn is skipped.
function isParalyzed(c) {
  if (!c.status || c.status.type !== "paralyze") return false;
  // 25% chance to act despite paralysis (can be adjusted)
  if (Math.random() < 0.25) {
    log(`⚡ ${spec(c).name} is paralyzed but fights through it!`);
    return false;
  }
  log(`⚡ ${spec(c).name} is paralyzed and can't move!`);
  c.status.turns--;
  if (c.status.turns <= 0) { c.status = null; log(`${spec(c).name} is no longer paralyzed!`); }
  return true;
}

// Asleep creatures lose their action. Returns true if the turn is skipped.
function isAsleep(c) {
  if (!c.status || c.status.type !== "sleep") return false;
  log(`💤 ${spec(c).name} is fast asleep!`);
  c.status.turns--;
  if (c.status.turns <= 0) { c.status = null; log(`${spec(c).name} woke up!`); }
  return true;
}

/* ---- Turn flow ---- */

function afterEnemy() {
  busy = false;
  renderBattle();
  if (battle.forceSwitch) { battle.forceSwitch = false; showSwitchMenu(true); }
}

function playerAttack(move) {
  if (busy || battle.over) return;
  busy = true;
  const me = cur();
  // Check for status conditions that prevent action
  if (isFrozen(me) || isParalyzed(me) || isAsleep(me)) {
    updateCards();
    setTimeout(() => enemyTurn(afterEnemy), 400);
    busy = false;
    return;
  }
  animateAttack("playerSprite", "enemySprite", spec(me).type, () => {
    dealDamage(me, battle.enemy, move);
    animateHit("enemySprite");
    applyMoveEffect(move, battle.enemy);
    updateCards();
    if (battle.enemy.hp <= 0) { onEnemyFaint(); busy = false; renderBattle(); return; }
    // Your own status effects tick at the end of your turn
    if (tickStatus(me, "playerSprite")) { handleStatusFaint(); return; }
    setTimeout(() => enemyTurn(afterEnemy), 350);
  });
}

// Player creature fainted from poison damage.
function handleStatusFaint() {
  const me = cur();
  log(`${spec(me).name} fainted!`);
  busy = false;
  if (firstAliveIdx() === undefined) {
    log("You have no critters left... you rush back to the tent!");
    battle.over = true; battle.lost = true;
    renderBattle();
  } else {
    renderBattle();
    showSwitchMenu(true);
  }
}

function enemyTurn(cb) {
  const me = cur();
  const en = battle.enemy;
  if (isFrozen(en)) { // enemy frozen: skips its attack
    updateCards();
    if (tickStatus(en, "enemySprite")) { onEnemyFaint(); busy = false; renderBattle(); return; }
    cb();
    return;
  }
  const mv = spec(en).moves[Math.floor(Math.random()*2)];
  animateAttack("enemySprite", "playerSprite", spec(en).type, () => {
    dealDamage(en, me, mv);
    animateHit("playerSprite");
    applyMoveEffect(mv, me);
    updateCards();
    if (me.hp <= 0) {
      me.hp = 0;
      log(`${spec(me).name} fainted!`);
      if (firstAliveIdx() === undefined) {
        log("You have no critters left... you rush back to the tent!");
        battle.over = true; battle.lost = true;
      } else {
        battle.forceSwitch = true;
      }
      cb();
      return;
    }
    // Enemy's poison ticks at the end of its turn
    if (tickStatus(en, "enemySprite")) { onEnemyFaint(); busy = false; renderBattle(); return; }
    cb();
  });
}

function tryCatch() {
  if (busy || battle.over) return;

  // Use the best orb tier the player currently owns (highest catch bonus first).
  let orbTier = null;
  for (let i = ORB_TIERS.length - 1; i >= 0; i--) {
    if (state.items[ORB_TIERS[i].key] > 0) { orbTier = ORB_TIERS[i]; break; }
  }
  if (!orbTier) {
    log("You're out of Critter Orbs! Buy more at the 🏪 shop.");
    return;
  }
  state.items[orbTier.key]--;

  busy = true;
  updateHUD();
  const e = battle.enemy;

  // Base catch rate calculation (scaled by remaining HP), then scaled down by
  // the species' rarity, then scaled back up by the orb's bonus.
  const rarity = speciesRarity(spec(e));
  const rarityMult = RARITY_CATCH_MULT[rarity] ?? 1;
  const baseChance = Math.min(0.9, Math.max(0.1, 0.25 + 0.65 * (1 - e.hp / e.maxHp))) * rarityMult;
  const catchRate = Math.min(0.98, baseChance * orbTier.mult);
  const cureStatus = orbTier.cures;
  // Sub-1% rates would display as "0% chance" if rounded to a whole number,
  // which is confusing for rare/mythical catches — show 2 decimals instead.
  const catchPct = catchRate * 100;
  const catchPctStr = catchPct < 1 ? catchPct.toFixed(2) : Math.round(catchPct);
  const rarityNote = rarity === "mythical" ? " — mythical, incredibly rare!"
                    : rarity === "rare" ? " — a rare species!" : "";

  animateAttack("playerSprite", "enemySprite", "Orb", () => {
    log(`You threw a ${orbTier.label}... (${catchPctStr}% chance)${rarityNote}`);
    if (Math.random() < catchRate) {
      log(`🎉 Gotcha! ${e.deviant ? "✨ DEVIANT " : ""}${spec(e).name} was caught!`);
      e.status = null; // caught critters are always cured of status
      if (cureStatus) log(`The ${orbTier.label}'s energy also healed its status condition!`);
      grantXP(e.level); // your active critter side still gets XP for a successful capture
      state.collection.push(e);
      state.stats.crittersCaught++; // 📊
      questEvent("catch"); // 📜 sidequest progress (e.g. Prof. Fern's field study)
      if (state.teamIdx.length < 6) state.teamIdx.push(state.collection.length - 1);
      battle.over = true;
      busy = false;
      renderBattle();
    } else {
      log("Oh no, it broke free!");
      setTimeout(() => enemyTurn(afterEnemy), 350);
    }
  });
}

function usePotion(kind) {
  if (busy || battle.over) return;
  const me = cur();
  
  // Handle status cure items
  if (kind === "antidote") {
    if (me.status && (me.status.type === "poison" || me.status.type === "burn")) {
      state.items.antidote--;
      const curedType = me.status.type;
      me.status = null;
      log(`You used an 🧪 Antidote! ${spec(me).name} was cured of ${curedType}!`);
    } else {
      log(`${spec(me).name} doesn't have a curable status condition!`);
      busy = false;
      return;
    }
  } else if (kind === "awakening") {
    if (me.status && (me.status.type === "paralyze" || me.status.type === "sleep")) {
      state.items.awakening--;
      me.status = null;
      log(`You used a ⏰ Awakening! ${spec(me).name} woke up!`);
    } else {
      log(`${spec(me).name} isn't asleep or paralyzed!`);
      busy = false;
      return;
    }
  } else {
    // Handle healing items (potions)
    if (me.hp >= me.maxHp) { 
      log(`${spec(me).name} is already at full HP!`); 
      busy = false;
      return; 
    }
    busy = true;
    state.items[kind]--;
    const amount = kind === "potion" ? 30 : me.maxHp;
    me.hp = Math.min(me.maxHp, me.hp + amount);
    log(`You used a ${kind === "potion" ? "🧪 Potion" : "⚗️ Big Potion"}! ${spec(me).name} recovered HP.`);
  }
  
  updateCards(); updateHUD();
  setTimeout(() => enemyTurn(afterEnemy), 400);
}

function tryRun() {
  if (busy || battle.over) return;
  busy = true;
  if (Math.random() < 0.7) { log("You got away safely!"); battle.over = true; renderBattle(); }
  else { log("Couldn't escape!"); enemyTurn(afterEnemy); }
}

function showSwitchMenu(forced) {
  const box = $("battleActions"); box.innerHTML = "";
  for (const i of state.teamIdx) {
    const c = state.collection[i];
    const b = document.createElement("button");
    b.textContent = `${spec(c).icon} ${spec(c).name} Lv${c.level} (${Math.max(0,c.hp)}HP)`;
    b.disabled = c.hp <= 0 || i === battle.activeIdx;
    b.onclick = () => {
      battle.activeIdx = i;
      log(`Go, ${spec(c).name}!`);
      renderBattle();
      if (!forced) { busy = true; setTimeout(() => enemyTurn(afterEnemy), 350); }
    };
    box.appendChild(b);
  }
  if (!forced) addBtn(box, "Back", renderActions);
}

function onEnemyFaint() {
  log(`Enemy ${spec(battle.enemy).name} fainted!`);
  grantXP(battle.enemy.level);
  const coins = battle.enemy.level * 3;
  state.coins += coins;
  state.stats.battlesWon++;            // 📊 each enemy critter defeated counts
  state.stats.coinsEarned += coins;    // 📊
  log(`💰 You earned ${coins} coins!`);
  updateHUD();
  if (battle.mode === "trainer" && battle.enemyQueue.length) {
    battle.enemy = battle.enemyQueue.shift();
    log(`${battle.trainer.name} sent out ${spec(battle.enemy).name} (Lv ${battle.enemy.level})!`);
  } else {
    if (battle.mode === "trainer") {
      if (battle.isRematch) {
        state.rematches[battle.trainer.id] = (state.rematches[battle.trainer.id] || 0) + 1;
        log(`🔁 Rematch win against ${battle.trainer.name}! Bonus: ${REMATCH_BONUS} coins!`);
        state.coins += REMATCH_BONUS;
        state.stats.coinsEarned += REMATCH_BONUS;   // 📊
      } else {
        log(`🏆 You defeated ${battle.trainer.name}! Bonus: 50 coins!`);
        state.coins += 50;
        state.stats.coinsEarned += 50;              // 📊
        state.defeated.push(battle.trainer.id);
        questEvent("trainer"); // 📜 sidequest progress (e.g. Granny Rose's champion trial)
        const need = world().portals || [];
        const beatenId = battle.trainer.id;
        need.forEach(portal => {
          const req = portal.requires || [];
          if (!req.length || !req.includes(beatenId)) return; // not relevant to this portal
          const beaten = req.filter(id => state.defeated.includes(id)).length;
          if (beaten === req.length) log("🌀 A portal hums... it is now OPEN!");
          else log(`🌀 Portal progress: ${beaten}/${req.length} trainers defeated.`);
        });
        battle.pendingStory = storyKeyForTrainer(battle.trainer.id); // played once battle screen closes
      }
      updateHUD();
    }
    battle.over = true;
  }
}

// Applies XP to a creature, handling any level-ups (using the rarity-scaled
// threshold from xpNeeded) and evolution checks. Returns an array of message
// strings describing what happened — the caller decides where to show them
// (the battle log, or a HUD message when fed outside battle).
function awardXP(creature, amount) {
  const messages = [];
  const oldLevel = creature.level;
  creature.xp += amount;
  while (creature.xp >= xpNeeded(creature) && creature.level < MAX_LEVEL) {
    creature.xp -= xpNeeded(creature);
    creature.level++; creature.maxHp += 3; creature.atk += 2; creature.hp = Math.min(creature.maxHp, creature.hp + 3);
    messages.push(`⬆️ ${spec(creature).name} grew to Lv ${creature.level}!`);
  }
  if (creature.level >= MAX_LEVEL) creature.xp = 0;

  // Check for evolution
  if (creature.level > oldLevel) {
    for (const evo of EVOLUTIONS) {
      if (evo.from === creature.speciesId && creature.level >= evo.level) {
        // Evolve the critter
        creature.speciesId = evo.to;
        creature.maxHp = SPECIES[evo.to].baseHP + creature.level * 3;
        creature.atk = SPECIES[evo.to].baseAtk + creature.level * 2;
        creature.hp = Math.min(creature.maxHp, creature.hp); // Ensure HP doesn't exceed max
        messages.push(`🌟 ${spec(creature).name} evolved into ${SPECIES[evo.to].name}!`);
        break; // Only evolve once per level up
      }
    }
  }
  return messages;
}

function grantXP(enemyLevel) {
  const me = cur();
  const amount = enemyLevel * 12;
  log(`${spec(me).name} gained ${amount} XP.`);
  for (const msg of awardXP(me, amount)) log(msg);
}

// Feed a 🍬 Candy Bar to a collection critter outside of battle — grants a
// flat chunk of XP (rarer critters still need more XP per level to grow,
// via xpNeeded's rarity multiplier, so a candy goes further on a common critter).
function feedCandy(i, type) {
  type = type || "candy";
  var xpMap = { candy: CANDY_XP, supercandy: SUPER_CANDY_XP, megacandy: MEGA_CANDY_XP };
  var labelMap = { candy: "Candy Bar", supercandy: "Super Candy", megacandy: "Mega Candy" };
  var xp = xpMap[type] || CANDY_XP;
  var label = labelMap[type] || "Candy";
  if ((state.items[type] || 0) <= 0) { hudMsg("You don't have any " + label + " - buy from the shop!"); return; }
  const c = state.collection[i];
  if (!c) return;
  state.items[type]--;
  const msgs = awardXP(c, xp);
  saveGame(false);
  updateHUD();
  openTeam();
  hudMsg("Fed a " + label + " to " + spec(c).name + " (+" + xp + " XP)." + (msgs.length ? " " + msgs.join(" ") : ""));
}

function endBattle() {
  $("battleScreen").classList.add("hidden");
  inBattle = false;
  for (const i of state.teamIdx) state.collection[i].status = null; // statuses end with the battle
  if (battle.lost) {
    // Fainted in the town? The town tents catch you — no walking home.
    const hs = (state.world === 6) ? { x:11, y:14 } : { ...world().healSpot };
    state.player = hs;
    healTeam();
    hudMsg("You blacked out and woke at the tent, fully healed.");
  }
  const pendingStory = battle && battle.pendingStory;
  battle = null;
  saveGame(false);
  draw();
  if (pendingStory) playStory(pendingStory);
  refreshTalkBtn();
}

/* ---- Quest log — the 📜 board in Harmony Hollow ---- */
function showQuestLog() {
  inMenu = true;
  const list = $("questLogList"); list.innerHTML = "";
  let any = false;
  for (const q of QUESTS) {
    const qs = questState(q.key);
    any = true;
    const row = document.createElement("div");
    row.className = "shopRow";
    let status;
    if (qs.stage === "available") status = "❗ NEW — talk to " + q.npc;
    else if (qs.stage === "done") status = "✅ Complete";
    else status = (qs.n >= q.goal ? "❓ Ready! Return to " + q.npc : q.progress(qs.n));
    row.innerHTML = `<b>${q.icon} ${q.npc}</b> <small>${q.offer}</small><span>${status}</span>`;
    list.appendChild(row);
  }
  if (!any) list.innerHTML = "<p>No quests posted yet.</p>";
  $("questLogScreen").classList.remove("hidden");
}
function closeQuestLog() { $("questLogScreen").classList.add("hidden"); inMenu = false; }

/* ============ 5. SHOP / TEAM / UPDATES UI ============ */

function openShop(si) {
  inMenu = true;
  renderShop(si);
  $("shopScreen").classList.remove("hidden");
}
function renderShop(si) {
  var items = si ? SHOP_ITEMS.filter(function(it) { return si.indexOf(it.key) !== -1; }) : SHOP_ITEMS;
  $("shopCoins").textContent = `🪙 ${state.coins}`;
  const list = $("shopList"); list.innerHTML = "";
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "shopRow";
    row.innerHTML = `<b>${item.label}</b> <small>${item.desc}</small>
      <span>Owned: ${state.items[item.key]}</span>`;
    const b = document.createElement("button");
    b.textContent = `Buy — ${item.price} 🪙`;
    b.disabled = state.coins < item.price;
    b.onclick = () => {
      state.coins -= item.price;
      state.items[item.key]++;
      saveGame(false);
      updateHUD();
      renderShop(si); // FIX: was renderShop() with no args — buying re-listed every shop item
    };
    row.appendChild(b);
    list.appendChild(row);
  }
}
function closeShop() { $("shopScreen").classList.add("hidden"); inMenu = false; }

function openTeam() {
  if (inBattle) return;
  inMenu = true;
  const list = $("collectionList"); list.innerHTML = "";
  state.collection.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "critRow" + (state.teamIdx.includes(i) ? " inTeam" : "");
    row.innerHTML = `<span style="font-size:22px">${spec(c).icon}</span>
      <b>${spec(c).name}</b> <span class="typeTag">${spec(c).type}</span>${deviantTag(c)}${bredTag(c)}
      <span>Lv ${c.level} · ${Math.max(0,c.hp)}/${c.maxHp} HP · ATK ${c.atk} · ${c.level >= MAX_LEVEL ? 'MAX' : c.xp+'/'+xpNeeded(c)+' XP'}</span>
      <span style="margin-left:auto;color:#ffd76a">${state.teamIdx.includes(i) ? "★ In team" : "☆ Reserve"}</span>`;
    row.style.cursor = "pointer";
    row.onclick = () => toggleTeam(i);
    // Candy feeding is a separate action from the team-toggle click on the
    // row, so it needs its own button and must stop the click from bubbling.
    var candyTypes = [{key:"candy",label:"Candy"},{key:"supercandy",label:"Super Candy"},{key:"megacandy",label:"Mega Candy"}];
    candyTypes.forEach(function(ct) { if ((state.items[ct.key] || 0) > 0) { var cb = document.createElement("button"); cb.textContent = ct.label + " (" + state.items[ct.key] + ")"; cb.onclick = function(e) { e.stopPropagation(); feedCandy(i, ct.key); }; row.appendChild(cb); } });
    list.appendChild(row);
  });
  $("teamScreen").classList.remove("hidden");
}
function toggleTeam(i) {
  const pos = state.teamIdx.indexOf(i);
  if (pos >= 0) {
    if (state.teamIdx.length === 1) { alert("You need at least 1 critter in your team!"); return; }
    state.teamIdx.splice(pos, 1);
  } else {
    if (state.teamIdx.length >= 6) { alert("Team is full (max 6)!"); return; }
    state.teamIdx.push(i);
  }
  saveGame(false);
  openTeam();
}
function closeTeam() { $("teamScreen").classList.add("hidden"); inMenu = false; }

/* ---- Breeding screen ---- */
let breedSelection = []; // up to 2 indices into state.collection

function openBreed() {
  if (inBattle) return;
  inMenu = true;
  breedSelection = [];
  renderBreed();
  $("breedScreen").classList.remove("hidden");
}
function closeBreed() { $("breedScreen").classList.add("hidden"); inMenu = false; }

function toggleBreedSelect(i) {
  const pos = breedSelection.indexOf(i);
  if (pos >= 0) breedSelection.splice(pos, 1);
  else {
    if (breedSelection.length >= 2) breedSelection.shift(); // swap out the oldest pick
    breedSelection.push(i);
  }
  renderBreed();
}

function renderBreed() {
  $("breedCost").textContent = BREED_COST;

  const list = $("breedList"); list.innerHTML = "";
  let shown = 0;
  state.collection.forEach((c, i) => {
    // Only unbred (wild-caught/starter) critters can be used as breeding stock —
    // a critter that's already the product of breeding can't breed again, so it's
    // hidden from this menu entirely.
    if (c.bred) return;
    shown++;
    const row = document.createElement("div");
    const selected = breedSelection.includes(i);
    row.className = "critRow" + (selected ? " breedSelected" : "");
    row.innerHTML = `<span style="font-size:22px">${spec(c).icon}</span>
      <b>${spec(c).name}</b> <span class="typeTag">${spec(c).type}</span>${deviantTag(c)}
      <span>Lv ${c.level} · ${Math.max(0,c.hp)}/${c.maxHp} HP</span>
      <span style="margin-left:auto;color:#ffd76a">${selected ? "✔ Selected" : ""}</span>`;
    row.style.cursor = "pointer";
    row.onclick = () => toggleBreedSelect(i);
    list.appendChild(row);
  });
  if (!shown) {
    list.innerHTML = `<div style="color:#aaa;font-size:13px">You don't have any unbred critters to breed with — catch some wild critters first!</div>`;
  }

  const preview = $("breedPreview");
  if (breedSelection.length < 2) {
    preview.innerHTML = `<div style="color:#aaa;font-size:13px;margin-bottom:8px">Select 2 critters below to preview their offspring.</div>`;
    return;
  }
  const [ia, ib] = breedSelection;
  const pa = state.collection[ia], pb = state.collection[ib];
  const errors = [];
  if (ia === ib) errors.push("Pick two different critters.");
  if (pa.level < BREED_MIN_LEVEL || pb.level < BREED_MIN_LEVEL) errors.push(`Both parents must be Lv ${BREED_MIN_LEVEL}+.`);
  if (state.coins < BREED_COST) errors.push(`Not enough coins (need 🪙 ${BREED_COST}).`);

  if (errors.length) {
    preview.innerHTML = `<div class="shopRow">⚠️ ${errors.join(" ")}</div>`;
    return;
  }
  const baby = makeHybridCreature(pa, pb, 1); // pure preview — nothing is spent/saved yet
  preview.innerHTML = `<div class="shopRow">
    <span style="font-size:28px">${spec(baby).icon}</span>
    <div><b>${spec(baby).name}</b> <span class="typeTag">${spec(baby).type}</span>
    <div style="font-size:12px;color:#aaa">Baby · Lv 1 · ${baby.maxHp} HP · ATK ${baby.atk}</div></div>
    <button style="margin-left:auto" onclick="confirmBreed(${ia},${ib})">Breed! (🪙 ${BREED_COST})</button>
  </div>`;
}

function confirmBreed(ia, ib) {
  const pa = state.collection[ia], pb = state.collection[ib];
  if (!pa || !pb || ia === ib) return;
  if (pa.level < BREED_MIN_LEVEL || pb.level < BREED_MIN_LEVEL) return;
  if (state.coins < BREED_COST) return;

  state.coins -= BREED_COST;
  const baby = makeHybridCreature(pa, pb, 1);
  state.collection.push(baby);
  if (state.teamIdx.length < 6) state.teamIdx.push(state.collection.length - 1);
  breedSelection = [];

  saveGame(false);
  updateHUD();
  renderBreed();
  hudMsg(`🧬 A wild new combination! ${spec(baby).name} was born from breeding.`);
}

/* ---- Update log screen ---- */
function openUpdates() {
  if (inBattle) return;
  inMenu = true;
  const list = $("updatesList"); list.innerHTML = "";
  const firstShipped = UPDATE_LOG.findIndex(e => !e.future); // newest real version
  const newestEntry = UPDATE_LOG[firstShipped];
  // The 🗺️ Roadmap always floats to the top of the list, above every version entry.
  const ordered = [...UPDATE_LOG].sort((a, b) => (b.future ? 1 : 0) - (a.future ? 1 : 0));
  ordered.forEach(entry => {
    const div = document.createElement("div");
    div.className = "updateEntry" + (entry.future ? " future" : (entry === newestEntry ? " newest" : ""));
    div.innerHTML = `<h3>${entry.version}</h3>
      <ul>${entry.notes.map(n => `<li>${n}</li>`).join("")}</ul>`;
    list.appendChild(div);
  });
  $("updatesScreen").classList.remove("hidden");
}
function closeUpdates() { $("updatesScreen").classList.add("hidden"); inMenu = false; }

/* ---- Stats / Leaderboards screen (v2.4.5) ----
   Local lifetime totals tracked in state.stats: battles won, critters caught
   and coins earned. The ONLINE leaderboard is a placeholder — it always says
   it's in beta and coming later, exactly like the Trading screen. */
function openStats() {
  if (inBattle) return;
  inMenu = true;
  renderStats();
  $("statsScreen").classList.remove("hidden");
}
function closeStats() { $("statsScreen").classList.add("hidden"); inMenu = false; }

function renderStats() {
  const list = $("statsList"); list.innerHTML = "";

  // --- Your stats (this save) ---
  const s = state.stats;
  const card = document.createElement("div");
  card.className = "updateEntry";
  card.innerHTML = `
    <h3>📊 Your Stats</h3>
    <ul>
      <li>⚔️ Total battles won: <b>${s.battlesWon}</b></li>
      <li>🎯 Critters caught: <b>${s.crittersCaught}</b></li>
      <li>💰 Coins earned: <b>${s.coinsEarned}</b></li>
      <li>🦊 Critters in your collection: <b>${state.collection.length}</b></li>
      <li>🏆 Trainers defeated: <b>${state.defeated.length}</b></li>
    </ul>`;
  list.appendChild(card);

  // --- Online leaderboard (beta placeholder, like Trading) ---
  const online = document.createElement("div");
  online.className = "updateEntry future";
  online.innerHTML = `
    <h3>🌐 Online Leaderboard — Beta</h3>
    <ul>
      <li>🚧 Online leaderboards are in beta and will be added later.</li>
      <li>Compare battles won, critters caught and coins earned with other players once it ships!</li>
    </ul>`;
  list.appendChild(online);
}

function openTrade() {
   if (inBattle) return;
   inMenu = true;
   const tradeScreen = document.createElement("div");
   tradeScreen.id = "tradeScreen";
   tradeScreen.className = "overlay";
   tradeScreen.innerHTML = `
      <h2>💱 Trading (Beta)</h2>
      <p>Trading feature is currently in beta testing.</p>
      <p>Please check back later for full trading functionality with other players!</p>
      <button onclick="closeTrade()" style="margin-top:12px;">Close</button>
   `;
   document.getElementById("wrap").appendChild(tradeScreen);
}

function closeTrade() {
   document.getElementById("tradeScreen").remove();
   inMenu = false;
}

/* ============ 6. MOBILE TOUCH CONTROLS ============ */

// Reliable touch detection: some mobile browsers misreport hover/pointer in CSS,
// so we force-show the D-pad with JS whenever a touchscreen exists.
const isTouchDevice = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
if (isTouchDevice) document.getElementById("dpad").style.display = "flex";

// 💬 Talk button: shown only when standing next to a townsfolk (touch users
// have no E key). Refreshed from draw() via refreshTalkBtn().
function refreshTalkBtn() {
  const b = document.getElementById("talkBtn");
  if (!b) return;
  b.style.display = (!inBattle && !inMenu && adjacentNpc()) ? "" : "none";
}

// D-pad: tap to step, hold to keep walking.
function bindDpad(id, dx, dy) {
  const btn = document.getElementById(id);
  if (!btn) return;
  let timer = null;
  const step = () => { if (!inBattle && !inMenu) tryMove(dx, dy); };
  const start = e => {
    e.preventDefault();
    step();
    timer = setInterval(step, 170); // hold-to-walk repeat rate
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", stop);
  btn.addEventListener("pointerleave", stop);
  btn.addEventListener("pointercancel", stop);
}
bindDpad("dUp", 0, -1);
bindDpad("dDown", 0, 1);
bindDpad("dLeft", -1, 0);
bindDpad("dRight", 1, 0);

// Swipe on the map also moves you one tile in the swipe direction.
(function enableSwipe() {
  const cv = document.getElementById("map");
  let sx = 0, sy = 0;
  cv.addEventListener("touchstart", e => {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive:true });
  cv.addEventListener("touchend", e => {
    if (inBattle || inMenu) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return; // too short — ignore taps
    if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 1 : -1, 0);
    else tryMove(0, dy > 0 ? 1 : -1);
  }, { passive:true });
})();

/* ============ BOOT ============ */

function showStarterChoice() {
  inMenu = true;
  $("starterScreen").classList.remove("hidden");
  const box = $("starterBtns");
  for (const sid of [0, 1, 2]) {
    const s = SPECIES[sid];
    addBtn(box, `${s.icon} ${s.name} (${s.type})`, () => {
      state.collection.push(makeCreature(sid, 5));
      state.teamIdx = [0];
      $("starterScreen").classList.add("hidden");
      inMenu = false;
      saveGame(false);
      hudMsg(`You chose ${s.name}! You have 5 🟠 orbs and 150 🪙 — good luck!`);
      // Show Meadowlands greeting after choosing starter
      playStory("world0Greeting");
    });
  }
}

function buildCritterIndex() {
  var TILE_NAMES = { ",": "Grass", "f": "Forest", "~": "Water", "c": "Cave", "*": "Mythical ✨", "g": "Sunflowers" };
  var locs = {}; // speciesId -> ["World — Tile", ...]

  // Build reverse evolution map
  var evolvesFrom = {};
  for (var i = 0; i < EVOLUTIONS.length; i++) {
    evolvesFrom[EVOLUTIONS[i].to] = { from: EVOLUTIONS[i].from, level: EVOLUTIONS[i].level };
  }

  // Collect locations from all worlds and segments
  for (var w = 0; w < WORLDS.length; w++) {
    var world = WORLDS[w];
    function addEnc(encounters, worldName) {
      var tiles = Object.keys(encounters);
      for (var t = 0; t < tiles.length; t++) {
        var tile = tiles[t]; var enc = encounters[tile];
        var tileName = TILE_NAMES[tile] || tile;
        var pool = enc.pool || [];
        for (var p = 0; p < pool.length; p++) {
          var sid = pool[p];
          if (!locs[sid]) locs[sid] = [];
          var label = worldName + " — " + tileName;
          if (locs[sid].indexOf(label) === -1) locs[sid].push(label);
        }
        var np = enc.nightPool || [];
        for (var n = 0; n < np.length; n++) {
          var sid2 = np[n];
          if (!locs[sid2]) locs[sid2] = [];
          var nlabel = worldName + " — " + tileName + " (night)";
          if (locs[sid2].indexOf(nlabel) === -1) locs[sid2].push(nlabel);
        }
      }
    }
    if (world.encounters) addEnc(world.encounters, world.name);
    if (world.segments) {
      for (var s = 0; s < world.segments.length; s++) {
        var seg = world.segments[s];
        if (seg && seg.encounters) addEnc(seg.encounters, seg.name || world.name);
      }
    }
  }

  // Build the full index
  var breedPairs = { 44: "Fire + Water", 45: "Electric + Grass", 46: "Air + Rock", 47: "Mystic + Shade" };
  var result = [];
  for (var j = 0; j < SPECIES.length; j++) {
    var sp = SPECIES[j];
    var spLocs = locs[sp.id] || [];
    var notes = [];
    if (sp.id <= 2) notes.push("🎯 Starter choice");
    if (breedPairs[sp.id]) notes.push("🧬 Breed only (" + breedPairs[sp.id] + ")");
    if (evolvesFrom[sp.id]) {
      var fromSp = SPECIES[evolvesFrom[sp.id].from];
      notes.push("⬆️ Evolves from " + fromSp.name + " at Lv " + evolvesFrom[sp.id].level);
    }
    result.push({
      id: sp.id, icon: sp.icon, name: sp.name, type: sp.type,
      rarity: sp.rarity || "common",
      locations: spLocs, notes: notes,
    });
  }
  return result;
}

function renderCritterIndex() {
  var index = buildCritterIndex();
  var el = document.getElementById("critterIndex");
  if (!el) return;
  var html = '<h3 style="margin:16px 0 10px;color:var(--accent-gold);font-family: Fredoka, sans-serif;font-size:18px;">📖 Critter Index</h3>';

  // Group by world
  var worldOrder = [];
  var worldMap = {};
  for (var i = 0; i < index.length; i++) {
    var c = index[i];
    var worlds = [];
    for (var l = 0; l < c.locations.length; l++) {
      var wName = c.locations[l].split(" — ")[0];
      if (worlds.indexOf(wName) === -1) worlds.push(wName);
    }
    if (c.notes.length > 0) {
      for (var n = 0; n < c.notes.length; n++) {
        if (c.notes[n].indexOf("Starter") !== -1 && worlds.indexOf("Starter") === -1) worlds.push("Starter");
        if (c.notes[n].indexOf("Breed") !== -1 && worlds.indexOf("Breeding") === -1) worlds.push("Breeding");
      }
    }
    if (worlds.length === 0) worlds.push("Evolution Only");
    for (var w = 0; w < worlds.length; w++) {
      if (!worldMap[worlds[w]]) { worldMap[worlds[w]] = []; worldOrder.push(worlds[w]); }
      worldMap[worlds[w]].push(c);
    }
  }

  // Render each world group
  for (var wi = 0; wi < worldOrder.length; wi++) {
    var wn = worldOrder[wi];
    var critters = worldMap[wn];
    html += '<div class="critterWorldGroup">';
    html += '<div class="critterWorldHeader">' + wn + ' (' + critters.length + ')</div>';
    html += '<div class="critterGrid">';
    for (var ci = 0; ci < critters.length; ci++) {
      var cr = critters[ci];
      var rarityClass = cr.rarity !== "common" ? " rarity-" + cr.rarity : "";
      html += '<div class="critterCard' + rarityClass + '">';
      html += '<div class="critterCardIcon">' + cr.icon + '</div>';
      html += '<div class="critterCardBody">';
      html += '<div class="critterCardName">' + cr.name + ' <span class="typeTag">' + cr.type + '</span>';
      if (cr.rarity !== "common") html += ' <span class="rarityTag rarity-' + cr.rarity + '">' + cr.rarity + '</span>';
      html += '</div>';
      // Show locations for this world group
      var myLocs = [];
      for (var li = 0; li < cr.locations.length; li++) {
        if (cr.locations[li].indexOf(wn) === 0) myLocs.push(cr.locations[li].split(" — ")[1] || "");
      }
      if (myLocs.length > 0) html += '<div class="critterCardLoc">📍 ' + myLocs.join(', ') + '</div>';
      // Show notes
      for (var ni = 0; ni < cr.notes.length; ni++) {
        html += '<div class="critterCardNote">' + cr.notes[ni] + '</div>';
      }
      html += '</div></div>';
    }
    html += '</div></div>';
  }
  el.innerHTML = html;
}

function showIndex() {
  if (inBattle) return;
  inMenu = true;
  // Show "Back to Game" button only if the game has started (has a save or collection)
  var hasGame = state.collection.length > 0;
  document.getElementById("backToGameBtn").style.display = hasGame ? "" : "none";
  // Hide New Game/Continue if already in a game
  document.getElementById("newGameBtn").style.display = hasGame ? "none" : "";
  document.getElementById("continueBtn").style.display = hasGame ? "none" : "";
  renderCritterIndex();
  document.getElementById("indexScreen").classList.remove("hidden");
}
function closeIndex() {
  document.getElementById("indexScreen").classList.add("hidden");
  inMenu = false;
  draw();
}

function startNewGame() {
  // Never silently destroy an existing save — New Game used to wipe real
  // progress whenever a corrupted/broken state pushed players here.
  if (localStorage.getItem(SAVE_KEY) && !confirm("Starting a new game will permanently overwrite your existing save. Continue?")) return;
  state = freshState(); // actually reset the in-memory state, not just the save
  document.getElementById("indexScreen").classList.add("hidden");
  inMenu = false;
  playStory("intro", showStarterChoice);
  draw();
}

function continueGame() {
  document.getElementById("indexScreen").classList.add("hidden");
  inMenu = false;
  if (loadGame()) {
    draw();
    hudMsg("💾 Game loaded!");
  } else {
    hudMsg("No save found — starting new game!");
    playStory("intro", showStarterChoice);
    draw();
  }
}

// Show index screen on load
(function boot() {
  var hasSave = !!localStorage.getItem(SAVE_KEY);
  document.getElementById("indexScreen").classList.remove("hidden");
  document.getElementById("backToGameBtn").style.display = "none"; // no game yet
  document.getElementById("newGameBtn").style.display = "";
  document.getElementById("continueBtn").style.display = hasSave ? "" : "none";
  inMenu = true;
  draw();
})();
