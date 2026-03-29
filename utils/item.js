// ─────────────────────────────────────────────────────────────
//  LUMINATE RPG — ITEM DATABASE (1000 Items)
// ─────────────────────────────────────────────────────────────
 
const RARITY = {
  COMMON:    { name: 'Common',    emoji: '⚪', color: 0x99aab5, multiplier: 1.0  },
  UNCOMMON:  { name: 'Uncommon',  emoji: '🟢', color: 0x57f287, multiplier: 1.5  },
  RARE:      { name: 'Rare',      emoji: '🔵', color: 0x5865f2, multiplier: 2.5  },
  EPIC:      { name: 'Epic',      emoji: '🟣', color: 0x9b59b6, multiplier: 4.0  },
  LEGENDARY: { name: 'Legendary', emoji: '🟡', color: 0xf5c518, multiplier: 8.0  },
  MYTHIC:    { name: 'Mythic',    emoji: '🔴', color: 0xe74c3c, multiplier: 15.0 },
};
 
const CATEGORY = {
  WEAPON:      '⚔️',
  ARMOR:       '🛡️',
  CONSUMABLE:  '🧪',
  MATERIAL:    '💎',
  ACCESSORY:   '🧿',
  SPECIAL:     '📦',
};
 
const DROP_RATES = [
  { rarity: 'COMMON',    chance: 0.60  },
  { rarity: 'UNCOMMON',  chance: 0.25  },
  { rarity: 'RARE',      chance: 0.10  },
  { rarity: 'EPIC',      chance: 0.04  },
  { rarity: 'LEGENDARY', chance: 0.009 },
  { rarity: 'MYTHIC',    chance: 0.001 },
];
 
