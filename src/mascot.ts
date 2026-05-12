// Color zones used in the pixel grid:
// 0=empty  1=stem(dark-green)  2=leaf(light-green)  3=highlight  4=body-gold  5=shadow-amber  6=dark-edge
const ZONE_NORMAL = ['', '#2E7D32', '#A5D6A7', '#FFF9C4', '#FFD54F', '#FF8F00', '#BF360C'];
const ZONE_BRIGHT = ['', '#4CAF50', '#C8E6C9', '#FFFFFF', '#FFEE58', '#FFB300', '#E64A19'];

// Braille dot layout inside one 2×4 char cell:
//   dot1  dot4      bit 0   bit 3
//   dot2  dot5  →   bit 1   bit 4
//   dot3  dot6      bit 2   bit 5
//   dot7  dot8      bit 6   bit 7
// Each entry: [dx, dy, bitIndex]
const BRAILLE_DOTS: [number, number, number][] = [
  [0, 0, 0],
  [0, 1, 1],
  [0, 2, 2],
  [1, 0, 3],
  [1, 1, 4],
  [1, 2, 5],
  [0, 3, 6],
  [1, 3, 7]
];

// Terminal size thresholds → mascot char dimensions (cols × rows).
// Listed largest-first; first match wins.
const SIZES = [
  { termCols: 80, termRows: 24, mascotCols: 20, mascotRows: 12 },
  { termCols: 44, termRows: 8, mascotCols: 7, mascotRows: 4 },
  { termCols: 24, termRows: 5, mascotCols: 5, mascotRows: 3 },
  { termCols: 16, termRows: 3, mascotCols: 3, mascotRows: 2 }
] as const;

export type MascotArt = {
  lines: string[]; // blessed-tagged strings, one per char row
  charCols: number;
  charRows: number;
};

/**
 * Generates the pixel grid for the gold tomato mascot.
 * Returns a (rows*4) × (cols*2) matrix of zone indices (0–6).
 */
export function generateTomato(cols: number, rows: number): number[][] {
  const w = cols * 2;
  const h = rows * 4;
  const grid: number[][] = Array.from({ length: h }, () => new Array<number>(w).fill(0));

  // Stem
  const stemW = Math.max(2, Math.round(w * 0.18));
  const stemH = Math.max(1, Math.round(h * 0.12));
  const stemX = Math.floor((w - stemW) / 2);
  for (let y = 0; y < stemH; y++) {
    for (let x = stemX; x < stemX + stemW; x++) {
      grid[y][x] = 1;
    }
  }

  // Leaf nubs — only when wide enough to show them
  if (w >= 10) {
    const leafY = stemH;
    if (stemX - 1 >= 0) {
      grid[leafY][stemX - 1] = 2;
    }
    if (stemX + stemW < w) {
      grid[leafY][stemX + stemW] = 2;
    }
  }

  // Body ellipse
  const cx = (w - 1) / 2;
  const bodyTop = stemH;
  const bodySpan = h - stemH;
  const cy = bodyTop + bodySpan * 0.5;
  const rx = ((w - 1) / 2) * 0.95;
  const ry = bodySpan * 0.53;
  const isTiny = w < 10;

  for (let y = bodyTop; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1.0) {
        continue;
      }

      if (isTiny) {
        // Simpler shading at tiny size keeps the circular silhouette clean
        if (nx < -0.3 && ny < -0.2) {
          grid[y][x] = 3;
        } else if (nx > 0.4 || ny > 0.45) {
          grid[y][x] = 5;
        } else {
          grid[y][x] = 4;
        }
      } else {
        if (nx < -0.38 && ny < -0.28) {
          grid[y][x] = 3;
        } else if (nx > 0.55 || ny > 0.58) {
          grid[y][x] = 6;
        } else if (nx > 0.28 || ny > 0.3) {
          grid[y][x] = 5;
        } else {
          grid[y][x] = 4;
        }
      }
    }
  }

  return grid;
}

/**
 * Converts a pixel grid to an array of blessed-tagged braille strings.
 * `waveOffset` (0.0–1.0) is the normalised horizontal position of the
 * colour-wave front; cells near it get the bright colour variant.
 */
export function toBrailleLines(grid: number[][], waveOffset: number): string[] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const charCols = Math.ceil(w / 2);
  const charRows = Math.ceil(h / 4);
  const lines: string[] = [];

  for (let cy = 0; cy < charRows; cy++) {
    let line = '';
    for (let cx = 0; cx < charCols; cx++) {
      let bits = 0;
      const zoneCounts = new Array<number>(7).fill(0);

      for (const [dx, dy, bit] of BRAILLE_DOTS) {
        const px = cx * 2 + dx;
        const py = cy * 4 + dy;
        const zone = py < h && px < w ? (grid[py][px] ?? 0) : 0;
        if (zone > 0) {
          bits |= 1 << bit;
          zoneCounts[zone]++;
        }
      }

      if (bits === 0) {
        line += ' ';
        continue;
      }

      // Use the zone with the highest dot count in this cell
      let dominantZone = 1;
      let maxCount = 0;
      for (let z = 1; z <= 6; z++) {
        if (zoneCounts[z] > maxCount) {
          maxCount = zoneCounts[z];
          dominantZone = z;
        }
      }

      // Wave: light up cells near the wave front
      const xFrac = charCols <= 1 ? 0.5 : cx / (charCols - 1);
      const lit = Math.abs(xFrac - waveOffset) < 0.15;
      const color = (lit ? ZONE_BRIGHT : ZONE_NORMAL)[dominantZone];

      line += `{${color}-fg}${String.fromCharCode(0x2800 + bits)}`;
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Returns the mascot art for the given terminal size, or `null` when the
 * terminal is too small to display anything meaningful.
 */
export function getMascotArt(
  termCols: number,
  termRows: number,
  waveOffset: number
): MascotArt | null {
  const size = SIZES.find((s) => termCols >= s.termCols && termRows >= s.termRows);
  if (!size) {
    return null;
  }

  const grid = generateTomato(size.mascotCols, size.mascotRows);
  const lines = toBrailleLines(grid, waveOffset);
  return { lines, charCols: size.mascotCols, charRows: size.mascotRows };
}
