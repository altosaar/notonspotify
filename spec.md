# notonspotify.jaan.io — MVP Spec

**Version:** 1.0 · **Status:** ready for implementation · **Owner:** Jaan
**One-liner:** A full-screen abstract clock that tells _track time_ instead of clock time — a minimal player for music that isn't on Spotify, sourced from YouTube, SoundCloud, and Bandcamp.

---

## 0. References

| What                 | Link                                                      | Use                                                                                                         |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Clock face direction | https://clocks.dev/clock/2564d77881f3                     | Visual reference for the face. Open in a real browser (page is JS-rendered; a plain fetch returns nothing). |
| clocks.dev generally | https://clocks.dev/                                       | The vibe: one object, black screen, nothing else.                                                           |
| Style to mirror      | https://jaan-io.pages.dev/ (Astro source repo: `jaan-io`) | Lift color, type, and spacing tokens from here. Black background, white text, extreme restraint.            |
| Attitude reference   | https://saloon.wtf/                                       | Tone only — a single-purpose toy site that takes itself exactly as seriously as it should.                  |

---

## 1. Scope

### In scope (all of it, nothing else)

1. One page. A clock face that visualizes the current track's progress.
2. Playback of tracks hosted on **YouTube**, **SoundCloud**, and **Bandcamp**.
3. Three controls: **previous**, a **giant play/pause**, **next**.
4. Track metadata line (title — artist — year).
5. Tracklist maintained as one YAML file, editable from GitHub mobile; a commit triggers deploy.
6. Responsive, mobile-first, dark. Looks like a sibling of jaan.io.

### Explicitly out of scope for MVP (do not build, do not stub UI for)

- "This is now on Spotify!" button / any shared or real-time state / any backend or KV
- The universe-of-music pie chart
- Shuffle, repeat, seek/scrub bar, volume control, queue view, tracklist view
- Multiple clock faces / random face per refresh (architecture should merely not preclude it — see §5)
- Accounts, analytics, cookies, SEO work, social cards beyond a basic og:image
- Spotify API anything

If a feature is not in the in-scope list, it is out.

---

## 2. Architecture

- **Repo:** new standalone repo, `notonspotify`. Do not touch the main-site repo except for the one redirect noted in §9.
- **Framework:** Astro (matches the main site), **zero UI frameworks** — no React/Vue/Svelte. One Astro page, one hand-written TypeScript island for the player, one for the clock (or a single island containing both).
- **Runtime deps:** none on the client beyond the platform SDKs (YouTube IFrame API, SoundCloud Widget API), which are lazy-loaded only when a track from that platform is activated. Build-time deps: `js-yaml` (or `yaml`), `zod`, `tsx` for the resolve script.
- **JS budget:** ≤ 15 KB gzipped of first-party JS, excluding platform SDKs.
- **Hosting:** Cloudflare Pages, custom domain `notonspotify.jaan.io`.

### File tree

```
notonspotify/
├── tracks.yaml                 # THE file the owner edits (repo root, easy to find on GitHub mobile)
├── scripts/
│   └── resolve.ts              # build step: tracks.yaml → src/generated/playlist.json
├── src/
│   ├── pages/index.astro
│   ├── styles/global.css
│   ├── lib/
│   │   ├── player.ts           # state machine, playlist nav, adapter orchestration
│   │   ├── clock.ts            # face rendering + time mapping
│   │   └── adapters/
│   │       ├── types.ts        # PlayerAdapter interface
│   │       ├── youtube.ts
│   │       ├── soundcloud.ts
│   │       └── bandcamp.ts
│   └── generated/
│       └── playlist.json       # gitignored, produced by resolve.ts
├── public/                     # favicon, og image
├── astro.config.mjs
└── package.json                # "build": "tsx scripts/resolve.ts && astro build"
```

---

## 3. Content pipeline

### 3.1 `tracks.yaml` schema

Playlist order = file order (top of file plays first when navigating forward). Contributor-facing comment block at the top of the file showing a copy-paste template.

```yaml
# Add a track: copy a block, edit, commit. That's it.
# url is the only thing that must be exactly right. title/artist can be fixed later.

- url: https://thenecksau.bandcamp.com/album/sex
  title: Sex
  artist: The Necks
  year: 1989
  duration: 3390 # optional, seconds — recommended for bandcamp (see §4.4)
  note: one continuous piece # optional, not rendered in MVP

- url: https://www.youtube.com/watch?v=c2u91BJc5vM
  title: Ruff Lovin
  artist: Coki
  start: 0 # optional, seconds — begin playback here (yt/sc only)
```

