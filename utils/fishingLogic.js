// ─────────────────────────────────────────────────────────────
//  LUMINATE FISHING — GAME LOGIC
// ─────────────────────────────────────────────────────────────

const db      = require('./database');
const fishDb  = require('./fishingItems');

// ─── Default player fishing data ─────────────────────────────
function defaultFishing() {
  return {
    level:        1,
    exp:          0,
    rod:          'rod_001',
    bait:         { id: 'bait_001', qty: 10 },
    area:         'river',
    totalCaught:  0,
    totalWeight:  0,
    totalEarned:  0,
    inventory:    [], // [{ fishId, weight, price }]
    rodInventory: [], // ['rod_002', ...]
    baitInventory:[], // [{ id, qty }]
  };
}

function getPlayerFishing(userId) {
  const user = db.getUser(userId);
  if (!user.fishing) {
    user.fishing = defaultFishing();
    db.saveUser(userId, user);
  }
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

// ─── Roll ikan berdasarkan luck, weight, area ─────────────────
function rollFish(totalLuck, totalWeight, areaKey) {
  const area       = fishDb.getArea(areaKey);
  const effectiveLuck   = totalLuck + area.luckBonus;
  const effectiveWeight = totalWeight + area.weightBonus;

  // ── Step 1: tentukan rarity ───────────────────────────────
  // Setiap 5 luck: -2% common, +1% naik ke rare ke atas
  const luckTiers = Math.floor(effectiveLuck / 5);
  const chances   = {
    COMMON:    Math.max(20, 60 - luckTiers * 2 - area.rarityBoost * 100),
    UNCOMMON:  25,
    RARE:      Math.min(30, 10 + luckTiers * 0.8 + area.rarityBoost * 50),
    EPIC:      Math.min(15, 4  + luckTiers * 0.5 + area.rarityBoost * 30),
    LEGENDARY: Math.min(8,  0.9 + luckTiers * 0.3 + area.rarityBoost * 15),
    MYTHIC:    Math.min(4,  0.1 + luckTiers * 0.1 + area.rarityBoost * 5),
    SECRET:    Math.min(2,  0.05 + luckTiers * 0.05 + area.rarityBoost * 2),
  };

  // Normalize total ke 100
  const total = Object.values(chances).reduce((a, b) => a + b, 0);
  let roll    = Math.random() * total;
  let selectedRarity = 'COMMON';
  for (const [rarity, chance] of Object.entries(chances)) {
    roll -= chance;
    if (roll <= 0) { selectedRarity = rarity; break; }
  }

  // ── Step 2: pilih ikan dari rarity yang terpilih ──────────
  const pool = fishDb.FISH.filter(f => f.rarity === selectedRarity);
  const fish = pool[Math.floor(Math.random() * pool.length)];

  // ── Step 3: hitung berat ──────────────────────────────────
  const baseWeight   = fish.weightMin + Math.random() * (fish.weightMax - fish.weightMin);
  const weightBoost  = effectiveWeight * (0.5 + Math.random());
  let   finalWeight  = parseFloat((baseWeight + weightBoost * 0.3).toFixed(1));
  finalWeight        = Math.max(fish.weightMin, Math.min(fish.weightMax * 1.5, finalWeight));

  // ── Step 4: special RNG ───────────────────────────────────
  let special = null;

  // Jackpot Catch (1%) → weight x2 atau rarity naik 1 tier
  if (Math.random() < 0.01) {
    const jackpotType = Math.random() < 0.5 ? 'weight' : 'rarity';
    if (jackpotType === 'weight') {
      finalWeight *= 2;
      special = { type: 'jackpot_weight', desc: '💥 JACKPOT! Berat ikan x2!' };
    } else {
      const rarityOrder  = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
      const currentIdx   = rarityOrder.indexOf(fish.rarity);
      if (currentIdx < rarityOrder.length - 1) {
        const newRarity  = rarityOrder[currentIdx + 1];
        const betterPool = fishDb.FISH.filter(f => f.rarity === newRarity);
        if (betterPool.length > 0) {
          const betterFish = betterPool[Math.floor(Math.random() * betterPool.length)];
          special = { type: 'jackpot_rarity', desc: `💥 JACKPOT! Rarity naik ke ${fishDb.RARITY[newRarity].emoji} ${newRarity}!` };
          return { fish: betterFish, weight: finalWeight, special, failed: false };
        }
      }
    }
  }

  // Treasure Catch (5%) → bonus coin
  if (!special && Math.random() < 0.05) {
    const bonus = Math.floor(Math.random() * 200 + 50);
    special = { type: 'treasure', desc: `💎 Treasure! Bonus ✨ ${bonus} Lumens!`, bonus };
  }

  // Fail (5%) → ikan kabur
  if (!special && Math.random() < 0.05) {
    return { fish: null, weight: 0, special: null, failed: true };
  }

  return { fish, weight: parseFloat(finalWeight.toFixed(1)), special, failed: false };
}

module.exports = {
  getPlayerFishing, savePlayerFishing,
  expForLevel, addFishingExp,
  rollFish, defaultFishing,
};