const { EmbedBuilder } = require('discord.js');
const currency = require('../utils/currency');
const db       = require('../utils/database');
const config   = require('../config');

module.exports = {
  name: 'wallet',
  aliases: ['balance', 'saldo', 'bal'],
  description: 'Cek saldo Lumens kamu atau transfer ke member lain',

  async execute(message, args, client) {
    const sub = (args[0] || '').toLowerCase();

    // ── TRANSFER ─────────────────────────────────────────────
    if (sub === 'transfer' || sub === 'kirim') {
      const target = message.mentions.members.first();
      if (!target) return message.reply('❌ Tag user tujuan.\nContoh: `!wallet transfer @user 100`');
      if (target.id === message.author.id) return message.reply('❌ Tidak bisa transfer ke diri sendiri.');
      if (target.user.bot) return message.reply('❌ Tidak bisa transfer ke bot.');

      const amount = parseInt(args[2]);
      if (isNaN(amount) || amount <= 0) return message.reply('❌ Jumlah tidak valid. Contoh: `!wallet transfer @user 100`');

      const senderBalance = currency.getBalance(message.author.id);
      if (senderBalance < amount) {
        return message.reply(`❌ Saldo kamu tidak cukup. Saldo sekarang: ${currency.formatLumens(senderBalance)}`);
      }

      currency.transferLumens(message.author.id, target.id, amount);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Transfer Berhasil!')
        .addFields(
          { name: 'Dari',          value: `<@${message.author.id}>`,                                     inline: true },
          { name: 'Ke',            value: `<@${target.id}>`,                                              inline: true },
          { name: 'Jumlah',        value: currency.formatLumens(amount),                                  inline: false },
          { name: 'Sisa saldo',    value: currency.formatLumens(currency.getBalance(message.author.id)),  inline: true },
        )
        .setFooter({ text: 'Luminate Economy' })
        .setTimestamp();

      // Notif ke penerima via DM
      target.user.send(
        `💸 Kamu menerima ${currency.formatLumens(amount)} dari **${message.author.username}**!`
      ).catch(() => {});

      return message.reply({ embeds: [embed] });
    }

    // ── LEADERBOARD ──────────────────────────────────────────
    if (sub === 'top' || sub === 'leaderboard' || sub === 'lb') {
      const top     = currency.getLumensLeaderboard(10);
      const medals  = ['🥇', '🥈', '🥉'];
      const lines   = await Promise.all(top.map(async (entry, i) => {
        let name = `<@${entry.id}>`;
        try {
          const member = await message.guild.members.fetch(entry.id);
          name = member.displayName;
        } catch {}
        return `${medals[i] || `**${i + 1}.**`} **${name}** — ${currency.formatLumens(entry.lumens)}`;
      }));

      const embed = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle('✨ Leaderboard Lumens')
        .setDescription(lines.length > 0 ? lines.join('\n') : 'Belum ada data.')
        .setFooter({ text: 'Luminate Economy' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ── CEK SALDO (default) ──────────────────────────────────
    const target = message.mentions.members.first() || message.member;
    const userData = db.getUser(target.id);
    const balance  = currency.getBalance(target.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`✨ Wallet — ${target.displayName}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Saldo',        value: currency.formatLumens(balance),  inline: true },
        { name: 'Total EXP',    value: `**${userData.exp || 0}** EXP`,  inline: true },
        { name: 'Level',        value: `**Lv.${userData.level || 1}**`, inline: true },
      )
      .addFields({
        name: '💡 Cara dapat Lumens',
        value:
          '• Chat aktif → **+1** per pesan\n' +
          '• Voice Channel → **+1** per 2 menit\n' +
          '• Daily Claim → bonus Lumens harian\n' +
          '• Menang Word Chain → **+5** per kata\n' +
          '• Menang Withdraw → sesuai jackpot',
      })
      .setFooter({ text: 'Luminate Economy • !wallet transfer @user <jumlah>' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};