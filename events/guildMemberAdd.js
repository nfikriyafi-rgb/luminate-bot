const config = require('../config');
const db     = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    console.log(`[MemberAdd] ${member.user.tag} join server ${member.guild.name}`);

    if (member.user.bot) return;

    const user = db.getUser(member.id);
    if (!user.level) user.level = 1;
    if (!user.exp)   user.exp   = 0;
    db.saveUser(member.id, user);

    const levelOneRole = config.levels[0];
    console.log(`[MemberAdd] Mencari role: "${levelOneRole.name}"`);

    const role = member.guild.roles.cache.find(r => r.name === levelOneRole.name);
    if (!role) {
      console.warn(`[MemberAdd] Role "${levelOneRole.name}" TIDAK DITEMUKAN di server!`);
      console.log(`[MemberAdd] Role yang ada:`, member.guild.roles.cache.map(r => r.name).join(', '));
      return;
    }

    console.log(`[MemberAdd] Role ditemukan: ${role.name} (${role.id})`);
    await member.roles.add(role).catch(err => {
      console.error(`[MemberAdd] Gagal assign role:`, err.message);
    });
    console.log(`[MemberAdd] ✅ Role berhasil diberikan ke ${member.user.tag}`);
  },
};