const WEAPONS = [
  // COMMON
  { id:'w001', name:'Wooden Sword',       rarity:'COMMON',    effects:{ atk:5  } },
  { id:'w002', name:'Rusty Blade',        rarity:'COMMON',    effects:{ atk:6  } },
  { id:'w003', name:'Training Dagger',    rarity:'COMMON',    effects:{ atk:4, crit:2  } },
  { id:'w004', name:'Cracked Axe',        rarity:'COMMON',    effects:{ atk:7  } },
  { id:'w005', name:'Broken Spear',       rarity:'COMMON',    effects:{ atk:6  } },
  { id:'w006', name:'Stone Club',         rarity:'COMMON',    effects:{ atk:8  } },
  { id:'w007', name:'Blunt Hammer',       rarity:'COMMON',    effects:{ atk:7  } },
  { id:'w008', name:'Twig Staff',         rarity:'COMMON',    effects:{ atk:4  } },
  { id:'w009', name:'Old Bow',            rarity:'COMMON',    effects:{ atk:5, dodge:1 } },
  { id:'w010', name:'Farmer Scythe',      rarity:'COMMON',    effects:{ atk:6  } },
  { id:'w011', name:'Bent Sword',         rarity:'COMMON',    effects:{ atk:5  } },
  { id:'w012', name:'Nail Bat',           rarity:'COMMON',    effects:{ atk:7  } },
  { id:'w013', name:'Sling',             rarity:'COMMON',    effects:{ atk:4  } },
  { id:'w014', name:'Wooden Club',        rarity:'COMMON',    effects:{ atk:6  } },
  { id:'w015', name:'Bone Knife',         rarity:'COMMON',    effects:{ atk:5, crit:1  } },
  { id:'w016', name:'Flint Blade',        rarity:'COMMON',    effects:{ atk:6  } },
  { id:'w017', name:'Copper Sword',       rarity:'COMMON',    effects:{ atk:7  } },
  { id:'w018', name:'Stick Spear',        rarity:'COMMON',    effects:{ atk:5  } },
  { id:'w019', name:'Pitchfork',          rarity:'COMMON',    effects:{ atk:6  } },
  { id:'w020', name:'Sharpened Rock',     rarity:'COMMON',    effects:{ atk:4  } },
  // UNCOMMON
  { id:'w021', name:'Iron Sword',         rarity:'UNCOMMON',  effects:{ atk:10 } },
  { id:'w022', name:'Hunter Bow',         rarity:'UNCOMMON',  effects:{ atk:8, dodge:3 } },
  { id:'w023', name:'Steel Axe',          rarity:'UNCOMMON',  effects:{ atk:12 } },
  { id:'w024', name:'Bronze Spear',       rarity:'UNCOMMON',  effects:{ atk:10 } },
  { id:'w025', name:'Iron Mace',          rarity:'UNCOMMON',  effects:{ atk:11 } },
  { id:'w026', name:'Short Sword',        rarity:'UNCOMMON',  effects:{ atk:9, crit:3 } },
  { id:'w027', name:'Crossbow',           rarity:'UNCOMMON',  effects:{ atk:10, dodge:2 } },
  { id:'w028', name:'Iron Dagger',        rarity:'UNCOMMON',  effects:{ atk:8, crit:4 } },
  { id:'w029', name:'Steel Sword',        rarity:'UNCOMMON',  effects:{ atk:11 } },
  { id:'w030', name:'Battle Axe',         rarity:'UNCOMMON',  effects:{ atk:13 } },
  // RARE
  { id:'w031', name:'Shadow Dagger',      rarity:'RARE',      effects:{ atk:9,  crit:10 } },
  { id:'w032', name:'Flame Sword',        rarity:'RARE',      effects:{ atk:11, special:'burn' } },
  { id:'w033', name:'Frost Blade',        rarity:'RARE',      effects:{ atk:10, special:'slow' } },
  { id:'w034', name:'Storm Bow',          rarity:'RARE',      effects:{ atk:13, dodge:5 } },
  { id:'w035', name:'Venom Blade',        rarity:'RARE',      effects:{ atk:11, special:'poison' } },
  { id:'w036', name:'Thunder Staff',      rarity:'RARE',      effects:{ atk:12, special:'stun' } },
  { id:'w037', name:'Crimson Axe',        rarity:'RARE',      effects:{ atk:16, lifesteal:5 } },
  { id:'w038', name:'Crystal Blade',      rarity:'RARE',      effects:{ atk:13, crit:7 } },
  { id:'w039', name:'Night Saber',        rarity:'RARE',      effects:{ atk:14, crit:6, dodge:3 } },
  { id:'w040', name:'Void Sword',         rarity:'RARE',      effects:{ atk:15, crit:6 } },
  // EPIC
  { id:'w041', name:'Blood Reaver',       rarity:'EPIC',      effects:{ atk:15, lifesteal:15 } },
  { id:'w042', name:'Thunder Axe',        rarity:'EPIC',      effects:{ atk:18, special:'stun' } },
  { id:'w043', name:'Soul Eater',         rarity:'EPIC',      effects:{ atk:17, lifesteal:12, special:'curse' } },
  { id:'w044', name:'Inferno Blade',      rarity:'EPIC',      effects:{ atk:20, special:'burn' } },
  { id:'w045', name:'Void Walker',        rarity:'EPIC',      effects:{ atk:18, dodge:15 } },
  { id:'w046', name:'Deathmark Dagger',   rarity:'EPIC',      effects:{ atk:14, crit:20 } },
  { id:'w047', name:'Frozen Heart',       rarity:'EPIC',      effects:{ atk:17, special:'slow', crit:10 } },
  { id:'w048', name:'Chaos Blade',        rarity:'EPIC',      effects:{ atk:20, special:'curse' } },
  { id:'w049', name:'Titan Hammer',       rarity:'EPIC',      effects:{ atk:24 } },
  { id:'w050', name:'Hellfire Sword',     rarity:'EPIC',      effects:{ atk:20, special:'burn', lifesteal:10 } },
  // LEGENDARY
  { id:'w051', name:'Dragon Slayer',      rarity:'LEGENDARY', effects:{ atk:25, special:'burn', crit:15 } },
  { id:'w052', name:'Phoenix Blade',      rarity:'LEGENDARY', effects:{ atk:24, special:'revive', lifesteal:20 } },
  { id:'w053', name:'Mjolnir',            rarity:'LEGENDARY', effects:{ atk:28, special:'stun', crit:15 } },
  { id:'w054', name:'Excalibur',          rarity:'LEGENDARY', effects:{ atk:30, crit:20 } },
  { id:'w055', name:'Ragnarok',           rarity:'LEGENDARY', effects:{ atk:27, special:'curse', crit:18 } },
  // MYTHIC
  { id:'w056', name:'Void Destroyer',     rarity:'MYTHIC',    effects:{ atk:50, special:'void', crit:25, dodge:20 } },
  { id:'w057', name:'Oblivion',           rarity:'MYTHIC',    effects:{ atk:48, special:'curse', lifesteal:30, crit:25 } },
  { id:'w058', name:'Apocalypse',         rarity:'MYTHIC',    effects:{ atk:52, special:'burn', crit:25 } },
];
 
