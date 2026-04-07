const { EmbedBuilder } = require('discord.js');
const fishLogic = require('../utils/fishingLogic');
const fishDb    = require('../utils/fishingItems');
const currency  = require('../utils/currency');
const config    = require('../config');

const FISH_COOLDOWN = new Map();
const COOLDOWN_MS   = 15 * 1000; // 15 detik

module.exports = {
  name: 'fish',
  aliases: ['mancing', 'fishing'],
  description: 'Mancing ikan dan jual untuk dapat Lumens!',

  async execute(message, args, client) {
    const userId  = message.author.id;
    const sub     = (args[0] || '').toLowerCase();

    // ── SELL ─────────────────────────────────────────────────
    if (sub === 'sell' || sub === 'jual') {
      return handleSell(message, args);
    }

    // ── SELLALL ───────────────────────────────────────────────
    if (sub === 'sellall' || sub === 'jualall') {
      return handleSellAll(message);
    }

    // ── INVENTORY ─────────────────────────────────────────────
    if (sub === 'inv' || sub === 'inventory' || sub === 'bag') {
      return handleInventory(message);
    }

    // ── PROFILE ───────────────────────────────────────────────
    if (sub === 'profile' || sub === 'stats') {
      return handleProfile(message);
    }

    // ── EQUIP ROD ─────────────────────────────────────────────
    if (sub === 'equip') {
      return handleEquipRod(message, args);
    }

    // ── USE BAIT ──────────────────────────────────────────────
    if (sub === 'bait') {
      return handleUseBait(message, args);
    }

    // ── TRAVEL ───────────────────────────────────────────────
    if (sub === 'travel' || sub === 'area') {
      return handleTravel(message, args);
    }

    // ── MANCING (default) ─────────────────────────────────────
    const last = FISH_COOLDOWN.get(userId) || 0;
    const diff = Date.now() - last;
    if (diff < COOLDOWN_MS) {
      const left = Math.ceil((COOLDOWN_MS - diff) / 1000);
      return message.reply(`🎣 Tunggu **${left} detik** lagi sebelum mancing!`);
    }

    FISH_COOLDOWN.set(userId, Date.now());

    const fishing  = fishLogic.getPlayerFishing(userId);
    const rod      = fishDb.getRod(fishing.rod);
    const bait     = fishing.bait?.id ? fishDb.getBait(fishing.bait.id) : null;
    const area     = fishDb.getArea(fishing.area);

    // Hitung total luck & weight
    const totalLuck   = (rod?.luck   || 1) + (bait?.luck   || 0);
    const totalWeight = (rod?.weight || 1) + (bait?.weight || 0);

    // Kurangi bait qty
    if (fishing.bait && fishing.bait.qty > 0) {
      fishing.bait.qty--;
      if (fishing.bait.qty <= 0) fishing.bait = null;
    }

    // Roll ikan
    const result = fishLogic.rollFish(totalLuck, totalWeight, fishing.area);

    if (result.failed) {
      fishLogic.savePlayerFishing(userId, fishing);
      return message.reply(`😈 Ikannya kabur! Nasib kurang hoki kali ini. Coba lagi!${bait ? '' : '\n💡 Tip: Pakai bait untuk meningkatkan Luck!'}`);
    }

    const { fish, weight, special, isSecret } = result;
    const price = fishDb.calcFishPrice(fish, weight);
    const r     = fishDb.RARITY[fish.rarity];

    // Simpan ikan ke inventory
    fishing.inventory.push({ fishId: fish.id, weight, price });
    fishing.totalCaught++;
    fishing.totalWeight += weight;

    fishLogic.savePlayerFishing(userId, fishing);

    // ── Cek quest progress ────────────────────────────────────
    const completedQuests = fishLogic.updateQuestProgress(userId, fish);

    // Tambah fishing EXP
    const expGain   = Math.floor(weight * (r.priceMultiplier || 1) * 0.5);
    const lvlResult = fishLogic.addFishingExp(userId, expGain);

    // Bonus Lumens dari treasure
    let bonusLumens = 0;
    if (special?.type === 'treasure' && special.bonus) {
      bonusLumens = special.bonus;
      currency.addLumens(userId, bonusLumens);
    }

    // Build embed
    const embedColor = isSecret ? 0x2b2d31 : r.color;
    const embedTitle = isSecret
      ? `❓ ${message.member.displayName} menangkap ikan MISTERIUS!`
      : `🎣 ${message.member.displayName} dapat ikan!`;

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(embedTitle)
      .addFields(
        { name: 'Ikan',        value: `${r.emoji} **${fish.name}**`,           inline: true  },
        { name: 'Rarity',      value: fishDb.formatRarity(fish.rarity),         inline: true  },
        { name: 'Berat',       value: `⚖️ **${weight} kg**`,                   inline: true  },
        { name: 'Harga',       value: `✨ **${price} Lumens**`,                inline: true  },
        { name: 'Fishing EXP', value: `+**${expGain}** EXP`,                   inline: true  },
        { name: 'Area',        value: area.name,                                inline: true  },
      )
      .setFooter({ text: `Rod: ${rod?.name || 'Basic'} | Bait: ${bait?.name || 'Tidak ada'} | Luck: ${totalLuck} | Weight: ${totalWeight} | !fish sellall untuk jual semua` });

    if (fish.rarity === 'SECRET') {
      const secretCount = fishLogic.getPlayerFishing(userId).secretCaught[fish.id] || 0;
      embed.setDescription(
        `🌑 **WOW! Kamu menangkap ikan ❓ SECRET yang sangat langka!**\n` +
        `**${fish.name}** ditangkap ${secretCount}x total.\n` +
        `Ketik \`!fishquest\` untuk cek progress quest!`
      );
    } else if (special) {
      embed.setDescription(`🎉 **${special.desc}**${bonusLumens > 0 ? `\nBonus langsung masuk ke saldo!` : ''}`);
    }

    if (lvlResult.leveled) {
      embed.addFields({
        name:  '🎉 Fishing Level Up!',
        value: `Level mancing naik ke **${lvlResult.fishing.level}**!`,
        inline: false,
      });
    }

    // Cek inventory penuh
    const totalFish = lvlResult.fishing.inventory.length;
    if (totalFish >= 20) {
      embed.addFields({
        name:  '⚠️ Inventory Penuh!',
        value: `${totalFish}/20 ikan — Jual dulu dengan \`!fish sellall\``,
        inline: false,
      });
    }

    await message.reply({ embeds: [embed] });

    // ── Notif quest selesai ───────────────────────────────────
    for (const { questId, quest } of completedQuests) {
      const questEmbed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('❓ SECRET QUEST SELESAI!')
        .setDescription(
          `🎉 <@${userId}> menyelesaikan quest **${quest.name}**!\n\n` +
          `🎁 **Reward diterima:** ${quest.rewardText}\n\n` +
          `Ketik \`!fish equip\` atau \`!fish bait\` untuk pasang item secret kamu!`
        )
        .setFooter({ text: 'Item secret tidak bisa dijual atau diperjualbelikan' });
      message.channel.send({ embeds: [questEmbed] }).catch(() => {});

      // DM notif
      message.author.send(
        `🎉 Quest **${quest.name}** selesai!\nReward: ${quest.rewardText}`
      ).catch(() => {});
    }
        setFooter({ text: 'Terus tangkap ikan SECRET untuk quest berikutnya!' });
      await message.channel.send({ content: `<@${userId}>`, embeds: [questEmbed] });
  },
};


