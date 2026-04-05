const { createCanvas } = require('@napi-rs/canvas');
const path = require('path');
const fs   = require('fs');

// ─── Warna per rarity ─────────────────────────────────────────
const RARITY_COLORS = {
  COMMON:    { bg: '#2b2d31', card: '#383a40', border: '#99aab5', text: '#ffffff', glow: '#99aab5' },
  UNCOMMON:  { bg: '#1a2d1f', card: '#223328', border: '#57f287', text: '#ffffff', glow: '#57f287' },
  RARE:      { bg: '#1a1f3d', card: '#202545', border: '#5865f2', text: '#ffffff', glow: '#5865f2' },
  EPIC:      { bg: '#231a3d', card: '#2a2045', border: '#9b59b6', text: '#ffffff', glow: '#9b59b6' },
  LEGENDARY: { bg: '#3d3100', card: '#453900', border: '#f5c518', text: '#ffffff', glow: '#f5c518' },
  MYTHIC:    { bg: '#3d0000', card: '#450000', border: '#e74c3c', text: '#ffffff', glow: '#e74c3c' },
};

// ─── Emoji visual per kategori & rarity ──────────────────────
const FISH_EMOJI   = { COMMON:'🐟', UNCOMMON:'🐠', RARE:'🐡', EPIC:'🦈', LEGENDARY:'🐉', MYTHIC:'🌌' };
const ROD_EMOJI    = { COMMON:'🎣', UNCOMMON:'🎣', RARE:'🎣', EPIC:'🎣', LEGENDARY:'🎣', MYTHIC:'🎣' };
const BAIT_EMOJI   = { COMMON:'🪱', UNCOMMON:'🦗', RARE:'✨', EPIC:'💛', LEGENDARY:'🔥', MYTHIC:'🌀' };

// ─── Helper: rounded rect ─────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Helper: wrap text ────────────────────────────────────────
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line    = '';
  let lineY   = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line  = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, lineY);
  return lineY;
}

