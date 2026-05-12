// scripts/preview-mascot.mjs
// Generates a PNG preview of 10 gold tomato mascot variants
// Each pixel = 1 braille dot (2 dots per terminal col, 4 dots per terminal row)

import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const PALETTE = {
  0: null,        // transparent
  1: '#2E7D32',   // dark green – stem
  2: '#A5D6A7',   // light green – leaf nubs
  3: '#FFF9C4',   // bright highlight
  4: '#FFD54F',   // gold body
  5: '#FF8F00',   // deep amber shadow
  6: '#BF360C',   // dark edge
};

const BG = '#0f0f1a';
const GRID_LINE = '#1a1a3a';

/**
 * Generate a gold tomato as a 2D pixel array (braille-dot resolution).
 * w = cols*2, h = rows*4
 */
function generateTomato(cols, rows) {
  const w = cols * 2;
  const h = rows * 4;
  const grid = Array.from({ length: h }, () => new Array(w).fill(0));

  const stemH = Math.max(2, Math.round(h * 0.15));
  const stemW = Math.max(2, Math.round(w * 0.18));
  const stemX = Math.floor((w - stemW) / 2);

  // Stem
  for (let y = 0; y < stemH; y++)
    for (let x = stemX; x < stemX + stemW; x++)
      grid[y][x] = 1;

  // Leaf nubs (only if wide enough)
  if (w >= 10) {
    const leafY = stemH - 1;
    grid[leafY][Math.max(0, stemX - 2)] = 2;
    grid[leafY][Math.max(0, stemX - 1)] = 2;
    grid[leafY][Math.min(w - 1, stemX + stemW)]     = 2;
    grid[leafY][Math.min(w - 1, stemX + stemW + 1)] = 2;
  }

  // Body: filled ellipse with highlight/shadow shading
  const cx = (w - 1) / 2.0;
  const bodyTop = stemH;
  const bodySpan = h - stemH;
  const cy = bodyTop + bodySpan * 0.50;
  const rx = (w - 1) / 2.0 * 0.95;
  const ry = bodySpan * 0.46;

  for (let y = bodyTop; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1.0) continue;

      if (nx < -0.38 && ny < -0.28)
        grid[y][x] = 3;                      // highlight
      else if (nx > 0.55 || ny > 0.58)
        grid[y][x] = 6;                      // dark edge
      else if (nx > 0.28 || ny > 0.30)
        grid[y][x] = 5;                      // shadow
      else
        grid[y][x] = 4;                      // main gold body
    }
  }

  return grid;
}

// 10 variants – [terminal cols, terminal rows]
// Wider than tall to look round in terminal (chars are ~2× taller than wide)
const VARIANTS = [
  [3, 2],   //  1 – 6×8 dots
  [4, 2],   //  2 – 8×8 dots
  [5, 3],   //  3 – 10×12 dots
  [6, 3],   //  4 – 12×12 dots
  [6, 4],   //  5 – 12×16 dots
  [7, 4],   //  6 – 14×16 dots
  [8, 4],   //  7 – 16×16 dots
  [8, 5],   //  8 – 16×20 dots
  [10, 5],  //  9 – 20×20 dots
  [12, 6],  // 10 – 24×24 dots
];

const DOT_PX   = 5;     // preview pixels per braille dot
const CHAR_W   = DOT_PX * 2;   // 10px per terminal col
const CHAR_H   = DOT_PX * 4;   // 20px per terminal row
const PAD      = 24;
const LABEL_H  = 18;
const COLS     = 5;

const maxCharCols = Math.max(...VARIANTS.map(v => v[0]));
const maxCharRows = Math.max(...VARIANTS.map(v => v[1]));
const cellW = maxCharCols * CHAR_W + PAD;
const cellH = maxCharRows * CHAR_H + LABEL_H + PAD;
const totalW = COLS * cellW + PAD;
const totalH = 2    * cellH + PAD;

function buildSVG() {
  const parts = [];
  parts.push(`<rect width="100%" height="100%" fill="${BG}"/>`);

  VARIANTS.forEach(([cols, rows], i) => {
    const grid = generateTomato(cols, rows);
    const w = cols * 2;
    const h = rows * 4;

    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const areaX = PAD / 2 + col * cellW;
    const areaY = PAD / 2 + row * cellH;

    const artW = w * DOT_PX;
    const artH = h * DOT_PX;
    const artX = areaX + (cellW - artW) / 2;
    const artY = areaY + LABEL_H + (cellH - LABEL_H - artH) / 2;

    // Label
    parts.push(`<text x="${areaX + cellW / 2}" y="${areaY + 13}" text-anchor="middle" fill="#666" font-size="11" font-family="monospace">${i + 1}  ${cols}×${rows} chars</text>`);

    // Terminal-char grid overlay
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++)
        parts.push(`<rect x="${artX + cx * CHAR_W}" y="${artY + cy * CHAR_H}" width="${CHAR_W}" height="${CHAR_H}" fill="none" stroke="${GRID_LINE}" stroke-width="0.5"/>`);

    // Pixels
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        const c = PALETTE[grid[py][px]];
        if (!c) continue;
        parts.push(`<rect x="${artX + px * DOT_PX}" y="${artY + py * DOT_PX}" width="${DOT_PX}" height="${DOT_PX}" fill="${c}"/>`);
      }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">${parts.join('')}</svg>`;
}

const html = `<!DOCTYPE html><html><body style="margin:0;background:${BG}">${buildSVG()}</body></html>`;
writeFileSync('/tmp/mascot-preview.html', html);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: totalW, height: totalH });
await page.goto('file:///tmp/mascot-preview.html');
await page.screenshot({ path: '/tmp/mascot-preview.png' });
await browser.close();

console.log('done');
