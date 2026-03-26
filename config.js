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
    // Contoh: ['123456789', '987654321']
    ignoredChannelIds: [],

    // Channel tempat pesan level-up dikirim
    // Kosongkan ('') untuk kirim ke channel yang sama dengan chat
    levelUpChannelId: '',

     announcementChannelId:  '1433455163498303632', // Channel untuk pengumuman EXP & aturan
  },

  // ─── ROLE SETTINGS ───────────────────────────────────────
  roles: {
    // Role ID yang mendapat bonus EXP (booster/VIP)
    // Contoh: ['123456789']
    boosterRoleIds: [],

    // Jika true, role level lama akan dilepas saat naik level
    removeOldLevelRoles: false,
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
