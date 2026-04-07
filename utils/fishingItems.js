// ─────────────────────────────────────────────────────────────
//  LUMINATE FISHING — ITEM & FISH DATABASE
// ─────────────────────────────────────────────────────────────

const RARITY = {
  COMMON:    { name: 'Common',    emoji: '⚪', color: 0x99aab5, priceMultiplier: 1,    dropChance: 60    },
  UNCOMMON:  { name: 'Uncommon',  emoji: '🟢', color: 0x57f287, priceMultiplier: 2,    dropChance: 25    },
  RARE:      { name: 'Rare',      emoji: '🔵', color: 0x5865f2, priceMultiplier: 4,    dropChance: 10    },
  EPIC:      { name: 'Epic',      emoji: '🟣', color: 0x9b59b6, priceMultiplier: 7,    dropChance: 4     },
  LEGENDARY: { name: 'Legendary', emoji: '🟡', color: 0xf5c518, priceMultiplier: 12,   dropChance: 0.9   },
  MYTHIC:    { name: 'Mythic',    emoji: '🔴', color: 0xe74c3c, priceMultiplier: 25,   dropChance: 0.1   },
  SECRET:    { name: 'Secret',    emoji: '❓', color: 0x2b2d31, priceMultiplier: 100,  dropChance: 0.001 },
  SPECIAL:   { name: 'Special',   emoji: '👑', color: 0xffffff, priceMultiplier: 9999, dropChance: 0     },
};

// ─── RODS ────────────────────────────────────────────────────
// ⚠️ SECRET & SPECIAL rod TIDAK dijual di shop
// SECRET rod hanya didapat dari quest menangkap ikan SECRET
// SPECIAL rod (The Rod God) hanya dari quest khusus admin
const RODS = [
  // COMMON
  { id: 'rod_001', name: 'Basic Rod',        rarity: 'COMMON',    luck: 1,   weight: 1,   price: 100,    obtainable: true  },
  { id: 'rod_002', name: 'Old Bamboo Rod',   rarity: 'COMMON',    luck: 2,   weight: 1,   price: 150,    obtainable: true  },
  // UNCOMMON
  { id: 'rod_003', name: 'Fisher Rod',       rarity: 'UNCOMMON',  luck: 3,   weight: 2,   price: 400,    obtainable: true  },
  { id: 'rod_004', name: 'Strong Rod',       rarity: 'UNCOMMON',  luck: 2,   weight: 4,   price: 450,    obtainable: true  },
  // RARE
  { id: 'rod_005', name: 'Carbon Rod',       rarity: 'RARE',      luck: 5,   weight: 5,   price: 1200,   obtainable: true  },
  { id: 'rod_006', name: 'Precision Rod',    rarity: 'RARE',      luck: 7,   weight: 4,   price: 1400,   obtainable: true  },
  // EPIC
  { id: 'rod_007', name: 'Deep Sea Rod',     rarity: 'EPIC',      luck: 8,   weight: 10,  price: 4000,   obtainable: true  },
  { id: 'rod_008', name: 'Storm Rod',        rarity: 'EPIC',      luck: 10,  weight: 8,   price: 4500,   obtainable: true  },
  // LEGENDARY
  { id: 'rod_009', name: 'Kraken Rod',       rarity: 'LEGENDARY', luck: 12,  weight: 12,  price: 15000,  obtainable: true  },
  { id: 'rod_010', name: 'Ocean King Rod',   rarity: 'LEGENDARY', luck: 15,  weight: 10,  price: 18000,  obtainable: true  },
  // MYTHIC
  { id: 'rod_011', name: 'Poseidon Rod',     rarity: 'MYTHIC',    luck: 20,  weight: 20,  price: 60000,  obtainable: true  },
  { id: 'rod_012', name: 'Void Ocean Rod',   rarity: 'MYTHIC',    luck: 25,  weight: 18,  price: 75000,  obtainable: true  },
  // SECRET — hanya dari quest menangkap ikan SECRET
  { id: 'rod_013', name: 'Phantom Rod',      rarity: 'SECRET',    luck: 35,  weight: 30,  price: 0,      obtainable: false,
    questReward: true, questDesc: 'Tangkap ikan ❓ SECRET pertamamu untuk mendapatkan rod ini!' },
  { id: 'rod_014', name: 'Celestial Rod',    rarity: 'SECRET',    luck: 40,  weight: 35,  price: 0,      obtainable: false,
    questReward: true, questDesc: 'Tangkap 5 ikan ❓ SECRET untuk mendapatkan rod ini!' },
  // SPECIAL — hanya dari admin quest
  { id: 'rod_god', name: 'The Rod God',      rarity: 'SPECIAL',   luck: 999, weight: 999, price: 0,      obtainable: false,
    questReward: false, adminOnly: true, questDesc: 'Rod terkuat di dunia. Hanya diberikan oleh Admin.' },
];