**Zod schema (build-time validation):**

| field      | type          | required | notes                                                                                        |
| ---------- | ------------- | -------- | -------------------------------------------------------------------------------------------- |
| `url`      | string url    | ✅       | youtube.com / youtu.be / m.youtube.com / soundcloud.com / on.soundcloud.com / *.bandcamp.com |
| `title`    | string        | ✅       |                                                                                              |
| `artist`   | string        | ✅       |                                                                                              |
| `year`     | int 1850–2100 | –        |                                                                                              |
| `duration` | int seconds   | –        | enables the clock's estimated mode for Bandcamp                                              |
| `start`    | int seconds   | –        | seek-on-play offset; ignored for Bandcamp                                                    |
| `note`     | string        | –        | stored, not rendered in MVP                                                                  |

**Failure policy:** schema errors **fail the build** with a message naming the offending entry's index and field (Cloudflare Pages keeps the last good deploy live, so a bad edit can't take the site down — it just doesn't ship). Network/resolution errors (§3.2) do **not** fail the build: the entry is skipped with a build-log warning, everything else ships.

### 3.2 `resolve.ts` (build step)

Turns raw pasted URLs into playable references. Runs on every build (list is small; no cache file needed for MVP).

1. **YouTube:** extract the 11-char video ID from any variant (`m.youtube.com`, `youtu.be`, `watch?v=`); strip `list=`, `pp=`, `ra=`, `start_radio` params. Pure string work, no network.
2. **SoundCloud:** `on.soundcloud.com/…` short links → follow redirects (HEAD/GET) to the canonical track URL. Canonical URLs pass through untouched. The widget accepts the canonical URL directly.
3. **Bandcamp:** fetch the page HTML and extract the numeric item ID and type from the `<meta name="bc-page-properties">` tag (JSON with `item_id`, `item_type`: `a` = album, `t` = track). Fallback: parse the `og:video` meta, whose URL contains `/album=<id>/` or `/track=<id>/`. Emit `{ kind: "album" | "track", id }`.
4. Output `playlist.json`: array of `ResolvedTrack { platform, embedRef, title, artist, year?, duration?, start?, sourceUrl }`.

Provide `SKIP_RESOLVE=1` env for offline dev (emits placeholder refs so the UI can be worked on without network).

### 3.3 Contributor flow (document this in the repo README, 5 lines max)

Open GitHub mobile → `tracks.yaml` → ✏️ → paste block → commit to `main` → Cloudflare Pages builds → live in ~1 minute. For `on.soundcloud.com` share links, paste as-is; the build resolves them.

---

## 4. Playback engine

### 4.1 Adapter interface

```ts
interface PlayerAdapter {
  readonly caps: { control: boolean; progress: boolean };
  mount(host: HTMLElement, track: ResolvedTrack): Promise<void>;
  play(): void; // no-op if !caps.control
  pause(): void;
  destroy(): void;
  on(event: AdapterEvent, cb: (...args) => void): void;
  // events: "ready" | "playing" | "paused" | "buffering" | "ended" | "error"
  // plus "progress" → { elapsed: number; duration: number }  (only if caps.progress)
}
```

`player.ts` owns: current index, adapter lifecycle (destroy old → mount new), the user-gesture flag, auto-advance, and error-skip. Adapters own nothing but their iframe.

### 4.2 Platform matrix

|                              | YouTube                                        | SoundCloud                                           | Bandcamp                            |
| ---------------------------- | ---------------------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| Embed                        | IFrame Player API                              | Widget API (`w.soundcloud.com/player` + `SC.Widget`) | Official `EmbeddedPlayer` iframe    |
| External play/pause          | ✅ `playVideo()/pauseVideo()`                  | ✅ `widget.play()/pause()`                           | ❌ none exists                      |
| Real progress                | ✅ poll `getCurrentTime()` ~4 Hz while playing | ✅ `PLAY_PROGRESS` event                             | ❌                                  |
| End detection → auto-advance | ✅ `onStateChange: ENDED`                      | ✅ `FINISH`                                          | ❌ (no auto-advance)                |
| `start` offset               | ✅ `seekTo` on first play                      | ✅ `seekTo`                                          | ignored                             |
| caps                         | `{control: true, progress: true}`              | `{control: true, progress: true}`                    | `{control: false, progress: false}` |

