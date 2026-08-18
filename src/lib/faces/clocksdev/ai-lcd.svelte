<script>
	let { time } = $props();

	const segmentMap = {
		0: ['a', 'b', 'c', 'd', 'e', 'f'],
		1: ['b', 'c'],
		2: ['a', 'b', 'g', 'e', 'd'],
		3: ['a', 'b', 'c', 'd', 'g'],
		4: ['f', 'g', 'b', 'c'],
		5: ['a', 'f', 'g', 'c', 'd'],
		6: ['a', 'f', 'g', 'e', 'c', 'd'],
		7: ['a', 'b', 'c'],
		8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
		9: ['a', 'b', 'c', 'd', 'f', 'g']
	};

	const allSegments = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

	function twoDigits(value) {
		return String(value ?? 0).padStart(2, '0');
	}

	function segmentIsLit(digit, segment) {
		return segmentMap[Number(digit)]?.includes(segment) ?? false;
	}

	function secondValue() {
		return Number(time?.ss ?? 0);
	}

	function floatingY(offset) {
		const phase = ((secondValue() + offset) % 60) / 60;
		return Math.sin(phase * Math.PI * 2) * 7;
	}

	function floatingX(offset) {
		const phase = ((secondValue() + offset) % 60) / 60;
		return Math.cos(phase * Math.PI * 2) * 4;
	}

	function floatingRotation(offset) {
		const phase = ((secondValue() + offset) % 60) / 60;
		return Math.sin(phase * Math.PI * 2) * 3;
	}
</script>

