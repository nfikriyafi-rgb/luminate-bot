module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Luminate Bot online sebagai ${client.user.tag}`);
    client.user.setActivity('🌟 Luminate Leveling', { type: 3 }); // WATCHING
  },
};
