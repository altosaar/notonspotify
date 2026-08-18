<script>
  let { time } = $props();

  // 4x7 glyph font. Digits are 4 wide, colon is 1 wide. Zero is a clean oval (no slash).
  const FONT = {
    '0': ['0110','1001','1001','1001','1001','1001','0110'],
    '1': ['0010','0110','0010','0010','0010','0010','0111'],
    '2': ['0110','1001','0001','0010','0100','1000','1111'],
    '3': ['1111','0010','0110','0001','0001','1001','0110'],
    '4': ['0010','0110','1010','1111','0010','0010','0010'],
    '5': ['1111','1000','1110','0001','0001','1001','0110'],
    '6': ['0110','1000','1000','1110','1001','1001','0110'],
    '7': ['1111','0001','0010','0010','0100','0100','0100'],
    '8': ['0110','1001','1001','0110','1001','1001','0110'],
    '9': ['0110','1001','1001','0111','0001','0001','0110'],
    ':': ['0','0','1','0','1','0','0'],
  };

  const COLS = 40;
  const ROWS = 7;
  const GAP = 1; // blank columns between glyphs

  const pad = (n) => String(n ?? 0).padStart(2, '0');

  // Rebuild the 7x40 matrix whenever `time` changes.
  const matrix = $derived.by(() => {
    const hh = pad(time?.hh);
    const mm = pad(time?.mm);
    const glyphs = [hh[0], hh[1], ':', mm[0], mm[1]].map((c) => FONT[c] ?? FONT['0']);

    const width =
      glyphs.reduce((w, g) => w + g[0].length, 0) + GAP * (glyphs.length - 1);
    const left = Math.max(0, Math.floor((COLS - width) / 2));

    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    let x = left;
    for (const g of glyphs) {
      const gw = g[0].length;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < gw; c++) {
          if (g[r][c] === '1' && x + c < COLS) grid[r][x + c] = 1;
        }
      }
      x += gw + GAP;
    }

    // flatten to {x, y, on} dots for the SVG
    const dots = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        dots.push({ x: c + 0.5, y: r + 0.5, on: grid[r][c] === 1 });
      }
    }
    return dots;
  });
</script>

<div class="clock">
  <svg class="matrix" viewBox="0 0 {COLS} {ROWS}" preserveAspectRatio="xMidYMid meet">
    {#each matrix as d}
      <circle cx={d.x} cy={d.y} r="0.42" class="px" class:on={d.on} />
    {/each}
  </svg>
</div>

<style>
  .clock {
    display: grid;
    place-content: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: 32px;
  }
  .matrix {
    width: clamp(240px, 82vw, 720px);
    height: auto;
  }
  .px {
    fill: rgba(255, 255, 255, 0.05); /* unlit dot — shows the grid */
  }
  .px.on {
    fill: #ff8a1e;
    filter: drop-shadow(0 0 0.35px rgba(255, 138, 30, 0.9));
  }
</style>