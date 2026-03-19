const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'levels',
  description: 'Tampilkan semua level dan EXP yang dibutuhkan',

  execute(message) {
    const lines = config.levels.map(lvl => {
      const exp = lvl.expRequired === 0 ? 'Start' : `${lvl.expRequired.toLocaleString()} EXP`;
      return `**Lv.${lvl.level}** ${lvl.name} — ${exp}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle('🌟 Daftar Level Luminate')
      .setDescription(lines.join('\n'))
      .addFields(
        { name: '💬 EXP Chat',  value: `+${config.chat.expPerMessage} EXP/pesan (cooldown ${config.chat.cooldownSeconds}d, min ${config.chat.minWords} kata)`, inline: false },
        { name: '🎧 EXP Voice', value: `+${config.voice.expPer2Minutes} EXP/2 menit (unmute & undeaf)`, inline: false },
        { name: '⚡ Bonus',     value: `Event: +${config.bonus.event} | Reaction: +${config.bonus.reaction} | Booster: +${Math.round((config.bonus.boosterMultiplier - 1) * 100)}%`, inline: false },
      )
      .setFooter({ text: 'Luminate Leveling System' });

    message.reply({ embeds: [embed] });
  },
};
