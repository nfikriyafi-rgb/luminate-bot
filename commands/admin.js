const { EmbedBuilder } = require('discord.js');
const leveling = require('../utils/leveling');
const db       = require('../utils/database');
const config   = require('../config');

// ─── Helper: kirim notif level-up ke channel yang dikonfigurasi ─
async function sendLevelNotif(client, guild, userId, result) {
  const channelId = config.channels.levelUpChannelId;
  const channel   = channelId ? client.channels.cache.get(channelId) : null;
  if (!channel) return;

  const text = config.levelUpMessage
    .replace('{user}',       `<@${userId}>`)
    .replace('{level}',      result.newLevel)
    .replace('{roleName}',   result.newLevelName)
    .replace('{serverName}', guild.name);

  channel.send(text).catch(console.error);
}

// ─── Sub-command handlers ─────────────────────────────────────

async function handleAdd(message, args, client) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin addexp @user 75`');

  const amount = parseInt(args[2]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Jumlah EXP tidak valid. Harus angka positif.\nContoh: `!admin addexp @user 75`');
  }

  const type   = args[3] || 'manual';
  const result = await leveling.addExp(target.id, target, amount);

  const embed = new EmbedBuilder()
    .setColor(0x57f287) // hijau
    .setTitle('✅ EXP Ditambahkan')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User',       value: `${target.displayName}`,                          inline: true  },
      { name: 'Tipe',       value: type,                                              inline: true  },
      { name: '\u200B',     value: '\u200B',                                          inline: false },
      { name: 'EXP Ditambah', value: `+**${result.expAdded}** EXP`,                  inline: true  },
      { name: 'Total EXP',  value: `**${result.userData.exp}** EXP`,                 inline: true  },
      { name: 'Level',      value: `Lv.**${result.newLevel}** — ${result.newLevelName}`, inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

if (result.leveled) {
    embed.setDescription(`🎉 **${target.displayName}** naik level dari Lv.${result.oldLevel} → Lv.${result.newLevel}!`);

    const text = config.levelUpMessage
      .replace('{user}',       `<@${target.id}>`)
      .replace('{level}',      result.newLevel)
      .replace('{roleName}',   result.newLevelName)
      .replace('{serverName}', message.guild.name);

    // Kirim ke DM user
    const dmText = text.replace(`<@${target.id}>`, `**${target.user.username}**`);
    target.user.send(dmText).catch(() => {
      console.warn(`[Luminate] Tidak bisa kirim DM ke ${target.user.tag}`);
    });

    // Kirim ke level up channel server
    const levelUpChannelId = config.channels.levelUpChannelId;
    if (levelUpChannelId) {
      const channel = client.channels.cache.get(levelUpChannelId);
      if (channel) channel.send(text).catch(console.error);
    }
  }

  message.reply({ embeds: [embed] });
}

async function handleRemove(message, args, client) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin removeexp @user 50`');

  const amount = parseInt(args[2]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Jumlah EXP tidak valid. Harus angka positif.\nContoh: `!admin removeexp @user 50`');
  }

  const userData = db.getUser(target.id);
  const before   = userData.exp;

  if (before === 0) {
    return message.reply(`❌ **${target.displayName}** sudah memiliki 0 EXP, tidak bisa dikurangi lagi.`);
  }

  const result   = await leveling.removeExp(target.id, target, amount);
  const actualRemoved = before - result.userData.exp; // bisa lebih kecil kalau EXP hampir 0

  const embed = new EmbedBuilder()
    .setColor(0xed4245) // merah
    .setTitle('➖ EXP Dikurangi')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User',         value: `${target.displayName}`,                              inline: true  },
      { name: '\u200B',       value: '\u200B',                                              inline: false },
      { name: 'EXP Dikurangi', value: `-**${actualRemoved}** EXP`,                         inline: true  },
      { name: 'Sisa EXP',     value: `**${result.userData.exp}** EXP`,                     inline: true  },
      { name: 'Level',        value: `Lv.**${result.newLevel}** — ${result.newLevelName}`,  inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  if (result.levelChanged) {
    embed.setDescription(`⬇️ **${target.displayName}** turun level dari Lv.${result.oldLevel} → Lv.${result.newLevel}.`);
  }

  message.reply({ embeds: [embed] });
}

