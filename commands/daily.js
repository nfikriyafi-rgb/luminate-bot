const { EmbedBuilder } = require('discord.js');
const leveling = require('../utils/leveling');
const currency = require('../utils/currency');
const db       = require('../utils/database');
const config   = require('../config');

// ─── Konstanta daily claim ────────────────────────────────────
const BASE_EXP    = 10;
const MAX_EXP     = 500;
const MAX_STREAK  = 7;
const MS_PER_DAY  = 24 * 60 * 60 * 1000;
const MS_GRACE    = 48 * 60 * 60 * 1000; // 48 jam — kalau lebih, streak reset

// ─── Hitung EXP berdasarkan hari streak ──────────────────────
// Hari 1: 10, Hari 2: 20, Hari 3: 40 ... kelipatan 2, cap 500
function calcDailyExp(streak) {
  const day = Math.min(streak, MAX_STREAK);
  const exp  = BASE_EXP * Math.pow(2, day - 1);
  return Math.min(exp, MAX_EXP);
}

// ─── Progress bar streak ──────────────────────────────────────
function streakBar(streak) {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'];
  return Array.from({ length: MAX_STREAK }, (_, i) => {
    if (i < streak % MAX_STREAK || (streak >= MAX_STREAK && streak % MAX_STREAK === 0)) {
      return `🔥`;
    }
    return `⬜`;
  }).join('') + ` (${streak % MAX_STREAK === 0 && streak > 0 ? MAX_STREAK : streak % MAX_STREAK}/${MAX_STREAK})`;
}

// ─── Format sisa waktu ────────────────────────────────────────
function formatTimeLeft(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const hours     = Math.floor(totalSecs / 3600);
  const minutes   = Math.floor((totalSecs % 3600) / 60);
  const seconds   = totalSecs % 60;
  return `${hours}j ${minutes}m ${seconds}d`;
}

module.exports = {
  name: 'daily',
  aliases: ['claim', 'checkin'],
  description: 'Claim EXP harian dengan sistem streak',

  async execute(message, args, client) {
    const userId   = message.author.id;
    const userData = db.getUser(userId);
    const now      = Date.now();

    // Init data daily jika belum ada
    if (!userData.daily) {
      userData.daily = { lastClaim: 0, streak: 0, totalClaims: 0 };
    }

    const { lastClaim, streak, totalClaims } = userData.daily;
    const timeSinceLast = now - lastClaim;

    // ── Belum 24 jam sejak claim terakhir ────────────────────
    if (lastClaim > 0 && timeSinceLast < MS_PER_DAY) {
      const timeLeft = MS_PER_DAY - timeSinceLast;
      const nextExp  = calcDailyExp(streak + 1);

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('⏰ Sudah Claim Hari Ini!')
        .setDescription(`Kamu sudah claim EXP harian hari ini, **${message.author.username}**!`)
        .addFields(
          { name: '⏳ Bisa claim lagi dalam', value: `**${formatTimeLeft(timeLeft)}**`,          inline: true },
          { name: '🔥 Streak sekarang',        value: `**${streak} hari**`,                        inline: true },
          { name: '💰 EXP claim berikutnya',   value: `**${nextExp} EXP** (Hari ke-${Math.min(streak + 1, MAX_STREAK)})`, inline: false },
        )
        .setFooter({ text: 'Jangan sampai putus streaknya!' });

      return message.reply({ embeds: [embed] });
    }

    // ── Hitung streak baru ────────────────────────────────────
    let newStreak;
    let streakBroken = false;

    if (lastClaim === 0) {
      // Claim pertama kali
      newStreak = 1;
    } else if (timeSinceLast <= MS_GRACE) {
      // Masih dalam grace period (48 jam) → streak lanjut
      newStreak = streak + 1;
    } else {
      // Lebih dari 48 jam → streak reset
      newStreak    = 1;
      streakBroken = streak > 1;
    }

    // Reset streak ke 1 setelah 7 hari penuh
    const isWeekComplete = newStreak > MAX_STREAK;
    if (isWeekComplete) newStreak = 1;

    // Hitung EXP
    const expGained = calcDailyExp(newStreak);
    const member    = message.member;

    // Update data
    userData.daily = {
      lastClaim:   now,
      streak:      newStreak,
      totalClaims: (totalClaims || 0) + 1,
    };
    db.saveUser(userId, userData);

    // Tambah EXP
    const result = await leveling.addExp(userId, member, expGained);

    // Tambah Lumens (sama dengan EXP yang didapat)
    const lumensGained = expGained;
    currency.addLumens(userId, lumensGained);
    const newBalance = currency.getBalance(userId);

    // ── Buat embed response ───────────────────────────────────
    let color       = 0x57f287;
    let title       = '🎁 Daily Claim Berhasil!';
    let description = '';

    if (streakBroken) {
      color       = 0xfee75c;
      title       = '💔 Streak Terputus!';
      description = `Sayang sekali, streak kamu terputus karena tidak claim lebih dari 48 jam.\nStreak dimulai ulang dari hari ke-1.\n\n`;
    } else if (isWeekComplete) {
      color       = 0xf5c518;
      title       = '🏆 7 Hari Streak Selesai!';
      description = `Luar biasa! Kamu berhasil menyelesaikan **7 hari streak penuh!** 🎉\nStreak dimulai ulang dari hari ke-1.\n\n`;
    }

    // Preview EXP berikutnya
    const nextDayExp = calcDailyExp(newStreak + 1 > MAX_STREAK ? 1 : newStreak + 1);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description + `Selamat datang kembali, **${message.author.username}**!`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💰 EXP Didapat',        value: `**+${expGained} EXP**`,                                        inline: true  },
        { name: '✨ Lumens Didapat',      value: `**+${lumensGained} Lumens**`,                                  inline: true  },
        { name: '📊 Total EXP',          value: `**${result.userData.exp} EXP**`,                                inline: true  },
        { name: '💎 Saldo Lumens',       value: `**${newBalance} Lumens**`,                                      inline: true  },
        { name: '\u200B',                value: '\u200B',                                                         inline: false },
        { name: '🔥 Streak',             value: streakBar(newStreak),                                             inline: false },
        { name: '📅 Hari ke-',           value: `**${newStreak}** dari ${MAX_STREAK}`,                           inline: true  },
        { name: '🗓️ Total Claim',       value: `**${userData.daily.totalClaims}x**`,                            inline: true  },
        { name: '💡 Besok',              value: `Claim besok untuk **+${nextDayExp} EXP & +${nextDayExp} Lumens** (Hari ke-${newStreak + 1 > MAX_STREAK ? 1 : newStreak + 1})`, inline: false },
      )
      .setFooter({ text: 'Claim setiap hari untuk menjaga streak!' })
      .setTimestamp();

    // Tambah field level up jika naik level
    if (result.leveled) {
      embed.addFields({
        name:  '🎉 Level Up!',
        value: `Kamu naik ke **${result.newLevelName}** (Lv.${result.newLevel})!`,
        inline: false,
      });

      // Kirim DM notif level up
      const text = config.levelUpMessage
        .replace('{user}',       `**${message.author.username}**`)
        .replace('{level}',      result.newLevel)
        .replace('{roleName}',   result.newLevelName)
        .replace('{serverName}', message.guild.name);
      message.author.send(text).catch(() => {});
    }

    message.reply({ embeds: [embed] });
  },
};