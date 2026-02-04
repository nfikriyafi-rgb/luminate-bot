const fs = require("fs");

const { 
  Client, 
  GatewayIntentBits, 
  Partials 
} = require("discord.js");
;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});
 // auto ⚡ Spark & init data
console.log("TOKEN:", process.env.TOKEN);

client.once("ready", async () => {
  console.log(`✅ Online sebagai ${client.user.tag}`);

  const guild = client.guilds.cache.first();
  if (!guild) return;

  await guild.members.fetch();

  const sparkRole = guild.roles.cache.find(r => r.name === "⚡ Spark");
  if (!sparkRole) {
    console.log("❌ Role Spark tidak ditemukan");
    return;
  }

  guild.members.cache.forEach(member => {
    if (member.user.bot) return;

    // init data
    if (!users[member.id]) {
      users[member.id] = { exp: 0, level: 1 };
    }

    // kasih role ⚡ Spark
    if (!member.roles.cache.has(sparkRole.id)) {
      member.roles.add(sparkRole).catch(() => {});
    }
  });

  saveDB();
});


/* ===============================
   CONFIG
================================ */
const CHAT_EXP = 10;
const CHAT_COOLDOWN = 30 * 1000;
const VOICE_EXP = 10;
const VOICE_INTERVAL = 2 * 60 * 1000;

const LEVEL_ROLES = {
  1: "⚡ Spark",
  2: "🔹 Flicker",
  3: "🌱 Glow",
  4: "💎 Shimmer",
  5: "🌞 Radiant",
  6: "🕯️ Illume",
  7: "🗼 Beacon",
  8: "🔥 Lightbearer",
  9: "🌌 Stellar",
  10: "👑 Luminate Ascendant"
};

const DB_FILE = "./levels.json";

/* ===============================
   DATABASE
================================ */
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

/* ===============================
   LEVEL FUNCTION
================================ */
function totalExp(level) {
  if (level <= 1) return 0;
  return 100 * Math.pow(2, level - 2);
}

function getLevel(exp) {
  let lvl = 1;
  while (exp >= totalExp(lvl + 1)) lvl++;
  return lvl;
}

/* ===============================
   READY
================================ */
client.once("ready", () => {
  console.log(`✅ Online sebagai ${client.user.tag}`);
});

/* ===============================
   AUTO ROLE LEVEL 1
================================ */
client.on("guildMemberAdd", async member => {
  users[member.id] = { exp: 0, level: 1 };
  saveDB();

  const role = member.guild.roles.cache.find(r => r.name === "⚡ Spark");
  if (role) await member.roles.add(role).catch(() => {});
});

/* ===============================
   CHAT EXP
================================ */
const lastChat = {};

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  // COMMAND LEADERBOARD
  if (message.content === "!leaderboard") {
    const sorted = Object.entries(users)
      .sort((a, b) => b[1].exp - a[1].exp)
      .slice(0, 10);

    let text = "🏆 **Luminate Leaderboard**\n\n";
    for (let i = 0; i < sorted.length; i++) {
      const user = await client.users.fetch(sorted[i][0]).catch(() => null);
      if (!user) continue;

      text += `**${i + 1}. ${user.username}** — Lv.${sorted[i][1].level} (${sorted[i][1].exp} EXP)\n`;
    }

    return message.channel.send(text);
  }

  const words = message.content.trim().split(/\s+/).length;
  if (words < 5) return;

  const now = Date.now();
  if (lastChat[message.author.id] && now - lastChat[message.author.id] < CHAT_COOLDOWN) return;
  lastChat[message.author.id] = now;

  if (!users[message.author.id]) {
    users[message.author.id] = { exp: 0, level: 1 };
  }

  users[message.author.id].exp += CHAT_EXP;

  const newLevel = getLevel(users[message.author.id].exp);
  if (newLevel > users[message.author.id].level) {
    users[message.author.id].level = newLevel;
    await levelUp(message.member, newLevel);
  }

  saveDB();
});

/* ===============================
   VOICE EXP
================================ */
const voiceTimers = {};

client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;

  if (!oldState.channel && newState.channel) {
    voiceTimers[member.id] = setInterval(() => {
      if (!newState.selfMute && !newState.selfDeaf) {
        if (!users[member.id]) users[member.id] = { exp: 0, level: 1 };

        users[member.id].exp += VOICE_EXP;
        const newLevel = getLevel(users[member.id].exp);

        if (newLevel > users[member.id].level) {
          users[member.id].level = newLevel;
          levelUp(member, newLevel);
        }

        saveDB();
      }
    }, VOICE_INTERVAL);
  }

  if (oldState.channel && !newState.channel) {
    clearInterval(voiceTimers[member.id]);
    delete voiceTimers[member.id];
  }
});

/* ===============================
   LEVEL UP
================================ */
async function levelUp(member, level) {
  const roleName = LEVEL_ROLES[level];
  if (!roleName) return;

  const role = member.guild.roles.cache.find(r => r.name === roleName);
  if (role) await member.roles.add(role).catch(() => {});

  member.send(`✨ Selamat! Kamu naik ke **${roleName} (Lv.${level})** 🔥`).catch(() => {});
}

/* ===============================
   LOGIN
================================ */
client.login(process.env.TOKEN);

