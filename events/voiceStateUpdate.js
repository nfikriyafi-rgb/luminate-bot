// ─────────────────────────────────────────────────────────────
//  VC JOIN NOTIF — Kirim DM ke owner saat ada yang join VC
// ─────────────────────────────────────────────────────────────

const config = require('../config');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {

    const { startVoiceTracking, stopVoiceTracking } = require('../utils/voiceTracker');

    const userId = newState.id || oldState.id;
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const joinedVC    = !oldState.channelId && newState.channelId;
    const leftVC      = oldState.channelId  && !newState.channelId;
    const changedVC   = oldState.channelId  && newState.channelId &&
                        oldState.channelId  !== newState.channelId;
    const muteChanged = oldState.selfMute   !== newState.selfMute   ||
                        oldState.selfDeaf   !== newState.selfDeaf   ||
                        oldState.serverMute !== newState.serverMute ||
                        oldState.serverDeaf !== newState.serverDeaf;

    // ── EXP Voice tracking ────────────────────────────────────
    if (joinedVC)  { startVoiceTracking(userId, member, newState, client); }
    if (leftVC)    { stopVoiceTracking(userId); }
    if (changedVC) { stopVoiceTracking(userId); startVoiceTracking(userId, member, newState, client); }
    if (muteChanged) {
      stopVoiceTracking(userId);
      if (newState.channelId) startVoiceTracking(userId, member, newState, client);
    }

    // ── DM Notif ke owner saat ada yang JOIN VC ───────────────
    if (!joinedVC && !changedVC) return;

    const ownerNotifId = config.ownerNotifId;
    if (!ownerNotifId) return;
    if (userId === ownerNotifId) return; // jangan notif kalau owner sendiri yang join

    try {
      const owner = await client.users.fetch(ownerNotifId).catch(() => null);
      if (!owner) return;

      const channel = newState.channel;
      const guild   = newState.guild;
      const time    = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const date    = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      const action  = changedVC
        ? `pindah dari **${oldState.channel?.name || '?'}** ke **${channel?.name || '?'}**`
        : `join **${channel?.name || '?'}**`;

      await owner.send(
        `🎙️ **${member.displayName}** ${action}\n` +
        `📋 Server: **${guild.name}**\n` +
        `👥 Di channel: **${channel?.members?.size || 1} member**\n` +
        `🕐 ${date}, ${time}`
      ).catch(() => {});
    } catch {}
  },
};