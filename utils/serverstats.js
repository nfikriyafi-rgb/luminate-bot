const { ChannelType, PermissionFlagsBits } = require('discord.js');
const db       = require('../utils/database');
const config   = require('../config');

const REFRESH_INTERVAL = 25 * 60 * 1000; // 25 menit

// ─── Nama channel stats ───────────────────────────────────────
function getStatChannels(guild) {
  const allUsers  = db.getAllUsers();
  const userArr   = Object.values(allUsers);
  const totalExp  = userArr.reduce((a, u) => a + (u.exp || 0), 0);
  const topUser   = userArr.sort((a, b) => (b.exp || 0) - (a.exp || 0))[0];
  const topLumens = userArr.sort((a, b) => (b.lumens || 0) - (a.lumens || 0))[0];

  return [
    { key: 'stat_members',  name: `👥 Members: ${guild.members.cache.filter(m => !m.user.bot).size}`                                      },
    { key: 'stat_admins',   name: `👑 Admins: ${guild.members.cache.filter(m => !m.user.bot && m.permissions.has('Administrator')).size}`  },
    { key: 'stat_online',   name: `🟢 Online: ${guild.members.cache.filter(m => !m.user.bot && (m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd')).size}`   },
    { key: 'stat_bots',     name: `🤖 Bots: ${guild.members.cache.filter(m => m.user.bot).size}`          },
    { key: 'stat_channels', name: `📢 Channels: ${guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory).size}` },
    { key: 'stat_exp',      name: `📈 Total EXP: ${totalExp.toLocaleString()}`                             },
    { key: 'stat_lumens',   name: `✨ Total Lumens: ${userArr.reduce((a, u) => a + (u.lumens || 0), 0).toLocaleString()}` },
    { key: 'stat_refresh',  name: `🔄 Updated: ${new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}` },
  ];
}

// ─── Buat atau update channel stats ──────────────────────────
async function setupStatsChannels(guild) {
  if (!config.channels.statsCategory) return;

  // Cari atau buat category
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.id === config.channels.statsCategory
  );
  if (!category) {
    console.warn('[Stats] Category ID tidak ditemukan. Cek config.channels.statsCategory');
    return;
  }

  const statChannels = getStatChannels(guild);
  const stored       = config.channels.statsChannelIds || {};

  for (const stat of statChannels) {
    const existingId = stored[stat.key];
    const existing   = existingId ? guild.channels.cache.get(existingId) : null;

    if (existing) {
      // Update nama channel yang sudah ada
      await existing.setName(stat.name).catch(console.error);
    } else {
      // Buat channel baru
      const newChannel = await guild.channels.create({
        name:   stat.name,
        type:   ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id:   guild.roles.everyone.id,
            deny: [PermissionFlagsBits.Connect],
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      }).catch(console.error);

      if (newChannel) {
        stored[stat.key] = newChannel.id;
        // Simpan ID ke config runtime (tidak permanen, perlu di-isi manual di config.js)
        if (!config.channels.statsChannelIds) config.channels.statsChannelIds = {};
        config.channels.statsChannelIds[stat.key] = newChannel.id;
      }
    }
  }
}

// ─── Start auto refresh ───────────────────────────────────────
function startStatsRefresh(client) {
  const refresh = async () => {
    for (const [, guild] of client.guilds.cache) {
      await guild.members.fetch().catch(() => {});
      await setupStatsChannels(guild).catch(console.error);
    }
  };

  // Langsung jalankan saat start
  setTimeout(refresh, 5000);

  // Refresh tiap 25 menit
  setInterval(refresh, REFRESH_INTERVAL);
  console.log('[Stats] Server stats refresh aktif (setiap 25 menit)');
}

module.exports = { startStatsRefresh, setupStatsChannels };