const { EmbedBuilder } = require('discord.js');
const fishDb = require('../utils/fishingItems');
const config = require('../config');

const p = config.prefix;

// ─── Gambar per rarity (URL gambar publik) ────────────────────
const RARITY_IMAGES = {
  COMMON:    'https://i.imgur.com/8mQKGvM.png', // abu-abu
  UNCOMMON:  'https://i.imgur.com/4gDnFO8.png', // hijau
  RARE:      'https://i.imgur.com/3wYYrP4.png', // biru
  EPIC:      'https://i.imgur.com/9hQKJ3L.png', // ungu
  LEGENDARY: 'https://i.imgur.com/7mNKL2P.png', // kuning
  MYTHIC:    'https://i.imgur.com/5pQLM8N.png', // merah
};

// ─── Gambar spesifik per item ─────────────────────────────────
const ITEM_IMAGES = {
  // ROD IMAGES (fishing rod themed)
  rod_001: 'https://i.imgur.com/BasicRod.png',
  rod_011: 'https://i.imgur.com/PoseidonRod.png',
  rod_012: 'https://i.imgur.com/VoidRod.png',

  // FISH IMAGES (pakai emoji besar + warna rarity)
  fish_021: 'https://i.imgur.com/CelestialWhale.png',
  fish_024: 'https://i.imgur.com/GodOfTides.png',
};

// ─── Emoji visual per kategori ────────────────────────────────
const ROD_VISUAL = {
  COMMON:    '🎣',
  UNCOMMON:  '🎣',
  RARE:      '🎣',
  EPIC:      '🎣',
  LEGENDARY: '🎣',
  MYTHIC:    '🎣',
};

const FISH_VISUAL = {
  COMMON:    '🐟',
  UNCOMMON:  '🐠',
  RARE:      '🐡',
  EPIC:      '🦈',
  LEGENDARY: '🐉',
  MYTHIC:    '🌌',
};

const BAIT_VISUAL = {
  COMMON:    '🪱',
  UNCOMMON:  '🦗',
  RARE:      '✨',
  EPIC:      '💛',
  LEGENDARY: '🔥',
  MYTHIC:    '🌀',
};

module.exports = {
  name: 'fishcatalog',
  aliases: ['fishcat', 'fishlist', 'rodlist', 'baitlist'],
  description: 'Lihat katalog visual semua ikan, rod, dan bait',

  execute(message, args) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'fish' || sub === 'ikan' || !sub) return showFish(message, args[1]);
    if (sub === 'rod'  || sub === 'rods')          return showRods(message, args[1]);
    if (sub === 'bait' || sub === 'baits')          return showBaits(message, args[1]);

    // Default: menu
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Fishing Catalog')
      .setDescription('Lihat semua item fishing dengan visual lengkap!\n\u200B')
      .addFields(
        { name: `\`${p}fishcatalog fish\``,         value: 'Lihat semua ikan beserta rarity & harganya',  inline: false },
        { name: `\`${p}fishcatalog fish mythic\``,   value: 'Filter ikan berdasarkan rarity',             inline: false },
        { name: `\`${p}fishcatalog rod\``,           value: 'Lihat semua rod beserta stats',              inline: false },
        { name: `\`${p}fishcatalog bait\``,          value: 'Lihat semua bait beserta stats',             inline: false },
      )
      .setFooter({ text: 'Rarity: common | uncommon | rare | epic | legendary | mythic' });

    message.reply({ embeds: [embed] });
  },
};

