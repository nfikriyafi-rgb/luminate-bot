const { EmbedBuilder } = require('discord.js');
const rpg    = require('../utils/rpg');
const items  = require('../utils/items');
const currency = require('../utils/currency');

module.exports = {
  name: 'profile',
  aliases: ['char', 'stats', 'hero'],
  description: 'Lihat stats RPG & inventory kamu',

  async execute(message, args) {
    const target   = message.mentions.members.first() || message.member;
    const playerRPG = rpg.getPlayerRPG(target.id);
    const stats    = rpg.calcStats(playerRPG);
    const balance  = currency.getBalance(target.id);
    const area     = rpg.getArea(playerRPG.area);
    const expNeeded = rpg.expForLevel(playerRPG.level);

    // Equipment info
    const weaponItem = playerRPG.weapon ? items.getItem(playerRPG.weapon) : null;
    const armorItem  = playerRPG.armor  ? items.getItem(playerRPG.armor)  : null;
    const accItem    = playerRPG.accessory ? items.getItem(playerRPG.accessory) : null;

    const weaponText = weaponItem ? `${items.formatItem(weaponItem).name}` : '*Tidak ada*';
    const armorText  = armorItem  ? `${items.formatItem(armorItem).name}`  : '*Tidak ada*';
    const accText    = accItem    ? `${items.formatItem(accItem).name}`    : '*Tidak ada*';

    // HP bar
    const hpPct    = Math.floor((playerRPG.hp / stats.maxHp) * 10);
    const hpBar    = '█'.repeat(hpPct) + '░'.repeat(10 - hpPct);

    // EXP bar
    const expPct   = Math.floor((playerRPG.exp / expNeeded) * 10);
    const expBar   = '█'.repeat(expPct) + '░'.repeat(10 - expPct);

    const embed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle(`⚔️ ${target.displayName}'s Character`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name:  '📊 Level & EXP',
          value:
            `Level: **${playerRPG.level}**\n` +
            `EXP: \`${expBar}\` ${playerRPG.exp}/${expNeeded}`,
          inline: false,
        },
        {
          name:  '❤️ HP',
          value: `\`${hpBar}\` **${playerRPG.hp}/${stats.maxHp}**`,
          inline: false,
        },
        {
          name:  '⚔️ ATK',
          value: `**${stats.atk}**`,
          inline: true,
        },
        {
          name:  '🛡️ DEF',
          value: `**${stats.def}**`,
          inline: true,
        },
        {
          name:  '🎯 Crit',
          value: `**${stats.crit}%**`,
          inline: true,
        },
        {
          name:  '💨 Dodge',
          value: `**${stats.dodge}%**`,
          inline: true,
        },
        {
          name:  '🍀 Luck',
          value: `**${stats.luck}**`,
          inline: true,
        },
        {
          name:  '✨ Lumens',
          value: `**${balance}**`,
          inline: true,
        },
        {
          name:  '🗺️ Area',
          value: area.name,
          inline: true,
        },
        {
          name:  '⚔️ Kills',
          value: `**${playerRPG.kills}**`,
          inline: true,
        },
        { name: '\u200B', value: '\u200B', inline: false },
        {
          name:  '🎒 Equipment',
          value:
            `⚔️ Weapon: ${weaponText}\n` +
            `🛡️ Armor: ${armorText}\n` +
            `🧿 Accessory: ${accText}`,
          inline: false,
        },
        {
          name:  '🎒 Inventory',
          value: playerRPG.inventory.length > 0
            ? `${playerRPG.inventory.length} item(s) — ketik \`!inventory\` untuk detail`
            : '*Kosong*',
          inline: false,
        },
      )
      .setFooter({ text: 'Luminate RPG • !fight untuk battle, !equip untuk pasang item' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};