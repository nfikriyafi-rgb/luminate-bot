const { EmbedBuilder } = require('discord.js');
const fishDb    = require('../utils/fishingItems');
const fishLogic = require('../utils/fishingLogic');
const currency  = require('../utils/currency');
const config    = require('../config');

const p = config.prefix;

module.exports = {
  name: 'fishop',
  aliases: ['fishingshop', 'rodshop'],
  description: 'Beli rod dan bait untuk mancing',

  execute(message, args) {
    const sub = (args[0] || '').toLowerCase();

    // ── BUY ───────────────────────────────────────────────────
    if (sub === 'buy' || sub === 'beli') {
      return handleBuy(message, args);
    }

    // ── ROD LIST ──────────────────────────────────────────────
    if (sub === 'rod' || sub === 'rods') {
      return showRods(message);
    }

    // ── BAIT LIST ─────────────────────────────────────────────
    if (sub === 'bait' || sub === 'baits') {
      return showBaits(message);
    }

    // ── DEFAULT: menu utama ───────────────────────────────────
    const balance = currency.getBalance(message.author.id);
    const embed   = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎣 Fishing Shop')
      .setDescription(`Saldo kamu: ✨ **${balance} Lumens**\n\u200B`)
      .addFields(
        {
          name:  '🎣 Rods (Joran)',
          value: `12 rod tersedia ⚪🟢🔵🟣🟡🔴\nKetik \`${p}fishop rod\` untuk lihat semua`,
          inline: true,
        },
        {
          name:  '🪱 Baits (Umpan)',
          value: `12 bait tersedia ⚪🟢🔵🟣🟡🔴\nKetik \`${p}fishop bait\` untuk lihat semua`,
          inline: true,
        },
      )
      .addFields({
        name:  '🛒 Cara Beli',
        value:
          `\`${p}fishop buy <id>\` — Beli rod atau bait\n` +
          `Contoh: \`${p}fishop buy rod_003\` atau \`${p}fishop buy bait_003\``,
        inline: false,
      })
      .setFooter({ text: 'Setelah beli rod: !fish equip <id> | Setelah beli bait: !fish bait <id>' });

    message.reply({ embeds: [embed] });
  },
};

// ─── SHOW RODS ────────────────────────────────────────────────
function showRods(message) {
  const balance = currency.getBalance(message.author.id);
  const fishing = fishLogic.getPlayerFishing(message.author.id);
  const embed   = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🎣 Rod Shop')
    .setDescription(`Saldo: ✨ **${balance} Lumens**\n\n⚠️ Rod ❓ SECRET & 👑 SPECIAL tidak dijual — hanya dari quest!\n\u200B`)
    .setFooter({ text: '!fishop buy <id> untuk beli' });

  const rarityOrder = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
  for (const rarity of rarityOrder) {
    const rods = fishDb.getShopRods().filter(r => r.rarity === rarity);
    if (rods.length === 0) continue;
    const r     = fishDb.RARITY[rarity];
    const lines = rods.map(rod => {
      const owned      = fishing.rod === rod.id || fishing.rodInventory.includes(rod.id);
      const canAfford  = balance >= rod.price;
      const status     = owned ? '✅ Owned' : canAfford ? '💰 Bisa beli' : '❌ Kurang';
      return `\`${rod.id}\` **${rod.name}** — ✨${rod.price.toLocaleString()}\n🎯 Luck: +${rod.luck} | ⚖️ Weight: +${rod.weight} | ${status}`;
    }).join('\n\n');

    embed.addFields({ name: `${r.emoji} ${r.name}`, value: lines, inline: false });
  }

  message.reply({ embeds: [embed] });
}

// ─── SHOW BAITS ───────────────────────────────────────────────
function showBaits(message) {
  const balance = currency.getBalance(message.author.id);
  const fishing = fishLogic.getPlayerFishing(message.author.id);
  const embed   = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🪱 Bait Shop')
    .setDescription(`Saldo: ✨ **${balance} Lumens**\n\n⚠️ Bait ❓ SECRET & 👑 SPECIAL tidak dijual — hanya dari quest!\n\u200B`)
    .setFooter({ text: '!fishop buy <id> untuk beli' });

  const rarityOrder = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
  for (const rarity of rarityOrder) {
    const baits = fishDb.getShopBaits().filter(b => b.rarity === rarity);
    if (baits.length === 0) continue;
    const r     = fishDb.RARITY[rarity];
    const lines = baits.map(bait => {
      const owned     = fishing.baitInventory.find(b => b.id === bait.id);
      const canAfford = balance >= bait.price;
      const status    = owned ? `✅ Punya x${owned.qty}` : canAfford ? '💰 Bisa beli' : '❌ Kurang';
      return `\`${bait.id}\` **${bait.name}** (x${bait.qty}) — ✨${bait.price.toLocaleString()}\n🎯 Luck: +${bait.luck} | ⚖️ Weight: +${bait.weight} | ${status}`;
    }).join('\n\n');

    embed.addFields({ name: `${r.emoji} ${r.name}`, value: lines, inline: false });
  }

  message.reply({ embeds: [embed] });
}