<div class="page">
	<div class="watch">
		<div class="watch-edge"></div>

		<header class="case-header">
			<div class="brand">DIGITAL QUARTZ</div>
			<div class="model">LCD · 1983</div>
		</header>

		<div class="screen">
			<div class="lcd-scanlines"></div>
			<div class="glass-reflection"></div>

			<div class="screen-header">
				<div class="weekdays">
					<span>MO</span>
					<span>TU</span>
					<span class="weekday-lit">WE</span>
					<span>TH</span>
					<span>FR</span>
					<span>SA</span>
					<span>SU</span>
				</div>

				<div class="format-label">24H</div>
			</div>

			<div
				class="floating-shape floating-diamond"
				style:transform={`translate(${floatingX(0)}px, ${floatingY(0)}px) rotate(${14 + floatingRotation(0)}deg)`}
			>
				◆
			</div>

			<div
				class="floating-shape floating-square"
				style:transform={`translate(${floatingX(20)}px, ${floatingY(20)}px) rotate(${floatingRotation(20)}deg)`}
			>
				■
			</div>

			<div
				class="floating-shape floating-cross"
				style:transform={`translate(${floatingX(40)}px, ${floatingY(40)}px) rotate(${floatingRotation(40)}deg)`}
			>
				+
			</div>

			<div class="decorative-line line-left"></div>
			<div class="decorative-line line-right"></div>

			<div class="main-time">
				<div class="digit-pair">
					{#each [...twoDigits(time?.hh)] as digit}
						<div class="digit">
							{#each allSegments as segment}
								<span
									class="segment {segment}"
									class:segment-lit={segmentIsLit(digit, segment)}
								></span>
							{/each}
						</div>
					{/each}
				</div>

				<div
					class="colon"
					class:colon-lit={secondValue() % 2 === 0}
				>
					<span></span>
					<span></span>
				</div>

				<div class="digit-pair">
					{#each [...twoDigits(time?.mm)] as digit}
						<div class="digit">
							{#each allSegments as segment}
								<span
									class="segment {segment}"
									class:segment-lit={segmentIsLit(digit, segment)}
								></span>
							{/each}
						</div>
					{/each}
				</div>

				<div class="seconds">
					{#each [...twoDigits(time?.ss)] as digit}
						<div class="small-digit">
							{#each allSegments as segment}
								<span
									class="segment {segment}"
									class:segment-lit={segmentIsLit(digit, segment)}
								></span>
							{/each}
						</div>
					{/each}
				</div>
			</div>

			<footer class="screen-footer">
				<div class="status-label">
					<span class="status-symbol">◉</span>
					<span>ALM</span>
				</div>

				<div class="status-label">
					<span class="status-symbol">◒</span>
					<span>SIG</span>
				</div>

				<div class="water-label">WATER RESIST</div>
			</footer>
		</div>

		<footer class="case-footer">
			<span>MODE</span>
			<span>LIGHT</span>
			<span>START</span>
		</footer>
	</div>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
	}

	.page {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		min-height: 100%;
		padding: clamp(14px, 4vw, 48px);
		overflow: hidden;
		background:
			radial-gradient(
				circle at 50% 36%,
				rgba(117, 150, 142, 0.2),
				transparent 43%
			),
			linear-gradient(
				145deg,
				#080a0b,
				#182021 52%,
				#070909
			);
		font-family: Arial, Helvetica, sans-serif;
	}

	.watch {
		position: relative;
		width: min(94vw, 850px);
		padding: clamp(14px, 2.8vw, 30px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: clamp(18px, 3vw, 34px);
		background:
			linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.14),
				transparent 22%,
				transparent 66%,
				rgba(0, 0, 0, 0.42)
			),
			linear-gradient(
				155deg,
				#363c3e,
				#171b1c 58%,
				#090b0c
			);
		box-shadow:
			0 34px 85px rgba(0, 0, 0, 0.68),
			0 9px 18px rgba(0, 0, 0, 0.52),
			inset 0 1px 1px rgba(255, 255, 255, 0.25),
			inset 0 -4px 9px rgba(0, 0, 0, 0.72);
		transform: perspective(1100px) rotateX(2deg);
	}

	.watch-edge {
		position: absolute;
		inset: 7px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: inherit;
		pointer-events: none;
	}

	.case-header,
	.case-footer {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-inline: 9px;
		color: #bec6c3;
		font-size: clamp(8px, 1.1vw, 12px);
		font-weight: 700;
		letter-spacing: 0.2em;
		text-shadow: 0 1px 1px #000;
	}

	.case-header {
		margin-bottom: 10px;
	}

	.case-footer {
		margin-top: 12px;
		opacity: 0.5;
	}

	.brand {
		color: #d8dddb;
	}

	.model {
		opacity: 0.62;
		font-weight: 500;
	}

	.screen {
		position: relative;
		min-height: clamp(235px, 43vw, 400px);
		padding: clamp(18px, 3.8vw, 38px);
		overflow: hidden;
		border: clamp(7px, 1.4vw, 13px) solid #0b0e0e;
		border-radius: clamp(12px, 2vw, 22px);
		background:
			linear-gradient(
				120deg,
				rgba(255, 255, 255, 0.12),
				transparent 24%,
				transparent 72%,
				rgba(26, 37, 30, 0.15)
			),
			#adb49a;
		box-shadow:
			inset 0 0 0 2px rgba(223, 229, 205, 0.28),
			inset 0 6px 14px rgba(28, 35, 29, 0.5),
			inset 0 -3px 8px rgba(255, 255, 255, 0.2),
			0 2px 1px rgba(255, 255, 255, 0.1);
		color: #263027;
	}

	.lcd-scanlines {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		opacity: 0.15;
		background-image:
			repeating-linear-gradient(
				0deg,
				rgba(22, 31, 23, 0.11) 0,
				rgba(22, 31, 23, 0.11) 1px,
				transparent 1px,
				transparent 4px
			);
	}

	.glass-reflection {
		position: absolute;
		inset: 0;
		z-index: 8;
		pointer-events: none;
		background:
			linear-gradient(
				118deg,
				rgba(255, 255, 255, 0.23),
				rgba(255, 255, 255, 0.035) 25%,
				transparent 46%
			);
		mix-blend-mode: screen;
	}

	.screen-header,
	.screen-footer {
		position: relative;
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-weight: 800;
		letter-spacing: 0.14em;
	}

	.screen-header {
		font-size: clamp(7px, 1.2vw, 12px);
	}

	.screen-footer {
		font-size: clamp(7px, 1.15vw, 12px);
	}

	.weekdays {
		display: flex;
		gap: clamp(5px, 1.3vw, 14px);
	}

	.weekdays span {
		opacity: 0.23;
	}

	.weekdays .weekday-lit {
		opacity: 0.94;
		text-shadow: 0 3px 5px rgba(31, 40, 31, 0.25);
		transform: translateY(-1px);
	}

	.format-label {
		padding: 4px 6px;
		border: 1px solid rgba(38, 48, 39, 0.3);
		border-radius: 3px;
		box-shadow: 0 3px 5px rgba(31, 40, 31, 0.16);
	}

	.main-time {
		position: relative;
		z-index: 4;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: clamp(5px, 1.4vw, 15px);
		margin:
			clamp(30px, 7vw, 66px)
			0
			clamp(26px, 5vw, 50px);
		filter: drop-shadow(0 6px 4px rgba(40, 49, 38, 0.18));
	}

	.digit-pair,
	.seconds {
		display: flex;
		gap: clamp(5px, 1.1vw, 11px);
	}

	.digit {
		--digit-width: clamp(47px, 10vw, 96px);
		--digit-height: calc(var(--digit-width) * 1.72);
		--thickness: calc(var(--digit-width) * 0.13);

		position: relative;
		width: var(--digit-width);
		height: var(--digit-height);
	}

	.small-digit {
		--digit-width: clamp(19px, 4vw, 38px);
		--digit-height: calc(var(--digit-width) * 1.72);
		--thickness: calc(var(--digit-width) * 0.14);

		position: relative;
		width: var(--digit-width);
		height: var(--digit-height);
	}

	.seconds {
		margin-bottom: 2px;
		margin-left: clamp(2px, 1vw, 8px);
	}

	.segment {
		position: absolute;
		display: block;
		background: rgba(42, 52, 41, 0.075);
	}

	.segment.segment-lit {
		background: #263027;
		filter: drop-shadow(0 3px 1px rgba(37, 46, 36, 0.2));
	}

	.segment.a,
	.segment.g,
	.segment.d {
		left: var(--thickness);
		width: calc(100% - var(--thickness) * 2);
		height: var(--thickness);
		clip-path: polygon(
			10% 0,
			90% 0,
			100% 50%,
			90% 100%,
			10% 100%,
			0 50%
		);
	}

	.segment.a {
		top: 0;
	}

	.segment.g {
		top: calc(50% - var(--thickness) / 2);
	}

	.segment.d {
		bottom: 0;
	}

	.segment.b,
	.segment.c,
	.segment.e,
	.segment.f {
		width: var(--thickness);
		height: calc(50% - var(--thickness));
		clip-path: polygon(
			50% 0,
			100% 10%,
			100% 90%,
			50% 100%,
			0 90%,
			0 10%
		);
	}

	.segment.b {
		top: calc(var(--thickness) * 0.55);
		right: 0;
	}

	.segment.c {
		right: 0;
		bottom: calc(var(--thickness) * 0.55);
	}

	.segment.e {
		left: 0;
		bottom: calc(var(--thickness) * 0.55);
	}

	.segment.f {
		top: calc(var(--thickness) * 0.55);
		left: 0;
	}

	.colon {
		display: flex;
		flex-direction: column;
		align-self: center;
		gap: clamp(22px, 4.5vw, 44px);
		margin-inline: clamp(0px, 0.7vw, 6px);
		opacity: 0.25;
	}

	.colon.colon-lit {
		opacity: 1;
	}

	.colon span {
		width: clamp(8px, 1.6vw, 15px);
		aspect-ratio: 1;
		border-radius: 2px;
		background: #263027;
		box-shadow: 0 4px 2px rgba(37, 46, 36, 0.17);
	}

	.status-label {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-symbol {
		font-size: 1.2em;
	}

	.water-label {
		opacity: 0.62;
	}

	.floating-shape {
		position: absolute;
		z-index: 2;
		color: rgba(37, 48, 37, 0.13);
		text-shadow: 0 8px 5px rgba(32, 43, 32, 0.1);
	}

	.floating-diamond {
		top: 24%;
		left: 9%;
		font-size: clamp(18px, 4vw, 35px);
	}

	.floating-square {
		right: 12%;
		bottom: 21%;
		font-size: clamp(12px, 2.5vw, 24px);
	}

	.floating-cross {
		top: 17%;
		right: 31%;
		font-size: clamp(15px, 3vw, 27px);
	}

	.decorative-line {
		position: absolute;
		z-index: 2;
		height: 1px;
		background:
			linear-gradient(
				90deg,
				transparent,
				rgba(36, 47, 36, 0.16),
				transparent
			);
	}

	.line-left {
		top: 31%;
		left: 4%;
		width: 28%;
		transform: rotate(-7deg);
	}

	.line-right {
		right: 3%;
		bottom: 27%;
		width: 22%;
		transform: rotate(8deg);
	}

	@media (max-width: 600px) {
		.page {
			padding: 10px;
		}

		.watch {
			width: 100%;
			padding: 12px;
		}

		.screen {
			padding: 16px 12px;
		}

		.seconds {
			display: none;
		}

		.weekdays {
			gap: 5px;
		}

		.main-time {
			gap: 5px;
		}
	}
</style>