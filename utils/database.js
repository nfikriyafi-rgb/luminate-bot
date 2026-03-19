const fs   = require('fs');
const path = require('path');
const config = require('../config');

const DB_PATH = path.resolve(config.database.path);

// ─── Pastikan folder & file ada ──────────────────────────────
function ensureDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
}

// ─── Load semua data ─────────────────────────────────────────
function loadAll() {
  ensureDatabase();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

// ─── Simpan semua data ───────────────────────────────────────
function saveAll(data) {
  ensureDatabase();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── Buat data default user baru ─────────────────────────────
function defaultUser() {
  return {
    exp: 0,
    level: 1,
    lastMessageTimestamp: 0,  // Unix ms, untuk cooldown chat
    totalMessages: 0,
    totalVoiceMinutes: 0,
  };
}

// ─── Ambil data satu user ─────────────────────────────────────
function getUser(userId) {
  const all  = loadAll();
  if (!all[userId]) all[userId] = defaultUser();
  return all[userId];
}

// ─── Simpan data satu user ────────────────────────────────────
function saveUser(userId, userData) {
  const all = loadAll();
  all[userId] = userData;
  saveAll(all);
}

// ─── Ambil semua user (untuk leaderboard) ────────────────────
function getAllUsers() {
  return loadAll();
}

module.exports = { getUser, saveUser, getAllUsers };
