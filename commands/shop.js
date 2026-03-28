const { EmbedBuilder } = require('discord.js');
const currency = require('../utils/currency');
const config   = require('../config');

// ─── Daftar item shop ─────────────────────────────────────────
// Edit di sini untuk tambah/hapus item
// type: 'role' → assign role Discord | 'cosmetic' → hanya tampilan
const shopItems = [
  {
    id:    'vip',
    name:  '⭐ VIP Role',
    desc:  'Dapatkan role VIP eksklusif di server!',
    price: 10000,
    type:  'role',
    roleId: '', // ← isi dengan ID role VIP di server kamu
  },
  {
    id:    'og',
    name:  '👑 OG Member',
    desc:  'Role khusus untuk member OG server.',
    price: 10000,
    type:  'role',
    roleId: '', // ← isi dengan ID role OG
  },
  {
    id:    'colorred',
    name:  '🔴 Color: Red',
    desc:  'Role warna merah untuk nama kamu.',
    price: 200,
    type:  'role',
    roleId: '', // ← isi dengan ID role color red
  },
  {
    id:    'colorblue',
    name:  '🔵 Color: Blue',
    desc:  'Role warna biru untuk nama kamu.',
    price: 200,
    type:  'role',
    roleId: '', // ← isi dengan ID role color blue
  },
];

module.exports = {
  name: 'shop',
  aliases: ['toko', 'store'],
  description: 'Beli role & hadiah eksklusif dengan Lumens',

  async execute(message, args, client) {
    const sub = (args[0] || '').toLowerCase();

    // ── LIST (default) ────────────────────────────────────────
    if (!sub || sub === 'list') {
      const balance = currency.getBalance(message.author.id);

      const embed = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle('🛍️ Luminate Shop')
        .setDescription(
          `Saldo kamu: ${currency.formatLumens(balance)}\n\n` +
          `Ketik \`${config.prefix}shop buy <id>\` untuk membeli.\n\u200B`
        );

      for (const item of shopItems) {
        const canAfford = balance >= item.price;
        embed.addFields({
          name:  `${item.name} — ${currency.formatLumens(item.price)} ${canAfford ? '✅' : '❌'}`,
          value: `${item.desc}\nID: \`${item.id}\``,
          inline: false,
        });
      }

      embed.setFooter({ text: 'Luminate Economy • ✅ = mampu beli, ❌ = Lumens kurang' });
      return message.reply({ embeds: [embed] });
    }

    // ── BUY ───────────────────────────────────────────────────
    if (sub === 'buy' || sub === 'beli') {
      const itemId = (args[1] || '').toLowerCase();
      const item   = shopItems.find(i => i.id === itemId);

      if (!item) {
        return message.reply(`❌ Item \`${itemId}\` tidak ditemukan. Ketik \`${config.prefix}shop\` untuk melihat daftar item.`);
      }

      const balance = currency.getBalance(message.author.id);
      if (balance < item.price) {
        return message.reply(
          `❌ Saldo tidak cukup!\n` +
          `Harga: ${currency.formatLumens(item.price)}\n` +
          `Saldo kamu: ${currency.formatLumens(balance)}`
        );
      }

      // Cek apakah sudah punya role
      if (item.type === 'role' && item.roleId) {
        if (message.member.roles.cache.has(item.roleId)) {
          return message.reply(`⚠️ Kamu sudah memiliki **${item.name}**!`);
        }

        // Assign role
        const role = message.guild.roles.cache.get(item.roleId);
        if (!role) {
          return message.reply(`❌ Role tidak ditemukan di server. Hubungi admin untuk mengatur shop.`);
        }

        await message.member.roles.add(role).catch(() => {});
      }

      // Kurangi saldo
      currency.removeLumens(message.author.id, item.price);
      const newBalance = currency.getBalance(message.author.id);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Pembelian Berhasil!')
        .setDescription(`Kamu berhasil membeli **${item.name}**!`)
        .addFields(
          { name: 'Item',           value: item.name,                          inline: true },
          { name: 'Harga',          value: currency.formatLumens(item.price),  inline: true },
          { name: 'Sisa Saldo',     value: currency.formatLumens(newBalance),  inline: false },
        )
        .setFooter({ text: 'Luminate Economy' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};