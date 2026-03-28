const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const p = config.prefix;

module.exports = {
  name: 'announce',
  description: '[Admin] Kirim embed announcement lengkap tentang fitur bot ke channel',

  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Hanya admin yang bisa mengirim announcement.');
    }

    // Target channel: mention, atau announcementChannelId di config, atau channel saat ini
    const announcementChannelId = config.channels.announcementChannelId;
    const targetChannel =
      message.mentions.channels.first() ||
      (announcementChannelId ? client.channels.cache.get(announcementChannelId) : null) ||
      message.channel;

    if (!targetChannel) {
      return message.reply('❌ Channel tidak ditemukan. Cek `announcementChannelId` di config.js');
    }

    await message.reply(`✅ Mengirim announcement ke ${targetChannel}...`);

    // ── 1. HEADER ─────────────────────────────────────────────
    const headerEmbed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle('🌟 Selamat Datang di Sistem Luminate!')
      .setDescription(
        '> Luminate adalah sistem leveling & ekonomi eksklusif server ini.\n' +
        '> Semakin aktif kamu, semakin tinggi level dan semakin banyak Lumens yang kamu kumpulkan!\n\n' +
        'Baca panduan di bawah ini dan mulai perjalananmu. ✨'
      )
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await targetChannel.send({ embeds: [headerEmbed] });

    // ── 2. SISTEM LEVELING ────────────────────────────────────
    const levelList = config.levels
      .map(l => `\`Lv.${l.level}\` ${l.name} — **${l.expRequired === 0 ? 'Start' : l.expRequired.toLocaleString() + ' EXP'}**`)
      .join('\n');

    const levelingEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📈 Sistem Leveling')
      .setDescription(
        'EXP bertambah setiap kali kamu aktif di server.\n' +
        'Naik level → role Discord otomatis berubah!\n\u200B'
      )
      .addFields(
        {
          name:  '🏅 Daftar Level & Role',
          value: levelList,
          inline: false,
        },
        {
          name:  '💬 EXP dari Chat',
          value:
            `• **+${config.chat.expPerMessage} EXP** & **+1 ✨ Lumens** per pesan valid\n` +
            `• Minimal **${config.chat.minWords} kata** per pesan\n` +
            `• Cooldown **${config.chat.cooldownSeconds} detik** antar pesan\n` +
            `• Tidak berlaku di channel spam/bot/AFK`,
          inline: true,
        },
        {
          name:  '🎧 EXP dari Voice',
          value:
            `• **+${config.voice.expPer2Minutes} EXP** & **+1 ✨ Lumens** per 2 menit di VC\n` +
            `• Harus **unmute & undeaf**\n` +
            `• EXP & Lumens masuk otomatis`,
          inline: true,
        },
        { name: '\u200B', value: '\u200B', inline: false },
        {
          name:  '⚡ Bonus EXP',
          value:
            `• Event / kontribusi khusus: **+${config.bonus.event} EXP**\n` +
            `• Membantu member / reaction: **+${config.bonus.reaction} EXP**\n` +
            `• Role Booster / VIP: **+${Math.round((config.bonus.boosterMultiplier - 1) * 100)}%** dari semua EXP`,
          inline: false,
        },
        {
          name:  '📊 Estimasi Naik Level',
          value:
            '• Aktif chat + voice santai → **1–2 level per hari**\n' +
            '• Level 10 bisa dicapai dalam **7–20 hari** tergantung keaktifan',
          inline: false,
        },
      )
      .setFooter({ text: 'EXP & role tersinkron otomatis setiap saat' });

    await targetChannel.send({ embeds: [levelingEmbed] });

    // ── 3. SISTEM LUMENS ──────────────────────────────────────
    const lumensEmbed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle('✨ Sistem Mata Uang — Lumens')
      .setDescription(
        'Lumens adalah mata uang eksklusif server ini.\n' +
        'Kumpulkan Lumens dan gunakan untuk gambling, beli role di shop, atau transfer ke member lain!\n\u200B'
      )
      .addFields(
        {
          name:  '💰 Cara Dapat Lumens',
          value:
            `• Chat aktif → **+1 Lumens** per pesan\n` +
            `• Voice Channel → **+1 Lumens** per 2 menit\n` +
            `• Daily Claim → bonus Lumens sesuai streak\n` +
            `• Word Chain → **+5 Lumens** per kata benar\n` +
            `• Withdraw (mini-game) → **20–60 Lumens** per soal`,
          inline: false,
        },
        {
          name:  '🛍️ Kegunaan Lumens',
          value:
            `• **Gambling** — Coinflip & Dice Roll taruhan Lumens\n` +
            `• **Shop** — Beli role eksklusif dengan Lumens\n` +
            `• **Transfer** — Kirim Lumens ke member lain\n` +
            `• **Event** — Hadiah event dari admin`,
          inline: false,
        },
        {
          name:  '🕹️ Commands Lumens',
          value:
            `\`${p}wallet\` — Cek saldo Lumens kamu\n` +
            `\`${p}wallet @user\` — Cek saldo member lain\n` +
            `\`${p}wallet transfer @user <jumlah>\` — Transfer Lumens\n` +
            `\`${p}wallet top\` — Leaderboard Lumens\n` +
            `\`${p}daily\` — Claim EXP & Lumens harian\n` +
            `\`${p}withdraw\` — Main mini-game dapat Lumens\n` +
            `\`${p}gamble coinflip <jumlah> heads/tails\` — Coinflip\n` +
            `\`${p}gamble dice <jumlah>\` — Dice Roll\n` +
            `\`${p}shop\` — Lihat & beli item di shop`,
          inline: false,
        },
      )
      .setFooter({ text: 'Luminate Economy' });

    await targetChannel.send({ embeds: [lumensEmbed] });

    // ── 4. DAILY CLAIM ────────────────────────────────────────
    const dailyEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🎁 Daily Claim & Streak')
      .setDescription(
        `Ketik \`${p}daily\` setiap hari untuk dapat EXP & Lumens bonus!\n` +
        'Makin panjang streak, makin besar hadiahnya!\n\u200B'
      )
      .addFields(
        {
          name:  '🔥 Tabel Streak Harian',
          value:
            '`Hari 1` → **10 EXP & 10 Lumens**\n' +
            '`Hari 2` → **20 EXP & 20 Lumens**\n' +
            '`Hari 3` → **40 EXP & 40 Lumens**\n' +
            '`Hari 4` → **80 EXP & 80 Lumens**\n' +
            '`Hari 5` → **160 EXP & 160 Lumens**\n' +
            '`Hari 6` → **320 EXP & 320 Lumens**\n' +
            '`Hari 7` → **500 EXP & 500 Lumens** 🏆',
          inline: false,
        },
        {
          name:  '⚠️ Perhatian',
          value:
            '• Streak putus jika tidak claim lebih dari **48 jam**\n' +
            '• Setelah 7 hari streak selesai → reset ke hari 1\n' +
            `• Alias: \`${p}claim\`, \`${p}checkin\``,
          inline: false,
        },
      )
      .setFooter({ text: 'Claim setiap hari untuk menjaga streak!' });

    await targetChannel.send({ embeds: [dailyEmbed] });

    // ── 5. GAME ───────────────────────────────────────────────
    const gameEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🎮 Game yang Tersedia')
      .setDescription(
        `Mainkan game seru bareng member lain dan dapatkan EXP & Lumens!\n` +
        `Ketik \`${p}system <nama game>\` untuk aturan lengkap.\n\u200B`
      )
      .addFields(
        {
          name:  '🔤 Word Chain (Sambung Kata)',
          value:
            'Sambung kata dari huruf terakhir kata sebelumnya!\n' +
            'Setiap member punya **3 nyawa ❤️❤️❤️** — habis nyawa, kamu eliminated!\n\n' +
            `\`${p}wordchain start <kata>\` — Buka lobby\n` +
            `\`${p}wordchain join\` — Ikut lobby\n` +
            `\`${p}wordchain begin\` — Mulai game (min. 2 member)\n` +
            `\`${p}wordchain players\` — Cek status nyawa\n` +
            `\`${p}wordchain stop\` — Hentikan game\n\n` +
            `**Alias:** \`${p}wc\`, \`${p}sambungkata\`\n` +
            `**Hadiah:** +5 EXP & +5 Lumens per kata benar | -5 EXP & -1 nyawa jika salah/timeout`,
          inline: false,
        },
        { name: '\u200B', value: '\u200B', inline: false },
        {
          name:  '🎮 Withdraw (Mini-game)',
          value:
            'Jawab soal random dan dapatkan Lumens!\n' +
            '3 tipe soal: 🧮 Matematika, 🔀 Tebak Kata, 🧠 Trivia\n\n' +
            `\`${p}withdraw\` — Mulai mini-game (cooldown 2 menit)\n\n` +
            `**Alias:** \`${p}wd\`, \`${p}kerja\`\n` +
            `**Hadiah:** 20–60 Lumens per soal benar`,
          inline: false,
        },
      )
      .setFooter({ text: `Ketik ${p}game untuk daftar lengkap semua game` });

    await targetChannel.send({ embeds: [gameEmbed] });

    // ── 6. COMMAND UMUM ───────────────────────────────────────
    const commandEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🕹️ Semua Command')
      .setDescription('Semua member bisa menggunakan command berikut:\n\u200B')
      .addFields(
        {
          name:  '📊 Leveling',
          value:
            `\`${p}rank\` / \`${p}rank @user\` — Cek level & EXP\n` +
            `\`${p}leaderboard\` / \`${p}lb\` / \`${p}top\` — Top 10 member paling aktif\n` +
            `\`${p}levels\` — Daftar semua level & EXP yang dibutuhkan`,
          inline: false,
        },
        {
          name:  '✨ Ekonomi',
          value:
            `\`${p}wallet\` — Cek saldo Lumens\n` +
            `\`${p}wallet transfer @user <jumlah>\` — Transfer Lumens\n` +
            `\`${p}wallet top\` — Leaderboard Lumens\n` +
            `\`${p}daily\` / \`${p}claim\` — Claim EXP & Lumens harian\n` +
            `\`${p}withdraw\` / \`${p}wd\` — Mini-game dapat Lumens\n` +
            `\`${p}shop\` — Lihat & beli item\n` +
            `\`${p}gamble coinflip <jumlah> heads/tails\` — Coinflip\n` +
            `\`${p}gamble dice <jumlah>\` — Dice Roll`,
          inline: false,
        },
        {
          name:  '🎮 Game',
          value:
            `\`${p}game\` — Lihat daftar semua game\n` +
            `\`${p}system <nama game>\` — Lihat aturan lengkap game\n` +
            `\`${p}wordchain start <kata>\` — Mulai Word Chain`,
          inline: false,
        },
      )
      .setFooter({ text: `Prefix bot: ${p}` });

    await targetChannel.send({ embeds: [commandEmbed] });

    // ── 7. ADMIN COMMAND ──────────────────────────────────────
    const adminEmbed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('⚙️ Command Admin')
      .setDescription('Hanya **Administrator** server yang dapat menggunakan command berikut:\n\u200B')
      .addFields(
        {
          name:  '📊 EXP Management',
          value:
            `\`${p}admin addexp @user <jumlah> [tipe]\` — Tambah EXP, notif DM & channel otomatis\n` +
            `\`${p}admin removeexp @user <jumlah>\` — Kurangi EXP, role turun otomatis\n` +
            `\`${p}admin resetexp @user RESET\` — Reset EXP & level 1 user ke 0\n` +
            `\`${p}admin resetall RESETALL\` — Reset EXP & level semua member\n` +
            `\`${p}admin syncroles @user\` — Sinkron ulang role sesuai EXP`,
          inline: false,
        },
        {
          name:  '✨ Lumens Management',
          value:
            `\`${p}admin addlumens @user <jumlah>\` — Tambah Lumens ke user\n` +
            `\`${p}admin removelumens @user <jumlah>\` — Kurangi Lumens dari user\n` +
            `\`${p}admin resetlumens @user RESET\` — Reset Lumens user ke 0`,
          inline: false,
        },
        {
          name:  '📣 Lainnya',
          value:
            `\`${p}announce [#channel]\` — Kirim ulang announcement ini`,
          inline: false,
        },
      )
      .setFooter({ text: 'Semua perubahan EXP & Lumens tersinkron otomatis' });

    await targetChannel.send({ embeds: [adminEmbed] });

    // ── 8. PENUTUP ────────────────────────────────────────────
    const closingEmbed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle('✨ Selamat Bermain!')
      .setDescription(
        '> Jadilah member paling aktif dan raih **👑 Luminate Ascendant**!\n\n' +
        `Ketik \`${p}rank\` untuk cek progress kamu sekarang.\n` +
        `Ketik \`${p}daily\` untuk claim EXP & Lumens harian.\n` +
        `Ketik \`${p}game\` untuk lihat semua game yang tersedia.\n\n` +
        '*Good luck & have fun!* 🚀'
      )
      .setFooter({ text: `${message.guild.name} • Powered by Luminate Bot`, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await targetChannel.send({ embeds: [closingEmbed] });
  },
};