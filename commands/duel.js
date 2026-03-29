const { EmbedBuilder } = require('discord.js');
const rpgUtils = require('../utils/rpg');
const items    = require('../utils/items');
const currency = require('../utils/currency');
const config   = require('../config');

// ─── Duel request pending ─────────────────────────────────────
// Map<targetId, { challengerId, bet, channelId, timeout }>
const pendingDuels = new Map();
const DUEL_COOLDOWN = new Map();
const COOLDOWN_MS   = 60 * 1000; // 1 menit

module.exports = {
  name: 'duel',
  aliases: ['pvp', 'challenge'],
  description: 'Tantang member lain untuk duel PvP! Bisa taruhan Lumens.',

  async execute(message, args, client) {
    const userId = message.author.id;
    const sub    = (args[0] || '').toLowerCase();

    // ── ACCEPT ────────────────────────────────────────────────
    if (sub === 'accept' || sub === 'terima') {
      const duel = pendingDuels.get(userId);
      if (!duel) return message.reply('❌ Tidak ada tantangan duel untukmu saat ini.');

      clearTimeout(duel.timeout);
      pendingDuels.delete(userId);

      const challenger = await message.guild.members.fetch(duel.challengerId).catch(() => null);
      if (!challenger) return message.reply('❌ Penantang sudah tidak ada di server.');

      await startDuel(message, duel.challengerId, userId, duel.bet, client);
      return;
    }

    // ── DECLINE ───────────────────────────────────────────────
    if (sub === 'decline' || sub === 'tolak') {
      const duel = pendingDuels.get(userId);
      if (!duel) return message.reply('❌ Tidak ada tantangan duel untukmu.');

      clearTimeout(duel.timeout);
      pendingDuels.delete(userId);
      return message.reply(`❌ Kamu menolak tantangan duel dari <@${duel.challengerId}>.`);
    }

    // ── CHALLENGE ─────────────────────────────────────────────
    const target = message.mentions.members.first();
    if (!target) return message.reply(`❌ Tag member yang ingin kamu tantang.\nContoh: \`${config.prefix}duel @user\` atau \`${config.prefix}duel @user 100\``);
    if (target.id === userId) return message.reply('❌ Tidak bisa duel dengan diri sendiri.');
    if (target.user.bot) return message.reply('❌ Tidak bisa duel dengan bot.');

    // Cek cooldown
    const lastDuel = DUEL_COOLDOWN.get(userId) || 0;
    if (Date.now() - lastDuel < COOLDOWN_MS) {
      const left = Math.ceil((COOLDOWN_MS - (Date.now() - lastDuel)) / 1000);
      return message.reply(`⏳ Cooldown duel! Tunggu **${left} detik** lagi.`);
    }

    // Cek HP challenger
    const challengerRPG = rpgUtils.getPlayerRPG(userId);
    if (challengerRPG.hp <= 0) return message.reply('💀 HP kamu 0! Pulihkan HP dulu sebelum duel.');

    // Cek HP target
    const targetRPG = rpgUtils.getPlayerRPG(target.id);
    if (targetRPG.hp <= 0) return message.reply(`💀 HP **${target.displayName}** sedang 0, tidak bisa duel sekarang.`);

    // Cek apakah target sudah ada pending duel
    if (pendingDuels.has(target.id)) return message.reply(`⚠️ **${target.displayName}** sudah ada tantangan duel yang pending.`);

    // Taruhan (opsional)
    const bet = parseInt(args[1]) || 0;
    if (bet > 0) {
      const challengerBalance = currency.getBalance(userId);
      if (challengerBalance < bet) return message.reply(`❌ Lumens kamu tidak cukup untuk taruhan **${bet}**. Saldo: ✨ **${challengerBalance}**`);
      const targetBalance = currency.getBalance(target.id);
      if (targetBalance < bet) return message.reply(`❌ Lumens **${target.displayName}** tidak cukup untuk taruhan **${bet}**. Saldo mereka: ✨ **${targetBalance}**`);
    }

    // Kirim tantangan
    const challengerStats = rpgUtils.calcStats(challengerRPG);
    const targetStats     = rpgUtils.calcStats(targetRPG);

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('⚔️ Tantangan Duel!')
      .setDescription(
        `<@${userId}> menantang <@${target.id}> untuk **DUEL**!\n\n` +
        (bet > 0 ? `💰 Taruhan: ✨ **${bet} Lumens**\n\n` : '') +
        `Ketik \`${config.prefix}duel accept\` untuk menerima atau \`${config.prefix}duel decline\` untuk menolak.\n` +
        `*Tantangan hangus dalam 60 detik.*`
      )
      .addFields(
        {
          name:  `⚔️ ${message.member.displayName}`,
          value:
            `❤️ HP: **${challengerRPG.hp}/${challengerStats.maxHp}**\n` +
            `⚔️ ATK: **${challengerStats.atk}** | 🛡️ DEF: **${challengerStats.def}**\n` +
            `🎯 Crit: **${challengerStats.crit}%** | 💨 Dodge: **${challengerStats.dodge}%**`,
          inline: true,
        },
        {
          name:  `⚔️ ${target.displayName}`,
          value:
            `❤️ HP: **${targetRPG.hp}/${targetStats.maxHp}**\n` +
            `⚔️ ATK: **${targetStats.atk}** | 🛡️ DEF: **${targetStats.def}**\n` +
            `🎯 Crit: **${targetStats.crit}%** | 💨 Dodge: **${targetStats.dodge}%**`,
          inline: true,
        },
      )
      .setFooter({ text: '⏳ 60 detik untuk menerima' });

    await message.channel.send({ content: `<@${target.id}>`, embeds: [embed] });

    // Simpan pending duel
    const timeoutId = setTimeout(() => {
      if (pendingDuels.has(target.id)) {
        pendingDuels.delete(target.id);
        message.channel.send(`⏰ Tantangan duel dari <@${userId}> ke <@${target.id}> hangus karena tidak ada respons.`).catch(() => {});
      }
    }, 60 * 1000);

    pendingDuels.set(target.id, {
      challengerId: userId,
      bet,
      channelId: message.channel.id,
      timeout: timeoutId,
    });
  },
};