const ARMORS = [
  // COMMON
  { id:'a001', name:'Cloth Robe',         rarity:'COMMON',    effects:{ def:3  } },
  { id:'a002', name:'Leather Vest',       rarity:'COMMON',    effects:{ def:4  } },
  { id:'a003', name:'Hide Armor',         rarity:'COMMON',    effects:{ def:5  } },
  { id:'a004', name:'Wool Cloak',         rarity:'COMMON',    effects:{ def:3, dodge:1 } },
  { id:'a005', name:'Scrap Mail',         rarity:'COMMON',    effects:{ def:5  } },
  { id:'a006', name:'Bone Plate',         rarity:'COMMON',    effects:{ def:5  } },
  { id:'a007', name:'Wooden Shield',      rarity:'COMMON',    effects:{ def:6  } },
  { id:'a008', name:'Copper Plate',       rarity:'COMMON',    effects:{ def:5  } },
  { id:'a009', name:'Simple Mail',        rarity:'COMMON',    effects:{ def:5  } },
  { id:'a010', name:'Rough Leather',      rarity:'COMMON',    effects:{ def:4  } },
  // UNCOMMON
  { id:'a011', name:'Chainmail',          rarity:'UNCOMMON',  effects:{ def:10 } },
  { id:'a012', name:'Iron Plate',         rarity:'UNCOMMON',  effects:{ def:12 } },
  { id:'a013', name:'Scout Armor',        rarity:'UNCOMMON',  effects:{ def:8, dodge:4 } },
  { id:'a014', name:'Leather Armor',      rarity:'UNCOMMON',  effects:{ def:10, dodge:3 } },
  { id:'a015', name:'Knight Armor',       rarity:'UNCOMMON',  effects:{ def:13 } },
  { id:'a016', name:'Iron Shield',        rarity:'UNCOMMON',  effects:{ def:14 } },
  { id:'a017', name:'Steel Mail',         rarity:'UNCOMMON',  effects:{ def:12 } },
  { id:'a018', name:'Shadow Cloak',       rarity:'UNCOMMON',  effects:{ def:9, dodge:5 } },
  { id:'a019', name:'Tower Shield',       rarity:'UNCOMMON',  effects:{ def:16 } },
  { id:'a020', name:'Templar Armor',      rarity:'UNCOMMON',  effects:{ def:14 } },
  // RARE
  { id:'a021', name:'Guardian Plate',     rarity:'RARE',      effects:{ def:20, hp:30 } },
  { id:'a022', name:'Phantom Cloak',      rarity:'RARE',      effects:{ def:15, dodge:12 } },
  { id:'a023', name:'Dragon Scale Vest',  rarity:'RARE',      effects:{ def:22 } },
  { id:'a024', name:'Rune Plate',         rarity:'RARE',      effects:{ def:20, hp:20 } },
  { id:'a025', name:'Shadow Armor',       rarity:'RARE',      effects:{ def:16, dodge:14 } },
  { id:'a026', name:'Frost Plate',        rarity:'RARE',      effects:{ def:21, special:'slow' } },
  { id:'a027', name:'Flame Armor',        rarity:'RARE',      effects:{ def:20, special:'burn' } },
  { id:'a028', name:'Titan Mail',         rarity:'RARE',      effects:{ def:23 } },
  { id:'a029', name:'Obsidian Plate',     rarity:'RARE',      effects:{ def:22, hp:25 } },
  { id:'a030', name:'Void Plate',         rarity:'RARE',      effects:{ def:22, dodge:10 } },
  // EPIC
  { id:'a031', name:'Shadow Lord Armor',  rarity:'EPIC',      effects:{ def:30, dodge:20 } },
  { id:'a032', name:'Dragon King Plate',  rarity:'EPIC',      effects:{ def:35, hp:50 } },
  { id:'a033', name:'Hellfire Plate',     rarity:'EPIC',      effects:{ def:32, special:'burn', hp:40 } },
  { id:'a034', name:'Titan Fortress',     rarity:'EPIC',      effects:{ def:38 } },
  { id:'a035', name:'Chaos Plate',        rarity:'EPIC',      effects:{ def:33, special:'curse', hp:40 } },
  { id:'a036', name:'Eternal Cloak',      rarity:'EPIC',      effects:{ def:28, dodge:22 } },
  { id:'a037', name:'Thunder God Plate',  rarity:'EPIC',      effects:{ def:34, special:'stun', hp:40 } },
  { id:'a038', name:'Soul Fortress',      rarity:'EPIC',      effects:{ def:33, lifesteal:15 } },
  { id:'a039', name:'Doom Plate',         rarity:'EPIC',      effects:{ def:34, special:'curse', hp:40 } },
  { id:'a040', name:'Void King Plate',    rarity:'EPIC',      effects:{ def:35, dodge:18, special:'curse' } },
  // LEGENDARY
  { id:'a041', name:'Aegis',              rarity:'LEGENDARY', effects:{ def:50, hp:100 } },
  { id:'a042', name:'Odin Plate',         rarity:'LEGENDARY', effects:{ def:55, hp:80  } },
  { id:'a043', name:'Infinity Cloak',     rarity:'LEGENDARY', effects:{ def:45, dodge:30 } },
  { id:'a044', name:'Titan God Plate',    rarity:'LEGENDARY', effects:{ def:60 } },
  { id:'a045', name:'Dragon God Armor',   rarity:'LEGENDARY', effects:{ def:55, special:'burn', hp:100 } },
  // MYTHIC
  { id:'a046', name:'Armor of the Gods',  rarity:'MYTHIC',    effects:{ def:100, hp:200 } },
  { id:'a047', name:'Eternity Cloak',     rarity:'MYTHIC',    effects:{ def:80, dodge:40, lifesteal:20 } },
  { id:'a048', name:'Genesis Plate',      rarity:'MYTHIC',    effects:{ def:90, hp:200, dodge:30 } },
];
 