**Do not** scrape Bandcamp stream URLs (`data-tralbum` mp3 links) to gain control — it violates their terms and breaks constantly. The official embed is the ceiling for Bandcamp, by design.

### 4.3 The media dock (embeds must stay visible)

Platform terms require the players to be genuinely visible — YouTube's API terms mandate a visible player of at least 200×200 px; hiding it or shrinking it to 1px is a violation and gets embeds flagged. So the layout (§6) includes a **media dock**: a full-width strip at the bottom of the viewport containing the active platform's embed.

- YouTube: 16:9, width capped so height ≈ 200–220 px on mobile.
- SoundCloud: standard widget, `visual=false`, height 166 px, dark params (`color=%23ffffff` etc. — tune to the palette).
- Bandcamp: slim official player (`size=small`, height 42 px, `bgcol=000000`, `linkcol` = accent), sized `album` or `track` per resolved kind.

Only the **active** track's embed is mounted; switching tracks destroys the old iframe and mounts the new one.

### 4.4 Bandcamp degraded mode (the honest version)

When a Bandcamp track is active:

- The giant play button changes affordance: instead of ▶ it renders a downward nudge (↓ plus label "play below") pointing at the dock — the user must tap play inside Bandcamp's own player. Copy is literal, not apologetic.
- **Click-through detection:** listen for `window` `blur` while the pointer/touch was last over the dock iframe (the standard cross-origin iframe-click trick). On detection, treat it as "probably started."
- If `duration` is present in YAML: start an **estimated** progress timer from that moment; clock runs in estimate mode (see §5.4 for the visual tell). A second click-through toggles the estimate paused/resumed. Drift is accepted; this is an art project.
- If `duration` is absent: clock stays in idle mode (real time) while the Bandcamp track plays. Fine.
- No auto-advance from Bandcamp tracks, ever (an estimate that cuts off a track is worse than requiring one tap of →).

### 4.5 Autoplay & gestures

