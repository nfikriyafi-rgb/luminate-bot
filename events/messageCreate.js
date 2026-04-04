const leveling  = require('../utils/leveling');
const currency  = require('../utils/currency');
const config    = require('../config');

// ─── Cek apakah command boleh dipakai di channel ini ─────────
function checkGameChannel(message, gameKey) {
  const channelId = config.channels.gameChannels?.[gameKey];
  if (!channelId) return true; // belum diset = bebas dimana saja
  if (message.channel.id === channelId) return true;

  const channel = message.client.channels.cache.get(channelId);
  const mention = channel ? `<#${channelId}>` : `channel game`;
  message.reply(`❌ Command ini hanya bisa digunakan di ${mention}!`).catch(() => {});
  return false;
}

// ─── Map command ke game channel key ─────────────────────────
const GAME_CHANNEL_MAP = {
  wordchain: 'wordchain', wc: 'wordchain', sambungkata: 'wordchain',
  withdraw: 'withdraw', wd: 'withdraw', kerja: 'withdraw',
  gamble: 'gambling', gambling: 'gambling', bet: 'gambling',
  fight: 'rpg', battle: 'rpg', hunt: 'rpg',
  fish: 'fishing', mancing: 'fishing', fishing: 'fishing',
  fishop: 'fishing', fishingshop: 'fishing', rodshop: 'fishing',
  adventure: 'rpg', adv: 'rpg', explore: 'rpg',
  profile: 'rpg', char: 'rpg', stats: 'rpg', hero: 'rpg',
  inventory: 'rpg', inv: 'rpg', bag: 'rpg',
  equip: 'rpg', use: 'rpg', sell: 'rpg',
  heal: 'rpg', travel: 'rpg', goto: 'rpg', area: 'rpg',
  shop: 'rpg', store: 'rpg', toko: 'rpg',
};

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // ─── Handle prefix commands ───────────────────────────
    if (message.content.startsWith(config.prefix)) {
      const args        = message.content.slice(config.prefix.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();

      const command = client.commands.get(commandName) ||
        client.commands.find(c => c.aliases && c.aliases.includes(commandName));

      if (command) {
        // Cek game channel restriction
        const gameKey = GAME_CHANNEL_MAP[commandName];
        if (gameKey && !checkGameChannel(message, gameKey)) return;

        // Handle adventure recall
        if (commandName === 'adventure' && args[0]?.toLowerCase() === 'recall') {
          const advCmd = client.commands.get('adventure');
          if (advCmd?.handleRecall) await advCmd.handleRecall(message, client);
          return;
        }

        try {
          await command.execute(message, args, client);
        } catch (err) {
          console.error(`[Luminate] Error di command "${commandName}":`, err);
          message.reply('❌ Terjadi error saat menjalankan command ini.').catch(() => {});
        }
      }
      return;
    }

    // ─── Withdraw: cek jawaban aktif ──────────────────────
    const withdraw = client.commands.get('withdraw');
    if (withdraw) {
      const handled = await withdraw.handleAnswer(message);
      if (handled) return;
    }

    // ─── Word Chain: proses kata biasa ────────────────────
    const wordchain = client.commands.get('wordchain');
    if (wordchain) {
      // Word chain hanya di channel wordchain
      const wcChannelId = config.channels.gameChannels?.wordchain;
      if (!wcChannelId || message.channel.id === wcChannelId) {
        await wordchain.handleMessage(message, client);
      }
    }

    // ─── EXP & Lumens dari Chat ───────────────────────────
    if (leveling.isIgnoredChannel(message.channel.id)) return;
    if (!leveling.isMessageValid(message.content)) return;
    if (leveling.isChatOnCooldown(message.author.id)) return;

    leveling.updateLastMessage(message.author.id);

    const member = message.member;
    if (!member) return;

    const result = await leveling.addExp(message.author.id, member, config.chat.expPerMessage);
    if (result.leveled) await leveling.sendLevelUpMessage(client, message, result);

    currency.addLumens(message.author.id, 1);
  },
};