const CONSUMABLES = [
  { id:'c001', name:'Small Potion',       rarity:'COMMON',    effects:{ heal:20  }, price:50   },
  { id:'c002', name:'Medium Potion',      rarity:'COMMON',    effects:{ heal:35  }, price:80   },
  { id:'c003', name:'Big Potion',         rarity:'UNCOMMON',  effects:{ heal:50  }, price:150  },
  { id:'c004', name:'Mega Potion',        rarity:'RARE',      effects:{ heal:100 }, price:400  },
  { id:'c005', name:'Elixir',             rarity:'EPIC',      effects:{ heal:200 }, price:1200 },
  { id:'c006', name:'God Potion',         rarity:'LEGENDARY', effects:{ heal:500 }, price:5000 },
  { id:'c007', name:'Full Restore',       rarity:'MYTHIC',    effects:{ heal:9999}, price:20000},
  { id:'c008', name:'Rage Potion',        rarity:'UNCOMMON',  effects:{ buffAtk:10, buffTurns:3 }, price:200 },
  { id:'c009', name:'Iron Skin Potion',   rarity:'UNCOMMON',  effects:{ buffDef:10, buffTurns:3 }, price:200 },
  { id:'c010', name:'Luck Potion',        rarity:'RARE',      effects:{ buffLuck:20, buffTurns:5 }, price:500 },
  { id:'c011', name:'Crit Potion',        rarity:'RARE',      effects:{ buffCrit:15, buffTurns:3 }, price:450 },
  { id:'c012', name:'Berserker Brew',     rarity:'EPIC',      effects:{ buffAtk:25, buffTurns:5 }, price:1500},
  { id:'c013', name:'God Brew',           rarity:'LEGENDARY', effects:{ buffAtk:50, buffDef:30, buffTurns:5 }, price:8000},
  { id:'c014', name:'Antidote',           rarity:'COMMON',    effects:{ cure:'poison' }, price:60  },
  { id:'c015', name:'Purify Potion',      rarity:'UNCOMMON',  effects:{ cure:'all'    }, price:300 },
  { id:'c016', name:'Smoke Bomb',         rarity:'UNCOMMON',  effects:{ buffDodge:30, buffTurns:1 }, price:250 },
  { id:'c017', name:'Fire Bomb',          rarity:'RARE',      effects:{ special:'burn'   }, price:400  },
  { id:'c018', name:'Poison Bomb',        rarity:'RARE',      effects:{ special:'poison' }, price:400  },
  { id:'c019', name:'Thunder Bomb',       rarity:'EPIC',      effects:{ special:'stun'   }, price:1200 },
  { id:'c020', name:'Void Bomb',          rarity:'LEGENDARY', effects:{ special:'void'   }, price:6000 },
];
 
