const leveling = require('./leveling');
const db       = require('./database');
const config   = require('../config');
 
// Map<userId, intervalId> — melacak interval aktif per user
const voiceIntervals = new Map();
 
// ─── Mulai tracking EXP voice ────────────────────────────────
function startVoiceTracking(userId, member, voiceState, client) {
  if (voiceIntervals.has(userId)) return; // jangan dobel
 
  const intervalId = setInterval(async () => {
    const guild        = member.guild;
    const currentState = guild.voiceStates.cache.get(userId);
 
    if (!currentState || !currentState.channelId) {
      stopVoiceTracking(userId);
      return;
    }
 
    const isMuted = currentState.selfMute || currentState.serverMute;
    const isDeaf  = currentState.selfDeaf  || currentState.serverDeaf;
    if (isMuted || isDeaf) return;
 
    // Tambah stat voice minutes
    const user = db.getUser(userId);
    user.totalVoiceMinutes = (user.totalVoiceMinutes || 0) + 2;
    db.saveUser(userId, user);
 
    // Tambah EXP
    const freshMember = await guild.members.fetch(userId).catch(() => null);
    if (!freshMember) return;
 
    const result = await leveling.addExp(userId, freshMember, config.voice.expPer2Minutes);
 
    // Kirim notif level up via DM
    if (result.leveled) {
      const text = config.levelUpMessage
        .replace('{user}',       `**${freshMember.user.username}**`)
        .replace('{level}',      result.newLevel)
        .replace('{roleName}',   result.newLevelName)
        .replace('{serverName}', guild.name);
 
      freshMember.user.send(text).catch(() => {
        console.warn(`[Luminate] Tidak bisa kirim DM ke ${freshMember.user.tag}`);
      });
    }
  }, config.voice.checkIntervalMs);
 
  voiceIntervals.set(userId, intervalId);
}
 
// ─── Stop tracking EXP voice ─────────────────────────────────
function stopVoiceTracking(userId) {
  const intervalId = voiceIntervals.get(userId);
  if (intervalId) {
    clearInterval(intervalId);
    voiceIntervals.delete(userId);
  }
}
 
module.exports = { startVoiceTracking, stopVoiceTracking };
 