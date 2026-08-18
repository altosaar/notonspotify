<script>
  let { time } = $props();

  const hash = (n) => {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // 5x7 dot-matrix font -------------------------------------------------
  const FONT = {
    '0': ['01110','10001','10011','10101','11001','10001','01110'],
    '1': ['00100','01100','00100','00100','00100','00100','01110'],
    '2': ['01110','10001','00001','00110','01000','10000','11111'],
    '3': ['11110','00001','00001','01110','00001','00001','11110'],
    '4': ['00010','00110','01010','10010','11111','00010','00010'],
    '5': ['11111','10000','11110','00001','00001','10001','01110'],
    '6': ['00110','01000','10000','11110','10001','10001','01110'],
    '7': ['11111','00001','00010','00100','01000','01000','01000'],
    '8': ['01110','10001','10001','01110','10001','10001','01110'],
    '9': ['01110','10001','10001','01111','00001','00010','01100'],
  };

  // one blob per lit cell -> an ordered point list per glyph ------------
  const CELLPTS = {};
  for (const ch in FONT) {
    const g = FONT[ch], pts = [];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (g[r][c] === '1') pts.push({ x: c, y: r });
    CELLPTS[ch] = pts;
  }
  const MAXPTS = Math.max(...Object.values(CELLPTS).map((a) => a.length));
  const COLONPTS = [{ x: 0, y: 2 }, { x: 0, y: 4 }];

  // layout --------------------------------------------------------------
  const SEQ = ['digit','digit','colon','digit','digit','colon','digit','digit'];
  const DW = 5, GAP = 1.8, PAD = 1.3;
  const slotX = [];
  let cur = PAD, maxX = 0;
  for (let slot = 0; slot < SEQ.length; slot++) {
    slotX[slot] = cur;
    if (SEQ[slot] === 'digit') { maxX = cur + DW - 1; cur += DW + GAP; }
    else { maxX = cur; cur += 1 + GAP; }
  }
  const viewW = maxX + PAD;
  const viewH = PAD * 2 + 6;

  // static blob pool per slot; blob i flies to point i of the current glyph
  const blobs = [];
  let gi = 0;
  for (let slot = 0; slot < SEQ.length; slot++) {
    const isColon = SEQ[slot] === 'colon';
    const pool = isColon ? COLONPTS.length : MAXPTS;
    for (let i = 0; i < pool; i++) {
      const s = gi++;
      blobs.push({
        slot, i, seed: s, type: isColon ? 'colon' : 'digit',
        offx: (hash(s) * 2 - 1) * 0.12,
        offy: (hash(s + 9) * 2 - 1) * 0.12,
        delay: Math.round(hash(s + 3) * 260),          // staggered morph
        bfreq: 0.62 + 0.18 * hash(s + 5),              // personal breath rate
        nx: (hash(s + 11) * 2 - 1) * 0.18,             // nucleus sits off-center
        ny: (hash(s + 13) * 2 - 1) * 0.18,
        hx: -0.24 + (hash(s + 17) * 2 - 1) * 0.08,     // specular highlight, upper-left
        hy: -0.22 + (hash(s + 19) * 2 - 1) * 0.08,
      });
    }
  }

  // reactive state -- pure functions of the time prop -------------------
  const pad2 = (v) => String(v ?? 0).padStart(2, '0');
  const chars = $derived.by(() => {
    const hh = pad2(time?.hh), mm = pad2(time?.mm), ss = pad2(time?.ss);
    return [hh[0], hh[1], ':', mm[0], mm[1], ':', ss[0], ss[1]];
  });
  const colonOn = $derived((Number(pad2(time?.ss)) % 2) === 0);
  const tsec = $derived.by(() =>
    Number(pad2(time?.hh)) * 3600 + Number(pad2(time?.mm)) * 60 + Number(pad2(time?.ss))
  );
  const hue = $derived.by(() => Math.round(150 + 60 * Math.sin((tsec / 86400) * Math.PI * 2)));

  // where a blob should be right now (target point + gentle drift)
  function target(b) {
    const ox = slotX[b.slot], t = tsec, s = b.seed;
    const dx = 0.09 * Math.sin(t * 0.6 + s * 1.7);
    const dy = 0.09 * Math.cos(t * 0.55 + s * 2.1);
    if (b.type === 'colon') {
      const p = COLONPTS[b.i];
      return { x: ox + p.x + b.offx + dx, y: PAD + p.y + b.offy + dy, on: true };
    }
    const pts = CELLPTS[chars[b.slot]];
    if (pts && b.i < pts.length) {
      const p = pts[b.i];
      return { x: ox + p.x + b.offx + dx, y: PAD + p.y + b.offy + dy, on: true };
    }
    const a = b.i * 2.399;
    return { x: ox + 2 + Math.cos(a) * 1.4 + dx, y: PAD + 3 + Math.sin(a) * 1.4 + dy, on: false };
  }

  // life: a slow breath (swell + contract) with subtle squish + tumble,
  // recomputed each tick from the time value and eased by the transition
  function life(b) {
    const t = tsec, s = b.seed;
    const breath = Math.sin(t * b.bfreq + s * 0.5);        // ~9-10s cycle, -1..1
    const squish = 0.05 * Math.sin(t * 0.95 + s * 1.7 + 1.7);
    const sx = 1 + 0.18 * breath + squish;
    const sy = 1 + 0.18 * breath - squish;
    const rot = 7 * Math.sin(t * 0.55 + s * 2.3);
    return {
      tf: `rotate(${rot}deg) scale(${sx}, ${sy})`,
      glow: 0.70 + 0.30 * breath,                          // brighter on the inhale
    };
  }
</script>

<div class="stage" style="--hue:{hue}">
  <svg class="dish" viewBox="0 0 {viewW} {viewH}" preserveAspectRatio="xMidYMid meet">
    <defs>
      <radialGradient id="memb" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="hsl(var(--hue,150) 92% 70%)" stop-opacity="0.74" />
        <stop offset="52%"  stop-color="hsl(var(--hue,150) 94% 56%)" stop-opacity="0.40" />
        <stop offset="100%" stop-color="hsl(var(--hue,150) 94% 48%)" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="nuc" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="hsl(calc(var(--hue,150) + 34) 100% 94%)" stop-opacity="1" />
        <stop offset="55%"  stop-color="hsl(var(--hue,150) 100% 76%)" stop-opacity="0.7" />
        <stop offset="100%" stop-color="hsl(var(--hue,150) 100% 62%)" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="spark" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="55%"  stop-color="hsl(calc(var(--hue,150) + 40) 100% 92%)" stop-opacity="0.5" />
        <stop offset="100%" stop-color="hsl(var(--hue,150) 100% 85%)" stop-opacity="0" />
      </radialGradient>
    </defs>

    {#each blobs as b (b.type + '-' + b.slot + '-' + b.i)}
      {@const t = target(b)}
      {@const L = life(b)}
      <g class="fly" style="transform: translate({t.x}px, {t.y}px); transition-delay:{b.delay}ms">
        <g
          class="blob {b.type}"
          class:off={!t.on}
          class:pulse={b.type === 'colon' && colonOn}>
          <g class="wob" style="transform:{L.tf}">
            <ellipse class="membrane" style="opacity:{L.glow}" rx="0.82" ry="0.72" />
            <circle class="nucleus" cx={b.nx} cy={b.ny} r="0.30" />
            <circle class="spark" cx={b.hx} cy={b.hy} r="0.13" style="opacity:{0.35 + 0.5 * L.glow}" />
          </g>
        </g>
      </g>
    {/each}
  </svg>
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    display: grid;
    place-content: center;
    padding: 6% 4%;
    background:
      radial-gradient(130% 130% at 50% 15%,
        hsl(var(--hue, 150) 42% 8%) 0%,
        #04070a 55%,
        #01050b 100%);
    transition: background 1200ms linear;
  }
  .dish { width: 100%; height: 100%; display: block; overflow: visible; }

  /* the morph: blob flies from its old cell to its new one, slightly overshooting */
  .fly { transition: transform 1150ms cubic-bezier(.34, 1.28, .5, 1); }

  /* fade in/out as blobs join or leave the digit */
  .blob { opacity: 1; transition: opacity 780ms ease; }
  .blob.off { opacity: 0; }

  /* breath + squish: transform (and membrane glow) recomputed each tick */
  .wob {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 1000ms linear;
  }
  .membrane {
    fill: url(#memb);
    stroke: hsl(calc(var(--hue,150) + 18) 96% 84%);
    stroke-width: 0.05;
    stroke-opacity: 0.55;
    mix-blend-mode: screen;
    transition: opacity 1000ms linear;
  }
  .nucleus { fill: url(#nuc); mix-blend-mode: screen; }
  .spark {
    fill: url(#spark);
    mix-blend-mode: screen;
    transition: opacity 1000ms linear;
  }

  /* colon blobs never leave; they brighten on the beat */
  .blob.colon { opacity: 0.55; }
  .blob.colon.pulse { opacity: 1; }
</style>