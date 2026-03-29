const db    = require('./database');
const items = require('./items');

// ─────────────────────────────────────────────────────────────
//  BASE STATS PER LEVEL
// ─────────────────────────────────────────────────────────────
const BASE_STATS = { hp: 100, atk: 10, def: 5, crit: 5, dodge: 3, luck: 5 };

function getPlayerRPG(userId) {
  const user = db.getUser(userId);
  if (!user.rpg) {
    user.rpg = {
      level:     1,
      exp:       0,
      hp:        BASE_STATS.hp,
      maxHp:     BASE_STATS.hp,
      atk:       BASE_STATS.atk,
      def:       BASE_STATS.def,
      crit:      BASE_STATS.crit,
      dodge:     BASE_STATS.dodge,
      luck:      BASE_STATS.luck,
      weapon:    null,
      armor:     null,
      accessory: null,
      inventory: [],
      kills:     0,
      deaths:    0,
      area:      'forest',
    };
    db.saveUser(userId, user);
  }
  return user.rpg;
}

function savePlayerRPG(userId, rpg) {
  const user = db.getUser(userId);
  user.rpg   = rpg;
  db.saveUser(userId, user);
}

// ─── Hitung stats total (base + equipment) ───────────────────
function calcStats(rpg) {
  const base = {
    maxHp: BASE_STATS.hp + (rpg.level - 1) * 10,
    atk:   BASE_STATS.atk + (rpg.level - 1) * 2,
    def:   BASE_STATS.def + (rpg.level - 1) * 1,
    crit:  BASE_STATS.crit,
    dodge: BASE_STATS.dodge,
    luck:  BASE_STATS.luck,
  };

  const slots = [rpg.weapon, rpg.armor, rpg.accessory].filter(Boolean);
  for (const itemId of slots) {
    const item = items.getItem(itemId);
    if (!item || !item.effects) continue;
    const e = item.effects;
    if (e.atk)   base.atk   += e.atk;
    if (e.def)   base.def   += e.def;
    if (e.hp)    base.maxHp += e.hp;
    if (e.crit)  base.crit  += e.crit;
    if (e.dodge) base.dodge += e.dodge;
    if (e.luck)  base.luck  += e.luck;
  }

  base.crit  = Math.min(base.crit,  75);
  base.dodge = Math.min(base.dodge, 60);
  return base;
}

// ─── EXP untuk naik level ────────────────────────────────────
function expForLevel(level) { return level * 100; }

// ─── Tambah EXP RPG & cek level up ──────────────────────────
function addRPGExp(userId, amount) {
  const rpg = getPlayerRPG(userId);
  rpg.exp  += amount;

  let leveled = false;
  while (rpg.exp >= expForLevel(rpg.level)) {
    rpg.exp   -= expForLevel(rpg.level);
    rpg.level += 1;
    leveled    = true;

    // Bonus stats naik level
    const stats  = calcStats(rpg);
    rpg.maxHp    = stats.maxHp;
    rpg.hp       = Math.min(rpg.hp + 20, rpg.maxHp); // heal sedikit saat level up
  }

  savePlayerRPG(userId, rpg);
  return { rpg, leveled };
}

// ─── AREA SYSTEM ─────────────────────────────────────────────
const AREAS = {
  forest:   { name: '🌲 Forest',    minLevel: 1,  monsters: ['wolf','goblin','slime','bandit','forest_troll'] },
  mountain: { name: '🏔️ Mountain',  minLevel: 3,  monsters: ['bear','orc','stone_golem','mountain_troll','harpy'] },
  dungeon:  { name: '🏰 Dungeon',   minLevel: 5,  monsters: ['skeleton','vampire','dark_knight','dungeon_slime','gargoyle'] },
  volcano:  { name: '🔥 Volcano',   minLevel: 8,  monsters: ['fire_elemental','lava_golem','phoenix','magma_dragon','fire_orc'] },
  end_realm:{ name: '🌌 End Realm', minLevel: 10, monsters: ['void_demon','shadow_lord','end_dragon','chaos_knight','void_titan'] },
};

