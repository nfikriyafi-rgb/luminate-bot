const leveling = require('../utils/leveling');
const config   = require('../config');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Abaikan bot
    if (message.author.bot) return;
    // Abaikan DM
    if (!message.guild) return;

    // ─── Handle prefix commands ───────────────────────────
    if (message.content.startsWith(config.prefix)) {
      const args        = message.content.slice(config.prefix.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();
      const command     = client.commands.get(commandName);
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

    // ─── EXP dari Chat ────────────────────────────────────
    // 1. Cek channel diabaikan
    if (leveling.isIgnoredChannel(message.channel.id)) return;

    // 2. Cek panjang pesan
    if (!leveling.isMessageValid(message.content)) return;

    // 3. Cek cooldown
    if (leveling.isChatOnCooldown(message.author.id)) return;

    // 4. Update timestamp
    leveling.updateLastMessage(message.author.id);

    // 5. Tambah EXP
    const member = message.member;
    if (!member) return;

    const result = await leveling.addExp(
      message.author.id,
      member,
      config.chat.expPerMessage
    );

    // 6. Notifikasi naik level
    if (result.leveled) {
      await leveling.sendLevelUpMessage(client, message, result);
    }
  },
};