// ─── Jalankan duel ────────────────────────────────────────────
async function startDuel(message, challengerId, targetId, bet, client) {
  const challenger    = await message.guild.members.fetch(challengerId).catch(() => null);
  const target        = await message.guild.members.fetch(targetId).catch(() => null);
  if (!challenger || !target) return message.reply('❌ Salah satu pemain tidak ditemukan.');

  const cRPG = rpgUtils.getPlayerRPG(challengerId);
  const tRPG = rpgUtils.getPlayerRPG(targetId);

  let cHp = cRPG.hp;
  let tHp = tRPG.hp;

  const cStats = rpgUtils.calcStats(cRPG);
  const tStats = rpgUtils.calcStats(tRPG);

  // Lifesteal dari weapon
  const cWeapon = cRPG.weapon ? items.getItem(cRPG.weapon) : null;
  const tWeapon = tRPG.weapon ? items.getItem(tRPG.weapon) : null;
  const cLifesteal = cWeapon?.effects?.lifesteal || 0;
  const tLifesteal = tWeapon?.effects?.lifesteal || 0;

  const log  = [];
  let   turn = 0;

  while (cHp > 0 && tHp > 0 && turn < 20) {
    turn++;

    // ── Challenger attack ─────────────────────────────────
    const cIsCrit  = Math.random() * 100 < cStats.crit;
    let   cDmg     = Math.floor(cStats.atk * (0.8 + Math.random() * 0.4));
    cDmg           = Math.max(1, cDmg - Math.floor(tStats.def / 2));
    if (cIsCrit) cDmg *= 2;

    const tDodge = Math.random() * 100 < tStats.dodge;
    if (tDodge) {
      log.push(`T${turn}: 💨 ${target.displayName} menghindari serangan!`);
    } else {
      tHp -= cDmg;
      if (cLifesteal > 0) cHp = Math.min(cHp + Math.floor(cDmg * cLifesteal / 100), cStats.maxHp);
      log.push(`T${turn}: ${challenger.displayName} ${cIsCrit ? '💥CRIT' : '⚔️'} **-${cDmg}** HP ke ${target.displayName}`);
    }
    if (tHp <= 0) break;

    // ── Target attack ─────────────────────────────────────
    const tIsCrit  = Math.random() * 100 < tStats.crit;
    let   tDmg     = Math.floor(tStats.atk * (0.8 + Math.random() * 0.4));
    tDmg           = Math.max(1, tDmg - Math.floor(cStats.def / 2));
    if (tIsCrit) tDmg *= 2;

    const cDodge = Math.random() * 100 < cStats.dodge;
    if (cDodge) {
      log.push(`T${turn}: 💨 ${challenger.displayName} menghindari serangan!`);
    } else {
      cHp -= tDmg;
      if (tLifesteal > 0) tHp = Math.min(tHp + Math.floor(tDmg * tLifesteal / 100), tStats.maxHp);
      log.push(`T${turn}: ${target.displayName} ${tIsCrit ? '💥CRIT' : '⚔️'} **-${tDmg}** HP ke ${challenger.displayName}`);
    }
  }

  // ── Tentukan pemenang ─────────────────────────────────────
  const challengerWon = tHp <= 0 || (cHp > 0 && cHp >= tHp);
  const winner        = challengerWon ? challenger : target;
  const loser         = challengerWon ? target : challenger;
  const winnerId      = winner.id;
  const loserId       = loser.id;

  // Update HP kedua player
  cRPG.hp = Math.max(1, cHp);
  tRPG.hp = Math.max(1, tHp);
  rpgUtils.savePlayerRPG(challengerId, cRPG);
  rpgUtils.savePlayerRPG(targetId, tRPG);

  // Tambah kills
  const winnerRPG = winnerId === challengerId ? cRPG : tRPG;
  winnerRPG.kills = (winnerRPG.kills || 0) + 1;
  rpgUtils.savePlayerRPG(winnerId, winnerRPG);

  // Taruhan
  let betText = '';
  if (bet > 0) {
    currency.removeLumens(loserId, bet);
    currency.addLumens(winnerId, bet);
    betText = `\n💰 **${winner.displayName}** mendapat ✨ **${bet} Lumens** dari taruhan!`;
  }

  // EXP RPG untuk keduanya
  const winExp  = 50;
  const loseExp = 20;
  rpgUtils.addRPGExp(winnerId, winExp);
  rpgUtils.addRPGExp(loserId, loseExp);

  // Cooldown
  DUEL_COOLDOWN.set(challengerId, Date.now());
  DUEL_COOLDOWN.set(targetId, Date.now());

  // ── Build embed ───────────────────────────────────────────
  const battleLog = log.slice(-8).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xf5c518)
    .setTitle(`⚔️ Hasil Duel — ${challenger.displayName} vs ${target.displayName}`)
    .addFields(
      { name: '⚔️ Battle Log', value: battleLog || 'Battle selesai!', inline: false },
      { name: `HP Akhir ${challenger.displayName}`, value: `❤️ **${Math.max(0, cHp)}/${cStats.maxHp}**`, inline: true  },
      { name: `HP Akhir ${target.displayName}`,     value: `❤️ **${Math.max(0, tHp)}/${tStats.maxHp}**`, inline: true  },
    )
    .setDescription(
      `🏆 **${winner.displayName}** menang!\n` +
      `💔 **${loser.displayName}** kalah.\n` +
      betText + '\n\n' +
      `📈 ${winner.displayName}: +${winExp} RPG EXP\n` +
      `📈 ${loser.displayName}: +${loseExp} RPG EXP`
    )
    .setFooter({ text: 'HP regen otomatis setiap 30 detik!' })
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
}