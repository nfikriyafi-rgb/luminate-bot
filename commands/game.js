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
    description: 'Jawab soal random dan dapatkan Lumens! Ada 3 tipe soal: Matematika, Tebak Kata, dan Trivia.',
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
  {
    id:          'rpg',
    emoji:       '⚔️',
    name:        'Luminate RPG',
    description: 'Game RPG lengkap! Lawan monster, kumpulkan item langka, naik level, dan jadi yang terkuat di server!',
    commands: [
      { cmd: `${p}profile`,         desc: 'Lihat stats & equipment karaktermu' },
      { cmd: `${p}fight`,           desc: 'Lawan monster & dapatkan item + Lumens (cooldown 30 detik)' },
      { cmd: `${p}inventory`,       desc: 'Lihat semua item di inventory' },
      { cmd: `${p}equip <item_id>`, desc: 'Pasang weapon/armor/accessory' },
      { cmd: `${p}use <item_id>`,   desc: 'Pakai potion atau consumable' },
      { cmd: `${p}sell <item_id>`,  desc: 'Jual item → dapat Lumens' },
      { cmd: `${p}heal`,            desc: 'Bayar Lumens untuk pulihkan HP penuh' },
      { cmd: `${p}travel`,          desc: 'Lihat & pindah ke area berbeda' },
      { cmd: `${p}shop`,            desc: 'Beli item dengan Lumens' },
    ],
    aliases: [`${p}char`, `${p}hero`, `${p}inv`, `${p}bag`],
    rules: [
      '1️⃣ Mulai dengan ketik `!profile` untuk lihat stats awal karaktermu.',
      '2️⃣ Ketik `!fight` untuk lawan monster di areamu sekarang.',
      '3️⃣ Menang → dapat **EXP RPG**, **Lumens ✨**, dan kemungkinan **drop item**.',
      '4️⃣ Kalah → HP dipulihkan ke 30%, bisa langsung lawan lagi!',
      '',
      '**🗺️ Area System:**',
      '• 🌲 Forest → Min Lv.1 (awal semua player)',
      '• 🏔️ Mountain → Min Lv.3',
      '• 🏰 Dungeon → Min Lv.5',
      '• 🔥 Volcano → Min Lv.8',
      '• 🌌 End Realm → Min Lv.10',
      'Ketik `!travel` untuk pindah area. Area lebih sulit = reward lebih besar!',
      '',
      '**🎒 Item & Equipment:**',
      '• Item didapat dari drop monster atau beli di `!shop`',
      '• Pasang item dengan `!equip <id>` untuk boost stats',
      '• Jual item yang tidak diperlukan dengan `!sell <id>`',
      '• Pakai potion dengan `!use <id>` saat HP menipis',
      '',
      '**⚔️ Rarity Item (dari terendah ke tertinggi):**',
      '⚪ Common → 🟢 Uncommon → 🔵 Rare → 🟣 Epic → 🟡 Legendary → 🔴 Mythic',
      'Semakin tinggi Luck, semakin besar chance dapat item langka!',
      '',
      '**⚔️ Battle System:**',
      '• Damage = ATK (80–120%) dikurangi DEF monster',
      '• 🎯 Crit → damage x2',
      '• 💨 Dodge → hindari serangan monster',
      '• 🩸 Lifesteal → pulihkan HP dari damage yang diberikan',
      '• Cooldown fight: **30 detik**',
      '',
      '**💰 Ekonomi RPG:**',
      '• Semua transaksi pakai **Lumens ✨**',
      '• Jual item → 60% dari harga asli',
      '• Heal HP → 0.5 Lumens per HP',
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  HANDLE SYSTEM
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

    if (sub === 'system') {
      return handleSystem(message, (args[1] || '').toLowerCase() || null);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎮 Daftar Game yang Tersedia')
      .setDescription(`Ketik \`${p}system <nama game>\` untuk melihat aturan lengkap.\n\u200B`)
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