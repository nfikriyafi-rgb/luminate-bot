const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
 
const p = config.prefix;
 
module.exports = {
  name: 'announce',
  description: '[Admin] Kirim embed announcement lengkap tentang fitur bot ke channel',
 
  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Hanya admin yang bisa mengirim announcement.');
    }
 
    // Kirim ke channel yang disebutkan, atau channel saat ini
   const announcementChannelId = config.channels.announcementChannelId;
   const targetChannel = message.mentions.channels.first() ||
  (announcementChannelId ? client.channels.cache.get(announcementChannelId) : null) ||
  message.channel;

 if (!targetChannel) {
  return message.reply('❌ Channel announcement tidak ditemukan. Cek `announcementChannelId` di config.js');
}
 
    await message.reply(`✅ Mengirim announcement ke ${targetChannel}...`);
 
    // ── 1. HEADER ─────────────────────────────────────────────
    const headerEmbed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle('🌟 Selamat Datang di Sistem Luminate!')
      .setDescription(
        '> Luminate adalah sistem leveling eksklusif server ini.\n' +
        '> Semakin aktif kamu di server, semakin tinggi levelmu!\n\n' +
        'Di bawah ini adalah panduan lengkap semua fitur yang tersedia.\n' +
        'Baca baik-baik dan mulai perjalananmu! ✨'
      )
      .setImage('https://i.imgur.com/placeholder.png') // ganti dengan banner server jika ada
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
        'EXP kamu akan terus bertambah setiap kali aktif di server.\n' +
        'Setiap naik level, role Discord kamu otomatis berubah!\n\u200B'
      )
      .addFields(
        {
          name: '🏅 Daftar Level & Role',
          value: levelList,
          inline: false,
        },
        {
          name: '💬 EXP dari Chat',
          value:
            `• **+${config.chat.expPerMessage} EXP** setiap pesan yang valid\n` +
            `• Minimal **${config.chat.minWords} kata** per pesan\n` +
            `• Cooldown **${config.chat.cooldownSeconds} detik** antar pesan\n` +
            `• Tidak berlaku di channel spam/bot/AFK`,
          inline: true,
        },
        {
          name: '🎧 EXP dari Voice',
          value:
            `• **+${config.voice.expPer2Minutes} EXP** setiap **2 menit** di Voice Channel\n` +
            `• Harus dalam kondisi **unmute & undeaf**\n` +
            `• EXP langsung masuk otomatis`,
          inline: true,
        },
        {
          name: '\u200B',
          value: '\u200B',
          inline: false,
        },
        {
          name: '⚡ Bonus EXP',
          value:
            `• Event / kontribusi khusus: **+${config.bonus.event} EXP**\n` +
            `• Membantu member / reaction: **+${config.bonus.reaction} EXP**\n` +
            `• Role Booster / VIP: **+${Math.round((config.bonus.boosterMultiplier - 1) * 100)}% EXP** dari semua aktivitas`,
          inline: false,
        },
        {
          name: '📊 Estimasi Naik Level',
          value:
            '• Aktif chat + voice santai → **1–2 level per hari**\n' +
            '• Level 10 bisa dicapai dalam **7–20 hari** tergantung keaktifan',
          inline: false,
        }
      )
      .setFooter({ text: 'EXP & role tersinkron otomatis setiap saat' });
 
    await targetChannel.send({ embeds: [levelingEmbed] });
 
    // ── 3. COMMAND UMUM ───────────────────────────────────────
    const commandEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🕹️ Command Umum')
      .setDescription('Semua member bisa menggunakan command berikut:\n\u200B')
      .addFields(
        {
          name: `\`${p}rank\``,
          value: 'Cek level, EXP, dan progress kamu saat ini.\nContoh: `!rank` atau `!rank @user`',
          inline: false,
        },
        {
          name: `\`${p}leaderboard\` / \`${p}lb\` / \`${p}top\``,
          value: 'Lihat **Top 10 member** paling aktif di server berdasarkan EXP.',
          inline: false,
        },
        {
          name: `\`${p}levels\``,
          value: 'Tampilkan semua level, nama role, dan EXP yang dibutuhkan.',
          inline: false,
        },
        {
          name: `\`${p}game\``,
          value: 'Lihat daftar semua game yang tersedia beserta cara memulainya.',
          inline: false,
        },
        {
          name: `\`${p}system <nama game>\``,
          value: 'Lihat aturan lengkap suatu game.\nContoh: `!system wordchain`',
          inline: false,
        },
      )
      .setFooter({ text: `Prefix bot: ${p}` });
 
    await targetChannel.send({ embeds: [commandEmbed] });
 
    // ── 4. GAME ───────────────────────────────────────────────
    const gameEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🎮 Game yang Tersedia')
      .setDescription('Mainkan game seru bareng member lain dan dapatkan EXP tambahan!\n\u200B')
      .addFields(
        {
          name: '🔤 Word Chain (Sambung Kata)',
          value:
            'Sambung kata dari huruf terakhir kata sebelumnya!\n' +
            'Setiap member punya **3 nyawa ❤️❤️❤️** — habis nyawa, kamu eliminated!\n\n' +
            `**Cara main:**\n` +
            `\`${p}wordchain start <kata>\` — Buka lobby\n` +
            `\`${p}wordchain join\` — Ikut lobby\n` +
            `\`${p}wordchain begin\` — Mulai game (min. 2 member)\n` +
            `\`${p}wordchain players\` — Cek status nyawa\n` +
            `\`${p}wordchain stop\` — Hentikan game\n\n` +
            `**Alias:** \`${p}wc\`, \`${p}sambungkata\`\n` +
            `**Hadiah:** +5 EXP per kata benar | -5 EXP & -1 nyawa jika salah/timeout`,
          inline: false,
        },
      )
      .setFooter({ text: 'Ketik !system <nama game> untuk aturan lengkap' });
 
    await targetChannel.send({ embeds: [gameEmbed] });
 
    // ── 5. ADMIN COMMAND ──────────────────────────────────────
    const adminEmbed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('⚙️ Command Admin')
      .setDescription('Hanya **Administrator** server yang dapat menggunakan command berikut:\n\u200B')
      .addFields(
        {
          name: `\`${p}admin addexp @user <jumlah> [tipe]\``,
          value:
            'Tambah EXP manual ke user.\n' +
            'Role naik otomatis jika level bertambah. Notifikasi dikirim ke DM & channel.\n' +
            `Contoh: \`${p}admin addexp @user 75 event\``,
          inline: false,
        },
        {
          name: `\`${p}admin removeexp @user <jumlah>\``,
          value:
            'Kurangi EXP dari user. EXP tidak bisa di bawah 0.\n' +
            'Role turun otomatis jika level berkurang.\n' +
            `Contoh: \`${p}admin removeexp @user 50\``,
          inline: false,
        },
        {
          name: `\`${p}admin resetexp @user RESET\``,
          value:
            'Reset semua EXP & level user ke 0.\n' +
            'Harus mengetik `RESET` sebagai konfirmasi.\n' +
            `Contoh: \`${p}admin resetexp @user RESET\``,
          inline: false,
        },
        {
          name: `\`${p}admin resetall RESETALL\``,
          value:
            'Reset EXP & level **semua member** ke 0 sekaligus.\n' +
            'Harus mengetik `RESETALL` sebagai konfirmasi.',
          inline: false,
        },
        {
          name: `\`${p}admin syncroles @user\``,
          value:
            'Paksa sinkron ulang role Discord user sesuai EXP saat ini.\n' +
            'Berguna jika role tidak sinkron dengan level.',
          inline: false,
        },
        {
          name: `\`${p}announce [#channel]\``,
          value:
            'Kirim ulang announcement ini ke channel tertentu.\n' +
            `Contoh: \`${p}announce #announcements\``,
          inline: false,
        },
      )
      .setFooter({ text: 'Semua perubahan EXP otomatis tersinkron ke role server' });
 
    await targetChannel.send({ embeds: [adminEmbed] });
 
    // ── 6. FOOTER / PENUTUP ───────────────────────────────────
    const closingEmbed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle('✨ Selamat Bermain!')
      .setDescription(
        '> Jadilah member paling aktif dan raih **👑 Luminate Ascendant**!\n\n' +
        `Ketik \`${p}rank\` untuk mulai cek progressmu sekarang.\n` +
        `Ketik \`${p}game\` untuk melihat game yang tersedia.\n\n` +
        '*Good luck & have fun!* 🚀'
      )
      .setFooter({ text: `${message.guild.name} • Powered by Luminate Bot`, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();
 
    await targetChannel.send({ embeds: [closingEmbed] });
  },
};