async function handleReset(message, args, client) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin resetexp @user`');

  // Konfirmasi: user harus mengetik ulang nama display target
  const confirmName = args[2];
  if (!confirmName) {
    return message.reply(
      `⚠️ **Peringatan!** Ini akan mereset semua EXP dan level **${target.displayName}** ke 0.\n` +
      `Untuk konfirmasi, ketik: \`!admin resetexp @${target.user.username} RESET\``
    );
  }
  if (confirmName !== 'RESET') {
    return message.reply('❌ Konfirmasi salah. Ketik `RESET` (huruf kapital) untuk konfirmasi.');
  }

  const oldLevel = db.getUser(target.id).level;
  const result   = await leveling.resetExp(target.id, target);

  const embed = new EmbedBuilder()
    .setColor(0xfee75c) // kuning
    .setTitle('🔄 EXP Di-reset')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`Semua progress **${target.displayName}** telah direset.`)
    .addFields(
      { name: 'Level Sebelum', value: `Lv.**${oldLevel}**`,            inline: true  },
      { name: 'Level Sekarang', value: `Lv.**1** — ${config.levels[0].name}`, inline: true },
      { name: 'EXP Sekarang', value: '**0** EXP',                       inline: false },
      { name: 'Role',         value: `✅ Diset ke **${config.levels[0].name}**`, inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

async function handleSync(message, args) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin syncroles @user`');

  const lvlData = await leveling.syncRoles(target.id, target);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2) // blurple
    .setTitle('🔁 Role Disinkronkan')
    .setDescription(`Role **${target.displayName}** telah disinkronkan ulang sesuai EXP.`)
    .addFields(
      { name: 'Level',  value: `Lv.**${lvlData.level}** — ${lvlData.name}`, inline: true },
      { name: 'EXP',    value: `**${db.getUser(target.id).exp}** EXP`,       inline: true },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

async function handleResetAll(message, client) {
  // Konfirmasi wajib
  const confirm = message.content.split(/\s+/)[2];
  if (!confirm || confirm !== 'RESETALL') {
    return message.reply(
      '⚠️ **Peringatan!** Ini akan mereset EXP & level **SEMUA member** ke 0.\n' +
      'Untuk konfirmasi, ketik: `!admin resetall RESETALL`'
    );
  }

  await message.reply('⏳ Sedang mereset semua data, mohon tunggu...');

  const allUsers = db.getAllUsers();
  const userIds  = Object.keys(allUsers);

  if (userIds.length === 0) {
    return message.reply('📭 Tidak ada data user yang perlu direset.');
  }

  let success = 0;
  let failed  = 0;

  for (const userId of userIds) {
    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (member) {
        await leveling.resetExp(userId, member);
      } else {
        // User sudah keluar server, reset data saja tanpa update role
        const userData = db.getUser(userId);
        userData.exp               = 0;
        userData.level             = 1;
        userData.lastMessageTimestamp = 0;
        userData.totalMessages     = 0;
        userData.totalVoiceMinutes = 0;
        db.saveUser(userId, userData);
      }
      success++;
    } catch (err) {
      console.error(`[Luminate] Gagal reset user ${userId}:`, err);
      failed++;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('🔄 Reset Semua EXP Selesai')
    .setDescription('Semua data EXP & level telah direset ke 0.')
    .addFields(
      { name: 'Berhasil', value: `${success} user`, inline: true  },
      { name: 'Gagal',    value: `${failed} user`,  inline: true  },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
}

function sendHelp(message) {
  const embed = new EmbedBuilder()
    .setColor(0x99aab5)
    .setTitle('⚙️ Admin Commands — Luminate')
    .addFields(
      {
        name: '`!admin addexp @user <jumlah> [tipe]`',
        value: 'Tambah EXP ke user. Tipe opsional (contoh: `event`, `reaction`).',
        inline: false,
      },
      {
        name: '`!admin removeexp @user <jumlah>`',
        value: 'Kurangi EXP dari user. Tidak bisa di bawah 0. Role turun otomatis jika perlu.',
        inline: false,
      },
      {
        name: '`!admin resetexp @user RESET`',
        value: 'Reset semua EXP & level user ke 0. Harus konfirmasi dengan kata `RESET`.',
        inline: false,
      },
      {
        name: '`!admin syncroles @user`',
        value: 'Paksa sinkron ulang role Discord user sesuai EXP saat ini.',
        inline: false,
      },
      {
        name: '`!admin resetall RESETALL`',
        value: 'Reset EXP & level **semua member** ke 0. Harus konfirmasi dengan kata `RESETALL`.',
        inline: false,
      }
    )
    .setFooter({ text: 'Semua command ini hanya untuk Administrator' });

  message.reply({ embeds: [embed] });
}

// ─── Main export ──────────────────────────────────────────────
module.exports = {
  name: 'admin',
  description: '[Admin] Kelola EXP user: add, remove, reset, syncroles',

  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Kamu tidak punya izin untuk command ini.');
    }

    const sub = (args[0] || '').toLowerCase();

    switch (sub) {
      case 'addexp':    return handleAdd(message, args, client);
      case 'removeexp': return handleRemove(message, args, client);
      case 'resetexp':  return handleReset(message, args, client);
      case 'syncroles': return handleSync(message, args);
      case 'resetall':  return handleResetAll(message, client);
      default:          return sendHelp(message);
    }
  },
};
