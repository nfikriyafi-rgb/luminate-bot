const { startVoiceTracking, stopVoiceTracking } = require('../utils/voiceTracker');
 
module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
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
 
    if (joinedVC)  { startVoiceTracking(userId, member, newState, client); return; }
    if (leftVC)    { stopVoiceTracking(userId); return; }
    if (changedVC) { stopVoiceTracking(userId); startVoiceTracking(userId, member, newState, client); return; }
    if (muteChanged) {
      stopVoiceTracking(userId);
      if (newState.channelId) startVoiceTracking(userId, member, newState, client);
    }
  },
};
 