// ─── MONSTER DATABASE ─────────────────────────────────────────
const MONSTERS = {
  // Forest
  wolf:          { name:'🐺 Wolf',          hp:50,  atk:8,  def:3,  exp:15, coins:[10,25],  dropRate:1.0 },
  goblin:        { name:'👺 Goblin',         hp:40,  atk:10, def:2,  exp:12, coins:[8,20],   dropRate:1.0 },
  slime:         { name:'🟢 Slime',          hp:30,  atk:6,  def:1,  exp:8,  coins:[5,15],   dropRate:1.1 },
  bandit:        { name:'🗡️ Bandit',         hp:60,  atk:12, def:4,  exp:20, coins:[15,35],  dropRate:0.9 },
  forest_troll:  { name:'🌿 Forest Troll',   hp:80,  atk:15, def:6,  exp:30, coins:[20,50],  dropRate:0.8 },
  // Mountain
  bear:          { name:'🐻 Bear',           hp:100, atk:18, def:8,  exp:40, coins:[30,60],  dropRate:0.9 },
  orc:           { name:'👹 Orc',            hp:90,  atk:20, def:10, exp:45, coins:[35,70],  dropRate:0.9 },
  stone_golem:   { name:'🗿 Stone Golem',    hp:150, atk:15, def:20, exp:55, coins:[40,80],  dropRate:0.8 },
  mountain_troll:{ name:'🏔️ Mountain Troll', hp:120, atk:22, def:12, exp:50, coins:[40,75],  dropRate:0.8 },
  harpy:         { name:'🦅 Harpy',          hp:80,  atk:25, def:8,  exp:48, coins:[35,70],  dropRate:0.9 },
  // Dungeon
  skeleton:      { name:'💀 Skeleton',       hp:120, atk:25, def:15, exp:70, coins:[55,100], dropRate:1.0 },
  vampire:       { name:'🧛 Vampire',        hp:140, atk:30, def:12, exp:80, coins:[65,120], dropRate:0.9 },
  dark_knight:   { name:'⚔️ Dark Knight',    hp:180, atk:28, def:20, exp:90, coins:[70,130], dropRate:0.8 },
  dungeon_slime: { name:'🟣 Dungeon Slime',  hp:100, atk:20, def:18, exp:65, coins:[50,90],  dropRate:1.1 },
  gargoyle:      { name:'🗿 Gargoyle',       hp:160, atk:32, def:18, exp:85, coins:[65,120], dropRate:0.8 },
  // Volcano
  fire_elemental:{ name:'🔥 Fire Elemental', hp:200, atk:38, def:20, exp:120, coins:[90,160], dropRate:0.9 },
  lava_golem:    { name:'🌋 Lava Golem',     hp:250, atk:35, def:30, exp:130, coins:[100,180],dropRate:0.8 },
  phoenix:       { name:'🔥 Phoenix',        hp:220, atk:42, def:22, exp:140, coins:[110,190],dropRate:0.9 },
  magma_dragon:  { name:'🐉 Magma Dragon',   hp:300, atk:45, def:28, exp:160, coins:[130,220],dropRate:0.7 },
  fire_orc:      { name:'👹 Fire Orc',       hp:200, atk:40, def:25, exp:125, coins:[95,170], dropRate:0.85},
  // End Realm
  void_demon:    { name:'👿 Void Demon',     hp:350, atk:55, def:35, exp:200, coins:[180,300],dropRate:0.9 },
  shadow_lord:   { name:'🌑 Shadow Lord',    hp:400, atk:60, def:40, exp:240, coins:[210,350],dropRate:0.8 },
  end_dragon:    { name:'🐲 End Dragon',     hp:500, atk:70, def:45, exp:300, coins:[280,450],dropRate:0.7 },
  chaos_knight:  { name:'⚔️ Chaos Knight',   hp:380, atk:65, def:38, exp:260, coins:[220,380],dropRate:0.8 },
  void_titan:    { name:'🌌 Void Titan',     hp:600, atk:75, def:50, exp:350, coins:[350,550],dropRate:0.7 },
};

function getMonsterForArea(area) {
  const areaData = AREAS[area] || AREAS.forest;
  const monsterId = areaData.monsters[Math.floor(Math.random() * areaData.monsters.length)];
  const base = MONSTERS[monsterId];
  return { id: monsterId, ...base, currentHp: base.hp };
}

function getArea(areaKey) { return AREAS[areaKey] || AREAS.forest; }
function getAllAreas() { return AREAS; }

module.exports = {
  getPlayerRPG, savePlayerRPG, calcStats,
  addRPGExp, expForLevel,
  getMonsterForArea, getArea, getAllAreas,
  MONSTERS, AREAS,
};