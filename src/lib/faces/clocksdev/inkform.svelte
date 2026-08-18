<script>
  let { time } = $props();

  let canvas;
  let side = $state(0);

  const TAU = Math.PI * 2;

  function hashD(a, b) {
    const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return h - Math.floor(h);
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const a = hashD(xi, yi), b = hashD(xi + 1, yi);
    const c = hashD(xi, yi + 1), d = hashD(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  function paint(ctx, dots, rMin) {
    dots.sort((p, q) => p.z - q.z);
    for (const d of dots) {
      const alpha = d.a === undefined ? 1 : d.a;
      if (alpha < 0.02) continue;
      const w = Math.min(1, Math.max(0, d.white));
      const g = Math.round((1 - w) * 255);
      ctx.fillStyle = `rgba(${g},${g},${g},${alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(rMin, d.r), 0, TAU);
      ctx.fill();
    }
  }

  const FONT = {
    '0': ['01110','10001','10011','10101','11001','10001','01110'],
    '1': ['00100','01100','00100','00100','00100','00100','01110'],
    '2': ['01110','10001','00001','00010','00100','01000','11111'],
    '4': ['00010','00110','01010','10010','11111','00010','00010'],
    '6': ['00110','01000','10000','11110','10001','10001','01110'],
    '8': ['01110','10001','10001','01110','10001','10001','01110'],
  };
  const ADVANCE = 4.5;
  function numeralDots(dots, str, cx, cy, pitch, k) {
    const cols = (str.length - 1) * ADVANCE + 5;
    const x0 = cx - (cols - 1) * pitch / 2;
    const y0 = cy - 3 * pitch;
    let cursor = 0;
    for (const ch of str) {
      const rows = FONT[ch];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (rows[r][c] === '1') {
            dots.push({
              x: x0 + (cursor + c) * pitch,
              y: y0 + r * pitch,
              z: 1, r: 1.0 * k, white: 0.34, a: 0.85,
            });
          }
        }
      }
      cursor += ADVANCE;
    }
  }

  function handDots(dots, cx, cy, ang, len, rt, k, z) {
    const pitch = Math.max(3, 7 * k);
    const n = Math.max(2, Math.round(len / pitch));
    for (let j = 1; j <= n; j++) {
      const fr = j / n;
      const rr = len * fr;
      const wave = Math.sin(rt * 0.9 - fr * 2.2) * 0.5 * k;
      dots.push({
        x: cx + Math.cos(ang) * rr - Math.sin(ang) * wave,
        y: cy + Math.sin(ang) * rr + Math.cos(ang) * wave,
        z, r: 1.1 * k, white: 0.06, a: 1,
      });
    }
  }

  function draw(ctx, size) {
    const rt = time.timestamp / 1000;
    const cx = size / 2, cy = size / 2;
    const R = (size / 2) * 0.88;
    const k = size / 340;

    const pHalfDay = ((time.hour % 12) + time.progress.hour) / 12;
    const pHour = time.progress.hour;

    const breath = 1 + 0.004 * Math.sin(rt * 0.5);
    const dots = [];

    const head = time.second + time.progress.second;
    for (let i = 0; i < 60; i++) {
      const a = -Math.PI / 2 + (i / 60) * TAU;
      const major = i % 5 === 0;
      let d = (head - i + 60) % 60;
      if (d > 30) d -= 60;
      const lit = d >= 0
        ? Math.exp(-d / 3.2)
        : Math.exp(-(d * d) / 0.55);
      const nz = (vnoise(Math.cos(a) * 2.1 + rt * 0.10, Math.sin(a) * 2.1) - 0.5) * 1.2 * k;
      dots.push({
        x: cx + Math.cos(a) * (R * breath + nz),
        y: cy + Math.sin(a) * (R * breath + nz),
        z: 1 + lit,
        r: (major ? 2.3 * (1 + 0.35 * lit) : 1.0 + 1.3 * lit) * k,
        white: (major ? 0.20 : 0.60) - (major ? 0.14 : 0.50) * lit,
        a: (major ? 0.9 : 0.55) + 0.4 * lit,
      });
    }

    for (let i = 0; i < 12; i += 2) {
      const a = -Math.PI / 2 + (i / 12) * TAU;
      const rr = R * 0.78;
      numeralDots(dots, i === 0 ? '12' : String(i), cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, size * 0.012, k);
    }

    const hourA = -Math.PI / 2 + pHalfDay * TAU;
    const minA  = -Math.PI / 2 + pHour * TAU;
    handDots(dots, cx, cy, hourA, R * 0.55, rt, k, 3);
    handDots(dots, cx, cy, minA,  R * 0.78, rt, k, 4);

    dots.push({ x: cx, y: cy, z: 6, r: 2.0 * k, white: 0.04, a: 1 });

    paint(ctx, dots, 0.3);
  }

  $effect(() => {
    const stamp = time.timestamp;
    if (!canvas || !side) return;
    const px = Math.round(side * 2);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, side, side);
    draw(ctx, side);
  });
</script>

<div class="clock">
  <div class="square" bind:clientWidth={side}>
    <canvas bind:this={canvas} style="width:{side}px;height:{side}px" aria-label="{time.hh}:{time.mm}"></canvas>
  </div>
</div>

<style>
  .clock {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: #000;
  }
  .square {
    width: min(94%, 94vmin);
    aspect-ratio: 1;
  }
</style>