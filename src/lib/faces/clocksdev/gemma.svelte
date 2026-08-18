<script>
  // Pulling the reactive time object from props
  let { time } = $props();
</script>

<!-- Time state injected straight into the root CSS context -->
<div class="hud-container" style="--hh: {time.hh}; --mm: {time.mm}; --ss: {time.ss};">
  <div class="hud-grid"></div>
  <div class="ambient-glow"></div>
  
  <!-- Outer Ring: Snap-rotates per second, scales organically using sine waves -->
  <div class="hud-ring outer" style="--ring-color: #ff0055; --ring-val: var(--ss); --ring-mult: 6deg;"></div>
  
  <!-- Middle Ring: Minute dial that smoothly creeps forward based on the current second -->
  <div class="hud-ring middle" style="--ring-color: #00f0ff; --ring-val: calc((var(--mm) * 6) + (var(--ss) * 0.1)); --ring-mult: 1deg;"></div>
  
  <!-- Inner Ring: Hour dial advancing precisely with the passing minutes -->
  <div class="hud-ring inner" style="--ring-color: #ffbe0b; --ring-val: calc((var(--hh) * 15) + (var(--mm) * 0.25)); --ring-mult: 1deg;"></div>

  <!-- Center Telemetry Display -->
  <div class="clock-core">
    <!-- The RGB split glitch jumps to new unique tracking offsets on every tick -->
    <div class="glitch-text" data-text="{time.hh}:{time.mm}:{time.ss}">
      {time.hh}:{time.mm}:{time.ss}
    </div>
    
    <!-- Real-time Loading Indicator Bar -->
    <div class="telemetry-rail">
      <div class="telemetry-bar"></div>
    </div>
    
    <div class="hud-metadata">
      <span>SYSTEM_CLOCK_CONNECTED</span>
      <span class="status-node">SYS_SEC // {time.ss}</span>
    </div>
  </div>

  <!-- Geometric Frame Hardware Layout -->
  <div class="corner-bracket tl"></div>
  <div class="corner-bracket tr"></div>
  <div class="corner-bracket bl"></div>
  <div class="corner-bracket br"></div>
</div>

<style>
  /* Base Container Setup */
  .hud-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, #0e0b16 0%, #030205 100%);
    overflow: hidden;
    font-family: 'Courier New', Courier, monospace;
    box-sizing: border-box;
    border-radius: inherit;
  }

  /* Procedural Tech Grid Background */
  .hud-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
    background-size: 20px 20px;
    background-position: center;
    pointer-events: none;
  }

  /* Ambient Backlight modulating glow using CSS Trigonometry */
  .ambient-glow {
    position: absolute;
    width: 350px;
    height: 350px;
    /* Opacity swells and shrinks organically based on the current second index */
    opacity: calc(0.3 + 0.3 * sin(calc(var(--ss) * 6deg)));
    background: radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
    transition: opacity 0.5s ease;
  }

  /* HUD Progress Rings */
  .hud-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.03);
    box-sizing: border-box;
  }

  /* Outer Ring: Snap-ticks + mechanical bounce via cubic-bezier */
  .hud-ring.outer { 
    width: 290px; 
    height: 290px; 
    transform: rotate(calc(var(--ss) * 6deg));
    scale: calc(1 + 0.03 * sin(calc(var(--ss) * 12deg)));
    transition: 
      transform 0.25s cubic-bezier(0.25, 1.4, 0.5, 1),
      scale 0.3s ease;
  }

  /* Middle Ring: Blends minutes + seconds for fluid micro-steps */
  .hud-ring.middle { 
    width: 240px; 
    height: 240px; 
    transform: rotate(calc(-1deg * ((var(--mm) * 6) + (var(--ss) * 0.1))));
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Inner Ring: Precision Hour Tracking */
  .hud-ring.inner { 
    width: 190px; 
    height: 190px; 
    transform: rotate(calc((var(--hh) * 15deg) + (var(--mm) * 0.25deg)));
    transition: transform 0.5s ease;
  }

  /* Radial masking engine to map ring fill states directly to standard units */
  .hud-ring::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    padding: 3px;
    background: conic-gradient(
      var(--ring-color) calc(var(--ring-val) * var(--ring-mult)), 
      transparent calc(var(--ring-val) * var(--ring-mult))
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    filter: drop-shadow(0 0 4px var(--ring-color));
  }

  /* Central Terminal Module */
  .clock-core {
    position: relative;
    z-index: 5;
    text-align: center;
    background: rgba(3, 2, 5, 0.85);
    padding: 24px 32px;
    border: 1px solid rgba(0, 240, 255, 0.15);
    box-shadow: 0 0 30px rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
  }

  /* Fully Prop-Driven Glitch Graphics (No Infinite Animation Loop) */
  .glitch-text {
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 900;
    color: #fff;
    letter-spacing: 4px;
    position: relative;
    /* The primary layout skews dynamically based on the current second parameter */
    transform: skewX(calc(sin(calc(var(--ss) * 40deg)) * 2deg));
    transition: transform 0.1s ease;
  }

  /* Split Chromatic Aberration Layers */
  .glitch-text::before,
  .glitch-text::after {
    content: attr(data-text);
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(3, 2, 5, 0.9);
    /* Slices custom text boxes based on geometric time configurations */
    clip-path: inset(calc(50% + sin(calc(var(--ss) * 24deg)) * 40%) 0 calc(50% - sin(calc(var(--ss) * 24deg)) * 40%) 0);
  }

  /* Cyan Shift Matrix Layer */
  .glitch-text::before {
    left: calc(sin(calc(var(--ss) * 90deg)) * 3px);
    text-shadow: -2px 0 #00f0ff;
  }

  /* Magenta Shift Matrix Layer */
  .glitch-text::after {
    left: calc(cos(calc(var(--ss) * 60deg)) * -3px);
    text-shadow: 2px 1px #ff0055;
  }

  /* Real-time Loading Rail Indicator */
  .telemetry-rail {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    margin: 12px 0 6px 0;
    overflow: hidden;
  }

  .telemetry-bar {
    height: 100%;
    /* Computes specific completion scales across each individual minute */
    width: calc(var(--ss) * 1.666%);
    background: #00f0ff;
    /* Evolves across the standard color spectrum over the course of the minute */
    filter: hue-rotate(calc(var(--ss) * 6deg));
    transition: 
      width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      filter 0.25s linear;
  }

  /* Text Details Layout */
  .hud-metadata {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8px;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 1px;
    margin-top: 4px;
  }

  .status-node {
    color: #00f0ff;
    text-shadow: 0 0 4px rgba(0, 240, 255, 0.5);
  }

  /* Frame Structural Hardware Brackets */
  .frame-bracket {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0, 240, 255, 0.25);
    pointer-events: none;
    /* Brackets shift slightly outward on even seconds for an analytical heartbeat effect */
    margin: calc(sin(calc(var(--ss) * 90deg)) * 1px);
    transition: margin 0.2s ease;
  }
  .tl { top: 20px; left: 20px; border-right: none; border-bottom: none; }
  .tr { top: 20px; right: 20px; border-left: none; border-bottom: none; }
  .bl { bottom: 20px; left: 20px; border-right: none; border-top: none; }
  .br { bottom: 20px; right: 20px; border-left: none; border-top: none; }
</style>