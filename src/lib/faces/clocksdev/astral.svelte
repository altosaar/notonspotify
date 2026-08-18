<script>
  let { time } = $props();

  // Basitleştirilmiş ortalama ekliptik boylam (derece) — J2000.0 epoku referanslı.
  // Kaynak: gezegenlerin ortalama boylamı L = L0 + n * d  (d = J2000'den beri geçen gün)
  // Not: Bu bir orrery yaklaşımıdır; ±birkaç derece hata olabilir ama hız ve konumlar gerçekçidir.
  const bodies = [
    // Ay: geosentrik ortalama boylam
    { name: 'Ay',      r: 90,  L0: 218.316, n: 13.176396,  color: '#dfe6f0', size: 6 },
    // Güneş: geosentrik görünür boylam (Dünya'nın yörüngesinden)
    { name: 'Güneş',   r: 112, L0: 280.459, n: 0.98564736, color: '#ffcf40', size: 11 },
    // Gezegenler: heliosentrik ortalama boylam (Güneş etrafında)
    { name: 'Merkür',  r: 132, L0: 252.251, n: 4.09233445, color: '#b7a48b', size: 4 },
    { name: 'Venüs',   r: 150, L0: 181.980, n: 1.60213034, color: '#e8c07a', size: 6 },
    { name: 'Mars',    r: 168, L0: 355.433, n: 0.52403840, color: '#e06b4a', size: 5 },
    { name: 'Jüpiter', r: 184, L0: 34.351,  n: 0.08308530, color: '#d8a26b', size: 8 },
    { name: 'Satürn',  r: 200, L0: 50.078,  n: 0.03344414, color: '#e4d3a2', size: 7 }
  ];

  const ticks = Array.from({ length: 12 }, (_, i) => i);
  const C = 220;

  // J2000.0 = 2000-01-01 12:00 UTC (Unix ms)
  const J2000 = 946728000000;

  // Cismin ekliptik boylamına göre açısı (derece). SVG'de 0° = 12 yönü olsun diye -90 kaydırdık.
  function angleDeg(b) {
    const days = (time.timestamp - J2000) / 86400000;
    let L = (b.L0 + b.n * days) % 360;
    if (L < 0) L += 360;
    return L - 90;
  }
  function px(b) { return C + b.r * Math.cos(angleDeg(b) * Math.PI / 180); }
  function py(b) { return C + b.r * Math.sin(angleDeg(b) * Math.PI / 180); }
</script>

<div class="wrap">
  <svg viewBox="0 0 440 440" class="orrery">
    <defs>
      <radialGradient id="space" cx="35%" cy="30%">
        <stop offset="0%" stop-color="#1b1740" />
        <stop offset="60%" stop-color="#0a0a1c" />
        <stop offset="100%" stop-color="#05060d" />
      </radialGradient>
    </defs>

    <circle cx="220" cy="220" r="216" fill="url(#space)" />

    {#each bodies as b}
      <circle cx="220" cy="220" r={b.r} class="orbit" />
    {/each}

    <circle cx="220" cy="220" r="72" class="face" />

    {#each ticks as i}
      <line x1="220" y1="158" x2="220" y2="170" transform={`rotate(${i * 30} 220 220)`} class="tick" />
    {/each}

    {#each bodies as b}
      {#if b.name === 'Satürn'}
        <ellipse cx={px(b)} cy={py(b)} rx={b.size * 2} ry={b.size * 0.6} transform={`rotate(-20 ${px(b)} ${py(b)})`} class="planetring" />
      {/if}
      <circle cx={px(b)} cy={py(b)} r={b.size} fill={b.color} class="body" />
    {/each}

    <line x1="220" y1="220" x2="220" y2="168" transform={`rotate(${((time.hour % 12) + time.minute / 60) * 30} 220 220)`} class="hand hour" />
    <line x1="220" y1="220" x2="220" y2="152" transform={`rotate(${(time.minute + time.second / 60) * 6} 220 220)`} class="hand minute" />
    <line x1="220" y1="232" x2="220" y2="148" transform={`rotate(${(time.second + time.millisecond / 1000) * 6} 220 220)`} class="hand second" />
    <circle cx="220" cy="220" r="4.5" class="pin" />
  </svg>

  <div class="time">{time.hh}:{time.mm}:{time.ss}</div>
  <div class="date">{time.weekdayName}, {time.day} {time.monthName} {time.year}</div>
</div>

<style>
  .wrap {
    position: relative;
    display: grid;
    place-content: center;
    justify-items: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: #05060d;
    box-sizing: border-box;
    padding: 8px;
    font-family: Inter, sans-serif;
  }
  .orrery {
    width: min(88vw, 88vh);
    height: min(88vw, 88vh);
    display: block;
  }
  .orbit { fill: none; stroke: rgba(255,255,255,0.09); stroke-width: 1; }
  .face { fill: rgba(255,255,255,0.03); stroke: rgba(255,255,255,0.18); stroke-width: 1.5; }
  .tick { stroke: rgba(255,255,255,0.45); stroke-width: 2; stroke-linecap: round; }
  .body { filter: drop-shadow(0 0 4px rgba(255,255,255,0.35)); }
  .planetring { fill: none; stroke: #e4d3a2; stroke-width: 1.5; opacity: 0.85; }
  .hand { stroke-linecap: round; }
  .hour { stroke: #ffffff; stroke-width: 4.5; }
  .minute { stroke: #cfd6ff; stroke-width: 3; }
  .second { stroke: #f472b6; stroke-width: 1.5; }
  .pin { fill: #f472b6; }
  .time {
    position: absolute;
    bottom: 30px;
    text-align: center;
    color: rgba(255,255,255,0.75);
    font: 600 clamp(13px, 2.6vw, 20px)/1 Inter, sans-serif;
    letter-spacing: 0.18em;
  }
  .date {
    position: absolute;
    bottom: 10px;
    text-align: center;
    color: rgba(255,255,255,0.45);
    font: 500 clamp(10px, 1.8vw, 13px)/1 Inter, sans-serif;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
</style>