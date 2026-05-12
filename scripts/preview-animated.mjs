// scripts/preview-animated.mjs
// Animated color-wave POC for the gold tomato mascot
// Shows mascot at each real terminal size with sweeping shimmer

import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

// --- pixel art generator (same as preview-mascot.mjs) ---

function generateTomato(cols, rows) {
  const w = cols * 2;
  const h = rows * 4;
  const grid = Array.from({ length: h }, () => new Array(w).fill(0));

  const stemH = Math.max(2, Math.round(h * 0.15));
  const stemW = Math.max(2, Math.round(w * 0.18));
  const stemX = Math.floor((w - stemW) / 2);

  for (let y = 0; y < stemH; y++)
    for (let x = stemX; x < stemX + stemW; x++)
      grid[y][x] = 1;

  if (w >= 10) {
    const leafY = stemH - 1;
    grid[leafY][Math.max(0, stemX - 2)] = 2;
    grid[leafY][Math.max(0, stemX - 1)] = 2;
    grid[leafY][Math.min(w - 1, stemX + stemW)]     = 2;
    grid[leafY][Math.min(w - 1, stemX + stemW + 1)] = 2;
  }

  const cx = (w - 1) / 2.0;
  const bodyTop = stemH;
  const bodySpan = h - stemH;
  const cy = bodyTop + bodySpan * 0.50;
  const rx = (w - 1) / 2.0 * 0.95;
  const ry = bodySpan * 0.53;
  const isTiny = w < 10;

  for (let y = bodyTop; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1.0) continue;
      if (isTiny) {
        if (nx < -0.3 && ny < -0.2)      grid[y][x] = 3;
        else if (nx > 0.4 || ny > 0.45)  grid[y][x] = 5;
        else                              grid[y][x] = 4;
      } else {
        if (nx < -0.38 && ny < -0.28)    grid[y][x] = 3;
        else if (nx > 0.55 || ny > 0.58) grid[y][x] = 6;
        else if (nx > 0.28 || ny > 0.30) grid[y][x] = 5;
        else                             grid[y][x] = 4;
      }
    }
  }
  return grid;
}

const PALETTE = {
  0: null,
  1: '#2E7D32',  // stem
  2: '#A5D6A7',  // leaf
  3: '#FFF9C4',  // highlight
  4: '#FFD54F',  // body
  5: '#FF8F00',  // shadow
  6: '#BF360C',  // dark edge
};

// Build pixel-art SVG using terminal-accurate dot dimensions
function mascotSVG(cols, rows, dotPx, offX, offY) {
  const grid = generateTomato(cols, rows);
  const parts = [];
  const w = cols * 2, h = rows * 4;
  const dotW = dotPx;
  const dotH = Math.round(dotPx * DOT_ASPECT * 10) / 10; // shorter than wide, like real terminal
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++) {
      const c = PALETTE[grid[py][px]];
      if (!c) continue;
      parts.push(`<rect x="${offX + px * dotW}" y="${offY + py * dotH}" width="${dotW}" height="${dotH}" fill="${c}"/>`);
    }
  return parts.join('');
}

// --- terminal sizes from VRT: [display px W, display px H, terminal cols, terminal rows] ---
// char size ≈ 10×17px  (from VRT screenshots)
const CHAR_W_PX = 10;
const CHAR_H_PX = 17;
// Dot aspect in terminal: each braille dot is (charW/2) × (charH/4)
const DOT_ASPECT = (CHAR_H_PX / 4) / (CHAR_W_PX / 2); // ≈ 0.85 (dots are slightly shorter than wide)

const SIZES = [
  // cols × rows chosen so cols × charW ≈ rows × charH  → visually round
  { label: 'large  80×24',  termCols: 80, termRows: 24, mascotCols: 20, mascotRows: 12 },
  { label: 'small  44×8',   termCols: 44, termRows:  8, mascotCols:  7, mascotRows:  4 },
  { label: 'ultra  24×5',   termCols: 24, termRows:  5, mascotCols:  5, mascotRows:  3 },
  { label: 'tiny   16×3',   termCols: 16, termRows:  3, mascotCols:  3, mascotRows:  2 },
];