- Nothing plays on page load. First playback always comes from a tap on the play button (or Bandcamp's own button).
- After the first user gesture, prev/next perform programmatic `play()` on the new track for YouTube/SoundCloud.
- **Known limitation (accept, document in README):** on iOS Safari, auto-advance or prev/next across a platform boundary (e.g., a YouTube track ending into a SoundCloud track) may load paused because the fresh iframe never received a gesture. The UI must make this graceful: the state simply returns to "paused" with the play button prominent. One tap resumes. Do not build workarounds.

### 4.6 Errors

Adapter `error` (deleted video, region block, private track): show a one-line status under the metadata — `unavailable — skipping` — wait 1.5 s, advance to the next track (but never auto-advance more than 3 consecutive errors; then stop paused with `a lot of this list is broken, try →`).

---

## 5. The clock

The clock is the entire product. It is the signature element; everything else on the page stays quiet so this can be the one memorable thing.

### 5.1 States

| State                                                     | Face shows                                                                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Idle** (nothing played yet / Bandcamp without duration) | Actual local time, mapped natively — the site is a working abstract clock when it isn't a player. This is the load screen. |
| **Playing**                                               | Track time (mapping below).                                                                                                |
| **Paused**                                                | Track time, frozen. Subtle: reduce face opacity to ~0.6.                                                                   |
| **Buffering**                                             | Track time, with the seconds-layer element pulsing.                                                                        |
| **Estimate** (Bandcamp)                                   | As Playing, plus the estimate tell (§5.4).                                                                                 |

### 5.2 Time mapping (playing)

- **Primary layer** (whatever reads as the "hour hand" / dominant element in the reference face): one full revolution per **track** — i.e., angle = `elapsed / duration × 360°`. This is the progress indicator.
- **Secondary layer** ("minute hand" equivalent): one full revolution per **minute of playback** — angle = `(elapsed mod 60) / 60 × 360°`. Gives the face motion at a legible speed.
- **Tertiary layer** ("seconds" equivalent, if the face has one): real seconds, continuous sweep — keeps the object feeling alive even on a 50-minute Necks track.
- Unknown duration (rare for yt/sc): primary layer hidden or held at 12; secondary/tertiary still run.
- Animation via a single `requestAnimationFrame` loop; interpolate between progress events so hands sweep smoothly rather than ticking at the 4 Hz poll rate.

### 5.3 Rendering & the reference face

- **SVG**, hand-rolled, in `clock.ts`. No canvas, no libs. Face is a square `viewBox`, scales to `min(72vw, 46vh)` on mobile and `min(46vh, 40vw)` on desktop, centered.
- Open the reference clock (https://clocks.dev/clock/2564d77881f3) in a browser and match its **character** — composition, weight, motion, restraint — but implement an **original** face; do not copy its code or clone it stroke-for-stroke (individual clocks.dev submissions are other people's work).
- **Fallback base face** (build this first; tune toward the reference after viewing it): black field; thin white outer ring; the primary layer is a hairline radial hand plus a faint arc that fills along the ring with track progress; secondary layer a shorter hand; tertiary a small orbiting dot; 12 minimal tick marks; no numerals; everything monochrome except at most one accent use.
- Structure the code so a face is one module implementing `renderFace(el, mapping)` — that's the only concession to the future "random face per refresh" idea. Build exactly one face.

### 5.4 The estimate tell

In estimate mode the face gets one honest marker — e.g., the progress arc renders dashed instead of solid. No tooltip, no explainer. Pick one device and keep it.

### 5.5 Reduced motion

`prefers-reduced-motion: reduce` → update hand positions once per second (discrete ticks), disable the buffering pulse and the seconds sweep.

---

## 6. UI, layout, style

### 6.1 Layout (mobile-first, one column, no breakpo­int gymnastics)

```
┌──────────────────────────┐
│ NOT ON SPOTIFY        ↗  │   header: wordmark (links home to jaan.io), tiny "n / N" counter
│                          │
│                          │
│        ( clock )         │   dominant, centered, generous space
│                          │
│                          │
│   Title — Artist · 1989  │   one line, truncates with ellipsis; status line appears under it
│                          │
│    ◄     ⬤ PLAY     ►    │   prev 64px · play 112px · next 64px tap targets
│                          │
│ [ media dock: embed    ] │   pinned to bottom, full-width, the active platform's player
└──────────────────────────┘
```

Desktop: same column, `max-width: 560px`, centered; dock stays bottom-of-column. No layout forks beyond sizing.

### 6.2 Style tokens

- Mirror the main site: pull the exact background (`#000`-family), text color, font-family, letter-spacing, and link treatment from the `jaan-io` repo's global styles so the two sites are visibly siblings. Do not introduce a new display typeface; the clock is the personality, the type stays utilitarian.
- One accent color maximum, used only for: the estimate tell (if not dashed), Bandcamp `linkcol`, and focus rings. If the main site has no accent, use white and skip the accent entirely.
- Buttons: no boxes, no gradients, no shadows. The play control is a large circle outline with a ▶/⏸ glyph or the "play below" state (§4.4). Hover/active states are opacity shifts.

### 6.3 Copy

Sentence case, plain verbs, no exclamation marks, no apologies. The full copy inventory for MVP: `not on spotify` (wordmark), `n / N`, `play` / `pause` / `play below`, `unavailable — skipping`, `a lot of this list is broken, try →`. Nothing else.

---

## 7. Behavior spec

1. **Load:** pick a random track index (`RANDOM_START = true`, a named constant), render it paused/idle, clock shows local time. Refresh = probably a different track: the "each refresh" spirit at zero cost.
2. **Play (yt/sc):** lazy-load the platform SDK if needed → mount → `seekTo(start)` if set → play. Clock switches idle → playing.
3. **Prev/next:** wrap around at both ends. Destroy the outgoing adapter before mounting the next. If playback was in progress, attempt programmatic play on the new track (§4.5 caveat applies).
4. **Auto-advance:** on `ended` (yt/sc only) → next track, attempt play.
5. **Keyboard:** `Space` toggle, `←`/`→` prev/next. Visible focus rings.
6. **Media dock:** exactly one iframe mounted at any time.
7. **Page title:** `title — artist · not on spotify` while playing; `not on spotify` otherwise.

---

## 8. Accessibility & performance floor

- All three controls are real `<button>`s with `aria-label`s; clock SVG gets `role="img"` and an `aria-label` of `"track progress: 34%"` (updated at most 1/s) or `"clock"` in idle.
- Status line changes announced via a polite live region.
- Lighthouse (mobile) ≥ 95 performance on first load with no track playing; zero layout shift when the dock mounts (reserve the dock's height per platform before the iframe loads).
- No fonts loaded beyond what the main site already uses; no third-party requests until a platform is activated.

---

## 9. Deployment

1. Cloudflare Pages project `notonspotify`, production branch `main`, build `npm run build`, output `dist/`, Node 20.
2. Custom domain: `notonspotify.jaan.io` (DNS is on Cloudflare; Pages auto-creates the CNAME + cert).
3. **Main-site task (one line, separate PR to the `jaan-io` repo):** redirect `jaan.io/notonspotify` → `https://notonspotify.jaan.io` (302), via `_redirects` or Astro redirect config.
4. `robots.txt`: allow everything; no other SEO work.

---

## 10. Acceptance criteria

- [ ] On iPhone Safari and Android Chrome: tapping the play button on a YouTube track starts audio, and the clock's primary layer completes exactly one revolution over the track's duration.
- [ ] Same for a SoundCloud track added via an `on.soundcloud.com` short link (resolution happened at build time).
- [ ] A Bandcamp album track: play button reads `play below`; tapping play inside the Bandcamp embed flips the clock into estimate mode (dashed tell) when `duration` is set; without `duration`, clock keeps showing local time.
- [ ] Prev/next work, wrap around, and swap the media dock's iframe; only one iframe exists in the DOM at any time.
- [ ] A YouTube track ending auto-advances; a Bandcamp track never auto-advances.
- [ ] Adding a track by editing `tracks.yaml` in GitHub mobile deploys and shows the track with no other changes.
- [ ] A malformed YAML entry fails the build with a message naming the entry; the live site is unaffected.
- [ ] A deleted YouTube video shows `unavailable — skipping` and advances after ~1.5 s.
- [ ] Embeds are genuinely visible (YouTube ≥ 200×200) — no hidden/1px players anywhere.
- [ ] Idle state is a functioning abstract clock showing real local time.
- [ ] `prefers-reduced-motion` produces 1 Hz ticks and no pulse animation.
- [ ] First-party JS ≤ 15 KB gzip; no SDK loads before first platform activation; CLS = 0 on dock mount.
- [ ] Space/arrow keys work; all controls have focus rings and labels.

---

## 11. Seed `tracks.yaml`

Ship with this seed (covers all three platforms and both Bandcamp kinds). Titles marked `TODO` need the owner's confirmation — resolve the URL, keep the block, fix the words later.

```yaml
- url: https://thenecksau.bandcamp.com/album/sex
  title: Sex
  artist: The Necks
  year: 1989
  duration: 3390

- url: https://losttraveler.bandcamp.com/track/nocturnal-essences-alternative-edition
  title: Nocturnal Essences (Alternative Edition)
  artist: Lost Traveler

- url: https://astromegamusic.bandcamp.com/album/godbodydevine-vol-1-2
  title: GODBODYDEVINE Vol. 1 & 2
  artist: Astro Mega

- url: https://garcondior.bandcamp.com/album/omp-1
  title: OMP-1
  artist: Garçon D'ior

- url: https://youmustrememberthis.bandcamp.com/album/you-must-remember-this-2
  title: You Must Remember This 2
  artist: You Must Remember This

- url: https://www.youtube.com/watch?v=c2u91BJc5vM
  title: Ruff Lovin
  artist: Coki

- url: https://www.youtube.com/watch?v=zpV7radKuwo
  title: Alicia
  artist: Mala

- url: https://www.youtube.com/watch?v=tO3e0jIfwls
  title: علق قلبي طفلة عربية
  artist: Talal Maddah

- url: https://www.youtube.com/watch?v=VUM4-h7T7os
  title: Better Days (slowed) # TODO verify
  artist: NEIKED

- url: https://on.soundcloud.com/sUQ5pKA7D0n2C1nNnS
  title: TODO
  artist: TODO

- url: https://on.soundcloud.com/HTBurTAbG004zeaZfk
  title: TODO
  artist: TODO

- url: https://on.soundcloud.com/EFk71dOy6rDMLURa2f
  title: TODO
  artist: TODO
```

The owner's full backlog (~50 more entries) gets added post-launch via the GitHub mobile flow; it is content, not scope.

---

## 12. Decisions made here (changeable, but change them deliberately)

1. **Bandcamp is tier-2 by design** — official embed only, estimated clock, no auto-advance. The alternative (scraping stream URLs) is off the table.
2. **Embeds stay visible** in a bottom dock rather than hidden, for platform-terms compliance. This constrains the layout and is non-negotiable.
3. **Random track on refresh**, sequential navigation after — the cheapest possible homage to "each refresh, a different player."
4. **Idle = a real clock.** The empty state is the art object, not a spinner.
5. **Schema errors fail builds; network errors don't.** Author mistakes should be loud; flaky networks shouldn't take edits hostage.
6. **One clock face**, built behind a one-function interface so faces can multiply later without a rewrite.
