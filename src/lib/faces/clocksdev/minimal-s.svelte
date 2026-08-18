<script>
  let { time } = $props();

  let hh = $derived(String(time?.hh ?? "00").padStart(2, "0"));
  let mm = $derived(String(time?.mm ?? "00").padStart(2, "0"));
  let ss = $derived(String(time?.ss ?? "00").padStart(2, "0"));

  let hour = $derived(Number(time?.hh) || 0);
  let minute = $derived(Number(time?.mm) || 0);
  let second = $derived(Number(time?.ss) || 0);

  let secondTurn = $derived(second * 6);
  let minuteTurn = $derived((minute + second / 60) * 6);
  let hourTurn = $derived(((hour % 12) + minute / 60) * 30);

  let secondProgress = $derived((second / 59) * 100);
  let minuteProgress = $derived((minute / 59) * 100);
</script>

<div
  class="clock"
  aria-label={`Current time ${hh}:${mm}:${ss}`}
  style={`
    --second-turn: ${secondTurn}deg;
    --minute-turn: ${minuteTurn}deg;
    --hour-turn: ${hourTurn}deg;
    --second-progress: ${secondProgress}%;
    --minute-progress: ${minuteProgress}%;
  `}
>
  <div class="grain"></div>

  <div class="composition">
    <div class="disc disc-one"></div>
    <div class="disc disc-two"></div>
    <div class="disc disc-three"></div>

    <div class="axis axis-horizontal"></div>
    <div class="axis axis-vertical"></div>

    <div class="time">
      <div class="hours">{hh}</div>

      <div class="divider"></div>

      <div class="minutes">{mm}</div>
    </div>

    <div class="seconds">
      <span>{ss}</span>
    </div>

    <div class="metadata">
      <span>Local time</span>
      <span>{hh}:{mm}:{ss}</span>
    </div>

    <div class="progress">
      <div class="minute-progress"></div>
      <div class="second-progress"></div>
    </div>
  </div>
</div>