// ─── SHOW FISH ────────────────────────────────────────────────
function showFish(message, rarityFilter) {
  const filter    = rarityFilter?.toUpperCase();
  const rarityOrder = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
  const filtered  = filter ? rarityOrder.filter(r => r === filter) : rarityOrder;

  if (filtered.length === 0) {
    return message.reply(`❌ Rarity tidak valid. Pilih: common, uncommon, rare, epic, legendary, mythic`);
  }

  for (const rarity of filtered) {
    const fishList = fishDb.FISH.filter(f => f.rarity === rarity);
    if (fishList.length === 0) continue;

    const r       = fishDb.RARITY[rarity];
    const visual  = FISH_VISUAL[rarity] || '🐟';

    const lines = fishList.map(fish => {
      const priceMin = fishDb.calcFishPrice(fish, fish.weightMin);
      const priceMax = fishDb.calcFishPrice(fish, fish.weightMax);
      return (
        `${visual} **${fish.name}**\n` +
        `⚖️ Berat: ${fish.weightMin}–${fish.weightMax} kg\n` +
        `✨ Harga: ${priceMin}–${priceMax} Lumens\n` +
        `🎯 Chance: ${r.dropChance}%`
      );
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(r.color)
      .setTitle(`${r.emoji} ${r.name} Fish`)
      .setDescription(lines)
      .setThumbnail(getThumbnail('fish', rarity))
      .setFooter({ text: `Harga = berat × ${r.priceMultiplier}x multiplier | Luck tinggi → lebih sering muncul` });

    message.channel.send({ embeds: [embed] });
  }
}

// ─── SHOW RODS ────────────────────────────────────────────────
function showRods(message, rarityFilter) {
  const filter      = rarityFilter?.toUpperCase();
  const rarityOrder = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
  const filtered    = filter ? rarityOrder.filter(r => r === filter) : rarityOrder;

  for (const rarity of filtered) {
    const rodList = fishDb.RODS.filter(rod => rod.rarity === rarity);
    if (rodList.length === 0) continue;

    const r      = fishDb.RARITY[rarity];
    const visual = ROD_VISUAL[rarity] || '🎣';

    const lines = rodList.map(rod => (
      `${visual} **${rod.name}** \`${rod.id}\`\n` +
      `🎯 Luck: +${rod.luck} | ⚖️ Weight: +${rod.weight}\n` +
      `✨ Harga: ${rod.price.toLocaleString()} Lumens`
    )).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(r.color)
      .setTitle(`${r.emoji} ${r.name} Rods`)
      .setDescription(lines)
      .setThumbnail(getThumbnail('rod', rarity))
      .setFooter({ text: `!fishop buy <id> untuk beli | !fish equip <id> untuk pasang` });

    message.channel.send({ embeds: [embed] });
  }
}

// ─── SHOW BAITS ───────────────────────────────────────────────
function showBaits(message, rarityFilter) {
  const filter      = rarityFilter?.toUpperCase();
  const rarityOrder = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
  const filtered    = filter ? rarityOrder.filter(r => r === filter) : rarityOrder;

  for (const rarity of filtered) {
    const baitList = fishDb.BAITS.filter(b => b.rarity === rarity);
    if (baitList.length === 0) continue;

    const r      = fishDb.RARITY[rarity];
    const visual = BAIT_VISUAL[rarity] || '🪱';

    const lines = baitList.map(bait => (
      `${visual} **${bait.name}** \`${bait.id}\`\n` +
      `🎯 Luck: +${bait.luck} | ⚖️ Weight: +${bait.weight}\n` +
      `✨ Harga: ${bait.price.toLocaleString()} Lumens (x${bait.qty})`
    )).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(r.color)
      .setTitle(`${r.emoji} ${r.name} Baits`)
      .setDescription(lines)
      .setThumbnail(getThumbnail('bait', rarity))
      .setFooter({ text: `!fishop buy <id> untuk beli | !fish bait <id> untuk pasang` });

    message.channel.send({ embeds: [embed] });
  }
}

// ─── Thumbnail per rarity & kategori ─────────────────────────
function getThumbnail(category, rarity) {
  const THUMBNAILS = {
    fish: {
      COMMON:    'https://www.fisheries.noaa.gov/s3/styles/full_width/s3/2022-08/640x427-Bluefish.png',
      UNCOMMON:  'https://www.fisheries.noaa.gov/s3/styles/full_width/s3/2022-08/640x427-Yellowtail-Snapper.png',
      RARE:      'https://www.fisheries.noaa.gov/s3/styles/full_width/s3/2022-08/640x427-Atlantic-Salmon.png',
      EPIC:      'https://www.fisheries.noaa.gov/s3/styles/full_width/s3/2022-08/640x427-Bluefin-Tuna-NE.png',
      LEGENDARY: 'https://www.fisheries.noaa.gov/s3/styles/full_width/s3/2021-12/640x427-Blue-Marlin.png',
      MYTHIC:    'https://www.fisheries.noaa.gov/s3/styles/full_width/s3/2022-08/640x427-Blue-Whale.png',
    },
    rod: {
      COMMON:    'https://i.imgur.com/zJfkD2m.png',
      UNCOMMON:  'https://i.imgur.com/zJfkD2m.png',
      RARE:      'https://i.imgur.com/zJfkD2m.png',
      EPIC:      'https://i.imgur.com/zJfkD2m.png',
      LEGENDARY: 'https://i.imgur.com/zJfkD2m.png',
      MYTHIC:    'https://i.imgur.com/zJfkD2m.png',
    },
    bait: {
      COMMON:    'https://i.imgur.com/eHKJvNm.png',
      UNCOMMON:  'https://i.imgur.com/eHKJvNm.png',
      RARE:      'https://i.imgur.com/eHKJvNm.png',
      EPIC:      'https://i.imgur.com/eHKJvNm.png',
      LEGENDARY: 'https://i.imgur.com/eHKJvNm.png',
      MYTHIC:    'https://i.imgur.com/eHKJvNm.png',
    },
  };
  return THUMBNAILS[category]?.[rarity] || null;
}