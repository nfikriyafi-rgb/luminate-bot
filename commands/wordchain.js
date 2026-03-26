const { EmbedBuilder } = require('discord.js');
const leveling = require('../utils/leveling');
const config   = require('../config');
 
const activeGames = new Map();
 
const TIMEOUT_SECONDS = 30;
const EXP_REWARD      = 5;
const EXP_PENALTY     = 5;
const MAX_LIVES       = 3;
const LOBBY_TIMEOUT   = 60; // detik untuk join lobby
 
function isValidWord(word) {
  return /^[a-zA-ZÀ-ÿ\u00C0-\u024F]{2,}$/u.test(word);
}
function lastChar(word) { return word.trim().toLowerCase().slice(-1); }
function firstChar(word) { return word.trim().toLowerCase()[0]; }
function livesDisplay(n) { return '❤️'.repeat(n) + '🖤'.repeat(MAX_LIVES - n); }
 
function formatScores(players) {
  const entries = Object.entries(players)
    .filter(([, p]) => !p.eliminated)
    .sort((a, b) => b[1].score - a[1].score);
  if (entries.length === 0) return 'Semua member telah eliminated.';
  return entries
    .map(([id, p], i) => `${i + 1}. <@${id}> — **+${p.score} EXP** ${livesDisplay(p.lives)}`)
    .join('\n');
}
 
function formatPlayers(players) {
  return Object.entries(players)
    .map(([id, p]) => {
      const status = p.eliminated ? '💀' : livesDisplay(p.lives);
      return `<@${id}> ${status} — **${p.score > 0 ? '+' : ''}${p.score} EXP**`;
    })
    .join('\n');
}
 
function getActivePlayers(players) {
  return Object.entries(players).filter(([, p]) => !p.eliminated);
}
 
function startTurnTimer(channelId, client) {
  const game = activeGames.get(channelId);
  if (!game || game.phase !== 'playing') return;
  if (game.timer) clearTimeout(game.timer);
 
  game.timer = setTimeout(async () => {
    const g = activeGames.get(channelId);
    if (!g || g.phase !== 'playing') return;
 
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;
 
    const currentId = g.turnOrder[g.turnIndex];
    const player    = g.players[currentId];
    if (!player) return;
 
    // Kurangi nyawa
    player.lives--;
    player.score -= EXP_PENALTY;
    const member = await channel.guild.members.fetch(currentId).catch(() => null);
    if (member) await leveling.removeExp(currentId, member, EXP_PENALTY);
 
    let desc = `⏰ <@${currentId}> kehabisan waktu! **-${EXP_PENALTY} EXP** ${livesDisplay(player.lives)}\n\n`;
 
    if (player.lives <= 0) {
      player.eliminated = true;
      desc += `💀 <@${currentId}> telah **eliminated!**\n\n`;
    }
 
    // Cek apakah game selesai
    const remaining = getActivePlayers(g.players);
    if (remaining.length <= 1) {
      if (g.timer) clearTimeout(g.timer);
      g.phase = 'ended';
      activeGames.set(channelId, g);
 
      const winner = remaining[0];
      const embed  = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle('🏆 Word Chain Selesai!')
        .setDescription(
          desc +
          (winner ? `👑 Pemenang: <@${winner[0]}> dengan **${winner[1].score} EXP**!\n\n` : 'Semua member eliminated!\n\n') +
          '**📊 Skor Akhir:**\n' + formatPlayers(g.players)
        )
        .setTimestamp();
      return channel.send({ embeds: [embed] });
    }
 
    // Lanjut ke giliran berikutnya
    advanceTurn(g);
    activeGames.set(channelId, g);
 
    const nextId = g.turnOrder[g.turnIndex];
    desc += `Kata terakhir: **${g.lastWord}** → sambung dengan **${lastChar(g.lastWord).toUpperCase()}**\n`;
    desc += `Giliran: <@${nextId}>`;
 
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('⏰ Timeout!')
      .setDescription(desc)
      .setFooter({ text: `${TIMEOUT_SECONDS} detik untuk menjawab` });
 
    await channel.send({ embeds: [embed] });
    startTurnTimer(channelId, client);
  }, TIMEOUT_SECONDS * 1000);
 
  activeGames.set(channelId, game);
}
 