// ─── BUY ─────────────────────────────────────────────────────
function handleBuy(message, args) {
  const itemId  = (args[1] || '').toLowerCase();
  if (!itemId) return message.reply(`❌ Ketik ID item.\nContoh: \`${config.prefix}fishop buy rod_003\``);

  const fishing = fishLogic.getPlayerFishing(message.author.id);
  const balance = currency.getBalance(message.author.id);

  // Cek apakah rod
  const rod = fishDb.getRod(itemId);
  if (rod) {
    if (!rod.obtainable) {
      return message.reply(
        `❌ **${rod.name}** tidak bisa dibeli!\n` +
        (rod.questReward
          ? `${rod.questDesc || 'Dapatkan dari quest menangkap ikan SECRET.'}`
          : rod.adminOnly
          ? '👑 Item ini hanya bisa diberikan oleh Admin.'
          : 'Item ini tidak tersedia di shop.')
      );
    }
    if (fishing.rod === itemId || fishing.rodInventory.includes(itemId)) {
      return message.reply(`⚠️ Kamu sudah punya **${rod.name}**!`);
    }
    if (balance < rod.price) {
      return message.reply(`❌ Lumens tidak cukup!\nHarga: ✨ **${rod.price.toLocaleString()}** | Saldo: ✨ **${balance}**`);
    }
    currency.removeLumens(message.author.id, rod.price);
    fishing.rodInventory.push(itemId);
    fishLogic.savePlayerFishing(message.author.id, fishing);

    const r = fishDb.RARITY[rod.rarity];
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(r.color)
          .setTitle('✅ Rod Dibeli!')
          .addFields(
            { name: 'Rod',       value: `${r.emoji} **${rod.name}**`, inline: true },
            { name: '🎯 Luck',   value: `+${rod.luck}`,               inline: true },
            { name: '⚖️ Weight', value: `+${rod.weight}`,             inline: true },
            { name: 'Harga',     value: `✨ -${rod.price.toLocaleString()}`,   inline: true },
            { name: 'Sisa Saldo',value: `✨ ${currency.getBalance(message.author.id).toLocaleString()}`, inline: true },
          )
          .setFooter({ text: `!fish equip ${itemId} untuk pasang rod ini` }),
      ],
    });
  }

  // Cek apakah bait
  const bait = fishDb.getBait(itemId);
  if (bait) {
    if (!bait.obtainable) {
      return message.reply(
        `❌ **${bait.name}** tidak bisa dibeli!\n` +
        (bait.questReward
          ? `${bait.questDesc || 'Dapatkan dari quest menangkap ikan SECRET.'}`
          : bait.adminOnly
          ? '👑 Item ini hanya bisa diberikan oleh Admin.'
          : 'Item ini tidak tersedia di shop.')
      );
    }
    if (balance < bait.price) {
      return message.reply(`❌ Lumens tidak cukup!\nHarga: ✨ **${bait.price.toLocaleString()}** | Saldo: ✨ **${balance}**`);
    }
    currency.removeLumens(message.author.id, bait.price);

    // Tambah qty kalau sudah punya, buat baru kalau belum
    const existing = fishing.baitInventory.find(b => b.id === itemId);
    if (existing) {
      existing.qty += bait.qty;
    } else {
      fishing.baitInventory.push({ id: itemId, qty: bait.qty });
    }
    fishLogic.savePlayerFishing(message.author.id, fishing);

    const r = fishDb.RARITY[bait.rarity];
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(r.color)
          .setTitle('✅ Bait Dibeli!')
          .addFields(
            { name: 'Bait',      value: `${r.emoji} **${bait.name}** x${bait.qty}`, inline: true },
            { name: '🎯 Luck',   value: `+${bait.luck}`,                             inline: true },
            { name: '⚖️ Weight', value: `+${bait.weight}`,                           inline: true },
            { name: 'Harga',     value: `✨ -${bait.price.toLocaleString()}`,        inline: true },
            { name: 'Sisa Saldo',value: `✨ ${currency.getBalance(message.author.id).toLocaleString()}`, inline: true },
          )
          .setFooter({ text: `!fish bait ${itemId} untuk pasang bait ini` }),
      ],
    });
  }

  return message.reply(`❌ Item \`${itemId}\` tidak ditemukan. Ketik \`${config.prefix}fishop\` untuk lihat daftar.`);
}