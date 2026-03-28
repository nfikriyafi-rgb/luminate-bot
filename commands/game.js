const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const p = config.prefix;

// ─────────────────────────────────────────────────────────────
//  DAFTAR GAME
// ─────────────────────────────────────────────────────────────

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
      '4️⃣ Setiap giliran, kirim **1 kata** yang diawali huruf terakhir kata sebelumnya.',
      '   Contoh: kata terakhir **"makan"** → harus mulai dari huruf **N** (misal: "nasi", "nilai", dst.)',
      '5️⃣ Kata **tidak boleh diulang** sepanjang game berlangsung.',
      '6️⃣ Kata harus **minimal 2 huruf**, tidak boleh mengandung angka atau simbol.',
      '7️⃣ Bahasa **Indonesia maupun Inggris** diperbolehkan.',
      '8️⃣ Setiap member memiliki **3 nyawa** ❤️❤️❤️.',
      '9️⃣ Nyawa berkurang **-1** jika:',
      '   • Kata tidak diawali huruf yang benar',
      '   • Kata sudah pernah dipakai',
      '   • Waktu habis (timeout **30 detik**)',
      '🔟 Jika nyawa habis → member **💀 eliminated**, giliran dilewati.',
      '🏆 Game berakhir jika hanya tersisa **1 member** → dia jadi **pemenang!**',
      '',
      '**💰 Hadiah & Penalti:**',
      '• Kata benar → **+5 EXP** & **+5 Lumens ✨**',
      '• Kata salah / timeout → **-5 EXP** & **-1 nyawa**',
    ],
  },
  {
    id:          'withdraw',
    emoji:       '🎮',
    name:        'Withdraw (Mini-game)',
    description: 'Jawab soal dan dapatkan Lumens! Ada 3 tipe soal: Matematika, Tebak Kata, dan Trivia.',
    commands: [
      { cmd: `${p}withdraw`, desc: 'Mulai mini-game untuk dapat Lumens (cooldown 2 menit)' },
    ],
    aliases: [`${p}wd`, `${p}kerja`],
    rules: [
      '1️⃣ Ketik `!withdraw` untuk memulai mini-game.',
      '2️⃣ Bot akan memberikan salah satu dari 3 jenis soal secara **random**:',
      '   🧮 **Matematika** — Jawab soal hitung-hitungan (contoh: 7 x 8)',
      '   🔀 **Tebak Kata** — Tebak kata yang hurufnya diacak (contoh: "etdiscor" → "discord")',
      '   🧠 **Trivia** — Jawab pertanyaan pengetahuan umum',
      '3️⃣ Ketik jawabanmu langsung di chat dalam **30 detik**.',
      '4️⃣ Jawaban benar → dapat **20–60 Lumens** tergantung jenis soal.',
      '5️⃣ Jawaban salah atau timeout → tidak dapat Lumens.',
      '6️⃣ Cooldown **2 menit** setelah setiap percobaan (benar maupun salah).',
      '7️⃣ Hanya bisa ada **1 soal aktif** per user dalam satu waktu.',
      '',
      '**💰 Hadiah per jenis soal:**',
      '• 🧮 Matematika → **20–50 Lumens**',
      '• 🔀 Tebak Kata → **30–60 Lumens**',
      '• 🧠 Trivia → **25–55 Lumens**',
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  HANDLE SYSTEM (dipakai juga oleh !system command)
// ─────────────────────────────────────────────────────────────

function handleSystem(message, gameName) {
  if (!gameName) {
    const list = games.map(g => `• \`${p}system ${g.id}\` — ${g.emoji} ${g.name}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(0x99aab5)
      .setTitle('📖 Sistem & Aturan Game')
      .setDescription(`Pilih game yang ingin kamu lihat aturannya:\n\n${list}\n\nKetik \`${p}system <nama game>\` untuk detail.`)
      .setFooter({ text: `${message.guild.name} • Luminate Bot` });
    return message.reply({ embeds: [embed] });
  }

  const game = games.find(g =>
    g.id === gameName ||
    g.name.toLowerCase().includes(gameName)
  );

  if (!game) {
    const list = games.map(g => `\`${g.id}\``).join(', ');
    return message.reply(`❌ Game \`${gameName}\` tidak ditemukan.\nGame yang tersedia: ${list}`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xf5c518)
    .setTitle(`${game.emoji} Sistem & Aturan — ${game.name}`)
    .setDescription(game.rules.join('\n'))
    .addFields(
      {
        name:  '🕹️ Commands',
        value: game.commands.map(c => `\`${c.cmd}\` — ${c.desc}`).join('\n'),
        inline: false,
      },
      {
        name:  '⚡ Alias',
        value: game.aliases.join(', '),
        inline: false,
      },
    )
    .setFooter({ text: `${message.guild.name} • Luminate Bot` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────

module.exports = {
  name: 'game',
  description: 'Lihat daftar game yang tersedia beserta cara mainnya',

  execute(message, args) {
    const sub = (args[0] || '').toLowerCase();

    // !game system <nama> → tampilkan aturan
    if (sub === 'system') {
      return handleSystem(message, (args[1] || '').toLowerCase() || null);
    }

    // !game → daftar semua game
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎮 Daftar Game yang Tersedia')
      .setDescription(
        `Ketik \`${p}system <nama game>\` untuk melihat aturan lengkap.\n\u200B`
      )
      .setFooter({ text: `${message.guild.name} • Luminate Bot` })
      .setTimestamp();

    for (const game of games) {
      const cmdList = game.commands
        .map(c => `\`${c.cmd}\` — ${c.desc}`)
        .join('\n');

      embed.addFields({
        name:  `${game.emoji} ${game.name}`,
        value:
          `${game.description}\n\n` +
          `**Commands:**\n${cmdList}\n` +
          `**Alias:** ${game.aliases.join(', ')}\n\u200B`,
        inline: false,
      });
    }

    embed.addFields({
      name:  '📖 Lihat aturan lengkap',
      value: games.map(g => `\`${p}system ${g.id}\` — ${g.emoji} ${g.name}`).join('\n'),
      inline: false,
    });

    return message.reply({ embeds: [embed] });
  },

  handleSystem,
};