// ─── BAITS ───────────────────────────────────────────────────
// ⚠️ SECRET & SPECIAL bait TIDAK dijual di shop
const BAITS = [
  // COMMON
  { id: 'bait_001', name: 'Basic Worm',       rarity: 'COMMON',    luck: 1,   weight: 0,  price: 20,     qty: 10, obtainable: true  },
  { id: 'bait_002', name: 'Bread Bait',       rarity: 'COMMON',    luck: 2,   weight: 0,  price: 30,     qty: 10, obtainable: true  },
  // UNCOMMON
  { id: 'bait_003', name: 'Insect Bait',      rarity: 'UNCOMMON',  luck: 3,   weight: 1,  price: 80,     qty: 10, obtainable: true  },
  { id: 'bait_004', name: 'Shrimp Bait',      rarity: 'UNCOMMON',  luck: 4,   weight: 1,  price: 100,    qty: 10, obtainable: true  },
  // RARE
  { id: 'bait_005', name: 'Glow Worm',        rarity: 'RARE',      luck: 6,   weight: 2,  price: 300,    qty: 5,  obtainable: true  },
  { id: 'bait_006', name: 'Fish Chunk',       rarity: 'RARE',      luck: 5,   weight: 3,  price: 280,    qty: 5,  obtainable: true  },
  // EPIC
  { id: 'bait_007', name: 'Golden Bait',      rarity: 'EPIC',      luck: 8,   weight: 4,  price: 1000,   qty: 5,  obtainable: true  },
  { id: 'bait_008', name: 'Magic Bait',       rarity: 'EPIC',      luck: 10,  weight: 3,  price: 1200,   qty: 5,  obtainable: true  },
  // LEGENDARY
  { id: 'bait_009', name: 'Dragon Bait',      rarity: 'LEGENDARY', luck: 12,  weight: 6,  price: 5000,   qty: 3,  obtainable: true  },
  { id: 'bait_010', name: 'Ocean Core Bait',  rarity: 'LEGENDARY', luck: 15,  weight: 5,  price: 6000,   qty: 3,  obtainable: true  },
  // MYTHIC
  { id: 'bait_011', name: 'Divine Bait',      rarity: 'MYTHIC',    luck: 20,  weight: 10, price: 25000,  qty: 1,  obtainable: true  },
  { id: 'bait_012', name: 'Void Bait',        rarity: 'MYTHIC',    luck: 25,  weight: 8,  price: 30000,  qty: 1,  obtainable: true  },
  // SECRET — hanya dari quest menangkap ikan SECRET
  { id: 'bait_013', name: 'Soul Bait',        rarity: 'SECRET',    luck: 35,  weight: 15, price: 0,      qty: 3,  obtainable: false,
    questReward: true, questDesc: 'Tangkap 3 ikan ❓ SECRET untuk mendapatkan bait ini!' },
  { id: 'bait_014', name: 'Cosmic Bait',      rarity: 'SECRET',    luck: 40,  weight: 20, price: 0,      qty: 1,  obtainable: false,
    questReward: true, questDesc: 'Tangkap 10 ikan ❓ SECRET untuk mendapatkan bait ini!' },
  // SPECIAL — hanya dari admin
  { id: 'bait_god', name: 'The Bait God',     rarity: 'SPECIAL',   luck: 999, weight: 999,price: 0,      qty: 999,obtainable: false,
    questReward: false, adminOnly: true, questDesc: 'Bait terkuat di dunia. Hanya diberikan oleh Admin.' },
];

