const { EmbedBuilder } = require('discord.js');
const rpgUtils = require('../utils/rpg');
const items    = require('../utils/items');
const currency = require('../utils/currency');
const config   = require('../config');

const ADVENTURE_COOLDOWN = new Map();
const COOLDOWN_MS        = 5 * 60 * 1000; // 5 menit

// ─── Durasi adventure per area ────────────────────────────────
const ADVENTURE_DURATION = {
  forest:    { min: 1, max: 3, label: '1–3 menit'  },
  mountain:  { min: 2, max: 4, label: '2–4 menit'  },
  dungeon:   { min: 3, max: 5, label: '3–5 menit'  },
  volcano:   { min: 4, max: 6, label: '4–6 menit'  },
  end_realm: { min: 5, max: 8, label: '5–8 menit'  },
};

// ─── Sesi adventure aktif per user ───────────────────────────
// Map<userId, { endTime, area, timeoutId, channelId }>
const activeSessions = new Map();

module.exports = {
  name: 'adventure',
  aliases: ['adv', 'explore'],
  description: 'Kirim karakter ke petualangan otomatis & balik bawa loot!',

  async execute(message, args, client) {
    const userId = message.author.id;

    // ── Cek apakah sedang adventure ──────────────────────────
    if (activeSessions.has(userId)) {
      const session  = activeSessions.get(userId);
      const timeLeft = Math.max(0, Math.ceil((session.endTime - Date.now()) / 1000));
      const mins     = Math.floor(timeLeft / 60);
      const secs     = timeLeft % 60;
      const area     = rpgUtils.getArea(session.area);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('⏳ Sedang Berpetualang!')
            .setDescription(
              `Karaktermu sedang di **${area.name}**.\n` +
              `Balik dalam **${mins}m ${secs}d**.\n\n` +
              `Ketik \`!adventure recall\` untuk pulang lebih awal (reward berkurang).`
            ),
        ],
      });
    }

    // ── Recall paksa ─────────────────────────────────────────
    if ((args[0] || '').toLowerCase() === 'recall') {
      return message.reply('❌ Kamu tidak sedang berpetualang.');
    }

    // ── Cek cooldown ─────────────────────────────────────────
    const lastTime = ADVENTURE_COOLDOWN.get(userId) || 0;
    const diff     = Date.now() - lastTime;
    if (diff < COOLDOWN_MS) {
      const left = Math.ceil((COOLDOWN_MS - diff) / 1000);
      const mins = Math.floor(left / 60);
      const secs = left % 60;
      return message.reply(`⏳ Kamu masih kelelahan setelah petualangan terakhir! Istirahat **${mins}m ${secs}d** lagi.`);
    }

    const playerRPG = rpgUtils.getPlayerRPG(userId);
    if (playerRPG.hp <= 0) {
      return message.reply('💀 HP kamu 0! Ketik `!heal` dulu sebelum berpetualang.');
    }

    const area     = rpgUtils.getArea(playerRPG.area);
    const duration = ADVENTURE_DURATION[playerRPG.area] || ADVENTURE_DURATION.forest;
    const minutes  = Math.floor(Math.random() * (duration.max - duration.min + 1)) + duration.min;
    const ms       = minutes * 60 * 1000;
    const endTime  = Date.now() + ms;

    // ── Simpan sesi ───────────────────────────────────────────
    const timeoutId = setTimeout(async () => {
      if (!activeSessions.has(userId)) return;
      activeSessions.delete(userId);
      ADVENTURE_COOLDOWN.set(userId, Date.now());

      await resolveAdventure(userId, playerRPG.area, minutes, false, message.channel.id, client);
    }, ms);

    activeSessions.set(userId, {
      endTime,
      area:      playerRPG.area,
      minutes,
      timeoutId,
      channelId: message.channel.id,
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🧭 Petualangan Dimulai!`)
      .setDescription(
        `Karaktermu berangkat ke **${area.name}**!\n` +
        `Perkiraan waktu: **${minutes} menit**\n\n` +
        `Kamu akan mendapat notifikasi saat petualangan selesai.\n` +
        `Ketik \`!adventure recall\` untuk pulang lebih awal.`
      )
      .addFields(
        { name: '🗺️ Area',    value: area.name,          inline: true },
        { name: '⏳ Durasi',  value: `${minutes} menit`,  inline: true },
      )
      .setFooter({ text: 'Reward: EXP, Lumens & item drop!' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  // ── Recall paksa dari command ─────────────────────────────
  async handleRecall(message, client) {
    const userId  = message.author.id;
    const session = activeSessions.get(userId);
    if (!session) return message.reply('❌ Kamu tidak sedang berpetualang.');

    clearTimeout(session.timeoutId);
    activeSessions.delete(userId);
    ADVENTURE_COOLDOWN.set(userId, Date.now());

    const elapsed = Math.max(1, Math.floor((Date.now() - (session.endTime - session.minutes * 60 * 1000)) / 60000));

    await resolveAdventure(userId, session.area, elapsed, true, message.channel.id, client);
  },
};

// ─── Selesaikan adventure & bagi reward ───────────────────────
async function resolveAdventure(userId, areaKey, minutes, isRecall, channelId, client) {
  const channel = client.channels.cache.get(channelId);
  if (!channel) return;

  const playerRPG = rpgUtils.getPlayerRPG(userId);
  const stats     = rpgUtils.calcStats(playerRPG);
  const area      = rpgUtils.getArea(areaKey);

  // Hitung reward berdasarkan durasi & area
  const multiplier  = isRecall ? 0.5 : 1.0;
  const areaBonus   = { forest:1, mountain:1.5, dungeon:2, volcano:3, end_realm:4 }[areaKey] || 1;

  const baseCoins   = Math.floor(minutes * 15 * areaBonus * multiplier);
  const coinReward  = baseCoins + Math.floor(Math.random() * baseCoins * 0.3);
  const baseExp     = Math.floor(minutes * 10 * areaBonus * multiplier);
  const expReward   = baseExp + Math.floor(Math.random() * baseExp * 0.2);

  // Drop item (1–3 item tergantung durasi)
  const dropCount   = Math.min(3, Math.floor(minutes / 2) + (isRecall ? 0 : 1));
  const droppedItems = [];
  for (let i = 0; i < dropCount; i++) {
    const roll = Math.random();
    const item = roll < 0.3
      ? items.rollMaterial(stats.luck)
      : items.rollItem(stats.luck);
    if (item && playerRPG.inventory.length < 50) {
      playerRPG.inventory.push(item.id);
      droppedItems.push(item);
    }
  }

  // Kurangi HP sedikit (kelelahan)
  const hpLoss   = Math.floor(stats.maxHp * 0.1 * minutes * 0.2);
  playerRPG.hp   = Math.max(1, playerRPG.hp - hpLoss);
  playerRPG.kills += Math.floor(minutes * areaBonus);

  // Tambah Lumens & RPG EXP
  currency.addLumens(userId, coinReward);
  const rpgResult = rpgUtils.addRPGExp(userId, expReward);
  rpgUtils.savePlayerRPG(userId, rpgResult.rpg);

  // ── Build embed ───────────────────────────────────────────
  const dropText = droppedItems.length > 0
    ? droppedItems.map(i => items.formatItem(i).name).join('\n')
    : '*Tidak ada drop*';

  const embed = new EmbedBuilder()
    .setColor(isRecall ? 0xfee75c : 0x57f287)
    .setTitle(isRecall ? '🔙 Pulang Lebih Awal!' : '✅ Petualangan Selesai!')
    .setDescription(
      isRecall
        ? '⚠️ Kamu pulang lebih awal — reward berkurang 50%!'
        : `Karaktermu pulang dari **${area.name}** dengan selamat!`
    )
    .addFields(
      { name: '⏳ Durasi',      value: `${minutes} menit`,           inline: true  },
      { name: '🗺️ Area',       value: area.name,                    inline: true  },
      { name: '\u200B',         value: '\u200B',                     inline: false },
      { name: '✨ Lumens',      value: `+**${coinReward}**`,         inline: true  },
      { name: '📈 RPG EXP',    value: `+**${expReward}**`,          inline: true  },
      { name: '❤️ HP Tersisa', value: `**${playerRPG.hp}/${stats.maxHp}**`, inline: true },
      { name: '🎁 Item Drop',  value: dropText,                     inline: false },
    )
    .setFooter({ text: 'Ketik !inventory untuk lihat item baru • !adventure untuk petualangan lagi' })
    .setTimestamp();

  if (rpgResult.leveled) {
    embed.addFields({
      name:  '🎉 Level Up!',
      value: `RPG Level naik ke **${rpgResult.rpg.level}**! Stats meningkat!`,
      inline: false,
    });
  }

  channel.send({ content: `<@${userId}>`, embeds: [embed] }).catch(console.error);
}