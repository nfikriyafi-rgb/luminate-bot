// ─────────────────────────────────────────────────────────────
//  LUMINATE FISHING — GAME LOGIC
// ─────────────────────────────────────────────────────────────

const db     = require('./database');
const fishDb = require('./fishingItems');

// ─── Default player fishing data ─────────────────────────────
function defaultFishing() {
  return {
    level:          1,
    exp:            0,
    rod:            'rod_001',
    bait:           { id: 'bait_001', qty: 10 },
    area:           'river',
    totalCaught:    0,
    totalWeight:    0,
    totalEarned:    0,
    secretCaught:   0,   // total ikan SECRET yang pernah ditangkap
    questCompleted: [],  // quest reward yang sudah diterima
    inventory:      [],  // [{ fishId, weight, price }]
    rodInventory:   [],  // ['rod_002', ...]
    baitInventory:  [],  // [{ id, qty }]
  };
}

function getPlayerFishing(userId) {
  const user = db.getUser(userId);
  if (!user.fishing) {
    user.fishing = defaultFishing();
    db.saveUser(userId, user);
  }
  // Pastikan field baru ada kalau user lama
  if (user.fishing.secretCaught   === undefined) user.fishing.secretCaught   = 0;
  if (user.fishing.questCompleted === undefined) user.fishing.questCompleted = [];
  return user.fishing;
}

function savePlayerFishing(userId, fishing) {
  const user   = db.getUser(userId);
  user.fishing = fishing;
  db.saveUser(userId, user);
}

// ─── EXP untuk naik level fishing ────────────────────────────
function expForLevel(level) { return level * 80; }

function addFishingExp(userId, amount) {
  const fishing = getPlayerFishing(userId);
  fishing.exp  += amount;
  let leveled   = false;
  while (fishing.exp >= expForLevel(fishing.level)) {
    fishing.exp   -= expForLevel(fishing.level);
    fishing.level += 1;
    leveled        = true;
  }
  savePlayerFishing(userId, fishing);
  return { fishing, leveled };
}

// ─── Cek & berikan quest reward SECRET ───────────────────────
// Returns array of quest rewards yang baru saja selesai
function checkSecretQuests(fishing) {
  const newRewards = [];
  for (const quest of fishDb.SECRET_QUEST_REWARDS) {
    // Sudah dapat reward ini sebelumnya? Skip
    if (fishing.questCompleted.includes(quest.reward)) continue;
    // Sudah cukup ikan SECRET?
    if (fishing.secretCaught >= quest.secretFishCount) {
      // Berikan reward
      if (quest.type === 'rod') {
        if (!fishing.rodInventory.includes(quest.reward)) {
          fishing.rodInventory.push(quest.reward);
        }
      } else if (quest.type === 'bait') {
        const item   = fishDb.getBait(quest.reward);
        const existing = fishing.baitInventory.find(b => b.id === quest.reward);
        if (existing) {
          existing.qty += item?.qty || 1;
        } else {
          fishing.baitInventory.push({ id: quest.reward, qty: item?.qty || 1 });
        }
      }
      fishing.questCompleted.push(quest.reward);
      newRewards.push(quest);
    }
  }
  return newRewards;
}

