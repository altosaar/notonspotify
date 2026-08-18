<script>
  let { time } = $props();

  const SEGMENTS = {
    '0': ['a', 'b', 'c', 'd', 'e', 'f'],
    '1': ['b', 'c'],
    '2': ['a', 'b', 'd', 'e', 'g'],
    '3': ['a', 'b', 'c', 'd', 'g'],
    '4': ['b', 'c', 'f', 'g'],
    '5': ['a', 'c', 'd', 'f', 'g'],
    '6': ['a', 'c', 'd', 'e', 'f', 'g'],
    '7': ['a', 'b', 'c'],
    '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  };

  const POLY = {
    a: '3.6,2 28.4,2 24.6,5.8 7.4,5.8',
    b: '30,3.6 30,27.4 26.2,23.6 26.2,7.4',
    c: '30,30.6 30,54.4 26.2,50.6 26.2,34.4',
    d: '3.6,56 28.4,56 24.6,52.2 7.4,52.2',
    e: '2,30.6 2,54.4 5.8,50.6 5.8,34.4',
    f: '2,3.6 2,27.4 5.8,23.6 5.8,7.4',
    g: '3.9,29 6.4,27 25.6,27 28.1,29 25.6,31 6.4,31',
  };
  const SEG_KEYS = Object.keys(POLY);

  let hourChars = $derived(
    (time.hour12 < 10 ? ' ' + time.hour12 : String(time.hour12)).split('')
  );
  let minuteChars = $derived(time.mm.split(''));
</script>

{#snippet digitSvg(ch)}
  <svg viewBox="0 0 32 58" class="digit">
    {#each SEG_KEYS as key}
      <polygon points={POLY[key]} class={SEGMENTS[ch]?.includes(key) ? 'lit' : 'off'} />
    {/each}
  </svg>
{/snippet}

<div class="clock">
  <div class="face">
    <span class="indicator ampm">{time.ampm}</span>

    <div class="digits-row">
      {#each hourChars as ch}
        {@render digitSvg(ch)}
      {/each}

      <svg viewBox="0 0 12 58" class="colon">
        <circle cx="6" cy="19" r="3" class="lit" />
        <circle cx="6" cy="39" r="3" class="lit" />
      </svg>

      {#each minuteChars as ch}
        {@render digitSvg(ch)}
      {/each}
    </div>

    <span class="indicator dst">DST</span>
  </div>
</div>

<style>
  .clock {
    display: grid;
    place-content: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: #050505;
  }

  .face {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .digits-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: clamp(2px, 0.6vw, 16px);
  }

  .digit {
    width: clamp(40px, 10vw, 110px);
    height: auto;
    overflow: visible;
  }

  .colon {
    width: clamp(14px, 3.4vw, 38px);
    height: auto;
    overflow: visible;
  }

  polygon.lit,
  circle.lit {
    fill: #ffa430;
    filter: drop-shadow(0 0 2px rgba(255, 164, 48, 0.7)) drop-shadow(0 0 6px rgba(255, 140, 0, 0.35));
  }

  polygon.off,
  circle.off {
    opacity: 0;
  }

  .indicator {
    position: absolute;
    top: 46%;
    transform: translateY(-50%);
    font-family: Arial, sans-serif;
    font-weight: 400;
    color: #ffa430;
    opacity: 0.92;
    text-shadow: 0 0 3px rgba(255, 164, 48, 0.45);
  }

  .ampm {
    left: -3.4em;
    font-size: clamp(13px, 2.4vw, 22px);
    letter-spacing: 0.04em;
  }

  .dst {
    right: -3.6em;
    font-size: clamp(11px, 1.9vw, 17px);
    letter-spacing: 0.06em;
  }
</style>