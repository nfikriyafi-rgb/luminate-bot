const { EmbedBuilder } = require('discord.js');
const leveling = require('../utils/leveling');
const currency = require('../utils/currency');
const db       = require('../utils/database');
const config   = require('../config');

// ─────────────────────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────────────────────

async function sendLevelUpDM(member, result, guildName) {
  const text = config.levelUpMessage
    .replace('{user}',       `**${member.user.username}**`)
    .replace('{level}',      result.newLevel)
    .replace('{roleName}',   result.newLevelName)
    .replace('{serverName}', guildName);
  member.user.send(text).catch(() => {});
}

async function sendLevelUpChannel(client, guildName, userId, result) {
  const channelId = config.channels.levelUpChannelId;
  if (!channelId) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel) return;
  const text = config.levelUpMessage
    .replace('{user}',       `<@${userId}>`)
    .replace('{level}',      result.newLevel)
    .replace('{roleName}',   result.newLevelName)
    .replace('{serverName}', guildName);
  channel.send(text).catch(console.error);
}

// ─────────────────────────────────────────────────────────────
//  EXP HANDLERS
// ─────────────────────────────────────────────────────────────

async function handleAddExp(message, args, client) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin addexp @user 75`');

  const amount = parseInt(args[2]);
  if (isNaN(amount) || amount <= 0)
    return message.reply('❌ Jumlah EXP tidak valid. Harus angka positif.\nContoh: `!admin addexp @user 75`');

  const type   = args[3] || 'manual';
  const result = await leveling.addExp(target.id, target, amount);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('✅ EXP Ditambahkan')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User',         value: target.displayName,                                   inline: true  },
      { name: 'Tipe',         value: type,                                                  inline: true  },
      { name: '\u200B',       value: '\u200B',                                              inline: false },
      { name: 'EXP Ditambah', value: `+**${result.expAdded}** EXP`,                       inline: true  },
      { name: 'Total EXP',    value: `**${result.userData.exp}** EXP`,                    inline: true  },
      { name: 'Level',        value: `Lv.**${result.newLevel}** — ${result.newLevelName}`, inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  if (result.leveled) {
    embed.setDescription(`🎉 **${target.displayName}** naik level dari Lv.${result.oldLevel} → Lv.${result.newLevel}!`);
    await sendLevelUpDM(target, result, message.guild.name);
    await sendLevelUpChannel(client, message.guild.name, target.id, result);
  }

  message.reply({ embeds: [embed] });
}

async function handleRemoveExp(message, args) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin removeexp @user 50`');

  const amount = parseInt(args[2]);
  if (isNaN(amount) || amount <= 0)
    return message.reply('❌ Jumlah EXP tidak valid. Harus angka positif.\nContoh: `!admin removeexp @user 50`');

  const before = db.getUser(target.id).exp;
  if (before === 0)
    return message.reply(`❌ **${target.displayName}** sudah memiliki 0 EXP.`);

  const result        = await leveling.removeExp(target.id, target, amount);
  const actualRemoved = before - result.userData.exp;

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('➖ EXP Dikurangi')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User',          value: target.displayName,                                   inline: true  },
      { name: '\u200B',        value: '\u200B',                                              inline: false },
      { name: 'EXP Dikurangi', value: `-**${actualRemoved}** EXP`,                         inline: true  },
      { name: 'Sisa EXP',      value: `**${result.userData.exp}** EXP`,                    inline: true  },
      { name: 'Level',         value: `Lv.**${result.newLevel}** — ${result.newLevelName}`, inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  if (result.levelChanged)
    embed.setDescription(`⬇️ **${target.displayName}** turun level dari Lv.${result.oldLevel} → Lv.${result.newLevel}.`);

  message.reply({ embeds: [embed] });
}

