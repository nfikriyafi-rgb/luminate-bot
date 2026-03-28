const db = require('./database');
 
// ─── Ambil saldo Lumens user ──────────────────────────────────
function getBalance(userId) {
  const user = db.getUser(userId);
  return user.lumens || 0;
}
 
// ─── Tambah Lumens ────────────────────────────────────────────
function addLumens(userId, amount) {
  const user = db.getUser(userId);
  user.lumens = (user.lumens || 0) + Math.floor(amount);
  db.saveUser(userId, user);
  return user.lumens;
}
 
// ─── Kurangi Lumens (return false kalau tidak cukup) ─────────
function removeLumens(userId, amount) {
  const user = db.getUser(userId);
  if ((user.lumens || 0) < amount) return false;
  user.lumens -= Math.floor(amount);
  db.saveUser(userId, user);
  return user.lumens;
}
 
// ─── Transfer Lumens antar user ───────────────────────────────
function transferLumens(fromId, toId, amount) {
  const result = removeLumens(fromId, amount);
  if (result === false) return false;
  addLumens(toId, amount);
  return true;
}
 
// ─── Set Lumens (untuk admin) ─────────────────────────────────
function setLumens(userId, amount) {
  const user = db.getUser(userId);
  user.lumens = Math.max(0, Math.floor(amount));
  db.saveUser(userId, user);
  return user.lumens;
}
 
// ─── Leaderboard Lumens ───────────────────────────────────────
function getLumensLeaderboard(top = 10) {
  const all = db.getAllUsers();
  return Object.entries(all)
    .map(([id, data]) => ({ id, lumens: data.lumens || 0 }))
    .filter(u => u.lumens > 0)
    .sort((a, b) => b.lumens - a.lumens)
    .slice(0, top);
}
 
// ─── Format angka Lumens ──────────────────────────────────────
function formatLumens(amount) {
  return `✨ **${amount.toLocaleString()} Lumens**`;
}
 
module.exports = { getBalance, addLumens, removeLumens, transferLumens, setLumens, getLumensLeaderboard, formatLumens };