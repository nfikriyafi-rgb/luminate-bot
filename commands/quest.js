const { EmbedBuilder } = require('discord.js');
const fishLogic = require('../utils/fishingLogic');
const fishDb    = require('../utils/fishingItems');
const config    = require('../config');

const p = config.prefix;

module.exports = {
  name: 'quest',
  aliases: ['quests', 'misi'],
  description: 'Lihat progress quest fishing kamu',

  execute(message, args) {
    const sub = (args[0] || '').toLowerCase();

    if (!sub || sub === 'fishing' || sub === 'fish') {
      return showFishingQuests(message);
    }

    // Default: menu kategori quest
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📋 Quest Menu')
      .setDescription('Pilih kategori quest:\n\u200B')
      .addFields(
        {
          name:  `\`${p}quest fishing\``,
          value: '🎣 Quest mancing — tangkap ikan SECRET untuk reward eksklusif!',
          inline: false,
        },
      )
      .setFooter({ text: 'Quest lebih banyak akan hadir!' });

    message.reply({ embeds: [embed] });
  },
};

// ─── Fishing Quest ────────────────────────────────────────────
function showFishingQuests(message) {
  const fishing      = fishLogic.getPlayerFishing(message.author.id);
  const secretCount  = fishing.secretCaught || 0;
  const completed    = fishing.questCompleted || [];
  const quests       = fishDb.SECRET_QUEST_REWARDS;

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('❓ Fishing Quest — SECRET Collection')
    .setDescription(
      `Tangkap ikan ❓ **SECRET** di 🌠 **Mystic Water** (Min. Fishing Lv.10) untuk mendapatkan reward eksklusif!\n\n` +
      `ikan SECRET kamu: **${secretCount}x** tertangkap\n\u200B`
    );

  for (const quest of quests) {
    const isDone    = completed.includes(quest.reward);
    const reward    = fishDb.getRod(quest.reward) || fishDb.getBait(quest.reward);
    const rarity    = reward ? fishDb.RARITY[reward.rarity] : null;

    // Progress bar
    const progress  = Math.min(secretCount, quest.secretFishCount);
    const pct       = Math.floor((progress / quest.secretFishCount) * 10);
    const bar       = '█'.repeat(pct) + '░'.repeat(10 - pct);

    let statusEmoji = '⬜';
    if (isDone)                          statusEmoji = '✅';
    else if (secretCount >= quest.secretFishCount) statusEmoji = '🟡';

    const rewardType = fishDb.getRod(quest.reward) ? '🎣 Rod' : '🪱 Bait';
    const rewardStats = reward
      ? `Luck: +${reward.luck} | Weight: +${reward.weight}${reward.qty ? ` | Qty: x${reward.qty}` : ''}`
      : '';

    embed.addFields({
      name:  `${statusEmoji} Quest ${quest.secretFishCount}x SECRET`,
      value:
        `**Reward:** ${rarity?.emoji || '❓'} **${reward?.name || quest.reward}** (${rewardType})\n` +
        `**Stats:** ${rewardStats}\n` +
        `**Progress:** \`${bar}\` ${progress}/${quest.secretFishCount}\n` +
        (isDone
          ? '✅ **Selesai! Reward sudah diterima.**'
          : secretCount >= quest.secretFishCount
          ? '🟡 **Syarat terpenuhi! Reward diberikan otomatis saat mancing.**'
          : `⬜ Butuh **${quest.secretFishCount - secretCount}x** ikan SECRET lagi.`),
      inline: false,
    });
  }

  // Tips
  embed.addFields({
    name:  '💡 Tips',
    value:
      `• Ikan SECRET **hanya muncul** di 🌠 Mystic Water\n` +
      `• Butuh **Fishing Level 10** untuk masuk Mystic Water\n` +
      `• Pakai rod & bait terbaik untuk meningkatkan peluang\n` +
      `• Luck tinggi = chance SECRET lebih besar\n` +
      `• Ketik \`${p}fish travel mystic_water\` untuk pergi ke sana`,
    inline: false,
  });

  embed.setFooter({ text: 'Reward diberikan otomatis saat menangkap ikan • !fish profile untuk cek progress' });

  message.reply({ embeds: [embed] });
}