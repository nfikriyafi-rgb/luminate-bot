const { EmbedBuilder } = require('discord.js');
const db      = require('../utils/database');
const leveling = require('../utils/leveling');
const config  = require('../config');

module.exports = {
  name: 'rank',
  description: 'Cek level dan EXP kamu (atau user lain)',

  async execute(message, args) {
    // Target bisa diri sendiri atau mention user lain
    const target = message.mentions.members.first() || message.member;
    const userData = db.getUser(target.id);

    const currentLvl = leveling.getLevelFromExp(userData.exp);
    const nextLvl    = leveling.getNextLevel(currentLvl.level);

    // Hitung progress ke level berikutnya
    let progressText = '';
    let progressBar  = '';
    if (nextLvl) {
      const expIntoLevel = userData.exp - currentLvl.expRequired;
      const expForNext   = nextLvl.expRequired - currentLvl.expRequired;
      const percent      = Math.min(100, Math.floor((expIntoLevel / expForNext) * 100));
      const filled       = Math.floor(percent / 10);
      progressBar  = '█'.repeat(filled) + '░'.repeat(10 - filled);
      progressText = `${expIntoLevel} / ${expForNext} EXP (${percent}%)`;
    } else {
      progressBar  = '█'.repeat(10);
      progressText = 'MAX LEVEL 🏆';
    }

    const embed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle(`🌟 ${target.displayName}'s Rank`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Level',          value: `**${currentLvl.level}** — ${currentLvl.name}`,           inline: true  },
        { name: 'Total EXP',      value: `**${userData.exp}** EXP`,                                  inline: true  },
        { name: '\u200B',         value: '\u200B',                                                   inline: false },
        { name: 'Progress ke level berikutnya', value: `\`${progressBar}\` ${progressText}`,         inline: false },
        { name: 'Total Chat',     value: `${userData.totalMessages || 0} pesan`,                     inline: true  },
        { name: 'Total Voice',    value: `${userData.totalVoiceMinutes || 0} menit`,                 inline: true  },
      )
      .setFooter({ text: `Luminate Leveling • ${message.guild.name}` })
      .setTimestamp();

    if (nextLvl) {
      embed.addFields({
        name: 'Level berikutnya',
        value: `${nextLvl.name} (butuh **${nextLvl.expRequired}** EXP total)`,
        inline: false,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