// Theme background (modern-work base color, matches VRT)
const THEME_BG   = '#fce9f1';
const LABEL_FG   = '#c96f97';

// Choose dot pixel size so mascot fits comfortably in the terminal area
function dotPxForMascot(termW, termH, mascotCols, mascotRows) {
  const maxW = termW * 0.75;
  const maxH = termH * 0.75;
  const dotByW = Math.floor(maxW / (mascotCols * 2));
  const dotByH = Math.floor(maxH / (mascotRows * 4 * DOT_ASPECT));
  return Math.max(1, Math.min(dotByW, dotByH));
}

// --- build full HTML ---
const GAP      = 32;
const LABEL_H  = 22;
const ROW_PAD  = 20;

let totalH = GAP;
const rows = [];
for (const sz of SIZES) {
  const termW = sz.termCols * CHAR_W_PX;
  const termH = sz.termRows * CHAR_H_PX;
  rows.push({ ...sz, termW, termH, y: totalH });
  totalH += LABEL_H + termH + GAP;
}
const totalW = Math.max(...rows.map(r => r.termW)) + GAP * 2;

// Re-center each terminal horizontally
for (const r of rows) r.termX = (totalW - r.termW) / 2;

const css = `
body { margin: 0; background: #0f0f1a; font-family: monospace; }

/* wave overlay — sweeps left-to-right, uses mix-blend-mode screen */
.wave {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent        20%,
    rgba(255,252,180,.18) 38%,
    rgba(255,230, 80,.60) 50%,
    rgba(255,252,180,.18) 62%,
    transparent        80%
  );
  mix-blend-mode: screen;
  animation: sweep 1.5s cubic-bezier(.45,0,.55,1) infinite;
  pointer-events: none;
}

@keyframes sweep {
  0%   { transform: translateX(-130%); }
  100% { transform: translateX(230%); }
}

.terminal {
  position: relative;
  display: inline-block;
  overflow: hidden;
}
.terminal svg { display: block; }
`;

let svgContent = '';
let htmlElements = '';

for (const r of rows) {
  const { termX, y: termY, termW, termH, label, mascotCols, mascotRows } = r;
  const dotPx = dotPxForMascot(termW, termH, mascotCols, mascotRows);
  const artW  = mascotCols * 2 * dotPx;
  const artH  = mascotRows * 4 * dotPx * DOT_ASPECT;
  const artX  = Math.round((termW - artW) / 2);
  const artY  = Math.round((termH - artH) / 2);

  htmlElements += `
  <div style="text-align:center; margin-bottom:6px;">
    <span style="color:${LABEL_FG}; font-size:12px;">${label}</span>
  </div>
  <div style="text-align:center; margin-bottom:${GAP}px;">
    <div class="terminal" style="width:${termW}px; height:${termH}px;">
      <svg width="${termW}" height="${termH}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${THEME_BG}"/>
        ${mascotSVG(mascotCols, mascotRows, dotPx, artX, artY)}
      </svg>
      <div class="wave"></div>
    </div>
  </div>`;
}

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
<body>
<div style="padding:${GAP}px;">
${htmlElements}
</div>
</body>
</html>`;

writeFileSync('/tmp/mascot-animated.html', html);
console.log('open /tmp/mascot-animated.html');

// Also produce a static 5-frame filmstrip via Playwright
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: totalW, height: totalH + GAP * 2 });
await page.setContent(html);

// Pause animation, jump to 5 evenly-spaced moments in the 1.5s cycle
const FRAMES = 5;
const strips = [];
for (let i = 0; i < FRAMES; i++) {
  const t = (i / (FRAMES - 1)) * 1500;
  await page.evaluate((ms) => {
    document.getAnimations().forEach(a => {
      a.pause();
      a.currentTime = ms;
    });
  }, t);
  const buf = await page.screenshot({ type: 'png' });
  strips.push(buf);
}
await browser.close();

// Stack frames side by side using sharp (or just save them individually)
for (let i = 0; i < FRAMES; i++) {
  writeFileSync(`/tmp/mascot-frame-${i}.png`, strips[i]);
}
console.log('frames saved → /tmp/mascot-frame-0.png … mascot-frame-4.png');