// ─── SELL 1 IKAN ─────────────────────────────────────────────
function handleSell(message, args) {
  const index   = parseInt(args[1]) - 1;
  const fishing = fishLogic.getPlayerFishing(message.author.id);

  if (isNaN(index) || index < 0 || index >= fishing.inventory.length) {
    return message.reply(`❌ Nomor ikan tidak valid. Ketik \`!fish inv\` untuk lihat daftar ikan.\nContoh: \`!fish sell 1\``);
  }

  const entry = fishing.inventory.splice(index, 1)[0];
  const fish  = fishDb.getFish(entry.fishId);
  fishing.totalEarned += entry.price;
  fishLogic.savePlayerFishing(message.author.id, fishing);
  currency.addLumens(message.author.id, entry.price);

  const r = fishDb.RARITY[fish?.rarity || 'COMMON'];
  message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('💰 Ikan Terjual!')
        .addFields(
          { name: 'Ikan',   value: `${r.emoji} **${fish?.name || 'Unknown'}**`, inline: true },
          { name: 'Berat',  value: `⚖️ **${entry.weight} kg**`,                 inline: true },
          { name: 'Harga',  value: `✨ **${entry.price} Lumens**`,              inline: true },
          { name: 'Saldo',  value: `✨ **${currency.getBalance(message.author.id)} Lumens**`, inline: false },
        ),
    ],
  });
}

