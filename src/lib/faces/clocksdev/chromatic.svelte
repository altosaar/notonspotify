<script>
  export let time

  $: hourAngle = ((time.hour % 12) + time.minute / 60 + time.second / 3600) * 30
  $: minuteAngle = (time.minute + time.second / 60 + time.millisecond / 60000) * 6
  $: secondAngle = (time.second + time.millisecond / 1000) * 6
</script>

<div
  class="sweep-clock"
  role="img"
  aria-label={`Chromatic clock showing ${time.hh}:${time.mm}:${time.ss}`}
>
  <div class="composition">
    <div class="sector seconds" style:--sweep={`${secondAngle}deg`}></div>
    <div class="sector minutes" style:--sweep={`${minuteAngle}deg`}></div>
    <div class="sector hours" style:--sweep={`${hourAngle}deg`}></div>
    <div class="pin"></div>
  </div>
</div>

<style>
  .sweep-clock {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    background: #000;
    isolation: isolate;
  }

  .composition {
    position: absolute;
    inset: 0;
    transform: scale(0.72);
    transform-origin: center;
  }

  .sector {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--size);
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transform-origin: center;
    -webkit-mask: conic-gradient(
      from 0deg,
      #000 0deg,
      #000 var(--sweep),
      transparent var(--sweep),
      transparent 360deg
    );
    mask: conic-gradient(
      from 0deg,
      #000 0deg,
      #000 var(--sweep),
      transparent var(--sweep),
      transparent 360deg
    );
  }

  .seconds {
    --size: 122cqw;
    z-index: 1;
    background:
      radial-gradient(circle at 50% 50%, rgb(25 40 60 / 96%), rgb(6 17 34 / 98%) 74%),
      conic-gradient(from 0deg, #193044, #0b1a30 42%, #071327 69%, #15293b);
    opacity: 0.95;
  }

  .minutes {
    --size: 95cqw;
    z-index: 2;
    background: conic-gradient(
      from 0deg,
      #2638dc 0deg,
      #5639d3 12deg,
      #b24aba 24deg,
      #ff7f89 42deg,
      #ef6e7f 105deg,
      #ae5793 190deg,
      #5942a7 274deg,
      #2739d3 360deg
    );
    mix-blend-mode: screen;
    opacity: 0.9;
  }

  .hours {
    --size: 57cqw;
    z-index: 3;
    background: conic-gradient(
      from 0deg,
      #2938e3 0deg,
      #743ee0 22deg,
      #ff7e91 55deg,
      #ef7585 126deg,
      #ad5b98 204deg,
      #6946a8 254deg,
      #2738cb 310deg,
      #2938e3 360deg
    );
    mix-blend-mode: screen;
    opacity: 0.86;
  }

  .pin {
    position: absolute;
    z-index: 5;
    top: 50%;
    left: 50%;
    width: 3cqw;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #000;
    box-shadow: 0 0 0 1.6cqw rgb(255 105 136 / 13%);
    transform: translate(-50%, -50%);
  }

  @media (prefers-reduced-motion: reduce) {
    .sector {
      transition: none;
    }
  }
</style>