async function handleResetExp(message, args) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin resetexp @user RESET`');

  if (args[2] !== 'RESET') {
    return message.reply(
      `⚠️ Ini akan mereset semua EXP & level **${target.displayName}** ke 0.\n` +
      `Ketik: \`!admin resetexp @${target.user.username} RESET\``
    );
  }

  const oldLevel = db.getUser(target.id).level;
  await leveling.resetExp(target.id, target);

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('🔄 EXP Di-reset')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`Semua progress **${target.displayName}** telah direset.`)
    .addFields(
      { name: 'Level Sebelum',  value: `Lv.**${oldLevel}**`,                        inline: true  },
      { name: 'Level Sekarang', value: `Lv.**1** — ${config.levels[0].name}`,       inline: true  },
      { name: 'EXP Sekarang',   value: '**0** EXP',                                 inline: false },
      { name: 'Role',           value: `✅ Diset ke **${config.levels[0].name}**`,  inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

async function handleResetAll(message, args) {
  if (args[1] !== 'RESETALL') {
    return message.reply(
      '⚠️ Ini akan mereset EXP & level **SEMUA member** ke 0.\n' +
      'Ketik: `!admin resetall RESETALL`'
    );
  }

  await message.reply('⏳ Sedang mereset semua data, mohon tunggu...');

  const allUsers = db.getAllUsers();
  const userIds  = Object.keys(allUsers);
  if (userIds.length === 0) return message.reply('📭 Tidak ada data user.');

  let success = 0, failed = 0;

  for (const userId of userIds) {
    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (member) {
        await leveling.resetExp(userId, member);
      } else {
        const userData = db.getUser(userId);
        userData.exp = 0; userData.level = 1;
        userData.lastMessageTimestamp = 0;
        userData.totalMessages = 0; userData.totalVoiceMinutes = 0;
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
      { name: 'Berhasil', value: `${success} user`, inline: true },
      { name: 'Gagal',    value: `${failed} user`,  inline: true },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
}

async function handleSyncRoles(message) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin syncroles @user`');

  const lvlData = await leveling.syncRoles(target.id, target);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🔁 Role Disinkronkan')
    .setDescription(`Role **${target.displayName}** telah disinkronkan ulang sesuai EXP.`)
    .addFields(
      { name: 'Level', value: `Lv.**${lvlData.level}** — ${lvlData.name}`, inline: true },
      { name: 'EXP',   value: `**${db.getUser(target.id).exp}** EXP`,      inline: true },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

async function handleSyncRolesAll(message) {
  await message.reply('⏳ Menyinkronkan semua role member, mohon tunggu...');

  const allUsers = db.getAllUsers();
  const userIds  = Object.keys(allUsers);
  if (userIds.length === 0) return message.channel.send('📭 Tidak ada data user.');

  let success = 0, failed = 0, skipped = 0;

  for (const userId of userIds) {
    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) { skipped++; continue; }

      const userData = db.getUser(userId);
      const lvlData  = leveling.getLevelFromExp(userData.exp || 0);
      userData.level = lvlData.level;
      db.saveUser(userId, userData);

      // Lepas semua role level lama
      const allRoleNames  = config.levels.map(l => l.name);
      const rolesToRemove = member.roles.cache.filter(r => allRoleNames.includes(r.name));
      for (const [, role] of rolesToRemove) {
        await member.roles.remove(role).catch(() => {});
      }

      // Pasang role level yang benar
      const correctRole = message.guild.roles.cache.find(r => r.name === lvlData.name);
      if (correctRole) await member.roles.add(correctRole).catch(() => {});

      success++;
    } catch (err) {
      console.error(`[Luminate] Gagal sync user ${userId}:`, err);
      failed++;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🔁 Sync Semua Role Selesai')
    .setDescription('Semua role member telah disinkronkan ulang sesuai EXP masing-masing.')
    .addFields(
      { name: 'Berhasil', value: `${success} member`,                           inline: true },
      { name: 'Dilewati', value: `${skipped} member (sudah keluar server)`,     inline: true },
      { name: 'Gagal',    value: `${failed} member`,                            inline: true },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────
//  LUMENS HANDLERS
// ─────────────────────────────────────────────────────────────

function handleAddLumens(message, args) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin addlumens @user 100`');

  const amount = parseInt(args[2]);
  if (isNaN(amount) || amount <= 0)
    return message.reply('❌ Jumlah tidak valid.\nContoh: `!admin addlumens @user 100`');

  const newBalance = currency.addLumens(target.id, amount);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('✅ Lumens Ditambahkan')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User',           value: target.displayName,            inline: true  },
      { name: 'Ditambah',       value: `+**${amount}** ✨ Lumens`,    inline: true  },
      { name: 'Saldo Sekarang', value: `**${newBalance}** ✨ Lumens`, inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

function handleRemoveLumens(message, args) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin removelumens @user 100`');

  const amount = parseInt(args[2]);
  if (isNaN(amount) || amount <= 0)
    return message.reply('❌ Jumlah tidak valid.\nContoh: `!admin removelumens @user 100`');

  const result = currency.removeLumens(target.id, amount);
  if (result === false) {
    const bal = currency.getBalance(target.id);
    return message.reply(`❌ Saldo **${target.displayName}** tidak cukup. Saldo sekarang: **${bal} Lumens**`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('➖ Lumens Dikurangi')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User',           value: target.displayName,         inline: true  },
      { name: 'Dikurangi',      value: `-**${amount}** ✨ Lumens`, inline: true  },
      { name: 'Saldo Sekarang', value: `**${result}** ✨ Lumens`,  inline: false },
    )
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

function handleResetLumens(message, args) {
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user terlebih dahulu.\nContoh: `!admin resetlumens @user RESET`');

  if (args[2] !== 'RESET') {
    return message.reply(
      `⚠️ Ini akan mereset semua Lumens **${target.displayName}** ke 0.\n` +
      `Ketik: \`!admin resetlumens @${target.user.username} RESET\``
    );
  }

  currency.setLumens(target.id, 0);

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('🔄 Lumens Di-reset')
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`Semua Lumens **${target.displayName}** telah direset ke 0.`)
    .setFooter({ text: `Admin: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────
//  GOD ITEMS (OWNER ONLY)
// ─────────────────────────────────────────────────────────────

async function handleGiveGod(message, args) {
  // Hanya owner server
  const guild = message.guild;
  if (message.author.id !== guild.ownerId) {
    return message.reply('❌ Command ini hanya untuk **Owner server**.');
  }

  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ Tag user.\nContoh: `!admin givegod @user rod` atau `!admin givegod @user bait`');

  const type = (args[2] || '').toLowerCase();
  if (type !== 'rod' && type !== 'bait' && type !== 'all') {
    return message.reply('❌ Pilih tipe: `rod`, `bait`, atau `all`.\nContoh: `!admin givegod @user all`');
  }

  const { giveGodItem } = require('../utils/fishingLogic');
  const fishDb = require('../utils/fishingItems');

  if (type === 'rod' || type === 'all') giveGodItem(target.id, 'rod');
  if (type === 'bait' || type === 'all') giveGodItem(target.id, 'bait');

  const rodGod  = fishDb.getRod('rod_god');
  const baitGod = fishDb.getBait('bait_god');

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle('👑 God Item Diberikan!')
    .setDescription(`Item eksklusif **God** telah diberikan ke **${target.displayName}**.`)
    .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      type !== 'bait' ? { name: '🎣 The Rod God',  value: `Luck: **999** | Weight: **999**`, inline: true } : { name: '\u200B', value: '\u200B', inline: false },
      type !== 'rod'  ? { name: '🪱 The Bait God', value: `Luck: **999** | Weight: **999** (x999)`, inline: true } : { name: '\u200B', value: '\u200B', inline: false },
    )
    .setFooter({ text: `Diberikan oleh Owner: ${message.author.tag}` })
    .setTimestamp();

  message.reply({ embeds: [embed] });

  // Notif ke user via DM
  target.user.send(
    `👑 Selamat! Kamu mendapat item eksklusif **God** dari Owner server!\n` +
    (type !== 'bait' ? `🎣 **The Rod God** — Luck 999, Weight 999\n` : '') +
    (type !== 'rod'  ? `🪱 **The Bait God** — Luck 999, Weight 999 (x999)\n` : '') +
    `\nKetik \`!fish equip rod_god\` dan \`!fish bait bait_god\` untuk pasang!`
  ).catch(() => {});
}

// ─────────────────────────────────────────────────────────────
//  HELP
// ─────────────────────────────────────────────────────────────

function sendHelp(message) {
  const embed = new EmbedBuilder()
    .setColor(0x99aab5)
    .setTitle('⚙️ Admin Commands — Luminate')
    .setDescription('Semua command di bawah hanya untuk **Administrator**.\n\u200B')
    .addFields(
      { name: '📊 EXP Management', value: '\u200B', inline: false },
      { name: '`!admin addexp @user <jumlah> [tipe]`',  value: 'Tambah EXP ke user. Role naik & notif DM otomatis.',          inline: false },
      { name: '`!admin removeexp @user <jumlah>`',      value: 'Kurangi EXP dari user. Role turun otomatis jika perlu.',      inline: false },
      { name: '`!admin resetexp @user RESET`',          value: 'Reset EXP & level user ke 0. Konfirmasi dengan `RESET`.',     inline: false },
      { name: '`!admin resetall RESETALL`',             value: 'Reset EXP & level **semua member**. Konfirmasi `RESETALL`.',  inline: false },
      { name: '`!admin syncroles @user`',               value: 'Sinkron ulang role 1 user sesuai EXP saat ini.',              inline: false },
      { name: '`!admin syncrolesall`',                  value: 'Sinkron ulang role **semua member** sesuai EXP masing-masing. Role lama dilepas, role yang benar dipasang.', inline: false },
      { name: '\u200B', value: '\u200B', inline: false },
      { name: '✨ Lumens Management', value: '\u200B', inline: false },
      { name: '`!admin addlumens @user <jumlah>`',      value: 'Tambah Lumens ke user.',                                     inline: false },
      { name: '`!admin removelumens @user <jumlah>`',   value: 'Kurangi Lumens dari user.',                                  inline: false },
      { name: '`!admin resetlumens @user RESET`',       value: 'Reset semua Lumens user ke 0. Konfirmasi dengan `RESET`.',   inline: false },
      { name: '\u200B', value: '\u200B', inline: false },
      { name: '👑 God Items (Owner Only)', value: '\u200B', inline: false },
      { name: '`!admin givegod @user rod`',              value: 'Berikan **👑 The Rod God** ke user. Luck & Weight: **999**. Hanya owner server.',   inline: false },
      { name: '`!admin givegod @user bait`',             value: 'Berikan **👑 The Bait God** ke user. Luck & Weight: **999** (x999). Hanya owner.', inline: false },
      { name: '`!admin givegod @user all`',              value: 'Berikan **Rod God + Bait God** sekaligus. Hanya owner server.',                    inline: false },
      { name: '`!admin givespecial @user rod/bait/all`', value: 'Alias dari `givegod` — sama persis.',                                              inline: false },
      { name: '\u200B', value: '\u200B', inline: false },
      { name: '📣 Lainnya', value: '\u200B', inline: false },
      { name: '`!announce [#channel]`',                 value: 'Kirim embed announcement ke channel tertentu.',              inline: false },
    )
    .setFooter({ text: 'Luminate Bot • Admin Panel' });

  message.reply({ embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────

module.exports = {
  name: 'admin',
  description: '[Admin] Kelola EXP & Lumens user',

  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Kamu tidak punya izin untuk command ini.');
    }

    const sub = (args[0] || '').toLowerCase();

    switch (sub) {
      case 'addexp':       return handleAddExp(message, args, client);
      case 'removeexp':    return handleRemoveExp(message, args);
      case 'resetexp':     return handleResetExp(message, args);
      case 'resetall':     return handleResetAll(message, args);
      case 'syncroles':    return handleSyncRoles(message);
      case 'syncrolesall': return handleSyncRolesAll(message);
      case 'addlumens':    return handleAddLumens(message, args);
      case 'removelumens': return handleRemoveLumens(message, args);
      case 'resetlumens':  return handleResetLumens(message, args);
      case 'givegod':      return handleGiveGod(message, args);
      case 'givespecial':  return handleGiveGod(message, args); // alias
      default:             return sendHelp(message);
    }
  },
};