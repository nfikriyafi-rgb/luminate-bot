const { EmbedBuilder } = require('discord.js');
const rpgUtils = require('../utils/rpg');
const items    = require('../utils/items');
const currency = require('../utils/currency');
const config   = require('../config');

const FIGHT_COOLDOWN = new Map();
const COOLDOWN_MS    = 30 * 1000; // 30 detik

module.exports = {
  name: 'fight',
  aliases: ['battle', 'hunt'],
  description: 'Lawan monster dan dapatkan EXP, Lumens & item!',

  async execute(message, args) {
    const userId = message.author.id;

    // Cooldown
    const last = FIGHT_COOLDOWN.get(userId) || 0;
    const diff = Date.now() - last;
    if (diff < COOLDOWN_MS) {
      const left = Math.ceil((COOLDOWN_MS - diff) / 1000);
      return message.reply(`⏳ Kamu masih kelelahan! Istirahat **${left} detik** lagi.`);
    }

    const playerRPG = rpgUtils.getPlayerRPG(userId);
    if (playerRPG.hp <= 0) {
      return message.reply('💀 HP kamu 0! Ketik `!heal` atau pakai potion untuk pulih.');
    }

    FIGHT_COOLDOWN.set(userId, Date.now());

    const stats   = rpgUtils.calcStats(playerRPG);
    const monster = rpgUtils.getMonsterForArea(playerRPG.area);

    // ── Battle Simulation ─────────────────────────────────────
    let playerHp  = playerRPG.hp;
    let monsterHp = monster.hp;
    const log     = [];
    let turn      = 0;
    let playerLifesteal = 0;

    // Cek lifesteal dari weapon
    const weaponItem = playerRPG.weapon ? items.getItem(playerRPG.weapon) : null;
    if (weaponItem?.effects?.lifesteal) playerLifesteal = weaponItem.effects.lifesteal;

    while (playerHp > 0 && monsterHp > 0 && turn < 20) {
      turn++;

      // ── Player attack ─────────────────────────────────────
      const isCrit  = Math.random() * 100 < stats.crit;
      let dmg       = Math.floor(stats.atk * (0.8 + Math.random() * 0.4));
      dmg           = Math.max(1, dmg - Math.floor(monster.def / 2));
      if (isCrit) dmg *= 2;
      monsterHp    -= dmg;

      // Lifesteal
      if (playerLifesteal > 0) {
        const heal = Math.floor(dmg * playerLifesteal / 100);
        playerHp   = Math.min(playerHp + heal, stats.maxHp);
      }

      log.push(`Turn ${turn}: Kamu ${isCrit ? '💥 CRIT' : '⚔️'} → **-${dmg} HP** ke ${monster.name}${playerLifesteal > 0 ? ` *(+${Math.floor(dmg * playerLifesteal / 100)} lifesteal)*` : ''}`);

      if (monsterHp <= 0) break;

      // ── Monster attack ────────────────────────────────────
      const isDodge = Math.random() * 100 < stats.dodge;
      if (isDodge) {
        log.push(`Turn ${turn}: 💨 Kamu menghindari serangan ${monster.name}!`);
      } else {
        let mDmg   = Math.floor(monster.atk * (0.8 + Math.random() * 0.4));
        mDmg       = Math.max(1, mDmg - Math.floor(stats.def / 2));
        playerHp  -= mDmg;
        log.push(`Turn ${turn}: ${monster.name} ⚔️ → **-${mDmg} HP** ke kamu`);
      }
    }

    const playerWon = monsterHp <= 0;
    playerRPG.hp    = Math.max(0, playerHp);

    // ── Hitung reward / loss ──────────────────────────────────
    let coinReward = 0, expReward = 0, droppedItem = null;

    if (playerWon) {
      playerRPG.kills++;
      coinReward   = Math.floor(Math.random() * (monster.coins[1] - monster.coins[0]) + monster.coins[0]);
      expReward    = monster.exp;

      // Drop item
      const dropRoll = Math.random() * monster.dropRate;
      if (dropRoll > 0.4) {
        droppedItem = items.rollItem(rpgUtils.calcStats(playerRPG).luck);
        if (droppedItem && playerRPG.inventory.length < 50) {
          playerRPG.inventory.push(droppedItem.id);
        }
      }

      // Tambah Lumens & RPG EXP
      currency.addLumens(userId, coinReward);
      const rpgResult = rpgUtils.addRPGExp(userId, expReward);

      rpgUtils.savePlayerRPG(userId, rpgResult.rpg);
    } else {
      playerRPG.deaths++;
      playerRPG.hp = Math.floor(rpgUtils.calcStats(playerRPG).maxHp * 0.3); // respawn 30% HP
      rpgUtils.savePlayerRPG(userId, playerRPG);
    }

    // ── Build embed ───────────────────────────────────────────
    const color = playerWon ? 0x57f287 : 0xed4245;
    const title = playerWon ? `✅ Menang! vs ${monster.name}` : `💀 Kalah! vs ${monster.name}`;

    const battleLog = log.slice(-6).join('\n'); // tampilkan 6 turn terakhir

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .addFields(
        {
          name:  '⚔️ Battle Log',
          value: battleLog || 'Battle selesai!',
          inline: false,
        },
        {
          name:  '❤️ HP Akhir',
          value: `**${Math.max(0, playerHp)}/${rpgUtils.calcStats(playerRPG).maxHp}**`,
          inline: true,
        },
        {
          name:  `${monster.name} HP`,
          value: `**${Math.max(0, monsterHp)}/${monster.hp}**`,
          inline: true,
        },
      )
      .setFooter({ text: 'Cooldown 30 detik • !profile untuk cek stats' })
      .setTimestamp();

    if (playerWon) {
      embed.addFields(
        { name: '✨ Lumens',  value: `+**${coinReward}**`,          inline: true },
        { name: '📈 RPG EXP', value: `+**${expReward}**`,           inline: true },
        { name: '🎁 Drop',    value: droppedItem
          ? `${items.formatItem(droppedItem).name}`
          : '*Tidak ada drop*',                                       inline: false },
      );
    } else {
      embed.setDescription(`💀 Kamu kalah! HP dipulihkan ke **${playerRPG.hp}** (30%). Lawan lagi dengan \`!fight\`!`);
    }

    message.reply({ embeds: [embed] });
  },
};