const leveling = require('../utils/leveling');
const db       = require('../utils/database');
const config   = require('../config');
 
// Map<userId, intervalId> — melacak interval aktif per user
const voiceIntervals = new Map();
 
module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const userId = newState.id || oldState.id;
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
 
    const joinedVC  = !oldState.channelId && newState.channelId;
    const leftVC    = oldState.channelId  && !newState.channelId;
    const changedVC = oldState.channelId  && newState.channelId &&
                      oldState.channelId  !== newState.channelId;
    const muteChanged = oldState.selfMute !== newState.selfMute ||
                        oldState.selfDeaf !== newState.selfDeaf ||
                        oldState.serverMute !== newState.serverMute ||
                        oldState.serverDeaf !== newState.serverDeaf;
 
    // ─── User JOIN VC ─────────────────────────────────────
    if (joinedVC) {
      startVoiceTracking(userId, member, newState, client);
      return;
    }
 
    // ─── User LEAVE VC ───────────────────────────────────
    if (leftVC) {
      stopVoiceTracking(userId);
      return;
    }
 
    // ─── User pindah channel ─────────────────────────────
    if (changedVC) {
      stopVoiceTracking(userId);
      startVoiceTracking(userId, member, newState, client);
      return;
    }
 
    // ─── Mute/deaf berubah: restart interval ─────────────
    if (muteChanged) {
      stopVoiceTracking(userId);
      if (newState.channelId) {
        startVoiceTracking(userId, member, newState, client);
      }
    }
  },
};
 
// ─── Mulai tracking EXP voice ────────────────────────────────
function startVoiceTracking(userId, member, voiceState, client) {
  // Jangan dobel interval
  if (voiceIntervals.has(userId)) return;
 
  const intervalId = setInterval(async () => {
    // Ambil state voice terkini dari cache
    const guild       = member.guild;
    const currentState = guild.voiceStates.cache.get(userId);
 
    // Pastikan user masih di VC dan tidak mute/deaf
    if (!currentState || !currentState.channelId) {
      stopVoiceTracking(userId);
      return;
    }
    const isMuted = currentState.selfMute || currentState.serverMute;
    const isDeaf  = currentState.selfDeaf  || currentState.serverDeaf;
    if (isMuted || isDeaf) return; // Tunggu saja, jangan kasih EXP
 
    // Tambah stat voice minutes
    const user = db.getUser(userId);
    user.totalVoiceMinutes = (user.totalVoiceMinutes || 0) + 2;
    db.saveUser(userId, user);
 
    // Tambah EXP
    const freshMember = await guild.members.fetch(userId).catch(() => null);
    if (!freshMember) return;
 
    const result = await leveling.addExp(
      userId,
      freshMember,
      config.voice.expPer2Minutes
    );
 
    // Kirim notif level up jika naik
    if (result.leveled) {
      const levelUpChannelId = config.channels.levelUpChannelId;
      const channel = levelUpChannelId
        ? (client.channels.cache.get(levelUpChannelId) || null)
        : (currentState.channel || null);
 
      if (channel) {
        const serverName = guild.name;
        const text = config.levelUpMessage
          .replace('{user}',       `<@${userId}>`)
          .replace('{level}',      result.newLevel)
          .replace('{roleName}',   result.newLevelName)
          .replace('{serverName}', serverName);
        channel.send(text).catch(console.error);
      }
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
 
module.exports.startVoiceTracking = startVoiceTracking;