// ─── FISH ────────────────────────────────────────────────────
const FISH = [
  // COMMON
  { id: 'fish_001', name: 'Silver Minnow',          rarity: 'COMMON',    weightMin: 1,    weightMax: 3    },
  { id: 'fish_002', name: 'River Carp',              rarity: 'COMMON',    weightMin: 2,    weightMax: 5    },
  { id: 'fish_003', name: 'Bluegill Snapper',        rarity: 'COMMON',    weightMin: 1,    weightMax: 4    },
  { id: 'fish_004', name: 'Tiny Catfish',            rarity: 'COMMON',    weightMin: 2,    weightMax: 6    },
  // UNCOMMON
  { id: 'fish_005', name: 'Golden Carp',             rarity: 'UNCOMMON',  weightMin: 5,    weightMax: 10   },
  { id: 'fish_006', name: 'Striped Bass',            rarity: 'UNCOMMON',  weightMin: 6,    weightMax: 12   },
  { id: 'fish_007', name: 'Emerald Tilapia',         rarity: 'UNCOMMON',  weightMin: 4,    weightMax: 9    },
  { id: 'fish_008', name: 'Swift Pike',              rarity: 'UNCOMMON',  weightMin: 7,    weightMax: 13   },
  // RARE
  { id: 'fish_009', name: 'Crystal Salmon',          rarity: 'RARE',      weightMin: 10,   weightMax: 20   },
  { id: 'fish_010', name: 'Frostfin Trout',          rarity: 'RARE',      weightMin: 12,   weightMax: 22   },
  { id: 'fish_011', name: 'Thunder Mackerel',        rarity: 'RARE',      weightMin: 15,   weightMax: 25   },
  { id: 'fish_012', name: 'Shadow Catfish',          rarity: 'RARE',      weightMin: 14,   weightMax: 24   },
  // EPIC
  { id: 'fish_013', name: 'Blazetail Tuna',          rarity: 'EPIC',      weightMin: 20,   weightMax: 40   },
  { id: 'fish_014', name: 'Stormbreaker Eel',        rarity: 'EPIC',      weightMin: 18,   weightMax: 35   },
  { id: 'fish_015', name: 'Phantom Barracuda',       rarity: 'EPIC',      weightMin: 25,   weightMax: 45   },
  { id: 'fish_016', name: 'Lunar Koi',               rarity: 'EPIC',      weightMin: 15,   weightMax: 30   },
  // LEGENDARY
  { id: 'fish_017', name: 'Dragonfin Leviathan',     rarity: 'LEGENDARY', weightMin: 40,   weightMax: 80   },
  { id: 'fish_018', name: 'Kraken Tentacle Fish',    rarity: 'LEGENDARY', weightMin: 50,   weightMax: 90   },
  { id: 'fish_019', name: 'Solar Flame Marlin',      rarity: 'LEGENDARY', weightMin: 45,   weightMax: 85   },
  { id: 'fish_020', name: 'Abyssal Kingfish',        rarity: 'LEGENDARY', weightMin: 60,   weightMax: 100  },
  // MYTHIC
  { id: 'fish_021', name: 'Celestial Whale',         rarity: 'MYTHIC',    weightMin: 100,  weightMax: 200  },
  { id: 'fish_022', name: 'Void Serpent',            rarity: 'MYTHIC',    weightMin: 120,  weightMax: 220  },
  { id: 'fish_023', name: 'Eternal Ocean Titan',     rarity: 'MYTHIC',    weightMin: 150,  weightMax: 300  },
  { id: 'fish_024', name: 'God of Tides',            rarity: 'MYTHIC',    weightMin: 200,  weightMax: 400  },
  // SECRET — chance sangat kecil, trigger quest reward
  { id: 'fish_025', name: 'Phantom Leviathan',       rarity: 'SECRET',    weightMin: 500,  weightMax: 999  },
  { id: 'fish_026', name: 'Cosmic God Fish',         rarity: 'SECRET',    weightMin: 1000, weightMax: 9999 },
];

// ─── AREA ────────────────────────────────────────────────────
const AREAS = {
  river:        { name: '🏞️ River',        minLevel: 1,  luckBonus: 0,   weightBonus: 0,   rarityBoost: 0    },
  ocean:        { name: '🌊 Ocean',         minLevel: 3,  luckBonus: 5,   weightBonus: 3,   rarityBoost: 0.05 },
  deep_sea:     { name: '🌌 Deep Sea',      minLevel: 5,  luckBonus: 10,  weightBonus: 7,   rarityBoost: 0.10 },
  lava_lake:    { name: '🔥 Lava Lake',     minLevel: 8,  luckBonus: 15,  weightBonus: 10,  rarityBoost: 0.15 },
  mystic_water: { name: '🌠 Mystic Water',  minLevel: 10, luckBonus: 25,  weightBonus: 15,  rarityBoost: 0.25 },
};

// ─── QUEST REWARDS (SECRET rod & bait) ───────────────────────
// Berapa ikan SECRET yang harus ditangkap untuk dapat reward
const SECRET_QUEST_REWARDS = [
  { secretFishCount: 1,  reward: 'rod_013', type: 'rod',  message: '🎉 Quest Selesai! Kamu menangkap ikan SECRET pertamamu dan mendapatkan **❓ Phantom Rod**!' },
  { secretFishCount: 3,  reward: 'bait_013',type: 'bait', message: '🎉 Quest Selesai! Kamu menangkap 3 ikan SECRET dan mendapatkan **❓ Soul Bait** (x3)!' },
  { secretFishCount: 5,  reward: 'rod_014', type: 'rod',  message: '🎉 Quest Selesai! Kamu menangkap 5 ikan SECRET dan mendapatkan **❓ Celestial Rod**!' },
  { secretFishCount: 10, reward: 'bait_014',type: 'bait', message: '🎉 Quest Selesai! Kamu menangkap 10 ikan SECRET dan mendapatkan **❓ Cosmic Bait** (x1)!' },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────
function getRod(id)  { return RODS.find(r => r.id === id)   || null; }
function getBait(id) { return BAITS.find(b => b.id === id)  || null; }
function getFish(id) { return FISH.find(f => f.id === id)   || null; }
function getArea(key){ return AREAS[key] || AREAS.river;             }

// Hanya rod yang bisa dibeli di shop (obtainable: true)
function getShopRods()  { return RODS.filter(r => r.obtainable);  }
function getShopBaits() { return BAITS.filter(b => b.obtainable); }

function formatRarity(rarity) {
  const r = RARITY[rarity];
  return r ? `${r.emoji} ${r.name}` : rarity;
}

function calcFishPrice(fish, weight) {
  const r = RARITY[fish.rarity];
  return Math.floor(weight * (r?.priceMultiplier || 1));
}

module.exports = {
  RARITY, RODS, BAITS, FISH, AREAS, SECRET_QUEST_REWARDS,
  getRod, getBait, getFish, getArea,
  getShopRods, getShopBaits,
  formatRarity, calcFishPrice,
};