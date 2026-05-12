import { generateTomato, toBrailleLines, getMascotArt } from '../mascot';

describe('generateTomato', () => {
  it('returns a grid with correct pixel dimensions', () => {
    const grid = generateTomato(7, 4);
    expect(grid.length).toBe(16); // rows * 4
    expect(grid[0]?.length).toBe(14); // cols * 2
  });

  it('has non-zero (visible) pixels in the body', () => {
    const grid = generateTomato(7, 4);
    const nonZero = grid.flat().filter((v) => v > 0);
    expect(nonZero.length).toBeGreaterThan(0);
  });

  it('has stem pixels in the top rows (zone 1)', () => {
    const grid = generateTomato(7, 4);
    const stemPixels = grid[0]?.filter((v) => v === 1) ?? [];
    expect(stemPixels.length).toBeGreaterThan(0);
  });

  it('has body-gold pixels (zone 4) in the middle', () => {
    const grid = generateTomato(7, 4);
    const bodyPixels = grid.flat().filter((v) => v === 4);
    expect(bodyPixels.length).toBeGreaterThan(0);
  });

  it('uses simplified shading (no zone 6) for tiny grids (w < 10)', () => {
    const grid = generateTomato(3, 2); // w=6 → tiny
    const darkEdge = grid.flat().filter((v) => v === 6);
    expect(darkEdge.length).toBe(0);
  });

  it('uses full shading (zone 6) for larger grids', () => {
    const grid = generateTomato(7, 4); // w=14 → not tiny
    const darkEdge = grid.flat().filter((v) => v === 6);
    expect(darkEdge.length).toBeGreaterThan(0);
  });

  it('works for all four standard mascot sizes', () => {
    const cases = [
      { cols: 20, rows: 12 },
      { cols: 7, rows: 4 },
      { cols: 5, rows: 3 },
      { cols: 3, rows: 2 }
    ];
    for (const { cols, rows } of cases) {
      const grid = generateTomato(cols, rows);
      expect(grid.length).toBe(rows * 4);
      expect(grid[0]?.length).toBe(cols * 2);
    }
  });
});

describe('toBrailleLines', () => {
  it('returns the correct number of char-row lines', () => {
    const grid = generateTomato(7, 4); // charRows = 4
    const lines = toBrailleLines(grid, 0.5);
    expect(lines.length).toBe(4);
  });

  it('contains braille Unicode characters (U+2800–U+28FF)', () => {
    const grid = generateTomato(7, 4);
    const lines = toBrailleLines(grid, 0.5);
    const allText = lines.join('');
    const hasBraille = [...allText].some(
      (ch) => ch.charCodeAt(0) >= 0x2800 && ch.charCodeAt(0) <= 0x28ff
    );
    expect(hasBraille).toBe(true);
  });

  it('contains blessed fg colour tags', () => {
    const grid = generateTomato(7, 4);
    const lines = toBrailleLines(grid, 0.5);
    const allText = lines.join('');
    expect(allText).toMatch(/\{#[0-9A-Fa-f]{6}-fg\}/);
  });

  it('emits bright colours near the wave front', () => {
    const grid = generateTomato(7, 4);
    // Wave is exactly at the left edge (cx=0, xFrac=0)
    const linesWave = toBrailleLines(grid, 0);
    const linesNoWave = toBrailleLines(grid, 2); // wave off-screen
    // Bright variant contains #FFEE58 (body bright), no-wave uses #FFD54F (body normal)
    expect(linesWave.join('')).toMatch(/#FFEE58/);
    expect(linesNoWave.join('')).not.toMatch(/#FFEE58/);
  });
});

describe('getMascotArt', () => {
  it('returns null when terminal is too small', () => {
    expect(getMascotArt(10, 3, 0.5)).toBeNull();
    expect(getMascotArt(16, 2, 0.5)).toBeNull();
    expect(getMascotArt(0, 0, 0.5)).toBeNull();
  });

  it('returns tiny art for the 16×3 threshold', () => {
    const art = getMascotArt(16, 3, 0.5);
    expect(art).not.toBeNull();
    if (!art) {
      return;
    }
    expect(art.charCols).toBe(3);
    expect(art.charRows).toBe(2);
  });

  it('returns ultra art for the 24×5 threshold', () => {
    const art = getMascotArt(24, 5, 0.5);
    expect(art).not.toBeNull();
    if (!art) {
      return;
    }
    expect(art.charCols).toBe(5);
    expect(art.charRows).toBe(3);
  });

  it('returns small art for the 44×8 threshold', () => {
    const art = getMascotArt(44, 8, 0.5);
    expect(art).not.toBeNull();
    if (!art) {
      return;
    }
    expect(art.charCols).toBe(7);
    expect(art.charRows).toBe(4);
  });

  it('returns large art for the 80×24 threshold', () => {
    const art = getMascotArt(80, 24, 0.5);
    expect(art).not.toBeNull();
    if (!art) {
      return;
    }
    expect(art.charCols).toBe(20);
    expect(art.charRows).toBe(12);
  });

  it('returns lines array with length equal to charRows', () => {
    const art = getMascotArt(80, 24, 0.5);
    expect(art).not.toBeNull();
    if (!art) {
      return;
    }
    expect(art.lines.length).toBe(art.charRows);
  });

  it('picks the largest size that fits (not just exact match)', () => {
    // 100×30 > 80×24 threshold → should still get large art
    const art = getMascotArt(100, 30, 0.5);
    expect(art).not.toBeNull();
    if (!art) {
      return;
    }
    expect(art.charCols).toBe(20);
    expect(art.charRows).toBe(12);
  });

  it('falls back to a smaller size when terminal is between thresholds', () => {
    // 30×6 fits 24×5 (ultra) but not 44×8 (small)
    const art = getMascotArt(30, 6, 0.5);
    expect(art).not.toBeNull();
    if (!art) {
      return;
    }
    expect(art.charCols).toBe(5);
    expect(art.charRows).toBe(3);
  });
});
