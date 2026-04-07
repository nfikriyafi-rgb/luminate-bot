const { ChannelType, PermissionFlagsBits } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const db   = require('./database');

const REFRESH_INTERVAL = 10 * 60 * 1000;
const STATS_FILE       = path.resolve('./data/stats.json');

function loadStatsData() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveStatsData(data) {
  const dir = path.dirname(STATS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
}

function getStatChannels(guild) {
  const allUsers    = db.getAllUsers();
  const userArr     = Object.values(allUsers);
  const members     = guild.members.cache;
  const totalExp    = userArr.reduce((a, u) => a + (u.exp    || 0), 0);
  const totalLumens = userArr.reduce((a, u) => a + (u.lumens || 0), 0);
  const onlineCount = members.filter(m => !m.user.bot && ['online','idle','dnd'].includes(m.presence?.status)).size;
  const adminCount  = members.filter(m => !m.user.bot && m.permissions.has('Administrator')).size;
  const memberCount = members.filter(m => !m.user.bot).size;
  const chanCount   = guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory).size;
  const time        = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  return [
    { key: 'stat_members',  name: `👥 Members: ${memberCount}`                 },
    { key: 'stat_online',   name: `🟢 Online: ${onlineCount}`                  },
    { key: 'stat_admins',   name: `👑 Admins: ${adminCount}`                   },
    { key: 'stat_channels', name: `📢 Channels: ${chanCount}`                  },
    { key: 'stat_exp',      name: `📈 Total EXP: ${totalExp.toLocaleString()}` },
    { key: 'stat_lumens',   name: `✨ Lumens: ${totalLumens.toLocaleString()}` },
    { key: 'stat_refresh',  name: `🔄 Updated: ${time}`                        },
  ];
}

async function setupStatsChannels(guild) {
  const config = require('../config');
  if (!config.channels.statsCategory) return;

  const category = guild.channels.cache.get(config.channels.statsCategory);
  if (!category) {
    console.warn('[Stats] Category tidak ditemukan. Cek config.channels.statsCategory');
    return;
  }

  const stored     = loadStatsData();
  const guildKey   = `guild_${guild.id}`;
  if (!stored[guildKey]) stored[guildKey] = {};
  const channelIds = stored[guildKey];

  for (const stat of getStatChannels(guild)) {
    const existingId = channelIds[stat.key];
    const existing   = existingId ? guild.channels.cache.get(existingId) : null;

    if (existing) {
      // Sudah ada → update nama saja, jangan buat baru
      if (existing.name !== stat.name) {
        await existing.setName(stat.name).catch(console.error);
      }
    } else {
      // Belum ada → buat sekali, simpan ID-nya
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
        channelIds[stat.key] = newChannel.id;
        console.log(`[Stats] Channel baru dibuat: ${stat.name}`);
      }
    }
  }

  stored[guildKey] = channelIds;
  saveStatsData(stored);
}

function startStatsRefresh(client) {
  const refresh = async () => {
    for (const [, guild] of client.guilds.cache) {
      await guild.members.fetch().catch(() => {});
      await setupStatsChannels(guild).catch(console.error);
    }
  };

  setTimeout(refresh, 5000);
  setInterval(refresh, REFRESH_INTERVAL);
  console.log('[Stats] Server stats refresh aktif (setiap 25 menit)');
}

module.exports = { startStatsRefresh, setupStatsChannels };