// ─── Generate fish card image ─────────────────────────────────
function generateFishCard(fish, rarityData) {
  const W   = 400, H = 220;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  const C      = RARITY_COLORS[fish.rarity] || RARITY_COLORS.COMMON;
  const emoji  = FISH_EMOJI[fish.rarity] || '🐟';

  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Glow effect (border blur simulation)
  ctx.shadowColor = C.glow;
  ctx.shadowBlur  = 20;
  ctx.strokeStyle = C.border;
  ctx.lineWidth   = 2;
  roundRect(ctx, 10, 10, W - 20, H - 20, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Card inner
  ctx.fillStyle = C.card;
  roundRect(ctx, 12, 12, W - 24, H - 24, 14);
  ctx.fill();

  // Rarity badge
  ctx.fillStyle = C.border;
  roundRect(ctx, 24, 24, 110, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${rarityData.emoji} ${rarityData.name}`, 79, 41);

  // Big emoji (item visual)
  ctx.font      = '72px serif';
  ctx.textAlign = 'left';
  ctx.fillText(emoji, 24, 140);

  // Fish name
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(fish.name, 120, 65);

  // Stats
  ctx.font      = '14px sans-serif';
  ctx.fillStyle = '#b5bac1';
  ctx.fillText(`⚖️  Berat: ${fish.weightMin} – ${fish.weightMax} kg`, 120, 92);

  const priceMin = Math.floor(fish.weightMin * rarityData.priceMultiplier);
  const priceMax = Math.floor(fish.weightMax * rarityData.priceMultiplier);
  ctx.fillText(`✨  Harga: ${priceMin} – ${priceMax} Lumens`, 120, 114);
  ctx.fillText(`🎯  Chance: ${rarityData.dropChance}%`, 120, 136);
  ctx.fillText(`✖️   Multiplier: x${rarityData.priceMultiplier}`, 120, 158);

  // Bottom stripe
  ctx.fillStyle = C.border + '33';
  roundRect(ctx, 12, H - 42, W - 24, 30, 8);
  ctx.fill();
  ctx.fillStyle = C.border;
  ctx.font      = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Luminate Fishing System', W / 2, H - 22);

  return canvas.toBuffer('image/png');
}

// ─── Generate rod card image ──────────────────────────────────
function generateRodCard(rod, rarityData) {
  const W   = 400, H = 220;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  const C      = RARITY_COLORS[rod.rarity] || RARITY_COLORS.COMMON;
  const emoji  = ROD_EMOJI[rod.rarity] || '🎣';

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.shadowColor = C.glow;
  ctx.shadowBlur  = 20;
  ctx.strokeStyle = C.border;
  ctx.lineWidth   = 2;
  roundRect(ctx, 10, 10, W - 20, H - 20, 16);
  ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.fillStyle = C.card;
  roundRect(ctx, 12, 12, W - 24, H - 24, 14);
  ctx.fill();

  // Rarity badge
  ctx.fillStyle = C.border;
  roundRect(ctx, 24, 24, 110, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${rarityData.emoji} ${rarityData.name}`, 79, 41);

  // Big emoji
  ctx.font      = '72px serif';
  ctx.textAlign = 'left';
  ctx.fillText(emoji, 24, 140);

  // Rod name & ID
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 22px sans-serif';
  ctx.fillText(rod.name, 120, 65);
  ctx.fillStyle = '#b5bac1';
  ctx.font      = '12px sans-serif';
  ctx.fillText(`ID: ${rod.id}`, 120, 82);

  // Stats
  ctx.font      = '14px sans-serif';
  ctx.fillText(`🎯  Luck: +${rod.luck}`, 120, 104);
  ctx.fillText(`⚖️  Weight: +${rod.weight}`, 120, 126);
  ctx.fillText(`✨  Harga: ${rod.price.toLocaleString()} Lumens`, 120, 148);
  ctx.fillText(`🛒  !fishop buy ${rod.id}`, 120, 170);

  ctx.fillStyle = C.border + '33';
  roundRect(ctx, 12, H - 42, W - 24, 30, 8);
  ctx.fill();
  ctx.fillStyle = C.border;
  ctx.font      = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Luminate Fishing System', W / 2, H - 22);

  return canvas.toBuffer('image/png');
}

// ─── Generate bait card image ─────────────────────────────────
function generateBaitCard(bait, rarityData) {
  const W   = 400, H = 220;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  const C      = RARITY_COLORS[bait.rarity] || RARITY_COLORS.COMMON;
  const emoji  = BAIT_EMOJI[bait.rarity] || '🪱';

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.shadowColor = C.glow;
  ctx.shadowBlur  = 20;
  ctx.strokeStyle = C.border;
  ctx.lineWidth   = 2;
  roundRect(ctx, 10, 10, W - 20, H - 20, 16);
  ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.fillStyle = C.card;
  roundRect(ctx, 12, 12, W - 24, H - 24, 14);
  ctx.fill();

  ctx.fillStyle = C.border;
  roundRect(ctx, 24, 24, 110, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${rarityData.emoji} ${rarityData.name}`, 79, 41);

  ctx.font      = '72px serif';
  ctx.textAlign = 'left';
  ctx.fillText(emoji, 24, 140);

  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 22px sans-serif';
  ctx.fillText(bait.name, 120, 65);
  ctx.fillStyle = '#b5bac1';
  ctx.font      = '12px sans-serif';
  ctx.fillText(`ID: ${bait.id}`, 120, 82);

  ctx.font      = '14px sans-serif';
  ctx.fillText(`🎯  Luck: +${bait.luck}`, 120, 104);
  ctx.fillText(`⚖️  Weight: +${bait.weight}`, 120, 126);
  ctx.fillText(`✨  Harga: ${bait.price.toLocaleString()} Lumens (x${bait.qty})`, 120, 148);
  ctx.fillText(`🛒  !fishop buy ${bait.id}`, 120, 170);

  ctx.fillStyle = C.border + '33';
  roundRect(ctx, 12, H - 42, W - 24, 30, 8);
  ctx.fill();
  ctx.fillStyle = C.border;
  ctx.font      = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Luminate Fishing System', W / 2, H - 22);

  return canvas.toBuffer('image/png');
}

// ─── Generate catalog grid (multiple items) ───────────────────
function generateCatalogGrid(itemList, type, rarityData) {
  const COLS    = 2;
  const ROWS    = Math.ceil(itemList.length / COLS);
  const CW      = 400, CH = 220;
  const GAP     = 10;
  const PAD     = 20;
  const W       = COLS * CW + (COLS - 1) * GAP + PAD * 2;
  const H       = ROWS * CH + (ROWS - 1) * GAP + PAD * 2;

  const canvas  = createCanvas(W, H);
  const ctx     = canvas.getContext('2d');
  const C       = RARITY_COLORS[rarityData.name.toUpperCase()] || RARITY_COLORS.COMMON;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < itemList.length; i++) {
    const col  = i % COLS;
    const row  = Math.floor(i / COLS);
    const x    = PAD + col * (CW + GAP);
    const y    = PAD + row * (CH + GAP);
    const item = itemList[i];

    let buf;
    if (type === 'fish') buf = generateFishCard(item, rarityData);
    else if (type === 'rod')  buf = generateRodCard(item, rarityData);
    else if (type === 'bait') buf = generateBaitCard(item, rarityData);

    // Draw card at position
    const { createImageData } = require('@napi-rs/canvas');
    // Buat canvas kecil untuk sub-item
    const subCanvas = createCanvas(CW, CH);
    const subCtx    = subCanvas.getContext('2d');
    if (type === 'fish')      drawFishOnCtx(subCtx, item, rarityData);
    else if (type === 'rod')  drawRodOnCtx(subCtx, item, rarityData);
    else if (type === 'bait') drawBaitOnCtx(subCtx, item, rarityData);

    const imgData = subCtx.getImageData(0, 0, CW, CH);
    ctx.putImageData(imgData, x, y);
  }

  return canvas.toBuffer('image/png');
}

// ─── Draw helpers untuk grid ──────────────────────────────────
function drawFishOnCtx(ctx, fish, rarityData) {
  const W = 400, H = 220;
  const C = RARITY_COLORS[fish.rarity] || RARITY_COLORS.COMMON;
  const emoji = FISH_EMOJI[fish.rarity] || '🐟';

  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.shadowColor = C.glow; ctx.shadowBlur = 20;
  ctx.strokeStyle = C.border; ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, W-20, H-20, 16); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = C.card; roundRect(ctx, 12, 12, W-24, H-24, 14); ctx.fill();
  ctx.fillStyle = C.border; roundRect(ctx, 24, 24, 110, 26, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${rarityData.emoji} ${rarityData.name}`, 79, 41);
  ctx.font = '72px serif'; ctx.textAlign = 'left'; ctx.fillText(emoji, 24, 140);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(fish.name, 120, 65);
  ctx.fillStyle = '#b5bac1'; ctx.font = '13px sans-serif';
  ctx.fillText(`⚖️ ${fish.weightMin}–${fish.weightMax} kg`, 120, 90);
  const pMin = Math.floor(fish.weightMin * rarityData.priceMultiplier);
  const pMax = Math.floor(fish.weightMax * rarityData.priceMultiplier);
  ctx.fillText(`✨ ${pMin}–${pMax} Lumens`, 120, 112);
  ctx.fillText(`🎯 Chance: ${rarityData.dropChance}%`, 120, 134);
  ctx.fillStyle = C.border+'33'; roundRect(ctx, 12, H-42, W-24, 30, 8); ctx.fill();
  ctx.fillStyle = C.border; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Luminate Fishing System', W/2, H-22);
}

function drawRodOnCtx(ctx, rod, rarityData) {
  const W = 400, H = 220;
  const C = RARITY_COLORS[rod.rarity] || RARITY_COLORS.COMMON;
  const emoji = ROD_EMOJI[rod.rarity] || '🎣';

  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.shadowColor = C.glow; ctx.shadowBlur = 20;
  ctx.strokeStyle = C.border; ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, W-20, H-20, 16); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = C.card; roundRect(ctx, 12, 12, W-24, H-24, 14); ctx.fill();
  ctx.fillStyle = C.border; roundRect(ctx, 24, 24, 110, 26, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${rarityData.emoji} ${rarityData.name}`, 79, 41);
  ctx.font = '72px serif'; ctx.textAlign = 'left'; ctx.fillText(emoji, 24, 140);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(rod.name, 120, 65);
  ctx.fillStyle = '#b5bac1'; ctx.font = '13px sans-serif';
  ctx.fillText(`ID: ${rod.id}`, 120, 84);
  ctx.fillText(`🎯 Luck: +${rod.luck}`, 120, 106);
  ctx.fillText(`⚖️ Weight: +${rod.weight}`, 120, 128);
  ctx.fillText(`✨ ${rod.price.toLocaleString()} Lumens`, 120, 150);
  ctx.fillStyle = C.border+'33'; roundRect(ctx, 12, H-42, W-24, 30, 8); ctx.fill();
  ctx.fillStyle = C.border; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Luminate Fishing System', W/2, H-22);
}

function drawBaitOnCtx(ctx, bait, rarityData) {
  const W = 400, H = 220;
  const C = RARITY_COLORS[bait.rarity] || RARITY_COLORS.COMMON;
  const emoji = BAIT_EMOJI[bait.rarity] || '🪱';

  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.shadowColor = C.glow; ctx.shadowBlur = 20;
  ctx.strokeStyle = C.border; ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, W-20, H-20, 16); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = C.card; roundRect(ctx, 12, 12, W-24, H-24, 14); ctx.fill();
  ctx.fillStyle = C.border; roundRect(ctx, 24, 24, 110, 26, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${rarityData.emoji} ${rarityData.name}`, 79, 41);
  ctx.font = '72px serif'; ctx.textAlign = 'left'; ctx.fillText(emoji, 24, 140);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(bait.name, 120, 65);
  ctx.fillStyle = '#b5bac1'; ctx.font = '13px sans-serif';
  ctx.fillText(`ID: ${bait.id}`, 120, 84);
  ctx.fillText(`🎯 Luck: +${bait.luck}`, 120, 106);
  ctx.fillText(`⚖️ Weight: +${bait.weight}`, 120, 128);
  ctx.fillText(`✨ ${bait.price.toLocaleString()} Lumens (x${bait.qty})`, 120, 150);
  ctx.fillStyle = C.border+'33'; roundRect(ctx, 12, H-42, W-24, 30, 8); ctx.fill();
  ctx.fillStyle = C.border; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Luminate Fishing System', W/2, H-22);
}

module.exports = {
  generateFishCard,
  generateRodCard,
  generateBaitCard,
  drawFishOnCtx,
  drawRodOnCtx,
  drawBaitOnCtx,
};