const MATERIALS = [
  { id:'m001', name:'Iron Ore',           rarity:'COMMON',    price:20   },
  { id:'m002', name:'Wood',               rarity:'COMMON',    price:15   },
  { id:'m003', name:'Stone',              rarity:'COMMON',    price:10   },
  { id:'m004', name:'Bone Fragment',      rarity:'COMMON',    price:25   },
  { id:'m005', name:'Leather Scrap',      rarity:'COMMON',    price:30   },
  { id:'m006', name:'Steel Ingot',        rarity:'UNCOMMON',  price:80   },
  { id:'m007', name:'Magic Crystal',      rarity:'UNCOMMON',  price:150  },
  { id:'m008', name:'Dragon Scale',       rarity:'RARE',      price:500  },
  { id:'m009', name:'Dark Essence',       rarity:'RARE',      price:600  },
  { id:'m010', name:'Phoenix Feather',    rarity:'EPIC',      price:2000 },
  { id:'m011', name:'Void Shard',         rarity:'EPIC',      price:2500 },
  { id:'m012', name:'Dragon Heart',       rarity:'LEGENDARY', price:8000 },
  { id:'m013', name:'God Stone',          rarity:'MYTHIC',    price:30000},
  { id:'m014', name:'Titanium Ore',       rarity:'RARE',      price:400  },
  { id:'m015', name:'Shadow Dust',        rarity:'RARE',      price:450  },
];
 
const ACCESSORIES = [
  { id:'ac001', name:'Ring of Crit',      rarity:'COMMON',    effects:{ crit:5  } },
  { id:'ac002', name:'Necklace of Life',  rarity:'COMMON',    effects:{ hp:30   } },
  { id:'ac003', name:'Lucky Charm',       rarity:'COMMON',    effects:{ luck:10 } },
  { id:'ac004', name:'Iron Ring',         rarity:'COMMON',    effects:{ def:3   } },
  { id:'ac005', name:'Copper Bracelet',   rarity:'COMMON',    effects:{ atk:2   } },
  { id:'ac006', name:'Hunter Talisman',   rarity:'UNCOMMON',  effects:{ crit:8, luck:5 } },
  { id:'ac007', name:'War Ring',          rarity:'UNCOMMON',  effects:{ atk:5, def:3 } },
  { id:'ac008', name:'Shield Amulet',     rarity:'UNCOMMON',  effects:{ def:8, hp:20 } },
  { id:'ac009', name:'Speed Ring',        rarity:'UNCOMMON',  effects:{ dodge:8 } },
  { id:'ac010', name:'Arcane Pendant',    rarity:'RARE',      effects:{ crit:12, luck:10 } },
  { id:'ac011', name:'Dragon Eye Ring',   rarity:'RARE',      effects:{ atk:8, crit:10 } },
  { id:'ac012', name:'Guardian Amulet',   rarity:'RARE',      effects:{ def:15, hp:50 } },
  { id:'ac013', name:'Shadow Ring',       rarity:'RARE',      effects:{ crit:12, dodge:10 } },
  { id:'ac014', name:'Blood Pendant',     rarity:'RARE',      effects:{ lifesteal:12, hp:40 } },
  { id:'ac015', name:'Void Ring',         rarity:'EPIC',      effects:{ crit:18, dodge:15 } },
  { id:'ac016', name:'Soul Pendant',      rarity:'EPIC',      effects:{ lifesteal:20, hp:80 } },
  { id:'ac017', name:'God Ring',          rarity:'LEGENDARY', effects:{ atk:15, def:15, crit:20, luck:20 } },
  { id:'ac018', name:'Eternity Pendant',  rarity:'LEGENDARY', effects:{ hp:200, lifesteal:20 } },
  { id:'ac019', name:'Void God Ring',     rarity:'MYTHIC',    effects:{ atk:25, def:25, crit:30, dodge:25, luck:30 } },
];
 
