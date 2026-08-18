<script>
  let { time } = $props();

  const mod = (n, d) => ((n % d) + d) % d;
  
  let time_beat = $derived(mod(+time.ss + time.progress.second + +time.mm * 60 + +time.hh * 60 * 60 - +time.offsetMinutes * 60 + 60 * 60, 86400) / 86400 * 1000);
  
</script>

<div class="background">
<div class="container">
  
<div class="clock"><span class="at">@</span>{time_beat.toFixed(2).padStart(6,"0")}</div>
<div class="description">(.beat internet time)</div>
  
</div>
  </div>

<style>
  .background {
    width:100%;
    height:100%;
    background-color:#443747;
    background:linear-gradient(in oklch to bottom right, #443747 0%,#423347 90%,#a0c3de 91%,#7db9e8 100%);
    transition:0.2s background-position;
  }
  .container {
    display: grid;
    place-content: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: 32px;
    color: white;
    backgroud-color: black;
    font-family:"Segoe UI", "Segoe UI Variable", system-ui, monospace;
  }
  .clock {
    font-weight:900;
    font-size: 6vw;
    letter-spacing: -0.1vw;
    line-height:1;
    text-shadow:#000 1px 1px;
  }
  .at {
    font-weight: 300;
  }
  .description {
    font-size: 1vw;
    text-align:center;
    text-shadow:#1b151c 1px 1px;
    color:#9e87a3;
  }
</style>