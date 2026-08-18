<script>
  let { time } = $props();

  const hourTicks = Array.from({ length: 24 });
  const minuteTicks = Array.from({ length: 60 });
  const secondTicks = Array.from({ length: 60 });

  const clampNumber = (value, max) => {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.min(Math.max(parsed, 0), max);
  };

  const pad = (value) => String(value).padStart(2, "0");

  let hours = $derived(clampNumber(time.hh, 23));
  let minutes = $derived(clampNumber(time.mm, 59));
  let seconds = $derived(clampNumber(time.ss, 59));
</script>

<div
  class="clock"
  role="timer"
  aria-live="off"
  aria-label={`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
>
  <header>
    <span>TIME REGISTER</span>
    <span>24 / 60 / 60</span>
  </header>

  <main>
    <section aria-label={`Hour ${pad(hours)}`}>
      <div class="scale-header">
        <span>HOUR</span>
        <output>{pad(hours)}</output>
      </div>

      <div class="ticks hours" aria-hidden="true">
        {#each hourTicks as _, index}
          <span class:filled={index < hours}></span>
        {/each}
      </div>

      <div class="range" aria-hidden="true">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </section>

    <section aria-label={`Minute ${pad(minutes)}`}>
      <div class="scale-header">
        <span>MINUTE</span>
        <output>{pad(minutes)}</output>
      </div>

      <div class="ticks minutes" aria-hidden="true">
        {#each minuteTicks as _, index}
          <span
            class:filled={index < minutes}
            class:major={index % 5 === 0}
          ></span>
        {/each}
      </div>

      <div class="range" aria-hidden="true">
        <span>00</span>
        <span>15</span>
        <span>30</span>
        <span>45</span>
        <span>60</span>
      </div>
    </section>

    <section aria-label={`Second ${pad(seconds)}`}>
      <div class="scale-header">
        <span>SECOND</span>
        <output>{pad(seconds)}</output>
      </div>

      <div class="ticks seconds" aria-hidden="true">
        {#each secondTicks as _, index}
          <span
            class:filled={index < seconds}
            class:major={index % 5 === 0}
          ></span>
        {/each}
      </div>

      <div class="range" aria-hidden="true">
        <span>00</span>
        <span>15</span>
        <span>30</span>
        <span>45</span>
        <span>60</span>
      </div>
    </section>
  </main>

  <footer>
    <span>LOCAL</span>
    <span class="status" aria-hidden="true"></span>
    <span>RUN</span>
  </footer>
</div>

<style>
  .clock,
  .clock * {
    box-sizing: border-box;
  }

  .clock {
    --paper: #e5e1d5;
    --ink: #171715;
    --inactive: #aaa79e;
    --signal: #c73127;

    display: grid;
    grid-template-rows: auto 1fr auto;
    width: min(100%, 100vh);
    aspect-ratio: 1;
    overflow: hidden;
    color: var(--ink);
    background: var(--paper);
    border: 2px solid var(--ink);
    font-family: "Courier New", Courier, monospace;
    user-select: none;
  }

  header,
  footer {
    display: flex;
    align-items: center;
    min-height: 38px;
    padding: 0 5%;
    font-size: clamp(8px, 1.5vw, 11px);
    font-weight: 700;
    letter-spacing: 0.12em;
  }

  header {
    justify-content: space-between;
    border-bottom: 2px solid var(--ink);
  }

  footer {
    gap: 12px;
    border-top: 2px solid var(--ink);
  }

  footer span:last-child {
    margin-left: auto;
  }

  main {
    display: grid;
    grid-template-rows: repeat(3, minmax(0, 1fr));
    min-height: 0;
  }

  section {
    display: grid;
    align-content: center;
    gap: clamp(8px, 2vw, 16px);
    min-height: 0;
    padding: 5% 6%;
    border-bottom: 1px solid var(--ink);
  }

  section:last-child {
    border-bottom: 0;
  }

  .scale-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: clamp(9px, 1.8vw, 13px);
    font-weight: 700;
    letter-spacing: 0.15em;
    transform: translateY(clamp(3px, 1vw, 10px));

  }

  output {
    font-size: clamp(18px, 5vw, 34px);
    font-weight: 700;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
    transform: translateY(clamp(3px, 1vw, 50px));
  }

  .ticks {
    display: grid;
    align-items: end;
    width: 100%;
    height: clamp(30px, 7vw, 50px);
  }

  .hours {
    grid-template-columns: repeat(24, minmax(0, 1fr));
    gap: clamp(2px, 0.45vw, 5px);
  }

  .minutes,
  .seconds {
    grid-template-columns: repeat(60, minmax(0, 1fr));
    gap: clamp(1px, 0.18vw, 2px);
  }

  .ticks span {
    display: block;
    width: 100%;
    height: 58%;
    background: var(--inactive);
  }

  .ticks span.filled {
    height: 100%;
    background: var(--ink);
  }

  .hours span.filled {
    background: var(--signal);
  }

  .minutes span.major,
  .seconds span.major {
    height: 78%;
  }

  .minutes span.major.filled,
  .seconds span.major.filled {
    height: 100%;
  }

  .range {
    display: flex;
    justify-content: space-between;
    color: #65635d;
    font-size: clamp(6px, 1.2vw, 9px);
    font-weight: 700;
    line-height: 1;
    transform: translateY(clamp(3px, 1vw, 8px));
  }

  .status {
    width: 8px;
    height: 8px;
    background: var(--signal);
    border-radius: 50%;
  }
</style>