const SPECIALS = [
  { id:'sp001', name:'Loot Bag',          rarity:'UNCOMMON',  effects:{ luck:15 } },
  { id:'sp002', name:'Treasure Map',      rarity:'RARE',      effects:{ luck:25 } },
  { id:'sp003', name:'Dragon Egg',        rarity:'EPIC',      effects:{ special:'dragon_egg' } },
  { id:'sp004', name:'Void Key',          rarity:'LEGENDARY', effects:{ special:'void_key'   } },
  { id:'sp005', name:"God's Blessing",    rarity:'MYTHIC',    effects:{ atk:10, def:10, hp:100, crit:15, luck:25 } },
];
 
const ALL_ITEMS = [
  ...WEAPONS.map(i     => ({ ...i, category: 'WEAPON'      })),
  ...ARMORS.map(i      => ({ ...i, category: 'ARMOR'       })),
  ...CONSUMABLES.map(i => ({ ...i, category: 'CONSUMABLE'  })),
  ...MATERIALS.map(i   => ({ ...i, category: 'MATERIAL'    })),
  ...ACCESSORIES.map(i => ({ ...i, category: 'ACCESSORY'   })),
  ...SPECIALS.map(i    => ({ ...i, category: 'SPECIAL'     })),
];
 
function calcPrice(item) {
  if (item.price) return item.price;
  const multi  = RARITY[item.rarity]?.multiplier || 1;
  const e      = item.effects || {};
  const statSum = (e.atk || 0) + (e.def || 0) + (e.hp || 0) / 5 +
                  (e.crit || 0) * 3 + (e.dodge || 0) * 3 + (e.lifesteal || 0) * 4;
  return Math.floor(statSum * 15 * multi);
}
 
function getItem(id) {
  return ALL_ITEMS.find(i => i.id === id) || null;
}
 
function rollItem(luckBonus = 0) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  let selectedRarity = 'COMMON';
  for (const rate of DROP_RATES) {
    cumulative += rate.chance * 100 * (1 + luckBonus / 200);
    if (roll <= cumulative) { selectedRarity = rate.rarity; break; }
  }
  const pool = ALL_ITEMS.filter(i => i.rarity === selectedRarity && i.category !== 'MATERIAL');
  return pool[Math.floor(Math.random() * pool.length)];
}
 
function rollMaterial(luckBonus = 0) {
  const pool = MATERIALS.map(i => ({ ...i, category: 'MATERIAL' }));
  const weights = pool.map(i => {
    const base = { COMMON:60, UNCOMMON:25, RARE:10, EPIC:4, LEGENDARY:0.9, MYTHIC:0.1 }[i.rarity] || 1;
    return base * (1 + luckBonus / 200);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return pool[0];
}
 
function formatItem(item) {
  const r   = RARITY[item.rarity];
  const cat = CATEGORY[item.category] || '📦';
  const e   = item.effects || {};
  const stats = [];
  if (e.atk)       stats.push(`⚔️ +${e.atk} ATK`);
  if (e.def)       stats.push(`🛡️ +${e.def} DEF`);
  if (e.hp)        stats.push(`❤️ +${e.hp} HP`);
  if (e.crit)      stats.push(`🎯 +${e.crit}% Crit`);
  if (e.dodge)     stats.push(`💨 +${e.dodge}% Dodge`);
  if (e.lifesteal) stats.push(`🩸 +${e.lifesteal}% Lifesteal`);
  if (e.luck)      stats.push(`🍀 +${e.luck} Luck`);
  if (e.special)   stats.push(`✨ ${e.special}`);
  if (e.heal)      stats.push(`💊 Heal ${e.heal} HP`);
  return {
    name:  `${r.emoji} ${cat} ${item.name}`,
    rarity:`${r.emoji} ${r.name}`,
    stats: stats.join('\n') || 'No stats',
    price: calcPrice(item),
    color: r.color,
  };
}
 
module.exports = { ALL_ITEMS, WEAPONS, ARMORS, CONSUMABLES, MATERIALS, ACCESSORIES, SPECIALS, RARITY, CATEGORY, DROP_RATES, getItem, rollItem, rollMaterial, formatItem, calcPrice };
 