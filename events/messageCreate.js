const leveling  = require('../utils/leveling');
const currency  = require('../utils/currency');
const config    = require('../config');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // ─── Handle prefix commands ───────────────────────────
    if (message.content.startsWith(config.prefix)) {
      const args        = message.content.slice(config.prefix.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();
      const command     = client.commands.get(commandName) ||
        client.commands.find(c => c.aliases && c.aliases.includes(commandName));

      if (command) {
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
      await wordchain.handleMessage(message, client);
    }

    // ─── EXP & Lumens dari Chat ───────────────────────────
    if (leveling.isIgnoredChannel(message.channel.id)) return;
    if (!leveling.isMessageValid(message.content)) return;
    if (leveling.isChatOnCooldown(message.author.id)) return;

    leveling.updateLastMessage(message.author.id);

    const member = message.member;
    if (!member) return;

    // EXP
    const result = await leveling.addExp(message.author.id, member, config.chat.expPerMessage);
    if (result.leveled) await leveling.sendLevelUpMessage(client, message, result);

    // Lumens +1 per pesan
    currency.addLumens(message.author.id, 1);
  },
};