function advanceTurn(game) {
  let attempts = 0;
  const total  = game.turnOrder.length;
  do {
    game.turnIndex = (game.turnIndex + 1) % total;
    attempts++;
  } while (game.players[game.turnOrder[game.turnIndex]]?.eliminated && attempts < total);
}
 
module.exports = {
  name: 'wordchain',
  aliases: ['wc', 'sambungkata'],
  description: 'Game sambung kata berhadiah EXP dengan sistem nyawa',
 
  async execute(message, args, client) {
    const sub = (args[0] || '').toLowerCase();
 
    // ── START (buka lobby) ───────────────────────────────
    if (sub === 'start') {
      if (activeGames.has(message.channel.id)) {
        return message.reply('⚠️ Game sudah berjalan di channel ini!');
      }
 
      const startWord = (args[1] || 'mulai').toLowerCase();
      if (!isValidWord(startWord)) {
        return message.reply('❌ Kata awal tidak valid.');
      }
 
      const game = {
        phase:      'lobby',
        lastWord:   startWord,
        usedWords:  new Set([startWord]),
        players:    {},
        turnOrder:  [],
        turnIndex:  0,
        startedBy:  message.author.id,
        timer:      null,
      };
 
      // Host otomatis join
      game.players[message.author.id] = { lives: MAX_LIVES, score: 0, eliminated: false };
      game.turnOrder.push(message.author.id);
 
      activeGames.set(message.channel.id, game);
 
      // Auto-close lobby setelah 60 detik kalau belum begin
      game.lobbyTimer = setTimeout(async () => {
        const g = activeGames.get(message.channel.id);
        if (!g || g.phase !== 'lobby') return;
        activeGames.delete(message.channel.id);
        message.channel.send('⏰ Lobby ditutup karena tidak ada yang memulai game dalam 60 detik.').catch(() => {});
      }, LOBBY_TIMEOUT * 1000);
 
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🔤 Word Chain — Lobby Terbuka!')
        .setDescription(
          `<@${message.author.id}> membuka game Word Chain!\n\n` +
          `**Kata awal:** \`${startWord}\`\n` +
          `**Nyawa:** ${livesDisplay(MAX_LIVES)} per member\n\n` +
          `Ketik \`!wordchain join\` untuk ikut!\n` +
          `Ketik \`!wordchain begin\` untuk mulai (minimal 2 member).\n\n` +
          `**Member siap:**\n• <@${message.author.id}> ✅`
        )
        .setFooter({ text: `Lobby tutup dalam ${LOBBY_TIMEOUT} detik` });
 
      return message.channel.send({ embeds: [embed] });
    }
 
    // ── JOIN ─────────────────────────────────────────────
    if (sub === 'join') {
      const game = activeGames.get(message.channel.id);
      if (!game) return message.reply('❌ Tidak ada lobby yang terbuka. Ketik `!wordchain start` untuk membuat game.');
      if (game.phase !== 'lobby') return message.reply('❌ Game sudah berjalan, tidak bisa join sekarang.');
      if (game.players[message.author.id]) return message.reply('⚠️ Kamu sudah ada di lobby!');
 
      game.players[message.author.id] = { lives: MAX_LIVES, score: 0, eliminated: false };
      game.turnOrder.push(message.author.id);
      activeGames.set(message.channel.id, game);
 
      const memberList = game.turnOrder.map(id => `• <@${id}> ✅`).join('\n');
 
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Member Bergabung!')
        .setDescription(
          `<@${message.author.id}> bergabung ke game!\n\n` +
          `**Member siap (${game.turnOrder.length}):**\n${memberList}\n\n` +
          `Ketik \`!wordchain begin\` untuk mulai!`
        );
 
      return message.channel.send({ embeds: [embed] });
    }
 
    // ── BEGIN ────────────────────────────────────────────
    if (sub === 'begin') {
      const game = activeGames.get(message.channel.id);
      if (!game) return message.reply('❌ Tidak ada lobby yang terbuka.');
      if (game.phase !== 'lobby') return message.reply('❌ Game sudah berjalan.');
      if (game.startedBy !== message.author.id && !message.member.permissions.has('Administrator')) {
        return message.reply('❌ Hanya yang membuka lobby yang bisa memulai game.');
      }
      if (game.turnOrder.length < 2) {
        return message.reply('⚠️ Minimal 2 member untuk memulai. Tunggu member lain join dulu!');
      }
 
      if (game.lobbyTimer) clearTimeout(game.lobbyTimer);
      game.phase     = 'playing';
      game.turnIndex = 0;
      // Acak urutan giliran
      game.turnOrder = game.turnOrder.sort(() => Math.random() - 0.5);
      activeGames.set(message.channel.id, game);
 
      const firstId    = game.turnOrder[0];
      const memberList = game.turnOrder.map((id, i) => `${i + 1}. <@${id}> ${livesDisplay(MAX_LIVES)}`).join('\n');
 
      const embed = new EmbedBuilder()
        .setColor(0xf5c518)
        .setTitle('🔤 Word Chain Dimulai!')
        .setDescription(
          `**Kata pertama:** \`${game.lastWord}\`\n` +
          `**Sambung dengan huruf:** \`${lastChar(game.lastWord).toUpperCase()}\`\n\n` +
          `**Urutan giliran (diacak):**\n${memberList}\n\n` +
          `**Giliran pertama:** <@${firstId}>\n\n` +
          `**Aturan:**\n` +
          `• Kata harus diawali huruf terakhir kata sebelumnya\n` +
          `• Kata tidak boleh diulang\n` +
          `• Timeout ${TIMEOUT_SECONDS} detik → -1 nyawa & -${EXP_PENALTY} EXP\n` +
          `• Nyawa habis → eliminated 💀\n` +
          `• Benar → +${EXP_REWARD} EXP`
        )
        .setFooter({ text: `${TIMEOUT_SECONDS} detik untuk menjawab` });
 
      await message.channel.send({ embeds: [embed] });
      startTurnTimer(message.channel.id, client);
      return;
    }
 
    // ── STOP ─────────────────────────────────────────────
    if (sub === 'stop') {
      const game = activeGames.get(message.channel.id);
      if (!game) return message.reply('❌ Tidak ada game yang berjalan.');
 
      const isAdmin   = message.member.permissions.has('Administrator');
      const isStarter = game.startedBy === message.author.id;
      if (!isAdmin && !isStarter) return message.reply('❌ Hanya admin atau host yang bisa menghentikan game.');
 
      if (game.timer) clearTimeout(game.timer);
      if (game.lobbyTimer) clearTimeout(game.lobbyTimer);
      activeGames.delete(message.channel.id);
 
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('🛑 Word Chain Dihentikan')
        .setDescription(
          `Game dihentikan oleh <@${message.author.id}>.\n\n` +
          `**📊 Skor Akhir:**\n${formatPlayers(game.players)}`
        )
        .setTimestamp();
 
      return message.channel.send({ embeds: [embed] });
    }
 
    // ── PLAYERS ──────────────────────────────────────────
    if (sub === 'players' || sub === 'member') {
      const game = activeGames.get(message.channel.id);
      if (!game) return message.reply('❌ Tidak ada game yang berjalan.');
 
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('👥 Status Member')
        .setDescription(formatPlayers(game.players))
        .addFields({
          name: 'Kata terakhir',
          value: game.phase === 'playing'
            ? `\`${game.lastWord}\` → sambung dengan **${lastChar(game.lastWord).toUpperCase()}**`
            : 'Game belum dimulai',
        });
 
      if (game.phase === 'playing') {
        const currentId = game.turnOrder[game.turnIndex];
        embed.addFields({ name: 'Giliran sekarang', value: `<@${currentId}>` });
      }
 
      return message.reply({ embeds: [embed] });
    }
  },
 
  // ── Handle pesan biasa di channel game ───────────────
  async handleMessage(message, client) {
    if (message.author.bot) return;
    const game = activeGames.get(message.channel.id);
    if (!game || game.phase !== 'playing') return;
    if (message.content.startsWith(config.prefix)) return;
 
    const word   = message.content.trim().toLowerCase();
    const userId = message.author.id;
 
    if (!word || word.includes(' ') || !isValidWord(word)) return;
 
    const player = game.players[userId];
 
    // Hanya yang terdaftar dan belum eliminated
    if (!player) return message.reply('❌ Kamu tidak terdaftar di game ini. Tunggu game berikutnya!').then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    if (player.eliminated) return;
 
    // Cek apakah giliran dia
    const currentId = game.turnOrder[game.turnIndex];
    if (userId !== currentId) {
      return message.reply(`⚠️ Sekarang giliran <@${currentId}>!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
    }
 
    const channelId = message.channel.id;
    let errorMsg    = null;
 
    if (firstChar(word) !== lastChar(game.lastWord)) {
      errorMsg = `❌ Kata harus diawali huruf **${lastChar(game.lastWord).toUpperCase()}**, bukan **${firstChar(word).toUpperCase()}**!`;
    } else if (game.usedWords.has(word)) {
      errorMsg = `❌ Kata **${word}** sudah pernah dipakai!`;
    }
 
    // ── Salah → kurangi nyawa ────────────────────────────
    if (errorMsg) {
      player.lives--;
      player.score -= EXP_PENALTY;
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (member) await leveling.removeExp(userId, member, EXP_PENALTY);
 
      let reply = `${errorMsg} **-${EXP_PENALTY} EXP** ${livesDisplay(player.lives)}`;
 
      if (player.lives <= 0) {
        player.eliminated = true;
        reply += `\n💀 <@${userId}> telah **eliminated!**`;
      }
 
      const remaining = getActivePlayers(game.players);
      if (remaining.length <= 1) {
        if (game.timer) clearTimeout(game.timer);
        game.phase = 'ended';
        activeGames.set(channelId, game);
 
        const winner = remaining[0];
        const embed  = new EmbedBuilder()
          .setColor(0xf5c518)
          .setTitle('🏆 Word Chain Selesai!')
          .setDescription(
            reply + '\n\n' +
            (winner ? `👑 Pemenang: <@${winner[0]}> dengan **${winner[1].score} EXP**!\n\n` : 'Semua member eliminated!\n\n') +
            '**📊 Skor Akhir:**\n' + formatPlayers(game.players)
          )
          .setTimestamp();
 
        activeGames.delete(channelId);
        return message.channel.send({ embeds: [embed] });
      }
 
      advanceTurn(game);
      activeGames.set(channelId, game);
 
      const nextId = game.turnOrder[game.turnIndex];
      reply += `\nKata terakhir: **${game.lastWord}** → sambung dengan **${lastChar(game.lastWord).toUpperCase()}**\nGiliran: <@${nextId}>`;
      await message.reply(reply);
      startTurnTimer(channelId, client);
      return;
    }
 
    // ── Benar → reward ───────────────────────────────────
    if (game.timer) clearTimeout(game.timer);
 
    game.usedWords.add(word);
    game.lastWord = word;
    player.score += EXP_REWARD;
 
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (member) {
      const result = await leveling.addExp(userId, member, EXP_REWARD);
      if (result.leveled) {
        const text = config.levelUpMessage
          .replace('{user}',       `**${member.user.username}**`)
          .replace('{level}',      result.newLevel)
          .replace('{roleName}',   result.newLevelName)
          .replace('{serverName}', message.guild.name);
        member.user.send(text).catch(() => {});
      }
    }
 
    advanceTurn(game);
    activeGames.set(channelId, game);
 
    const nextId = game.turnOrder[game.turnIndex];
    await message.react('✅').catch(() => {});
 
    // Setiap 5 kata, tampilkan status
    const totalWords = game.usedWords.size - 1;
    if (totalWords % 5 === 0 && totalWords > 0) {
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`🔤 ${totalWords} kata berhasil!`)
        .addFields(
          { name: 'Kata terakhir', value: `\`${word}\` → sambung dengan **${lastChar(word).toUpperCase()}**` },
          { name: '👥 Status Member', value: formatPlayers(game.players) }
        )
        .setFooter({ text: `Giliran: @${(await message.guild.members.fetch(nextId).catch(() => ({ displayName: nextId }))).displayName}` });
      await message.channel.send({ embeds: [embed] });
    } else {
      // Reply singkat tanpa embed
      await message.channel.send(`✅ **${word}** — +${EXP_REWARD} EXP! Sambung dengan **${lastChar(word).toUpperCase()}** | Giliran: <@${nextId}>`);
    }
 
    startTurnTimer(channelId, client);
  },
};