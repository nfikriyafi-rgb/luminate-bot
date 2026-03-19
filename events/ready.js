import { startVoiceTracking } from './voiceStateUpdate';
 
export const name = 'ready';
export const once = true;
export async function execute(client) {
  console.log(`✅ Luminate Bot online sebagai ${client.user.tag}`);
  client.user.setActivity('🌟 Luminate Leveling', { type: 3 }); // WATCHING


  // ─── Scan semua user yang sudah di VC sebelum bot nyala ──
  let recovered = 0;
  for (const [, guild] of client.guilds.cache) {
    await guild.members.fetch();
    for (const [, voiceState] of guild.voiceStates.cache) {
      if (!voiceState.channelId) continue;
      if (voiceState.member?.user.bot) continue;

      const isMuted = voiceState.selfMute || voiceState.serverMute;
      const isDeaf = voiceState.selfDeaf || voiceState.serverDeaf;
      if (isMuted || isDeaf) continue;

      startVoiceTracking(voiceState.id, voiceState.member, voiceState, client);
      recovered++;
    }
  }
  if (recovered > 0) {
    console.log(`🎧 Recovered ${recovered} user yang sudah di VC sebelum bot nyala.`);
  }
}
 