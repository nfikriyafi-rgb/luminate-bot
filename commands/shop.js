const { EmbedBuilder } = require('discord.js');
const items    = require('../utils/items');
const rpgUtils = require('../utils/rpg');
const currency = require('../utils/currency');
const config   = require('../config');

const p = config.prefix;

// ─── Item yang dijual di shop (bisa diatur manual) ────────────
const SHOP_ITEMS = [
  // Weapons
  'w021', 'w022', 'w023', 'w031', 'w032', 'w033', 'w041', 'w042', 'w051',
  // Armors
  'a011', 'a012', 'a013', 'a021', 'a022', 'a023', 'a031', 'a032', 'a041',
  // Consumables (semua)
  'c001', 'c002', 'c003', 'c004', 'c005', 'c008', 'c009', 'c010', 'c011',
  'c014', 'c015', 'c016',
  // Accessories
  'ac001', 'ac002', 'ac003', 'ac006', 'ac007', 'ac008', 'ac010', 'ac011',
  // Materials
  'm001', 'm002', 'm006', 'm007',
];

const CATEGORIES = [
  { key: 'WEAPON',     label: '⚔️ Weapons'     },
  { key: 'ARMOR',      label: '🛡️ Armors'      },
  { key: 'CONSUMABLE', label: '🧪 Consumables'  },
  { key: 'ACCESSORY',  label: '🧿 Accessories'  },
  { key: 'MATERIAL',   label: '💎 Materials'    },
];

function getShopItems(category) {
  return SHOP_ITEMS
    .map(id => items.getItem(id))
    .filter(i => i && (!category || i.category === category));
}