<style>
  .clock {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    color: #f1eee7;
    background: #11110f;
    font-family:
      Inter,
      Helvetica Neue,
      Helvetica,
      Arial,
      sans-serif;
  }

  .clock::before {
    position: absolute;
    inset: 0;
    content: "";
    background:
      radial-gradient(
        circle at 24% 18%,
        rgb(255 255 255 / 0.05),
        transparent 28%
      ),
      linear-gradient(
        135deg,
        rgb(255 255 255 / 0.025),
        transparent 42%
      );
  }

  .grain {
    position: absolute;
    inset: 0;
    opacity: 0.18;
    pointer-events: none;
    background-image:
      linear-gradient(
        90deg,
        rgb(255 255 255 / 0.025) 1px,
        transparent 1px
      ),
      linear-gradient(
        rgb(255 255 255 / 0.025) 1px,
        transparent 1px
      );
    background-size: 32px 32px;
    mask-image: linear-gradient(to bottom, black, transparent 85%);
    -webkit-mask-image: linear-gradient(to bottom, black, transparent 85%);
  }

  .composition {
    position: absolute;
    inset: 24px;
    overflow: hidden;
    border: 1px solid rgb(241 238 231 / 0.14);
  }

  .composition::before {
    position: absolute;
    inset: 10%;
    content: "";
    border: 1px solid rgb(241 238 231 / 0.07);
    border-radius: 50%;
  }

  .composition::after {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(58vw, 58vh);
    aspect-ratio: 1;
    content: "";
    border: 1px solid rgb(241 238 231 / 0.09);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  .disc {
    position: absolute;
    top: 50%;
    left: 50%;
    aspect-ratio: 1;
    border-radius: 50%;
    transform-origin: center;
  }

  .disc-one {
    width: min(74vw, 74vh);
    border: 1px solid rgb(241 238 231 / 0.12);
    transform:
      translate(-50%, -50%)
      rotate(var(--hour-turn));
  }

  .disc-one::before {
    position: absolute;
    top: -4px;
    left: 50%;
    width: 8px;
    height: 8px;
    content: "";
    border-radius: 50%;
    background: #f1eee7;
    transform: translateX(-50%);
  }

  .disc-two {
    width: min(54vw, 54vh);
    border: 1px dashed rgb(241 238 231 / 0.17);
    transform:
      translate(-50%, -50%)
      rotate(var(--minute-turn));
  }

  .disc-two::before {
    position: absolute;
    top: 50%;
    right: -3px;
    width: 6px;
    height: 6px;
    content: "";
    border-radius: 50%;
    background: #8da0ff;
    transform: translateY(-50%);
  }

  .disc-three {
    width: min(34vw, 34vh);
    background:
      conic-gradient(
        from var(--second-turn),
        #f1eee7 0deg 3deg,
        transparent 3deg 360deg
      );
    opacity: 0.28;
    transform: translate(-50%, -50%);
    mask-image: radial-gradient(
      circle,
      transparent 0 46%,
      black 47% 50%,
      transparent 51%
    );
    -webkit-mask-image: radial-gradient(
      circle,
      transparent 0 46%,
      black 47% 50%,
      transparent 51%
    );
  }

  .axis {
    position: absolute;
    background: rgb(241 238 231 / 0.08);
  }

  .axis-horizontal {
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
  }

  .axis-vertical {
    top: 0;
    left: 50%;
    width: 1px;
    height: 100%;
  }

  .time {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    grid-template-columns: auto 1px auto;
    align-items: center;
    gap: clamp(18px, 4vw, 54px);
    transform: translate(-50%, -50%);
    font-variant-numeric: tabular-nums;
  }

  .hours,
  .minutes {
    font-size: clamp(56px, 15vw, 180px);
    font-weight: 300;
    line-height: 0.82;
    letter-spacing: -0.09em;
  }

  .hours {
    text-align: right;
  }

  .minutes {
    color: #aeb8ff;
  }

  .divider {
    width: 1px;
    height: clamp(52px, 12vw, 144px);
    background: rgb(241 238 231 / 0.26);
  }

  .seconds {
    position: absolute;
    top: 28px;
    right: 28px;
    display: grid;
    place-items: center;
    width: 54px;
    aspect-ratio: 1;
    border: 1px solid rgb(241 238 231 / 0.2);
    border-radius: 50%;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }

  .seconds::before {
    position: absolute;
    inset: -7px;
    content: "";
    border: 1px solid rgb(174 184 255 / 0.32);
    border-radius: 50%;
    transform: rotate(var(--second-turn));
    clip-path: inset(0 0 76% 0);
  }

  .metadata {
    position: absolute;
    bottom: 28px;
    left: 28px;
    display: flex;
    gap: 18px;
    color: rgb(241 238 231 / 0.48);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .metadata span:last-child {
    color: #f1eee7;
    font-variant-numeric: tabular-nums;
  }

  .progress {
    position: absolute;
    right: 28px;
    bottom: 28px;
    width: min(210px, 28vw);
    height: 9px;
  }

  .progress::before {
    position: absolute;
    top: 4px;
    left: 0;
    width: 100%;
    height: 1px;
    content: "";
    background: rgb(241 238 231 / 0.14);
  }

  .minute-progress,
  .second-progress {
    position: absolute;
    left: 0;
    height: 1px;
  }

  .minute-progress {
    top: 1px;
    width: var(--minute-progress);
    background: rgb(241 238 231 / 0.45);
  }

  .second-progress {
    bottom: 1px;
    width: var(--second-progress);
    background: #aeb8ff;
  }

  @media (max-width: 560px) {
    .composition {
      inset: 14px;
    }

    .time {
      gap: 14px;
    }

    .hours,
    .minutes {
      font-size: clamp(52px, 18vw, 92px);
    }

    .metadata {
      bottom: 18px;
      left: 18px;
    }

    .metadata span:first-child {
      display: none;
    }

    .progress {
      right: 18px;
      bottom: 18px;
      width: 120px;
    }

    .seconds {
      top: 18px;
      right: 18px;
    }
  }

  @media (max-height: 340px) {
    .composition {
      inset: 12px;
    }

    .hours,
    .minutes {
      font-size: clamp(44px, 14vh, 88px);
    }

    .seconds {
      top: 14px;
      right: 14px;
      width: 42px;
    }

    .metadata,
    .progress {
      bottom: 14px;
    }
  }
</style>