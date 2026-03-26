const { handleSystem } = require('./game');
 
module.exports = {
  name: 'system',
  description: 'Lihat aturan lengkap suatu game',
 
  execute(message, args) {
    const gameName = (args[0] || '').toLowerCase();
    return handleSystem(message, gameName);
  },
};
 