const { EmbedBuilder } = require('discord.js');
const currency = require('../utils/currency');

const COOLDOWN_MS  = 2 * 60 * 1000; // 2 menit cooldown
const cooldowns    = new Map();

// ─── Daftar game withdraw ─────────────────────────────────────
const games = [
  {
    id:   'math',
    name: '🧮 Soal Matematika',
    desc: 'Jawab soal matematika dengan benar dalam 30 detik!',
    generate() {
      const ops    = ['+', '-', '*'];
      const op     = ops[Math.floor(Math.random() * ops.length)];
      let a, b, answer;
      if (op === '+')      { a = rand(10, 100); b = rand(10, 100); answer = a + b; }
      else if (op === '-') { a = rand(20, 100); b = rand(1, a);    answer = a - b; }
      else                 { a = rand(2, 12);   b = rand(2, 12);   answer = a * b; }
      return { question: `Berapa hasil dari **${a} ${op} ${b}**?`, answer: String(answer) };
    },
    reward: { min: 20, max: 50 },
  },
  {
    id:   'scramble',
    name: '🔀 Tebak Kata Acak',
    desc: 'Tebak kata yang hurufnya diacak dalam 30 detik!',
    generate() {
      const words = ['luminate', 'discord', 'server', 'gaming', 'komunitas', 'streak', 'leveling', 'wallet', 'gamble', 'diamond'];
      const word  = words[Math.floor(Math.random() * words.length)];
      const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
      return { question: `Kata apa ini? **\`${scrambled}\`**`, answer: word };
    },
    reward: { min: 30, max: 60 },
  },
  {
    id:   'trivia',
    name: '🧠 Trivia',
    desc: 'Jawab pertanyaan trivia dalam 30 detik!',
    generate() {
      const questions = [
        { q: 'Ibu kota Indonesia?',                    a: 'jakarta' },
        { q: 'Berapa jumlah sisi segitiga?',           a: '3' },
        { q: 'Hewan apa yang bisa terbang paling tinggi?', a: 'elang' },
        { q: 'Apa nama planet terbesar di tata surya?', a: 'jupiter' },
        { q: 'Berapa hasil 7 x 8?',                    a: '56' },
        { q: 'Siapa penemu listrik?',                  a: 'edison' },
        { q: 'Apa warna langit saat siang hari?',      a: 'biru' },
        { q: 'Berapa jumlah bulan dalam setahun?',     a: '12' },
        { q: 'Apa bahasa pemrograman yang dipakai bot ini?', a: 'javascript' },
        { q: 'Berapa jumlah pemain dalam satu tim sepak bola?', a: '11' },
      ];
      const item = questions[Math.floor(Math.random() * questions.length)];
      return { question: item.q, answer: item.a };
    },
    reward: { min: 25, max: 55 },
  },
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── Sesi aktif per user ──────────────────────────────────────
// Map<userId, { game, answer, reward, timeout }>
const activeSessions = new Map();

module.exports = {
  name: 'withdraw',
  aliases: ['wd', 'kerja'],
  description: 'Main mini-game untuk mendapatkan Lumens',

  async execute(message, args, client) {
    const userId = message.author.id;

    // ── Cek cooldown ─────────────────────────────────────────
    const lastTime = cooldowns.get(userId) || 0;
    const diff     = Date.now() - lastTime;
    if (diff < COOLDOWN_MS) {
      const left = Math.ceil((COOLDOWN_MS - diff) / 1000);
      const mins = Math.floor(left / 60);
      const secs = left % 60;
      return message.reply(`⏳ Kamu sudah kerja barusan! Istirahat dulu **${mins}m ${secs}d** ya.`);
    }

    // ── Cek session aktif ─────────────────────────────────────
    if (activeSessions.has(userId)) {
      return message.reply('⚠️ Kamu masih punya soal yang belum dijawab! Jawab dulu sebelum withdraw lagi.');
    }

    // ── Pilih game random ─────────────────────────────────────
    const game   = games[Math.floor(Math.random() * games.length)];
    const { question, answer } = game.generate();
    const reward = rand(game.reward.min, game.reward.max);

    // ── Simpan sesi ───────────────────────────────────────────
    const timeoutId = setTimeout(async () => {
      if (!activeSessions.has(userId)) return;
      activeSessions.delete(userId);

      const ch = client.channels.cache.get(message.channel.id);
      if (ch) {
        ch.send(`⏰ <@${userId}> Waktu habis! Kamu tidak mendapat Lumens kali ini. Jawaban: **${answer}**`).catch(() => {});
      }
    }, 30 * 1000);

    activeSessions.set(userId, { answer, reward, timeoutId, channelId: message.channel.id });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${game.name}`)
      .setDescription(
        `${game.desc}\n\n` +
        `❓ **${question}**\n\n` +
        `Hadiah jika benar: ${currency.formatLumens(reward)}\n` +
        `⏳ Waktu: **30 detik**`
      )
      .setFooter({ text: 'Ketik jawabanmu sekarang!' });

    message.reply({ embeds: [embed] });
  },

  // ── Handle jawaban dari user ──────────────────────────────
  async handleAnswer(message) {
    const userId  = message.author.id;
    const session = activeSessions.get(userId);
    if (!session) return false;
    if (message.channel.id !== session.channelId) return false;
    if (message.content.startsWith('!')) return false;

    const userAnswer = message.content.trim().toLowerCase();
    const correct    = session.answer.toLowerCase();

    clearTimeout(session.timeoutId);
    activeSessions.delete(userId);
    cooldowns.set(userId, Date.now());

    if (userAnswer === correct) {
      currency.addLumens(userId, session.reward);
      const newBalance = currency.getBalance(userId);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Jawaban Benar!')
        .addFields(
          { name: 'Jawaban',        value: `**${session.answer}**`,                  inline: true },
          { name: 'Lumens Didapat', value: currency.formatLumens(session.reward),    inline: true },
          { name: 'Saldo Sekarang', value: currency.formatLumens(newBalance),         inline: false },
        )
        .setFooter({ text: 'Withdraw lagi dalam 2 menit!' });

      message.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('❌ Jawaban Salah!')
        .addFields(
          { name: 'Jawabanmu',      value: `**${userAnswer}**`,   inline: true },
          { name: 'Jawaban Benar',  value: `**${session.answer}**`, inline: true },
        )
        .setFooter({ text: 'Coba lagi dalam 2 menit!' });

      message.reply({ embeds: [embed] });
    }

    return true;
  },
};