const { EmbedBuilder } = require('discord.js');
const fishLogic = require('../utils/fishingLogic');
const fishDb    = require('../utils/fishingItems');
const currency  = require('../utils/currency');
const config    = require('../config');

// ─── Active auto fish sessions ────────────────────────────────
// Map<userId, { intervalId, channelId, catches, totalEarned, startTime }>
const autoSessions = new Map();

const AUTO_INTERVAL = 20 * 1000; // 20 detik per cast
const MAX_INVENTORY = 20;

// Export supaya bisa dicek dari command lain
function isAutoFishing(userId) { return autoSessions.has(userId); }

module.exports = {
  name: 'autofish',
  aliases: ['af', 'automancing'],
  description: 'Auto mancing otomatis! Berhenti dengan !autofish stop',
  isAutoFishing,

  async execute(message, args, client) {
    const userId = message.author.id;
    const sub    = (args[0] || '').toLowerCase();

    // ── STOP ──────────────────────────────────────────────────
    if (sub === 'stop' || sub === 'berhenti') {
      const session = autoSessions.get(userId);
      if (!session) return message.reply('❌ Kamu tidak sedang auto fishing.');

      clearInterval(session.intervalId);
      autoSessions.delete(userId);

      const duration = Math.floor((Date.now() - session.startTime) / 1000 / 60);

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('🛑 Auto Fish Dihentikan')
        .setDescription(`Kamu berhenti mancing setelah **${duration} menit**.`)
        .addFields(
          { name: '🐟 Ikan Didapat',   value: `**${session.catches}** ikan`,             inline: true },
          { name: '✨ Total Earned',    value: `**${session.totalEarned} Lumens**`,       inline: true },
          { name: '💰 Saldo Sekarang', value: `**${currency.getBalance(userId)} Lumens**`, inline: false },
        )
        .setFooter({ text: 'Ketik !fish sellall untuk jual semua ikan!' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ── Cek sudah auto fishing ─────────────────────────────────
    if (autoSessions.has(userId)) {
      const session = autoSessions.get(userId);
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000 / 60);
      return message.reply(
        `⚠️ Kamu sudah sedang auto fishing di <#${session.channelId}>!\n` +
        `Durasi: **${elapsed} menit** | Ikan: **${session.catches}** | Earned: **${session.totalEarned} Lumens**\n` +
        `Ketik \`!autofish stop\` untuk berhenti.`
      );
    }

    // ── START AUTO FISH ───────────────────────────────────────
    const fishing = fishLogic.getPlayerFishing(userId);
    const rod     = fishDb.getRod(fishing.rod);
    const bait    = fishing.bait?.id ? fishDb.getBait(fishing.bait.id) : null;
    const area    = fishDb.getArea(fishing.area);

    const totalLuck   = (rod?.luck   || 1) + (bait?.luck   || 0);
    const totalWeight = (rod?.weight || 1) + (bait?.weight || 0);

    const session = {
      intervalId:  null,
      channelId:   message.channel.id,
      catches:     0,
      totalEarned: 0,
      startTime:   Date.now(),
    };

    const startEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🎣 Auto Fish Dimulai!')
      .setDescription(
        `Karaktermu mulai mancing otomatis di **${area.name}**!\n` +
        `Cast setiap **20 detik**. Ketik \`!autofish stop\` untuk berhenti.\n\n` +
        `⚠️ **Command lain tidak bisa dipakai saat auto fishing!**`
      )
      .addFields(
        { name: '🎣 Rod',    value: rod  ? `${fishDb.RARITY[rod.rarity].emoji} ${rod.name}`   : 'Basic Rod', inline: true },
        { name: '🪱 Bait',   value: bait ? `${fishDb.RARITY[bait.rarity].emoji} ${bait.name}` : 'Tidak ada', inline: true },
        { name: '🗺️ Area',  value: area.name,                                                               inline: true },
        { name: '🎯 Luck',   value: `**${totalLuck}**`,                                                    inline: true },
        { name: '⚖️ Weight', value: `**${totalWeight}**`,                                                  inline: true },
      )
      .setFooter({ text: 'Auto sell aktif saat inventory penuh' })
      .setTimestamp();

    await message.reply({ embeds: [startEmbed] });

    // ── Interval auto mancing ─────────────────────────────────
    session.intervalId = setInterval(async () => {
      const channel = client.channels.cache.get(session.channelId);
      if (!channel) { clearInterval(session.intervalId); autoSessions.delete(userId); return; }

      const currentFishing = fishLogic.getPlayerFishing(userId);
      const currentRod     = fishDb.getRod(currentFishing.rod);
      const currentBait    = currentFishing.bait?.id ? fishDb.getBait(currentFishing.bait.id) : null;
      const curLuck        = (currentRod?.luck   || 1) + (currentBait?.luck   || 0);
      const curWeight      = (currentRod?.weight || 1) + (currentBait?.weight || 0);

      // Kurangi bait qty
      if (currentFishing.bait && currentFishing.bait.qty > 0) {
        currentFishing.bait.qty--;
        if (currentFishing.bait.qty <= 0) {
          currentFishing.bait = null;
          channel.send(`<@${userId}> 🪱 Bait habis! Melanjutkan tanpa bait.`).catch(() => {});
        }
      }

      const result = fishLogic.rollFish(curLuck, curWeight, currentFishing.area);

      if (result.failed) {
        fishLogic.savePlayerFishing(userId, currentFishing);
        // Diam saja kalau ikan kabur, tidak perlu notif
        return;
      }

      const { fish, weight, special } = result;
      const price = fishDb.calcFishPrice(fish, weight);
      const r     = fishDb.RARITY[fish.rarity];

      // Auto sell jika inventory penuh
      let autoSell = false;
      if (currentFishing.inventory.length >= MAX_INVENTORY) {
        const sellTotal = currentFishing.inventory.reduce((a, e) => a + e.price, 0);
        session.totalEarned     += sellTotal;
        currentFishing.totalEarned += sellTotal;
        currentFishing.inventory  = [];
        currency.addLumens(userId, sellTotal);
        autoSell = true;
        channel.send(`<@${userId}> 💰 Inventory penuh! Auto-sell **${MAX_INVENTORY} ikan** → ✨ **${sellTotal} Lumens**`).catch(() => {});
      }

      // Simpan ikan
      currentFishing.inventory.push({ fishId: fish.id, weight, price });
      currentFishing.totalCaught++;
      currentFishing.totalWeight += weight;
      session.catches++;

      // Bonus treasure
      let bonusLumens = 0;
      if (special?.type === 'treasure' && special.bonus) {
        bonusLumens = special.bonus;
        currency.addLumens(userId, bonusLumens);
        session.totalEarned += bonusLumens;
      }

      fishLogic.savePlayerFishing(userId, currentFishing);

      // EXP
      const expGain = Math.floor(weight * (r.priceMultiplier || 1) * 0.5);
      const lvlRes  = fishLogic.addFishingExp(userId, expGain);

      // Hanya notif kalau ada event spesial
      if (special || lvlRes.leveled) {
        let notif = '';
        if (special?.type === 'jackpot_weight' || special?.type === 'jackpot_rarity' || special?.type === 'treasure')
          notif += `<@${userId}> ${special.desc}\n`;
        if (lvlRes.leveled)
          notif += `🎉 <@${userId}> **Fishing Level Up! → Lv.${lvlRes.fishing.level}**`;
        if (notif) channel.send(notif.trim()).catch(() => {});
      }

    }, AUTO_INTERVAL);

    session.intervalId = session.intervalId;
    autoSessions.set(userId, session);
  },
};