// ─── SELL ALL ────────────────────────────────────────────────
function handleSellAll(message) {
  const fishing = fishLogic.getPlayerFishing(message.author.id);
  if (fishing.inventory.length === 0) return message.reply('🎣 Inventory ikan kamu kosong!');

  const total = fishing.inventory.reduce((a, e) => a + e.price, 0);
  const count = fishing.inventory.length;
  fishing.totalEarned  += total;
  fishing.inventory     = [];
  fishLogic.savePlayerFishing(message.author.id, fishing);
  currency.addLumens(message.author.id, total);

  message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('💰 Semua Ikan Terjual!')
        .addFields(
          { name: 'Jumlah Ikan', value: `**${count} ikan**`,                                         inline: true  },
          { name: 'Total',       value: `✨ **${total} Lumens**`,                                    inline: true  },
          { name: 'Saldo',       value: `✨ **${currency.getBalance(message.author.id)} Lumens**`,   inline: false },
        ),
    ],
  });
}

// ─── INVENTORY ───────────────────────────────────────────────
function handleInventory(message) {
  const fishing = fishLogic.getPlayerFishing(message.author.id);
  const inv     = fishing.inventory;

  if (inv.length === 0) return message.reply('🎣 Inventory ikan kamu kosong! Ayo mancing dulu dengan `!fish`');

  const lines = inv.map((e, i) => {
    const fish = fishDb.getFish(e.fishId);
    const r    = fishDb.RARITY[fish?.rarity || 'COMMON'];
    return `**${i + 1}.** ${r.emoji} ${fish?.name || 'Unknown'} — ⚖️ ${e.weight}kg — ✨ ${e.price}`;
  }).join('\n');

  const totalValue = inv.reduce((a, e) => a + e.price, 0);

  message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎣 Inventory Ikan — ${message.member.displayName}`)
        .setDescription(lines)
        .addFields(
          { name: 'Total Ikan',  value: `**${inv.length}/20**`,             inline: true },
          { name: 'Total Nilai', value: `✨ **${totalValue} Lumens**`,      inline: true },
        )
        .setFooter({ text: '!fish sell <nomor> untuk jual 1 • !fish sellall untuk jual semua' }),
    ],
  });
}

// ─── PROFILE ─────────────────────────────────────────────────
function handleProfile(message) {
  const fishing   = fishLogic.getPlayerFishing(message.author.id);
  const rod       = fishDb.getRod(fishing.rod);
  const bait      = fishing.bait ? fishDb.getBait(fishing.bait.id) : null;
  const area      = fishDb.getArea(fishing.area);
  const expNeeded = fishLogic.expForLevel(fishing.level);

  const expPct = Math.floor((fishing.exp / expNeeded) * 10);
  const expBar = '█'.repeat(expPct) + '░'.repeat(10 - expPct);

  const rodR  = rod  ? fishDb.RARITY[rod.rarity]  : null;
  const baitR = bait ? fishDb.RARITY[bait.rarity] : null;

  // Quest progress
  const secretCount = fishing.secretCaught || 0;
  const questLines  = fishDb.SECRET_QUEST_REWARDS.map(q => {
    const done = (fishing.questCompleted || []).includes(q.reward);
    const bar  = done ? '✅' : secretCount >= q.secretFishCount ? '🟡' : '⬜';
    return `${bar} ${q.secretFishCount}x SECRET → **${fishDb.getRod(q.reward)?.name || fishDb.getBait(q.reward)?.name || q.reward}**`;
  }).join('\n');

  message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎣 Fishing Profile — ${message.member.displayName}`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '📊 Fishing Level', value: `**${fishing.level}**\n\`${expBar}\` ${fishing.exp}/${expNeeded} EXP`, inline: false },
          { name: '🎣 Rod',           value: rod  ? `${rodR.emoji} **${rod.name}**\n🎯 Luck: +${rod.luck} | ⚖️ Weight: +${rod.weight}`    : '*Tidak ada*', inline: true },
          { name: '🪱 Bait',          value: bait ? `${baitR.emoji} **${bait.name}** (x${fishing.bait.qty})\n🎯 Luck: +${bait.luck} | ⚖️ Weight: +${bait.weight}` : '*Tidak ada*', inline: true },
          { name: '🗺️ Area',          value: area.name,                                                         inline: true  },
          { name: '🐟 Total Tangkapan',value: `**${fishing.totalCaught}** ikan`,                                 inline: true  },
          { name: '⚖️ Total Berat',   value: `**${fishing.totalWeight.toFixed(1)} kg**`,                        inline: true  },
          { name: '✨ Total Earned',   value: `**${fishing.totalEarned} Lumens**`,                               inline: true  },
          { name: '❓ Ikan SECRET',    value: `Ditangkap: **${secretCount}x**`,                                  inline: true  },
          { name: '❓ SECRET Quest',   value: questLines || 'Belum ada',                                         inline: false },
        )
        .setFooter({ text: '!fish untuk mancing • !fishop untuk beli rod & bait' }),
    ],
  });
}