module.exports = {
  name: 'shop',
  aliases: ['toko', 'store'],
  description: 'Beli item RPG dengan Lumens',

  execute(message, args) {
    const sub = (args[0] || '').toLowerCase();

    // ── BUY ───────────────────────────────────────────────────
    if (sub === 'buy' || sub === 'beli') {
      const itemId = (args[1] || '').toLowerCase();
      if (!itemId) return message.reply(`❌ Ketik ID item.\nContoh: \`${p}shop buy w021\``);

      if (!SHOP_ITEMS.includes(itemId)) {
        return message.reply(`❌ Item \`${itemId}\` tidak tersedia di shop.\nKetik \`${p}shop\` untuk lihat daftar item.`);
      }

      const item    = items.getItem(itemId);
      if (!item) return message.reply('❌ Item tidak ditemukan.');

      const price   = items.calcPrice(item);
      const balance = currency.getBalance(message.author.id);

      if (balance < price) {
        return message.reply(
          `❌ Lumens tidak cukup!\n` +
          `Harga: ✨ **${price} Lumens**\n` +
          `Saldo kamu: ✨ **${balance} Lumens**`
        );
      }

      const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
      if (playerRPG.inventory.length >= 50) {
        return message.reply('❌ Inventory penuh! Jual item dulu dengan `!sell <id>`.');
      }

      currency.removeLumens(message.author.id, price);
      playerRPG.inventory.push(itemId);
      rpgUtils.savePlayerRPG(message.author.id, playerRPG);

      const f = items.formatItem(item);
      const embed = new EmbedBuilder()
        .setColor(items.RARITY[item.rarity].color)
        .setTitle('✅ Pembelian Berhasil!')
        .addFields(
          { name: 'Item',           value: f.name,                                            inline: true  },
          { name: 'Rarity',         value: f.rarity,                                          inline: true  },
          { name: 'Stats',          value: f.stats,                                           inline: false },
          { name: 'Harga',          value: `✨ **${price} Lumens**`,                         inline: true  },
          { name: 'Sisa Saldo',     value: `✨ **${currency.getBalance(message.author.id)} Lumens**`, inline: true },
        )
        .setFooter({ text: `!equip ${itemId} untuk pasang item ini` });

      return message.reply({ embeds: [embed] });
    }

    // ── SELL ──────────────────────────────────────────────────
    if (sub === 'sell' || sub === 'jual') {
      const itemId    = (args[1] || '').toLowerCase();
      if (!itemId) return message.reply(`❌ Ketik ID item.\nContoh: \`${p}shop sell w001\``);

      const playerRPG = rpgUtils.getPlayerRPG(message.author.id);
      const idx       = playerRPG.inventory.indexOf(itemId);
      if (idx === -1) return message.reply('❌ Item tidak ada di inventory kamu.');

      const item = items.getItem(itemId);
      if (!item) return message.reply('❌ Item tidak ditemukan.');

      const sellPrice = Math.floor(items.calcPrice(item) * 0.6);

      playerRPG.inventory.splice(idx, 1);
      if (playerRPG.weapon    === itemId) playerRPG.weapon    = null;
      if (playerRPG.armor     === itemId) playerRPG.armor     = null;
      if (playerRPG.accessory === itemId) playerRPG.accessory = null;

      rpgUtils.savePlayerRPG(message.author.id, playerRPG);
      currency.addLumens(message.author.id, sellPrice);

      const f = items.formatItem(item);
      const embed = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('💰 Item Terjual!')
        .addFields(
          { name: 'Item',        value: f.name,                                              inline: true },
          { name: 'Harga Jual',  value: `✨ **${sellPrice} Lumens**`,                       inline: true },
          { name: 'Saldo',       value: `✨ **${currency.getBalance(message.author.id)} Lumens**`, inline: false },
        )
        .setFooter({ text: 'Harga jual = 60% dari harga asli' });

      return message.reply({ embeds: [embed] });
    }

    // ── INFO ITEM ─────────────────────────────────────────────
    if (sub === 'info') {
      const itemId = (args[1] || '').toLowerCase();
      if (!itemId) return message.reply(`❌ Ketik ID item.\nContoh: \`${p}shop info w021\``);

      const item = items.getItem(itemId);
      if (!item) return message.reply('❌ Item tidak ditemukan.');

      const f     = items.formatItem(item);
      const price = items.calcPrice(item);
      const embed = new EmbedBuilder()
        .setColor(items.RARITY[item.rarity].color)
        .setTitle(f.name)
        .addFields(
          { name: 'Rarity',    value: f.rarity,                    inline: true  },
          { name: 'Kategori',  value: item.category,               inline: true  },
          { name: 'Stats',     value: f.stats,                     inline: false },
          { name: 'Harga Beli',value: `✨ **${price} Lumens**`,    inline: true  },
          { name: 'Harga Jual',value: `✨ **${Math.floor(price * 0.6)} Lumens**`, inline: true },
        );

      return message.reply({ embeds: [embed] });
    }

    // ── LIST SHOP (default / per kategori) ────────────────────
    const catFilter = sub ? sub.toUpperCase() : null;
    const validCat  = catFilter && CATEGORIES.find(c => c.key === catFilter || c.label.toLowerCase().includes(sub));

    // Kalau tidak ada filter atau filter tidak valid → tampilkan menu kategori
    if (!sub || !validCat) {
      const balance = currency.getBalance(message.author.id);
      const embed   = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle('🛍️ Luminate RPG Shop')
        .setDescription(
          `Saldo kamu: ✨ **${balance} Lumens**\n\n` +
          `Pilih kategori untuk melihat item:\n\u200B`
        )
        .setFooter({ text: `${p}shop buy <id> untuk beli • ${p}shop sell <id> untuk jual • ${p}shop info <id> untuk detail` });

      for (const cat of CATEGORIES) {
        const catItems = getShopItems(cat.key);
        if (catItems.length === 0) continue;

        const rarities = [...new Set(catItems.map(i => items.RARITY[i.rarity].emoji))].join('');
        embed.addFields({
          name:  cat.label,
          value: `${catItems.length} item tersedia ${rarities}\nKetik \`${p}shop ${cat.key.toLowerCase()}\` untuk lihat`,
          inline: true,
        });
      }

      return message.reply({ embeds: [embed] });
    }

    // ── LIST PER KATEGORI ─────────────────────────────────────
    const catKey   = validCat.key;
    const catItems = getShopItems(catKey);
    const balance  = currency.getBalance(message.author.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🛍️ Shop — ${validCat.label}`)
      .setDescription(`Saldo kamu: ✨ **${balance} Lumens**\n\u200B`)
      .setFooter({ text: `${p}shop buy <id> untuk beli • ${p}shop info <id> untuk detail item` });

    // Kelompokkan per rarity
    const rarityOrder = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
    for (const rarity of rarityOrder) {
      const rarityItems = catItems.filter(i => i.rarity === rarity);
      if (rarityItems.length === 0) continue;

      const r     = items.RARITY[rarity];
      const lines = rarityItems.map(i => {
        const f        = items.formatItem(i);
        const canAfford = balance >= items.calcPrice(i);
        return `${canAfford ? '✅' : '❌'} \`${i.id}\` **${i.name}** — ✨${items.calcPrice(i)}\n${f.stats}`;
      }).join('\n\n');

      embed.addFields({
        name:  `${r.emoji} ${r.name}`,
        value: lines,
        inline: false,
      });
    }

    return message.reply({ embeds: [embed] });
  },
};