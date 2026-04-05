const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fishDb     = require('../utils/fishingItems');
const fishCanvas = require('../utils/fishingCanvas');
const config     = require('../config');

const p = config.prefix;

module.exports = {
  name: 'fishcatalog',
  aliases: ['fishcat', 'fishlist', 'rodlist', 'baitlist'],
  description: 'Lihat katalog visual semua ikan, rod, dan bait',

  async execute(message, args) {
    const sub    = (args[0] || '').toLowerCase();
    const filter = (args[1] || '').toUpperCase();

    if (!sub) return showMenu(message);
    if (sub === 'fish' || sub === 'ikan') return showCategory(message, 'fish',  filter);
    if (sub === 'rod'  || sub === 'rods') return showCategory(message, 'rod',   filter);
    if (sub === 'bait' || sub === 'baits')return showCategory(message, 'bait',  filter);

    return showMenu(message);
  },
};

// ─── Menu utama ───────────────────────────────────────────────
function showMenu(message) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📖 Fishing Catalog')
    .setDescription('Lihat semua item fishing dengan kartu visual!\n\u200B')
    .addFields(
      { name: `\`${p}fishcatalog fish\``,          value: 'Lihat semua ikan (per rarity)',     inline: false },
      { name: `\`${p}fishcatalog fish mythic\``,    value: 'Filter ikan rarity tertentu',       inline: false },
      { name: `\`${p}fishcatalog rod\``,            value: 'Lihat semua rod',                   inline: false },
      { name: `\`${p}fishcatalog rod legendary\``,  value: 'Filter rod rarity tertentu',        inline: false },
      { name: `\`${p}fishcatalog bait\``,           value: 'Lihat semua bait',                  inline: false },
    )
    .setFooter({ text: 'Rarity: common | uncommon | rare | epic | legendary | mythic' });

  message.reply({ embeds: [embed] });
}

// ─── Show items per category ──────────────────────────────────
async function showCategory(message, type, rarityFilter) {
  const RARITY_ORDER = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
  const toShow = rarityFilter ? [rarityFilter] : RARITY_ORDER;

  // Validasi filter
  if (rarityFilter && !RARITY_ORDER.includes(rarityFilter)) {
    return message.reply(`❌ Rarity tidak valid.\nPilih: \`common\`, \`uncommon\`, \`rare\`, \`epic\`, \`legendary\`, \`mythic\``);
  }

  await message.reply(`⏳ Generating gambar, mohon tunggu...`);

  for (const rarity of toShow) {
    const rarityData = fishDb.RARITY[rarity];
    let   pool;

    if (type === 'fish') pool = fishDb.FISH.filter(f => f.rarity === rarity);
    else if (type === 'rod')  pool = fishDb.RODS.filter(r => r.rarity === rarity);
    else if (type === 'bait') pool = fishDb.BAITS.filter(b => b.rarity === rarity);

    if (!pool || pool.length === 0) continue;

    // Generate satu kartu per item & kirim sebagai attachment
    for (const item of pool) {
      try {
        let buf;
        if (type === 'fish') buf = fishCanvas.generateFishCard(item, rarityData);
        else if (type === 'rod')  buf = fishCanvas.generateRodCard(item, rarityData);
        else if (type === 'bait') buf = fishCanvas.generateBaitCard(item, rarityData);

        const attachment = new AttachmentBuilder(buf, { name: `${item.id}.png` });
        await message.channel.send({ files: [attachment] });
      } catch (err) {
        console.error(`[FishCatalog] Error generate ${item.id}:`, err);
        // Fallback ke text kalau canvas error
        message.channel.send(`${rarityData.emoji} **${item.name}** \`${item.id || ''}\``).catch(() => {});
      }
    }

    // Jeda kecil antar rarity biar tidak flood
    await new Promise(r => setTimeout(r, 300));
  }
}