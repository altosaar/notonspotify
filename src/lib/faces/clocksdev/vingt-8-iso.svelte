<!--
  Voutilainen Vingt-8 ISO  —  for clocks.dev
  ---------------------------------------------------------------------------
  Emulates the Vingt-8 ISO's unconventional display:

    • The hour hand runs normally (1 turn / 12h) and is read against the
      fixed applied hour markers.
    • The minute chapter ring turns at the SAME speed as the hour hand
      (1 turn / 12h); its "0" always tracks the hour hand.
    • The minute hand sits at  hourAngle + normalMinuteAngle,  so the two
      hands are superimposed on every hour, opposite at the half hour, and
      at 90° at quarter past / quarter to. Over 12h the minute hand makes
      13 revolutions, so the top-of-the-hour alignment migrates around the
      dial across the day.
    • Small seconds at 6 o'clock stutter at 18,000 vph = 5 beats / second,
      the beat of the real caliber.

  Authoring notes for the clocks.dev sandbox:
    – Pure Svelte 5 runes, no imports (the runtime strips import lines).
    – Single reactive `time` prop; angles derived from `time.progress.*`.
    – Static ~360-node SVG; only transforms mutate per frame.
    Suggested create-form colours:  background #0b0d12 · color #e9e4d6 · muted #8b8778
-->
<script>
  let { time } = $props();

  const C = 200;                 // dial centre
  const SUB_CX = 200;            // small-seconds subdial centre
  const SUB_CY = 292;
  const SUB_R = 42;

  // point on a circle, 0° = 12 o'clock, clockwise
  const pt = (deg, r) => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  };
  const ptc = (cx, cy, deg, r) => {
    const a = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const r2 = (n) => Math.round(n * 100) / 100;

  // ---- static geometry (built once) ----------------------------------------
  // Rose-engine guilloché: nested wavy rings whose crests share a radial phase
  // and drift with radius, so the peaks line up into fine radiating petals — a
  // "fleur" engine-turning like the real Vingt-8 dial. Each ring is one <path>.
  const wavyRing = (cx, cy, R, petals, amp, phase) => {
    const steps = petals * 2;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * Math.PI * 2;
      const rr = R + amp * Math.cos(petals * th + phase);
      const x = cx + rr * Math.cos(th);
      const y = cy + rr * Math.sin(th);
      d += (i === 0 ? 'M' : 'L') + r2(x) + ' ' + r2(y) + ' ';
    }
    return d + 'Z';
  };
  // dial fleur: fine petals over the open dial field
  const PETALS = 54;
  const guilFlower = [];
  for (let R = 13; R <= 178; R += 2.7) {
    guilFlower.push(wavyRing(200, 200, R, PETALS, 1.9, R * 0.028));
  }

  const minuteTicks = Array.from({ length: 60 }, (_, m) => {
    const big = m % 5 === 0;
    const p1 = pt(m * 6, big ? 178 : 184.5);
    const p2 = pt(m * 6, 191);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, big };
  });
  // minute numerals: printed ON the rotating chapter ring, oriented radially
  // (upright at the ring's top, upside-down at its bottom). They live inside
  // the ring group, so they turn rigidly with it. `a` is the home angle.
  const minuteNums = Array.from({ length: 12 }, (_, i) => {
    const m = i * 5;
    const a = m * 6;
    const p = pt(a, 169);
    return { label: m === 0 ? '60' : String(m), a, x: p.x, y: p.y };
  });

  const hourMarks = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    const p = pt(h * 30, 150);
    return { h, x: p.x, y: p.y, rot: h * 30, twelve: h === 12 };
  });

  // small-seconds subdial: fine concentric engine-turning
  const subRings = Array.from({ length: 17 }, (_, i) => 3.5 + i * 2.2);
  const subTicks = Array.from({ length: 60 }, (_, s) => {
    const big = s % 5 === 0;
    const p1 = ptc(SUB_CX, SUB_CY, s * 6, SUB_R - (big ? 9 : 5));
    const p2 = ptc(SUB_CX, SUB_CY, s * 6, SUB_R - 1);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, big };
  });
  const subNums = [0, 15, 30, 45].map((s) => {
    const p = ptc(SUB_CX, SUB_CY, s * 6, SUB_R - 18);
    return { label: s === 0 ? '60' : String(s), x: p.x, y: p.y };
  });

  // ---- the ISO movement (reactive) -----------------------------------------
  const h12       = $derived(time.hour % 12);
  const minCont   = $derived(time.minute + time.progress.minute);      // 0..60
  const hourCont  = $derived(h12 + time.progress.hour);                // 0..12
  const hourAngle = $derived(hourCont * 30);                           // hour hand
  const minAngle  = $derived(hourAngle + minCont * 6);                 // ISO minute hand
  const ringAngle = $derived(hourAngle);                               // ring tracks hour hand
  // small seconds: 18,000 vph → 5 discrete beats per second
  const secCont   = $derived(time.second + time.progress.second);
  const secAngle  = $derived(((Math.floor(secCont * 5) / 5) % 60) * 6);

  // ---- "Hunter" hands (Voutilainen signature) ------------------------------
  // Slim shaft → open circular eye near the end → pointed lance beyond it.
  // The eye is a true annulus (outer circle minus inner) so the guilloché
  // shows through; drawn with fill-rule evenodd. All hands share x = 200
  // (the dial and subdial are both centred on x). `cy` values point "up".
  const circlePath = (cy, r) =>
    `M ${200 - r} ${r2(cy)} a ${r} ${r} 0 1 0 ${r2(2 * r)} 0 a ${r} ${r} 0 1 0 ${r2(-2 * r)} 0 Z`;
  const eye = (cy, ro, ri) => circlePath(cy, ro) + ' ' + circlePath(cy, ri);
  const lance = (tipY, baseY, w) =>
    `M200 ${r2(tipY)} L ${r2(200 + w)} ${r2(baseY)} L ${r2(200 - w)} ${r2(baseY)} Z`;
  const shaft = (topY, botY, wTop, wBot) =>
    `M ${r2(200 - wBot)} ${r2(botY)} L ${r2(200 - wTop)} ${r2(topY)} ` +
    `L ${r2(200 + wTop)} ${r2(topY)} L ${r2(200 + wBot)} ${r2(botY)} Z`;

  // minute hand (long): open eye near the end, sharp lance beyond it
  const minuteShaft = shaft(77.5, 216, 1.05, 2.0);
  const minuteEye   = eye(70, 7.7, 4.8);
  const minuteTip   = lance(44, 62.5, 1.7);
  // hour hand (short)
  const hourShaft   = shaft(118, 214, 1.05, 1.95);
  const hourEye     = eye(110.5, 7.2, 4.5);
  const hourTip     = lance(87, 103.5, 1.7);
  // small seconds: plain pointed indicator + open circular counterweight tail
  const secPointer = lance(256, 292, 0.9);          // needle to the seconds track
  const secNeck    = shaft(292, 305, 0.5, 0.65);    // pivot → counterweight
  const secWeight  = eye(308.5, 4, 2.4);            // open ring counterpoise
