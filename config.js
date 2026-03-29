// ============================================================
//  LUMINATE BOT — Konfigurasi Utama
//  Edit file ini untuk menyesuaikan bot dengan server Discord kamu
// ============================================================

module.exports = {

  // ─── TOKEN & ID ───────────────────────────────────────────
  token: process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  clientId: process.env.CLIENT_ID  || 'YOUR_CLIENT_ID_HERE',

  // ─── PREFIX (untuk command text biasa) ───────────────────
  prefix: '!',

  // ─── LEVEL & NAMA ROLE ───────────────────────────────────
  // Sesuaikan nama role dengan yang sudah dibuat di Discord server
  levels: [
    { level: 1,  name: '⚡ Spark',               expRequired: 0     },
    { level: 2,  name: '🔹 Flicker',             expRequired: 100   },
    { level: 3,  name: '🌱 Glow',                expRequired: 200   },
    { level: 4,  name: '💎 Shimmer',             expRequired: 400   },
    { level: 5,  name: '🌞 Radiant',             expRequired: 800   },
    { level: 6,  name: '🕯️ Illume',             expRequired: 1400  },
    { level: 7,  name: '🗼 Beacon',              expRequired: 2800  },
    { level: 8,  name: '🔥 Lightbearer',         expRequired: 5600  },
    { level: 9,  name: '🌌 Stellar',             expRequired: 11200 },
    { level: 10, name: '👑 Luminate Ascendant',  expRequired: 22400 },
  ],

  // ─── EXP CHAT ────────────────────────────────────────────
  chat: {
    expPerMessage: 10,          // EXP yang didapat per pesan valid
    cooldownSeconds: 30,        // Cooldown antar pesan (detik)
    minWords: 5,                // Minimal kata dalam pesan
  },

  // ─── EXP VOICE ───────────────────────────────────────────
  voice: {
    expPer2Minutes: 10,         // EXP setiap 2 menit di VC
    checkIntervalMs: 120000,    // Cek interval (2 menit dalam ms)
  },

  // ─── BONUS EXP ───────────────────────────────────────────
  bonus: {
    event: 75,                  // Bonus dari event / kontribusi
    reaction: 20,               // Bonus dari reaction / membantu member
    boosterMultiplier: 1.10,    // Multiplier untuk role booster/VIP (10% bonus)
  },

  // ─── CHANNEL SETTINGS ────────────────────────────────────
  channels: {
    // Channel ID yang TIDAK memberikan EXP (spam/bot/AFK)
    ignoredChannelIds: [],

    // Channel tempat pesan level-up dikirim
    levelUpChannelId: '',

    // Channel announcement
    announcementChannelId: '',

    // Channel khusus per game (isi dengan ID channel)
    // Game HANYA bisa dimainkan di channel ini
    gameChannels: {
      wordchain: '1486793057083854898', // ← ID channel word chain
      withdraw:  '1487535038630199306', // ← ID channel withdraw/mini-game
      gambling:  '', // ← ID channel gambling
      rpg:       '1487535627749691472', // ← ID channel RPG (fight, adventure, dll)
    },

    // ─── SERVER STATS ─────────────────────────────────────
    // ID Category khusus untuk voice channel server stats
    // Buat category baru di Discord → klik kanan → Copy ID → paste di sini
    statsCategory: '1468779291306102835', // ← ID category "📊 SERVER STATS"

    // ID voice channel stats (diisi otomatis saat bot pertama jalan)
    // Bisa juga diisi manual jika channel sudah ada
    statsChannelIds: {},
  },

  // ─── ROLE SETTINGS ───────────────────────────────────────
  roles: {
    // Role ID yang mendapat bonus EXP (booster/VIP)
    // Contoh: ['123456789']
    boosterRoleIds: [],

    // Jika true, role level lama akan dilepas saat naik level
    removeOldLevelRoles: true,
  },

  // ─── DATABASE ────────────────────────────────────────────
  database: {
    // Path ke file JSON untuk menyimpan data user
    path: './data/users.json',
  },

  // ─── PESAN LEVEL UP ──────────────────────────────────────
  // Tersedia placeholder: {user}, {level}, {roleName}, {serverName}
  levelUpMessage: '✨ Selamat {user}! Kamu naik ke **{roleName}** (Lv.{level}) di {serverName}! 🎉',

  // ─── LEADERBOARD ─────────────────────────────────────────
  leaderboard: {
    topCount: 10,   // Jumlah user yang ditampilkan di leaderboard
  },
};