// ─── Roll ikan berdasarkan luck, weight, area ─────────────────
function rollFish(totalLuck, totalWeight, areaKey) {
  const area          = fishDb.getArea(areaKey);
  const effectiveLuck   = totalLuck + area.luckBonus;
  const effectiveWeight = totalWeight + area.weightBonus;

  // ── Step 1: tentukan rarity ───────────────────────────────
  const luckTiers = Math.floor(effectiveLuck / 5);
  const chances   = {
    COMMON:    Math.max(20, 60 - luckTiers * 2 - area.rarityBoost * 100),
    UNCOMMON:  25,
    RARE:      Math.min(30, 10 + luckTiers * 0.8 + area.rarityBoost * 50),
    EPIC:      Math.min(15, 4  + luckTiers * 0.5 + area.rarityBoost * 30),
    LEGENDARY: Math.min(8,  0.9 + luckTiers * 0.3 + area.rarityBoost * 15),
    MYTHIC:    Math.min(4,  0.1 + luckTiers * 0.1 + area.rarityBoost * 5),
    // SECRET: sangat kecil, hanya bisa muncul di mystic_water
    SECRET:    areaKey === 'mystic_water'
      ? Math.min(1, 0.001 + (effectiveLuck / 1000) + area.rarityBoost * 2)
      : 0,
  };

  // Normalize
  const total = Object.values(chances).reduce((a, b) => a + b, 0);
  let roll    = Math.random() * total;
  let selectedRarity = 'COMMON';
  for (const [rarity, chance] of Object.entries(chances)) {
    roll -= chance;
    if (roll <= 0) { selectedRarity = rarity; break; }
  }

  // ── Step 2: pilih ikan dari rarity yang terpilih ──────────
  const pool = fishDb.FISH.filter(f => f.rarity === selectedRarity);
  if (pool.length === 0) {
    // Fallback ke COMMON kalau pool kosong
    const fallback = fishDb.FISH.filter(f => f.rarity === 'COMMON');
    return rollFromPool(fallback, effectiveWeight, false);
  }

  return rollFromPool(pool, effectiveWeight, selectedRarity === 'SECRET');
}

function rollFromPool(pool, effectiveWeight, isSecret) {
  const fish = pool[Math.floor(Math.random() * pool.length)];

  // ── Step 3: hitung berat ──────────────────────────────────
  const baseWeight  = fish.weightMin + Math.random() * (fish.weightMax - fish.weightMin);
  const weightBoost = effectiveWeight * (0.5 + Math.random());
  let   finalWeight = parseFloat((baseWeight + weightBoost * 0.3).toFixed(1));
  finalWeight       = Math.max(fish.weightMin, Math.min(fish.weightMax * 1.5, finalWeight));

  // ── Step 4: special RNG ───────────────────────────────────
  let special = null;

  // Secret fish tidak kena fail/jackpot biasa
  if (!isSecret) {
    // Jackpot (1%)
    if (Math.random() < 0.01) {
      if (Math.random() < 0.5) {
        finalWeight *= 2;
        special = { type: 'jackpot_weight', desc: '💥 JACKPOT! Berat ikan x2!' };
      } else {
        const rarityOrder = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
        const idx = rarityOrder.indexOf(fish.rarity);
        if (idx < rarityOrder.length - 1) {
          const betterRarity = rarityOrder[idx + 1];
          const betterPool   = fishDb.FISH.filter(f => f.rarity === betterRarity);
          if (betterPool.length > 0) {
            const betterFish = betterPool[Math.floor(Math.random() * betterPool.length)];
            special = { type: 'jackpot_rarity', desc: `💥 JACKPOT! Rarity naik ke ${fishDb.RARITY[betterRarity].emoji} ${betterRarity}!` };
            return { fish: betterFish, weight: finalWeight, special, failed: false, isSecret: false };
          }
        }
      }
    }

    // Treasure (5%)
    if (!special && Math.random() < 0.05) {
      const bonus = Math.floor(Math.random() * 200 + 50);
      special = { type: 'treasure', desc: `💎 Treasure! Bonus ✨ ${bonus} Lumens!`, bonus };
    }

    // Fail (5%)
    if (!special && Math.random() < 0.05) {
      return { fish: null, weight: 0, special: null, failed: true, isSecret: false };
    }
  }

  return { fish, weight: parseFloat(finalWeight.toFixed(1)), special, failed: false, isSecret };
}

module.exports = {
  getPlayerFishing, savePlayerFishing,
  expForLevel, addFishingExp,
  rollFish, defaultFishing,
  checkSecretQuests,
};