const { EmbedBuilder } = require('discord.js');
const config = require('../config');
 
const p = config.prefix;
 
// ─── Daftar semua game & info sistemnya ──────────────────────
const games = [
  {
    id:          'wordchain',
    emoji:       '🔤',
    name:        'Word Chain (Sambung Kata)',
    description: 'Sambung kata dari huruf terakhir kata sebelumnya. Salah → nyawa berkurang!',
    commands: [
      { cmd: `${p}wordchain start <kata>`, desc: 'Buka lobby & tentukan kata pertama' },
      { cmd: `${p}wordchain join`,         desc: 'Bergabung ke lobby' },
      { cmd: `${p}wordchain begin`,        desc: 'Mulai game (host only, min. 2 member)' },
      { cmd: `${p}wordchain players`,      desc: 'Lihat status nyawa semua member' },
      { cmd: `${p}wordchain stop`,         desc: 'Hentikan game (host/admin)' },
    ],
    aliases: [`${p}wc`, `${p}sambungkata`],
    rules: [
      '1️⃣ Host membuka lobby dengan `!wordchain start <kata>`. Kata pertama ditentukan host.',
      '2️⃣ Member lain ketik `!wordchain join` untuk ikut. Minimal **2 member** untuk mulai.',
      '3️⃣ Host ketik `!wordchain begin` untuk memulai. Urutan giliran diacak otomatis.',
      '4️⃣ Setiap member giliran harus mengirim **1 kata** yang diawali huruf terakhir kata sebelumnya.',
      '   Contoh: kata terakhir **"makan"** → harus mulai dari huruf **N** (misal: "nasi", "nilai", dst.)',
      '5️⃣ Kata **tidak boleh diulang** sepanjang game berlangsung.',
      '6️⃣ Kata harus **minimal 2 huruf** dan tidak boleh mengandung angka atau simbol.',
      '7️⃣ Bahasa **Indonesia maupun Inggris** diperbolehkan.',
      '8️⃣ Setiap member memiliki **3 nyawa** ❤️❤️❤️.',
      '9️⃣ Nyawa berkurang **-1** jika:',
      '   • Kata tidak diawali huruf yang benar',
      '   • Kata sudah pernah dipakai',
      '   • Waktu habis (timeout **30 detik**)',
      '🔟 Jika nyawa habis → member **💀 eliminated** dan giliran dilewati.',
      '🏆 Game berakhir jika hanya tersisa **1 member** — dia menjadi **pemenang!**',
      '',
      '**💰 Hadiah & Penalti EXP:**',
      '• Kata benar → **+5 EXP**',
      '• Kata salah / timeout → **-5 EXP**',
      '• EXP langsung masuk ke sistem leveling server',
    ],
  },
];
 
module.exports = {
  name: 'game',
  description: 'Lihat daftar game yang tersedia atau aturan game tertentu',
 
  execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
 
    // ── !game (tanpa argumen) → daftar semua game ────────
    if (!sub) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎮 Daftar Game yang Tersedia')
        .setDescription('Ketik `!game system <nama game>` untuk melihat aturan lengkap.\n\u200B')
        .setFooter({ text: `${message.guild.name} • Luminate Bot` })
        .setTimestamp();
 
      for (const game of games) {
        const cmdList = game.commands
          .map(c => `\`${c.cmd}\` — ${c.desc}`)
          .join('\n');
 
        embed.addFields(
          {
            name:   `${game.emoji} ${game.name}`,
            value:
              `${game.description}\n\n` +
              `**Commands:**\n${cmdList}\n` +
              `**Alias:** ${game.aliases.join(', ')}\n\u200B`,
            inline: false,
          }
        );
      }
 
      embed.addFields({
        name:  '📖 Cara lihat aturan lengkap',
        value: `Ketik \`${p}system wordchain\` untuk aturan Word Chain`,
        inline: false,
      });
 
      return message.reply({ embeds: [embed] });
    }
 
    // ── !game system <nama> → redirect ke !system ────────
    if (sub === 'system') {
      const gameName = args[1]?.toLowerCase();
      return handleSystem(message, gameName);
    }
 
    // ── Kalau argumen tidak dikenal ───────────────────────
    return message.reply(`❌ Subcommand tidak dikenal. Ketik \`${p}game\` untuk melihat daftar game.`);
  },
};
 
// ─── Export handleSystem supaya bisa dipakai command !system ──
function handleSystem(message, gameName) {
  if (!gameName) {
    const list = games.map(g => `• \`${config.prefix}system ${g.id}\` — ${g.emoji} ${g.name}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(0x99aab5)
      .setTitle('📖 Sistem & Aturan Game')
      .setDescription(`Pilih game yang ingin kamu lihat aturannya:\n\n${list}`)
      .setFooter({ text: 'Ketik !system <nama game> untuk aturan lengkap' });
    return message.reply({ embeds: [embed] });
  }
 
  const game = games.find(g => g.id === gameName || g.name.toLowerCase().includes(gameName));
  if (!game) {
    return message.reply(`❌ Game \`${gameName}\` tidak ditemukan. Ketik \`${config.prefix}game\` untuk melihat daftar game.`);
  }
 
  const embed = new EmbedBuilder()
    .setColor(0xf5c518)
    .setTitle(`${game.emoji} Sistem & Aturan — ${game.name}`)
    .setDescription(game.rules.join('\n'))
    .addFields(
      {
        name:   '🕹️ Commands',
        value:  game.commands.map(c => `\`${c.cmd}\` — ${c.desc}`).join('\n'),
        inline: false,
      },
      {
        name:   '⚡ Alias',
        value:  game.aliases.join(', '),
        inline: false,
      }
    )
    .setFooter({ text: `${message.guild.name} • Luminate Bot` })
    .setTimestamp();
 
  return message.reply({ embeds: [embed] });
}
 
module.exports.handleSystem = handleSystem;
 