const { EmbedBuilder } = require('discord.js');
const currency = require('../utils/currency');

const COOLDOWN_MS = 10 * 1000; // 10 detik cooldown antar gamble
const cooldowns   = new Map();

function checkCooldown(userId) {
  const last = cooldowns.get(userId) || 0;
  const diff = Date.now() - last;
  if (diff < COOLDOWN_MS) return Math.ceil((COOLDOWN_MS - diff) / 1000);
  return 0;
}

module.exports = {
  name: 'gamble',
  aliases: ['gambling', 'bet'],
  description: 'Taruhan Lumens dengan Coinflip atau Dice Roll',

  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();

    if (!sub || (sub !== 'coinflip' && sub !== 'cf' && sub !== 'dice')) {
      const embed = new EmbedBuilder()
        .setColor(0x99aab5)
        .setTitle('🎰 Gambling — Luminate Economy')
        .setDescription('Pilih game gambling yang ingin dimainkan:\n\u200B')
        .addFields(
          {
            name: '🪙 Coinflip',
            value:
              '50/50 menang atau kalah.\n' +
              'Menang → **+2x** taruhanmu | Kalah → hilang semua taruhan\n' +
              'Contoh: `!gamble coinflip 100 heads`',
            inline: false,
          },
          {
            name: '🎲 Dice Roll',
            value:
              'Lempar dadu (1–6). Kamu vs bot.\n' +
              'Dadu kamu lebih tinggi → menang **+1.5x** | Sama/lebih rendah → kalah\n' +
              'Contoh: `!gamble dice 100`',
            inline: false,
          },
        )
        .setFooter({ text: 'Cooldown: 10 detik antar gamble' });
      return message.reply({ embeds: [embed] });
    }

    // ── Cek cooldown ─────────────────────────────────────────
    const cd = checkCooldown(message.author.id);
    if (cd > 0) return message.reply(`⏳ Cooldown! Tunggu **${cd} detik** lagi sebelum gamble.`);

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return message.reply('❌ Jumlah taruhan tidak valid.');
    if (amount < 10) return message.reply('❌ Taruhan minimal **10 Lumens**.');

    const balance = currency.getBalance(message.author.id);
    if (balance < amount) return message.reply(`❌ Saldo tidak cukup. Saldo kamu: ${currency.formatLumens(balance)}`);

    cooldowns.set(message.author.id, Date.now());

    // ── COINFLIP ─────────────────────────────────────────────
    if (sub === 'coinflip' || sub === 'cf') {
      const choice = (args[2] || '').toLowerCase();
      if (choice !== 'heads' && choice !== 'tails' && choice !== 'h' && choice !== 't') {
        return message.reply('❌ Pilih **heads** atau **tails**.\nContoh: `!gamble coinflip 100 heads`');
      }

      const normalizedChoice = (choice === 'h' || choice === 'heads') ? 'heads' : 'tails';
      const result           = Math.random() < 0.5 ? 'heads' : 'tails';
      const won              = normalizedChoice === result;
      const winAmount        = amount * 2;

      if (won) {
        currency.addLumens(message.author.id, amount); // sudah dikurangi di bawah, ini profit
      } else {
        currency.removeLumens(message.author.id, amount);
      }

      const newBalance = currency.getBalance(message.author.id);
      const embed = new EmbedBuilder()
        .setColor(won ? 0x57f287 : 0xed4245)
        .setTitle(`🪙 Coinflip — ${won ? 'MENANG! 🎉' : 'KALAH 💸'}`)
        .addFields(
          { name: 'Pilihanmu',   value: normalizedChoice === 'heads' ? '👑 Heads' : '🌊 Tails', inline: true },
          { name: 'Hasilnya',    value: result === 'heads' ? '👑 Heads' : '🌊 Tails',            inline: true },
          { name: '\u200B',      value: '\u200B',                                                  inline: false },
          { name: won ? '💰 Menang' : '💸 Kalah', value: won ? `+${currency.formatLumens(amount)}` : `-${currency.formatLumens(amount)}`, inline: true },
          { name: 'Saldo sekarang', value: currency.formatLumens(newBalance),                     inline: true },
        )
        .setFooter({ text: 'Luminate Economy • !gamble untuk info lebih lanjut' });

      return message.reply({ embeds: [embed] });
    }

    // ── DICE ROLL ─────────────────────────────────────────────
    if (sub === 'dice') {
      const playerRoll = Math.floor(Math.random() * 6) + 1;
      const botRoll    = Math.floor(Math.random() * 6) + 1;
      const won        = playerRoll > botRoll;
      const draw       = playerRoll === botRoll;

      const diceEmoji = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
      const winAmount  = Math.floor(amount * 1.5);

      let resultText, colorVal;
      if (won) {
        currency.addLumens(message.author.id, winAmount - amount);
        resultText = `MENANG! 🎉`;
        colorVal   = 0x57f287;
      } else if (draw) {
        resultText = `SERI! 🤝`;
        colorVal   = 0xfee75c;
      } else {
        currency.removeLumens(message.author.id, amount);
        resultText = `KALAH 💸`;
        colorVal   = 0xed4245;
      }

      const newBalance = currency.getBalance(message.author.id);

      const embed = new EmbedBuilder()
        .setColor(colorVal)
        .setTitle(`🎲 Dice Roll — ${resultText}`)
        .addFields(
          { name: '🎲 Dadumu',    value: `${diceEmoji[playerRoll]} **${playerRoll}**`, inline: true },
          { name: '🤖 Dadu Bot', value: `${diceEmoji[botRoll]} **${botRoll}**`,       inline: true },
          { name: '\u200B',       value: '\u200B',                                      inline: false },
          {
            name: won ? '💰 Menang' : draw ? '🤝 Seri' : '💸 Kalah',
            value: won
              ? `+${currency.formatLumens(winAmount - amount)}`
              : draw
              ? 'Taruhan dikembalikan'
              : `-${currency.formatLumens(amount)}`,
            inline: true,
          },
          { name: 'Saldo sekarang', value: currency.formatLumens(newBalance), inline: true },
        )
        .setFooter({ text: 'Menang = 1.5x taruhan | Seri = taruhan kembali' });

      return message.reply({ embeds: [embed] });
    }
  },
};