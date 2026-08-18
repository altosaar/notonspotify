<script>
  let { time } = $props();

  const hash = (s) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // Tres capas de estrellas (parallax)
  const mkStars = (n, seed) =>
    Array.from({ length: n }, (_, i) => ({
      x: hash(seed + i * 5 + 1) * 100,
      y: hash(seed + i * 5 + 2) * 100,
      s: 0.6 + hash(seed + i * 5 + 3) * 1.8,
      o: 0.25 + hash(seed + i * 5 + 4) * 0.6,
      ph: hash(seed + i * 5 + 5) * Math.PI * 2,
    }));

  const farStars = mkStars(70, 100);
  const midStars = mkStars(45, 500);
  const nearStars = mkStars(22, 900);

  // Tiempo continuo del día
  let ct = $derived(
    Number(time.hh) * 3600 + Number(time.mm) * 60 + Number(time.ss) + time.millisecond / 1000
  );

  // Progreso del segundo y del minuto
  let sp = $derived(time.millisecond / 1000);
  let mp = $derived((Number(time.ss) + sp) / 60);

  // Drift de parallax (px)
  let driftFar = $derived((ct * 0.6) % 200);
  let driftMid = $derived((ct * 1.4) % 200);
  let driftNear = $derived((ct * 2.8) % 200);

  // Barrido de radar: una vuelta por segundo... mejor una por 4s (más elegante)
  let sweep = $derived(((ct % 4) / 4) * 360);

  // TIE fighter: cruza la pantalla una vez por minuto, con leve onda vertical
  let tieX = $derived(-12 + mp * 124);
  let tieY = $derived(26 + Math.sin(mp * Math.PI * 3) * 6);

  // Carga del superláser (verde) durante el minuto
  let charge = $derived(mp);

  // Flicker holográfico sutil de los dígitos
  let flick = $derived(
    1 - Math.max(0, Math.sin(time.millisecond * 0.19) * Math.sin(ct * 2.3)) * 0.08
  );

  // Pulso del punto central del radar
  let blip = $derived(Math.abs(Math.sin(sp * Math.PI)));
</script>