// ─── EQUIP ROD ────────────────────────────────────────────────
function handleEquipRod(message, args) {
  const rodId   = (args[1] || '').toLowerCase();
  if (!rodId) return message.reply('❌ Ketik ID rod.\nContoh: `!fish equip rod_003`');

  const fishing = fishLogic.getPlayerFishing(message.author.id);
  if (!fishing.rodInventory.includes(rodId)) {
    return message.reply('❌ Rod tidak ada di inventory kamu. Beli dulu di `!fishop`');
  }

  const rod = fishDb.getRod(rodId);
  if (!rod) return message.reply('❌ Rod tidak ditemukan.');

  fishing.rod = rodId;
  fishLogic.savePlayerFishing(message.author.id, fishing);

  const r = fishDb.RARITY[rod.rarity];
  message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(r.color)
        .setTitle(`✅ Rod dipasang!`)
        .addFields(
          { name: 'Rod',    value: `${r.emoji} **${rod.name}**`, inline: true },
          { name: '🎯 Luck',   value: `+${rod.luck}`,            inline: true },
          { name: '⚖️ Weight', value: `+${rod.weight}`,          inline: true },
        ),
    ],
  });
}

// ─── USE BAIT ─────────────────────────────────────────────────
function handleUseBait(message, args) {
  const baitId  = (args[1] || '').toLowerCase();
  if (!baitId) return message.reply('❌ Ketik ID bait.\nContoh: `!fish bait bait_003`');

  const fishing = fishLogic.getPlayerFishing(message.author.id);
  const baitInv = fishing.baitInventory.find(b => b.id === baitId);
  if (!baitInv || baitInv.qty <= 0) {
    return message.reply('❌ Bait tidak ada di inventory kamu. Beli dulu di `!fishop`');
  }

  const bait = fishDb.getBait(baitId);
  if (!bait) return message.reply('❌ Bait tidak ditemukan.');

  fishing.bait = { id: baitId, qty: baitInv.qty };
  fishLogic.savePlayerFishing(message.author.id, fishing);

  const r = fishDb.RARITY[bait.rarity];
  message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(r.color)
        .setTitle(`✅ Bait dipasang!`)
        .addFields(
          { name: 'Bait',   value: `${r.emoji} **${bait.name}** (x${baitInv.qty})`, inline: true },
          { name: '🎯 Luck',   value: `+${bait.luck}`,                                inline: true },
          { name: '⚖️ Weight', value: `+${bait.weight}`,                              inline: true },
        ),
    ],
  });
}

// ─── TRAVEL AREA ─────────────────────────────────────────────
function handleTravel(message, args) {
  const dest    = (args[1] || '').toLowerCase();
  const fishing = fishLogic.getPlayerFishing(message.author.id);

  if (!dest) {
    const lines = Object.entries(fishDb.AREAS).map(([key, a]) => {
      const locked = fishing.level < a.minLevel;
      return `${locked ? '🔒' : '✅'} \`${key}\` — ${a.name} (Min Lv.${a.minLevel})${key === fishing.area ? ' ← **Sekarang**' : ''}`;
    }).join('\n');

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🗺️ Area Mancing')
          .setDescription(lines)
          .setFooter({ text: '!fish travel <area> untuk pindah' }),
      ],
    });
  }

  const area = fishDb.AREAS[dest];
  if (!area) return message.reply(`❌ Area \`${dest}\` tidak ditemukan. Ketik \`!fish travel\` untuk daftar area.`);
  if (fishing.level < area.minLevel) return message.reply(`🔒 Butuh **Fishing Level ${area.minLevel}** untuk ke ${area.name}. Level kamu: **${fishing.level}**.`);

  fishing.area = dest;
  fishLogic.savePlayerFishing(message.author.id, fishing);

  message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`🗺️ Pindah ke ${area.name}`)
        .setDescription(`Kamu sekarang mancing di **${area.name}**!\nLuck bonus: +${area.luckBonus} | Weight bonus: +${area.weightBonus}`)
        .setFooter({ text: 'Ketik !fish untuk mulai mancing!' }),
    ],
  });
}