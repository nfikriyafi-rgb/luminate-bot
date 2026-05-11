const config = require('../config');
const db     = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    if (member.user.bot) return;

    // Init data user baru di database
    const user = db.getUser(member.id);
    if (!user.level) user.level = 1;
    if (!user.exp)   user.exp   = 0;
    db.saveUser(member.id, user);

    // Cari role level 1
    const levelOneRole = config.levels[0];
    if (!levelOneRole) return;

    const role = member.guild.roles.cache.find(r => r.name === levelOneRole.name);
    if (!role) {
      console.warn(`[Luminate] Role "${levelOneRole.name}" tidak ditemukan. Pastikan role sudah dibuat di server.`);
      return;
    }

    // Assign role level 1
    await member.roles.add(role).catch(err => {
      console.error(`[Luminate] Gagal assign role ke ${member.user.tag}:`, err.message);
    });

    console.log(`[Luminate] ${member.user.tag} join → role "${levelOneRole.name}" diberikan.`);
  },
};