<div class="clock">
  <!-- Nebulosas -->
  <div class="nebula n1"></div>
  <div class="nebula n2"></div>

  <!-- Capas de estrellas (parallax con drift) -->
  <div class="starfield" style="transform: translateX({-driftFar}px)">
    {#each farStars as s}
      <div class="st" style="left:{s.x}%; top:{s.y}%; width:{s.s}px; height:{s.s}px;
        opacity:{s.o * (0.6 + 0.4 * Math.abs(Math.sin(ct * 0.7 + s.ph)))};"></div>
      <div class="st" style="left:calc({s.x}% + 200px); top:{s.y}%; width:{s.s}px; height:{s.s}px;
        opacity:{s.o * (0.6 + 0.4 * Math.abs(Math.sin(ct * 0.7 + s.ph)))};"></div>
    {/each}
  </div>
  <div class="starfield" style="transform: translateX({-driftMid}px)">
    {#each midStars as s}
      <div class="st bright" style="left:{s.x}%; top:{s.y}%; width:{s.s * 1.3}px; height:{s.s * 1.3}px;
        opacity:{s.o};"></div>
      <div class="st bright" style="left:calc({s.x}% + 200px); top:{s.y}%; width:{s.s * 1.3}px; height:{s.s * 1.3}px;
        opacity:{s.o};"></div>
    {/each}
  </div>
  <div class="starfield" style="transform: translateX({-driftNear}px)">
    {#each nearStars as s}
      <div class="st bright" style="left:{s.x}%; top:{s.y}%; width:{s.s * 1.8}px; height:{s.s * 1.8}px;
        opacity:{Math.min(1, s.o + 0.2)};"></div>
      <div class="st bright" style="left:calc({s.x}% + 200px); top:{s.y}%; width:{s.s * 1.8}px; height:{s.s * 1.8}px;
        opacity:{Math.min(1, s.o + 0.2)};"></div>
    {/each}
  </div>

  <!-- Planeta en el horizonte -->
  <div class="planet"></div>
  <div class="atmosphere"></div>

  <!-- Estrella de la Muerte (SVG detallada) -->
  <svg class="death-star" viewBox="0 0 200 200">
    <defs>
      <radialGradient id="dsBody" cx="36%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#8d99a8"/>
        <stop offset="45%" stop-color="#4c5563"/>
        <stop offset="80%" stop-color="#1c2129"/>
        <stop offset="100%" stop-color="#0a0d12"/>
      </radialGradient>
      <radialGradient id="dsDish" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#39414d"/>
        <stop offset="70%" stop-color="#161a20"/>
        <stop offset="100%" stop-color="#0b0d11"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="96" fill="url(#dsBody)"/>
    <!-- Trinchera ecuatorial -->
    <path d="M 5 108 Q 100 122 195 108" stroke="#05070a" stroke-width="5" fill="none" opacity="0.9"/>
    <path d="M 5 104 Q 100 118 195 104" stroke="#6b7684" stroke-width="0.8" fill="none" opacity="0.4"/>
    <!-- Paneles de superficie -->
    <line x1="30" y1="45" x2="170" y2="45" stroke="#0d1116" stroke-width="0.6" opacity="0.5"/>
    <line x1="18" y1="70" x2="182" y2="70" stroke="#0d1116" stroke-width="0.6" opacity="0.5"/>
    <line x1="20" y1="140" x2="180" y2="140" stroke="#0d1116" stroke-width="0.7" opacity="0.6"/>
    <line x1="35" y1="165" x2="165" y2="165" stroke="#0d1116" stroke-width="0.6" opacity="0.5"/>
    <line x1="60" y1="14" x2="60" y2="98" stroke="#0d1116" stroke-width="0.5" opacity="0.4"/>
    <line x1="130" y1="10" x2="130" y2="98" stroke="#0d1116" stroke-width="0.5" opacity="0.4"/>
    <line x1="95" y1="120" x2="95" y2="192" stroke="#0d1116" stroke-width="0.5" opacity="0.4"/>
    <!-- Plato del superláser -->
    <circle cx="66" cy="58" r="26" fill="url(#dsDish)"/>
    <circle cx="66" cy="58" r="26" fill="none" stroke="#020304" stroke-width="1.6"/>
    <circle cx="66" cy="58" r="19" fill="none" stroke="#59636f" stroke-width="0.5" opacity="0.5"/>
    <circle cx="66" cy="58" r="11" fill="none" stroke="#59636f" stroke-width="0.5" opacity="0.4"/>
    <!-- Núcleo del láser: carga con el minuto -->
    <circle cx="66" cy="58" r="{2 + charge * 5}" fill="#9dffb0"
      opacity="{0.25 + charge * 0.75}"
      style="filter: drop-shadow(0 0 {3 + charge * 14}px rgba(120,255,150,{0.4 + charge * 0.6}))"/>
    <!-- Luces de ciudad diminutas -->
    {#each Array.from({ length: 14 }) as _, i}
      <circle cx="{40 + hash(i * 7 + 3) * 130}" cy="{110 + hash(i * 7 + 5) * 70}"
        r="0.8" fill="#cfe3ff"
        opacity="{0.3 + 0.5 * Math.abs(Math.sin(ct * (0.5 + hash(i) * 1.2) + i))}"/>
    {/each}
  </svg>

  <!-- Caza TIE cruzando -->
  <svg class="tie" viewBox="0 0 60 40" style="left:{tieX}%; top:{tieY}%;">
    <rect x="4" y="2" width="4" height="36" rx="1" fill="#1a2028" stroke="#39424e" stroke-width="0.7"/>
    <rect x="52" y="2" width="4" height="36" rx="1" fill="#1a2028" stroke="#39424e" stroke-width="0.7"/>
    <line x1="8" y1="20" x2="24" y2="20" stroke="#2b333d" stroke-width="2"/>
    <line x1="36" y1="20" x2="52" y2="20" stroke="#2b333d" stroke-width="2"/>
    <circle cx="30" cy="20" r="7" fill="#232b35" stroke="#414b58" stroke-width="0.8"/>
    <circle cx="30" cy="20" r="3.4" fill="#0c1016" stroke="#4a5665" stroke-width="0.6"/>
  </svg>

  <!-- HUD: brackets de esquinas -->
  <div class="bracket tl"></div>
  <div class="bracket tr"></div>
  <div class="bracket bl"></div>
  <div class="bracket br"></div>

  <!-- Radar de combate -->
  <div class="radar">
    <div class="radar-ring r1"></div>
    <div class="radar-ring r2"></div>
    <div class="radar-cross-h"></div>
    <div class="radar-cross-v"></div>
    <div class="radar-sweep" style="transform: rotate({sweep}deg)"></div>
    <div class="radar-blip" style="opacity:{0.4 + blip * 0.6}; transform: scale({0.8 + blip * 0.5})"></div>
  </div>

  <!-- Display central -->
  <div class="panel" style="opacity:{flick}">
    <div class="hud-top">
      <span class="hud-tag">SECTOR 7-G</span>
      <span class="hud-tag">TRK {time.mm}{time.ss}</span>
    </div>

    <div class="time-digits">
      <span class="digit">{time.hh}</span>
      <span class="colon" style="opacity:{sp < 0.5 ? 1 : 0.25}">:</span>
      <span class="digit">{time.mm}</span>
      <span class="colon" style="opacity:{sp < 0.5 ? 1 : 0.25}">:</span>
      <span class="digit">{time.ss}</span>
    </div>

    <!-- Barra de targeting: progreso del minuto -->
    <div class="target-bar">
      <div class="tb-fill" style="width:{mp * 100}%"></div>
      {#each Array.from({ length: 13 }) as _, i}
        <div class="tb-tick" style="left:{(i / 12) * 100}%"></div>
      {/each}
    </div>

    <div class="holo-label">GALACTIC STANDARD TIME</div>
  </div>

  <div class="grain"></div>
  <div class="vignette"></div>
</div>

<style>
  .clock {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: linear-gradient(180deg, #01020a 0%, #050818 45%, #0a0f26 75%, #131a38 100%);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', 'SF Mono', 'Consolas', monospace;
  }

  /* ── Nebulosas ── */
  .nebula {
    position: absolute;
    inset: -20%;
    pointer-events: none;
  }
  .n1 {
    background: radial-gradient(ellipse 60% 40% at 20% 30%, rgba(80, 60, 160, 0.14) 0%, transparent 70%);
  }
  .n2 {
    background: radial-gradient(ellipse 50% 35% at 78% 60%, rgba(40, 100, 180, 0.10) 0%, transparent 70%);
  }

  /* ── Estrellas ── */
  .starfield {
    position: absolute;
    inset: 0;
    width: calc(100% + 200px);
    pointer-events: none;
  }
  .st {
    position: absolute;
    border-radius: 50%;
    background: #dfe9ff;
  }
  .st.bright {
    background: #fff;
    box-shadow: 0 0 3px rgba(200, 220, 255, 0.8);
  }

  /* ── Planeta ── */
  .planet {
    position: absolute;
    bottom: -58%;
    left: 50%;
    transform: translateX(-50%);
    width: 150%;
    height: 80%;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 0%,
      #2a3d6b 0%, #1c2b52 22%, #121d3c 45%, #0a1128 70%, #050a1a 100%);
    z-index: 1;
  }
  .atmosphere {
    position: absolute;
    bottom: 21.5%;
    left: 0;
    width: 100%;
    height: 10%;
    background: radial-gradient(ellipse 80% 100% at 50% 100%,
      rgba(90, 160, 255, 0.28) 0%, rgba(60, 120, 230, 0.10) 45%, transparent 100%);
    filter: blur(6px);
    z-index: 1;
    pointer-events: none;
  }

  /* ── Estrella de la Muerte ── */
  .death-star {
    position: absolute;
    top: 6%;
    right: 6%;
    width: clamp(90px, 16vw, 190px);
    height: clamp(90px, 16vw, 190px);
    z-index: 2;
    filter: drop-shadow(0 0 24px rgba(80, 100, 140, 0.15));
  }

  /* ── TIE ── */
  .tie {
    position: absolute;
    width: clamp(26px, 4vw, 46px);
    z-index: 3;
    opacity: 0.85;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.8));
  }

  /* ── HUD brackets ── */
  .bracket {
    position: absolute;
    width: 34px;
    height: 34px;
    border: 2px solid rgba(120, 200, 255, 0.35);
    z-index: 8;
    pointer-events: none;
  }
  .tl { top: 18px; left: 18px; border-right: none; border-bottom: none; }
  .tr { top: 18px; right: 18px; border-left: none; border-bottom: none; }
  .bl { bottom: 18px; left: 18px; border-right: none; border-top: none; }
  .br { bottom: 18px; right: 18px; border-left: none; border-top: none; }

  /* ── Radar ── */
  .radar {
    position: absolute;
    bottom: 7%;
    left: 6%;
    width: clamp(70px, 11vw, 130px);
    height: clamp(70px, 11vw, 130px);
    z-index: 6;
  }
  .radar-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(110, 220, 160, 0.35);
  }
  .r1 { inset: 0; }
  .r2 { inset: 26%; border-color: rgba(110, 220, 160, 0.22); }
  .radar-cross-h, .radar-cross-v {
    position: absolute;
    background: rgba(110, 220, 160, 0.18);
  }
  .radar-cross-h { top: 50%; left: 4%; width: 92%; height: 1px; }
  .radar-cross-v { left: 50%; top: 4%; height: 92%; width: 1px; }
  .radar-sweep {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(from 0deg,
      rgba(120, 255, 170, 0.35) 0deg,
      rgba(120, 255, 170, 0.08) 40deg,
      transparent 70deg,
      transparent 360deg);
    transform-origin: center;
  }
  .radar-blip {
    position: absolute;
    top: 32%;
    left: 60%;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #8fffb4;
    box-shadow: 0 0 6px #6fff9e;
  }

  /* ── Panel central ── */
  .panel {
    position: relative;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
  }

  .hud-top {
    display: flex;
    justify-content: space-between;
    width: min(80%, 480px);
  }
  .hud-tag {
    font-size: clamp(8px, 1.4vw, 11px);
    letter-spacing: 3px;
    color: rgba(140, 210, 255, 0.7);
    text-shadow: 0 0 6px rgba(80, 170, 255, 0.5);
  }

  .time-digits {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Dígitos con aberración cromática */
  .digit {
    font-size: clamp(58px, 13vw, 132px);
    font-weight: 700;
    color: #ffe81f;
    letter-spacing: 4px;
    font-variant-numeric: tabular-nums;
    text-shadow:
      -1.5px 0 1px rgba(255, 60, 60, 0.45),
      1.5px 0 1px rgba(60, 160, 255, 0.45),
      0 0 8px rgba(255, 232, 31, 0.9),
      0 0 22px rgba(255, 214, 30, 0.55),
      0 0 56px rgba(255, 180, 0, 0.35);
  }

  .colon {
    font-size: clamp(46px, 10vw, 104px);
    font-weight: 700;
    color: #ffe81f;
    text-shadow:
      0 0 8px rgba(255, 232, 31, 0.8),
      0 0 22px rgba(255, 214, 30, 0.45);
  }

  /* ── Barra de targeting ── */
  .target-bar {
    position: relative;
    width: min(76%, 440px);
    height: 8px;
    border: 1px solid rgba(255, 232, 31, 0.35);
    background: rgba(255, 232, 31, 0.04);
  }
  .tb-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(255, 232, 31, 0.5), #ffe81f);
    box-shadow: 0 0 10px rgba(255, 220, 30, 0.6);
  }
  .tb-tick {
    position: absolute;
    top: -4px;
    width: 1px;
    height: 4px;
    background: rgba(255, 232, 31, 0.4);
  }

  .holo-label {
    font-size: clamp(9px, 1.8vw, 13px);
    font-weight: 600;
    letter-spacing: 7px;
    color: #9fd4ff;
    text-shadow: 0 0 6px rgba(80, 170, 255, 0.7), 0 0 18px rgba(60, 140, 255, 0.4);
    font-family: 'Arial', 'Helvetica Neue', sans-serif;
  }

  /* ── Textura y viñeta ── */
  .grain {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(0deg,
      transparent, transparent 3px,
      rgba(0, 0, 0, 0.045) 3px, rgba(0, 0, 0, 0.045) 5px);
    pointer-events: none;
    z-index: 10;
  }
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 38%, rgba(0, 0, 0, 0.6) 100%);
    pointer-events: none;
    z-index: 9;
  }
</style>