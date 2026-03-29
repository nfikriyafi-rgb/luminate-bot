const { EmbedBuilder } = require('discord.js');
const rpgUtils = require('../utils/rpg');
const items    = require('../utils/items');
const currency = require('../utils/currency');

// ── INVENTORY ─────────────────────────────────────────────────
const inventoryCmd = {
  name: 'inventory',
  aliases: ['inv', 'bag'],
  description: 'Lihat inventory item kamu',

  execute(message, args) {
    const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
    const inv       = playerRPG.inventory;

    if (inv.length === 0) {
      return message.reply('🎒 Inventory kamu kosong! Lawan monster dengan `!fight` untuk mendapatkan item.');
    }

    // Group by category
    const grouped = {};
    for (const itemId of inv) {
      const item = items.getItem(itemId);
      if (!item) continue;
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🎒 Inventory — ${message.member.displayName}`)
      .setDescription(`Total: **${inv.length}/50** item\n\u200B`)
      .setFooter({ text: '!equip <item_id> untuk pasang • !use <item_id> untuk pakai • !sell <item_id> untuk jual' });

    for (const [cat, catItems] of Object.entries(grouped)) {
      const emoji = items.CATEGORY[cat] || '📦';
      const lines = catItems.map(i => {
        const f = items.formatItem(i);
        return `${f.name} \`${i.id}\` — 💰${f.price}`;
      }).join('\n');

      embed.addFields({ name: `${emoji} ${cat}`, value: lines, inline: false });
    }

    message.reply({ embeds: [embed] });
  },
};

// ── EQUIP ─────────────────────────────────────────────────────
const equipCmd = {
  name: 'equip',
  description: 'Pasang item ke slot equipment',

  execute(message, args) {
    const itemId    = (args[0] || '').toLowerCase();
    if (!itemId) return message.reply('❌ Ketik ID item. Contoh: `!equip w021`\nLihat inventory: `!inventory`');

    const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
    if (!playerRPG.inventory.includes(itemId)) {
      return message.reply('❌ Item tidak ada di inventory kamu.');
    }

    const item = items.getItem(itemId);
    if (!item) return message.reply('❌ Item tidak ditemukan.');

    const cat = item.category;
    if (cat === 'WEAPON')    playerRPG.weapon    = itemId;
    else if (cat === 'ARMOR')     playerRPG.armor     = itemId;
    else if (cat === 'ACCESSORY') playerRPG.accessory = itemId;
    else return message.reply('❌ Item ini tidak bisa di-equip. Hanya Weapon, Armor, dan Accessory.');

    rpgUtils.savePlayerRPG(message.author.id, playerRPG);

    const f     = items.formatItem(item);
    const stats = rpgUtils.calcStats(playerRPG);
    const embed = new EmbedBuilder()
      .setColor(items.RARITY[item.rarity].color)
      .setTitle(`✅ ${f.name} dipasang!`)
      .addFields(
        { name: 'Slot',   value: cat,      inline: true },
        { name: 'Stats',  value: f.stats,  inline: true },
        { name: '\u200B', value: '\u200B', inline: false },
        { name: '⚔️ Total ATK', value: `**${stats.atk}**`,  inline: true },
        { name: '🛡️ Total DEF', value: `**${stats.def}**`,  inline: true },
        { name: '❤️ Max HP',    value: `**${stats.maxHp}**`, inline: true },
      )
      .setFooter({ text: '!profile untuk lihat semua stats' });

    message.reply({ embeds: [embed] });
  },
};

// ── USE ITEM ──────────────────────────────────────────────────
const useCmd = {
  name: 'use',
  description: 'Gunakan consumable item (potion, dll)',

  execute(message, args) {
    const itemId    = (args[0] || '').toLowerCase();
    if (!itemId) return message.reply('❌ Ketik ID item. Contoh: `!use c001`');

    const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
    const idx       = playerRPG.inventory.indexOf(itemId);
    if (idx === -1) return message.reply('❌ Item tidak ada di inventory kamu.');

    const item = items.getItem(itemId);
    if (!item) return message.reply('❌ Item tidak ditemukan.');
    if (item.category !== 'CONSUMABLE') return message.reply('❌ Item ini tidak bisa digunakan. Hanya Consumable (potion, dll).');

    const stats  = rpgUtils.calcStats(playerRPG);
    const e      = item.effects || {};
    const results = [];

    if (e.heal) {
      const before   = playerRPG.hp;
      playerRPG.hp   = Math.min(playerRPG.hp + e.heal, stats.maxHp);
      results.push(`❤️ HP +${playerRPG.hp - before} (${playerRPG.hp}/${stats.maxHp})`);
    }

    // Hapus dari inventory setelah dipakai
    playerRPG.inventory.splice(idx, 1);
    rpgUtils.savePlayerRPG(message.author.id, playerRPG);

    const f     = items.formatItem(item);
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`✅ ${f.name} digunakan!`)
      .setDescription(results.join('\n') || 'Item berhasil digunakan.')
      .setFooter({ text: '!profile untuk cek stats' });

    message.reply({ embeds: [embed] });
  },
};

