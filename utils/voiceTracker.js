const leveling = require('./leveling');
const currency = require('./currency');
const db       = require('./database');
const config   = require('../config');

const voiceIntervals = new Map();

function startVoiceTracking(userId, member, voiceState, client) {
  if (voiceIntervals.has(userId)) return;

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

    // Tambah voice minutes
    const user = db.getUser(userId);
    user.totalVoiceMinutes = (user.totalVoiceMinutes || 0) + 2;
    db.saveUser(userId, user);

    const freshMember = await guild.members.fetch(userId).catch(() => null);
    if (!freshMember) return;

    // EXP
    const result = await leveling.addExp(userId, freshMember, config.voice.expPer2Minutes);
    if (result.leveled) {
      const text = config.levelUpMessage
        .replace('{user}',       `**${freshMember.user.username}**`)
        .replace('{level}',      result.newLevel)
        .replace('{roleName}',   result.newLevelName)
        .replace('{serverName}', guild.name);
      freshMember.user.send(text).catch(() => {});
    }

    // Lumens +1 per 2 menit voice
    currency.addLumens(userId, 1);

  }, config.voice.checkIntervalMs);

  voiceIntervals.set(userId, intervalId);
}

function stopVoiceTracking(userId) {
  const intervalId = voiceIntervals.get(userId);
  if (intervalId) {
    clearInterval(intervalId);
    voiceIntervals.delete(userId);
  }
}

module.exports = { startVoiceTracking, stopVoiceTracking };