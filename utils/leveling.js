const config = require('../config');
const db     = require('./database');

// ─── Cari level berdasarkan total EXP ────────────────────────
function getLevelFromExp(exp) {
  let current = config.levels[0];
  for (const lvl of config.levels) {
    if (exp >= lvl.expRequired) current = lvl;
    else break;
  }
  return current;
}

// ─── Ambil info level berikutnya ─────────────────────────────
function getNextLevel(currentLevel) {
  return config.levels.find(l => l.level === currentLevel + 1) || null;
}

// ─── Hitung EXP yang perlu ditambahkan (dengan multiplier) ───
function calculateExp(baseExp, member) {
  const boosterIds = config.roles.boosterRoleIds;
  const isBooster  = boosterIds.length > 0 &&
    boosterIds.some(id => member.roles.cache.has(id));
  return isBooster
    ? Math.floor(baseExp * config.bonus.boosterMultiplier)
    : baseExp;
}

// ─── Tambah EXP ke user & cek naik level ─────────────────────
// Returns: { leveled: boolean, oldLevel, newLevel, userData }
async function addExp(userId, member, baseExp) {
  const userData  = db.getUser(userId);
  const oldLevel  = userData.level;

  const expToAdd  = calculateExp(baseExp, member);
  userData.exp   += expToAdd;

  // Cek naik level (bisa naik lebih dari 1 sekaligus)
  let leveled = false;
  let newLevelData = getLevelFromExp(userData.exp);

  if (newLevelData.level > oldLevel) {
    leveled          = true;
    userData.level   = newLevelData.level;

    // Urus role di Discord
    await updateRoles(member, newLevelData.name);
  }

  db.saveUser(userId, userData);

  return {
    leveled,
    oldLevel,
    newLevel:     newLevelData.level,
    newLevelName: newLevelData.name,
    userData,
    expAdded: expToAdd,
  };
}

// ─── Update role Discord sesuai level baru ───────────────────
async function updateRoles(member, newRoleName) {
  try {
    const guild      = member.guild;
    const allRoleNames = config.levels.map(l => l.name);

    // Cari role baru
    const newRole = guild.roles.cache.find(r => r.name === newRoleName);
    if (!newRole) {
      console.warn(`[Luminate] Role "${newRoleName}" tidak ditemukan di server.`);
      return;
    }

    // Hapus role level lama jika diaktifkan
    if (config.roles.removeOldLevelRoles) {
      const rolesToRemove = member.roles.cache.filter(r =>
        allRoleNames.includes(r.name) && r.name !== newRoleName
      );
      for (const [, role] of rolesToRemove) {
        await member.roles.remove(role).catch(console.error);
      }
    }

    // Tambah role baru
    await member.roles.add(newRole).catch(console.error);
  } catch (err) {
    console.error('[Luminate] Gagal update role:', err);
  }
}

// ─── Kurangi EXP dari user & sinkron role ────────────────────
// Returns: { levelChanged, oldLevel, newLevel, newLevelName, userData }
async function removeExp(userId, member, amount) {
  const userData = db.getUser(userId);
  const oldLevel = userData.level;

  userData.exp = Math.max(0, userData.exp - amount); // tidak bisa minus

  const newLevelData = getLevelFromExp(userData.exp);
  const levelChanged = newLevelData.level !== oldLevel;

  if (levelChanged) {
    userData.level = newLevelData.level;
    await updateRoles(member, newLevelData.name);
  }

  db.saveUser(userId, userData);

  return {
    levelChanged,
    oldLevel,
    newLevel:     newLevelData.level,
    newLevelName: newLevelData.name,
    userData,
  };
}

// ─── Reset EXP user ke 0 & kembalikan ke level 1 ─────────────
async function resetExp(userId, member) {
  const userData    = db.getUser(userId);
  const oldLevel    = userData.level;

  userData.exp             = 0;
  userData.level           = 1;
  userData.lastMessageTimestamp = 0;
  userData.totalMessages   = 0;
  userData.totalVoiceMinutes = 0;

  // Lepas semua role level, pasang role level 1
  await updateRoles(member, config.levels[0].name);

  db.saveUser(userId, userData);

  return { oldLevel, userData };
}

// ─── Sinkron ulang role berdasarkan EXP saat ini ─────────────
// Berguna jika role server berubah atau ada data yang tidak sinkron
async function syncRoles(userId, member) {
  const userData = db.getUser(userId);
  const lvlData  = getLevelFromExp(userData.exp);

  userData.level = lvlData.level;
  db.saveUser(userId, userData);

  await updateRoles(member, lvlData.name);
  return lvlData;
}

// ─── Cek apakah channel diabaikan ────────────────────────────
function isIgnoredChannel(channelId) {
  return config.channels.ignoredChannelIds.includes(channelId);
}

// ─── Cek cooldown chat ────────────────────────────────────────
function isChatOnCooldown(userId) {
  const user      = db.getUser(userId);
  const now       = Date.now();
  const cooldownMs = config.chat.cooldownSeconds * 1000;
  return (now - user.lastMessageTimestamp) < cooldownMs;
}

// ─── Update timestamp pesan terakhir ─────────────────────────
function updateLastMessage(userId) {
  const user = db.getUser(userId);
  user.lastMessageTimestamp = Date.now();
  user.totalMessages = (user.totalMessages || 0) + 1;
  db.saveUser(userId, user);
}

// ─── Cek apakah pesan cukup panjang ──────────────────────────
function isMessageValid(content) {
  const words = content.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length >= config.chat.minWords;
}

// ─── Kirim pesan level up via DM ─────────────────────────────
async function sendLevelUpMessage(client, message, result) {
  const { newLevel, newLevelName } = result;
  const serverName = message.guild.name;
  const user = message.author;

  const text = config.levelUpMessage
    .replace('{user}',       `**${user.username}**`)
    .replace('{level}',      newLevel)
    .replace('{roleName}',   newLevelName)
    .replace('{serverName}', serverName);

  await user.send(text).catch(() => {
    console.warn(`[Luminate] Tidak bisa kirim DM ke ${user.tag} — DM mungkin dinonaktifkan.`);
  });
}

module.exports = {
  getLevelFromExp,
  getNextLevel,
  addExp,
  removeExp,
  resetExp,
  syncRoles,
  isIgnoredChannel,
  isChatOnCooldown,
  updateLastMessage,
  isMessageValid,
  sendLevelUpMessage,
};