// ── SELL ITEM ─────────────────────────────────────────────────
const sellCmd = {
  name: 'sell',
  description: 'Jual item dari inventory dengan Lumens',

  execute(message, args) {
    const itemId    = (args[0] || '').toLowerCase();
    if (!itemId) return message.reply('❌ Ketik ID item. Contoh: `!sell w001`');

    const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
    const idx       = playerRPG.inventory.indexOf(itemId);
    if (idx === -1) return message.reply('❌ Item tidak ada di inventory kamu.');

    const item = items.getItem(itemId);
    if (!item) return message.reply('❌ Item tidak ditemukan.');

    const sellPrice = Math.floor(items.calcPrice(item) * 0.6); // jual 60% dari harga
    playerRPG.inventory.splice(idx, 1);

    // Unequip jika item yang dijual sedang dipakai
    if (playerRPG.weapon    === itemId) playerRPG.weapon    = null;
    if (playerRPG.armor     === itemId) playerRPG.armor     = null;
    if (playerRPG.accessory === itemId) playerRPG.accessory = null;

    rpgUtils.savePlayerRPG(message.author.id, playerRPG);
    currency.addLumens(message.author.id, sellPrice);

    const f     = items.formatItem(item);
    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle(`💰 Item Terjual!`)
      .addFields(
        { name: 'Item',        value: f.name,                                         inline: true },
        { name: 'Harga Jual',  value: `✨ **${sellPrice} Lumens**`,                  inline: true },
        { name: 'Saldo',       value: `✨ **${currency.getBalance(message.author.id)} Lumens**`, inline: false },
      )
      .setFooter({ text: 'Harga jual = 60% dari harga asli' });

    message.reply({ embeds: [embed] });
  },
};

// ── HEAL (Passive Regen + Manual) ────────────────────────────
const REGEN_AMOUNT   = 5;   // HP per tick
const REGEN_INTERVAL = 30;  // detik per tick

// Jalankan regen otomatis saat module dimuat
setInterval(() => {
  const db = require('../utils/database');
  const all = db.getAllUsers();
  for (const [userId, data] of Object.entries(all)) {
    if (!data.rpg) continue;
    const rpg    = data.rpg;
    const stats  = rpgUtils.calcStats(rpg);
    if (rpg.hp >= stats.maxHp) continue;
    rpg.hp = Math.min(rpg.hp + REGEN_AMOUNT, stats.maxHp);
    data.rpg = rpg;
    db.saveUser(userId, data);
  }
}, REGEN_INTERVAL * 1000);

const healCmd = {
  name: 'heal',
  description: 'Cek HP & status regen kamu',

  execute(message, args) {
    const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
    const stats     = rpgUtils.calcStats(playerRPG);

    const hpPct  = Math.floor((playerRPG.hp / stats.maxHp) * 10);
    const hpBar  = '█'.repeat(hpPct) + '░'.repeat(10 - hpPct);
    const isFull = playerRPG.hp >= stats.maxHp;

    const embed = new EmbedBuilder()
      .setColor(isFull ? 0x57f287 : 0xed4245)
      .setTitle('❤️ Status HP')
      .addFields(
        {
          name:  'HP',
          value: `\`${hpBar}\` **${playerRPG.hp}/${stats.maxHp}**`,
          inline: false,
        },
        {
          name:  '🔄 Passive Regen',
          value: isFull
            ? '✅ HP sudah penuh!'
            : `+**${REGEN_AMOUNT} HP** setiap **${REGEN_INTERVAL} detik** secara otomatis`,
          inline: false,
        },
      )
      .setFooter({ text: 'HP regen berjalan otomatis di background' });

    message.reply({ embeds: [embed] });
  },
};

// ── TRAVEL ────────────────────────────────────────────────────
const travelCmd = {
  name: 'travel',
  aliases: ['goto', 'area'],
  description: 'Pindah ke area berbeda untuk lawan monster lebih kuat',

  execute(message, args) {
    const dest      = (args[0] || '').toLowerCase();
    const allAreas  = rpgUtils.getAllAreas();

    if (!dest) {
      const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
      const lines     = Object.entries(allAreas).map(([key, a]) => {
        const locked = rpgUtils.getPlayerRPG(message.author.id).level < a.minLevel;
        return `${locked ? '🔒' : '✅'} \`${key}\` — ${a.name} (Min Lv.${a.minLevel})${key === playerRPG.area ? ' ← **Sekarang**' : ''}`;
      }).join('\n');

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('🗺️ Area yang Tersedia')
            .setDescription(lines)
            .setFooter({ text: '!travel <area> untuk berpindah' }),
        ],
      });
    }

    const area = allAreas[dest];
    if (!area) return message.reply(`❌ Area \`${dest}\` tidak ditemukan. Ketik \`!travel\` untuk daftar area.`);

    const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
    if (playerRPG.level < area.minLevel) {
      return message.reply(`🔒 Kamu butuh **Level ${area.minLevel}** untuk masuk ${area.name}. Level kamu sekarang: **${playerRPG.level}**.`);
    }

    playerRPG.area = dest;
    rpgUtils.savePlayerRPG(message.author.id, playerRPG);

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle(`🗺️ Berpindah ke ${area.name}`)
          .setDescription(`Kamu sekarang berada di **${area.name}**.\nLawan monster di sini dengan \`!fight\`!`)
          .setFooter({ text: 'Semakin dalam area, semakin besar reward!' }),
      ],
    });
  },
};

module.exports = { inventoryCmd, equipCmd, useCmd, sellCmd, healCmd, travelCmd };