</script>

<div class="stage">
  <svg viewBox="0 0 400 400" role="img" aria-label="Voutilainen Vingt-8 ISO clock">
    <defs>
      <radialGradient id="dial" cx="38%" cy="32%" r="80%">
        <stop offset="0%"  stop-color="#efe9d8" />
        <stop offset="45%" stop-color="#d8d2c2" />
        <stop offset="100%" stop-color="#b3ac95" />
      </radialGradient>
      <radialGradient id="sub" cx="40%" cy="35%" r="75%">
        <stop offset="0%"  stop-color="#e9e3d2" />
        <stop offset="100%" stop-color="#c0b9a2" />
      </radialGradient>
      <linearGradient id="blued" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#6d84c6" />
        <stop offset="45%" stop-color="#2c3e73" />
        <stop offset="100%" stop-color="#16204a" />
      </linearGradient>
      <linearGradient id="hand" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0%"  stop-color="#3c4c78" />
        <stop offset="42%" stop-color="#182142" />
        <stop offset="100%" stop-color="#090d1e" />
      </linearGradient>
      <linearGradient id="ringMetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#fbf9f2" />
        <stop offset="50%" stop-color="#e7e2d5" />
        <stop offset="100%" stop-color="#cfc9ba" />
      </linearGradient>
      <radialGradient id="case" cx="50%" cy="35%" r="75%">
        <stop offset="0%"  stop-color="#eff1f4" />
        <stop offset="55%" stop-color="#c7ccd4" />
        <stop offset="100%" stop-color="#8f95a0" />
      </radialGradient>
      <radialGradient id="vig" cx="50%" cy="50%" r="52%">
        <stop offset="70%"  stop-color="rgba(0,0,0,0)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.28)" />
      </radialGradient>
    </defs>

    <!-- case + dial -->
    <circle cx="200" cy="200" r="198" fill="url(#case)" />
    <circle cx="200" cy="200" r="186" fill="#0b0d12" />
    <circle cx="200" cy="200" r="182" fill="url(#dial)" />

    <!-- guilloché engraving (rose-engine fleur) -->
    <g class="fleur">
      {#each guilFlower as d}
        <path {d} fill="none" stroke="#a79f88" stroke-width="0.35" />
      {/each}
    </g>

    <!-- signature / Voutilainen wordmark -->
    <text x="200" y="150" text-anchor="middle" class="wordmark">VOUTILAINEN</text>
    <text x="200" y="163" text-anchor="middle" class="wordmark-sub">ISO</text>

    <!-- fixed hour markers (read the hour hand against these) -->
    <g>
      {#each hourMarks as m}
        <g transform="translate({m.x} {m.y}) rotate({m.rot})">
          {#if m.twelve}
            <circle cx="0" cy="-3" r="3.2" fill="#20222a" />
            <circle cx="0" cy="5"  r="3.2" fill="#20222a" />
          {:else}
            <rect x="-2" y="-9" width="4" height="18" rx="1.4" fill="#20222a" />
            <rect x="-2" y="-9" width="1.4" height="18" rx="0.7" fill="#4a4d57" />
          {/if}
        </g>
      {/each}
    </g>

    <!-- ROTATING MINUTE CHAPTER RING (turns with the hour hand) -->
    <g transform="rotate({ringAngle} 200 200)">
      <circle cx="200" cy="200" r="181" fill="none" stroke="url(#ringMetal)" stroke-width="22" />
      <circle cx="200" cy="200" r="170.5" fill="none" stroke="#b8b2a2" stroke-width="0.6" />
      <circle cx="200" cy="200" r="191.5" fill="none" stroke="#b8b2a2" stroke-width="0.6" />
      {#each minuteTicks as t}
        <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="#20222a" stroke-width={t.big ? 1.6 : 0.7} stroke-linecap="round" />
      {/each}
      <!-- numerals printed on the ring: oriented radially, turn with it -->
      {#each minuteNums as n}
        <text x={n.x} y={n.y} text-anchor="middle" dominant-baseline="central"
              transform="rotate({n.a} {n.x} {n.y})" class="ring-num">{n.label}</text>
      {/each}
    </g>

    <!-- small seconds subdial @ 6 -->
    <circle cx={SUB_CX} cy={SUB_CY} r={SUB_R + 3} fill="#b3ac95" />
    <circle cx={SUB_CX} cy={SUB_CY} r={SUB_R} fill="url(#sub)" />
    <g opacity="0.45">
      {#each subRings as sr}
        <circle cx={SUB_CX} cy={SUB_CY} r={sr} fill="none" stroke="#9a927b" stroke-width="0.3" />
      {/each}
    </g>
    <circle cx={SUB_CX} cy={SUB_CY} r={SUB_R} fill="none" stroke="#8f8871" stroke-width="0.8" />
    {#each subTicks as t}
      <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#20222a" stroke-width={t.big ? 1.1 : 0.5} />
    {/each}
    {#each subNums as n}
      <text x={n.x} y={n.y} text-anchor="middle" dominant-baseline="central" class="sub-num">{n.label}</text>
    {/each}

    <!-- Hunter hands: slim shaft, open circular eye, pointed lance beyond it -->
    <g transform="rotate({hourAngle} 200 200)">
      <circle cx="200" cy="219" r="3.8" fill="url(#hand)" stroke="#080c18" stroke-width="0.35" />
      <path d={hourShaft} fill="url(#hand)" stroke="#080c18" stroke-width="0.35" />
      <path d={hourTip} fill="url(#hand)" stroke="#080c18" stroke-width="0.35" />
      <path d={hourEye} fill-rule="evenodd" fill="url(#hand)" stroke="#080c18" stroke-width="0.5" />
    </g>
    <g transform="rotate({minAngle} 200 200)">
      <circle cx="200" cy="222" r="4.2" fill="url(#hand)" stroke="#080c18" stroke-width="0.35" />
      <path d={minuteShaft} fill="url(#hand)" stroke="#080c18" stroke-width="0.35" />
      <path d={minuteTip} fill="url(#hand)" stroke="#080c18" stroke-width="0.35" />
      <path d={minuteEye} fill-rule="evenodd" fill="url(#hand)" stroke="#080c18" stroke-width="0.5" />
    </g>

    <circle cx="200" cy="200" r="5.5" fill="#0e1636" />
    <circle cx="200" cy="200" r="2.4" fill="#5b73b8" />

    <g transform="rotate({secAngle} {SUB_CX} {SUB_CY})">
      <path d={secPointer} fill="url(#hand)" />
      <path d={secNeck} fill="url(#hand)" />
      <path d={secWeight} fill-rule="evenodd" fill="url(#hand)" stroke="#080c18" stroke-width="0.25" />
      <circle cx={SUB_CX} cy={SUB_CY} r="1.9" fill="#0e1636" />
    </g>

    <!-- vignette + glass glare -->
    <circle cx="200" cy="200" r="182" fill="url(#vig)" />
    <ellipse cx="150" cy="120" rx="120" ry="70" fill="#ffffff" opacity="0.05"
             transform="rotate(-25 150 120)" />
  </svg>
</div>

<style>
  .stage {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    padding: 4%;
    background:
      radial-gradient(120% 120% at 50% 0%, #161a22 0%, #0b0d12 55%, #060709 100%);
  }
  svg {
    width: min(100%, 100vh, 92vmin);
    height: auto;
    aspect-ratio: 1;
    display: block;
    filter: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.55));
  }
  .fleur {
    opacity: 0.55;
  }
  .wordmark {
    font-family: 'Cormorant Garamond', 'Times New Roman', Georgia, serif;
    font-size: 8.6px;
    font-weight: 500;
    letter-spacing: 1.7px;
    fill: #20222a;
  }
  .wordmark-sub {
    font-family: 'Cormorant Garamond', 'Times New Roman', Georgia, serif;
    font-size: 5px;
    letter-spacing: 3.2px;
    fill: #454852;
  }
  .ring-num {
    font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
    font-size: 10.5px;
    font-weight: 600;
    fill: #20222a;
  }
  .sub-num {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 7px;
    fill: #3a3d46;
  }
</style>
