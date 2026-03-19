const { EmbedBuilder } = require('discord.js');
const db      = require('../utils/database');
const leveling = require('../utils/leveling');
const config  = require('../config');

module.exports = {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  description: 'Tampilkan leaderboard EXP server',

  async execute(message) {
    const allUsers = db.getAllUsers();

    // Urutkan berdasarkan EXP tertinggi
    const sorted = Object.entries(allUsers)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.exp - a.exp)
      .slice(0, config.leaderboard.topCount);

    if (sorted.length === 0) {
      return message.reply('📭 Belum ada data EXP. Mulai chat dulu!');
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines  = [];

    for (let i = 0; i < sorted.length; i++) {
      const entry  = sorted[i];
      const lvlObj = leveling.getLevelFromExp(entry.exp);
      const medal  = medals[i] || `**${i + 1}.**`;

      // Coba ambil display name dari guild
      let displayName = `<@${entry.id}>`;
      try {
        const member = await message.guild.members.fetch(entry.id);
        displayName  = member.displayName;
      } catch { /* user mungkin sudah keluar */ }

      lines.push(
        `${medal} **${displayName}** — Lv.${lvlObj.level} ${lvlObj.name} • ${entry.exp} EXP`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle(`🏆 Leaderboard — ${message.guild.name}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Top ${sorted.length} member paling aktif` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
