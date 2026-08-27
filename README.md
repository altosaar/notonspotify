# notonspotify.jaan.io

A full-screen abstract clock that tells **track time** instead of clock time — a
minimal player for music that isn't on Spotify, sourced from YouTube,
SoundCloud, and Bandcamp. Sibling of [jaan.io](https://jaan.io); same black,
same two typefaces, one moving object.

## Add a track

1. Open [`tracks.yaml`](./tracks.yaml) on GitHub (mobile is fine) → ✏️.
2. Copy a block, paste your link, fill in title and artist.
3. Commit to `main`.
4. GitHub Actions builds and deploys; live in about a minute.

`on.soundcloud.com` share links are fine as-is — the build expands them. Order in
the file is playing order. A malformed entry fails the build and names itself in
the log; the live site keeps running on the last good deploy until it's fixed.

`link:` is optional and does one thing: it puts a small ↗ under the play button
pointing wherever the artist would rather you went — their Bandcamp, their site.
Unlike `url:` it isn't limited to the three platforms, because it is never
played.

`banger: true` is the other optional flag: a pulsing siren-red dot and the words
_certified banger_ under the artist's name. It is a flag, not a rating — the
tracks without it aren't worse, they just haven't been called out.

## How it works

```
tracks.yaml  →  scripts/resolve.ts  →  src/generated/playlist.json  →  one page
```

`resolve.ts` runs before every build. It validates the YAML (zod), extracts
YouTube video ids, follows SoundCloud short links, and reads the Bandcamp item
id and duration off the album page (from its schema.org block — a `duration:` in
`tracks.yaml` overrides it). **Schema errors fail the build** — an author mistake
should be loud. **Network errors don't** — a Bandcamp page that times out drops
that one track with a warning and everything else ships.

The browser gets one hand-written module, no framework:

- `src/lib/clock.ts` — the mapping from seconds to the three numbers a face
  draws, and the animation loop.
- `src/lib/faces/` — one file per clock face, all implementing the same tiny
  contract: build yourself into an `<svg>`, set your own shape, hand back a
  function that moves your parts. Adding a ninth is one file plus one line in
  `faces/index.ts`; nothing else in the app knows how many there are.
- `src/lib/player.ts` — playlist navigation, adapter lifecycle, the estimate.
- `src/lib/adapters/*` — one per platform. Each owns an iframe and nothing else.

```bash
npm run dev            # resolve, then serve on :4321
npm run build          # resolve, then build to dist/
SKIP_RESOLVE=1 npm run dev   # no network: placeholder refs, real UI
npm run check          # astro check / tsc
```

Node 24 (`.nvmrc`) — Astro 7 requires ≥ 22.12. CI reads the version out of that
file and there is nowhere else to set it: Cloudflare builds nothing here, it
receives `dist/`. See [Deploy](#deploy).

## Things that are deliberate

- **Nothing plays on load.** The first tap is the browser's autoplay gesture and
  the first request to YouTube or SoundCloud. Bandcamp is the exception — see
  below.
- **The clock starts when you press play, and not before.** It measures a track,
  so with no track running it sits at rest — arc empty — rather than filling in
  as a wall clock. Nothing animates until there is something to animate: no
  timers run behind an idle page.
- **Every track gets its own clock, and no two share one.** The library is all
  40 of clocks.dev. `resolve.ts` deals one per track at build time, without
  replacement, so a build with 23 tracks uses 23 different clocks and a rebuild
  deals a new set.
- **The faces have different shapes**, and the room they get does not change:
  the clock box is a fixed height, and each face's viewBox scales inside it. A
  wide one (`bars`, `grid`) uses the full column, a tall one (`column`) uses the
  full height, a square one fits the smaller of the two. Nothing else on the
  page moves when the face changes.
- **`#face=grid`** in the URL pins one face, for looking at a single one without
  pressing → until it comes up.
- **`?` opens the credits**, full screen, over everything: where the clocks came
  from, who wrote the code, whose thought it was, and a `mailto:` for sending a
  song in with the subject line already filled. It's a real `<dialog>` — focus
  goes to the panel rather than its × so Space, the play key everywhere else,
  does nothing while it's up; Escape and the × are the ways out.
- **The embeds are visible, in a band at the bottom.** Platform terms require it
  (YouTube's want ≥ 200×200), so the layout is built around them rather than
  around hiding them. The band runs from the bottom of the play button to the
  bottom of the screen and is **one height for every platform** — YouTube is the
  tallest, so it sets it, and SoundCloud's 166px and Bandcamp's 42px sit centred
  in the same space. The clock and the controls are therefore fixed: nothing on
  the page moves when a track changes platform, when an embed finally loads, or
  when there's no embed at all. The clock takes whatever room is left over,
  which is what makes it smaller than it would otherwise be.
- **Bandcamp mounts on sight.** Its embed is the only thing that can start it, so
  it appears the moment its track becomes current — on arrival, and on load —
  rather than costing a tap just to reveal the player. The trade: for Bandcamp
  tracks the page does make third-party requests before you press anything, and
  Bandcamp's embed brings its own analytics with it.
- **Bandcamp is still tier 2, and this was checked rather than assumed.** Their
  player bundle registers no message listener, so there is no inbound channel;
  the one autoplay branch in it is gated on a `facebook.com` parameter that the
  server parses but that never fires playback for a third-party embed. Doing
  better would mean scraping stream URLs, which is off the table.
- **So on a Bandcamp track the big button is a sign, not a control.** It reads
  `click below to play` and is genuinely `disabled` — a tap, Space, or a screen
  reader activating it all do nothing. It used to focus the embed, which fired
  the same window blur a real click does, and so started the estimated clock
  over a track nobody had played. Only a click inside Bandcamp's own player
  starts anything now: the click-through detector asks whether focus has moved
  INTO the dock's iframe, which switching tab or app cannot fake.
- **The repeat control is the whole header.** Top right, three states, cycling on
  each press and remembered between visits: **off** (a finished track stops
  there), **repeat** (on to the next one), **repeat one** (the same track again
  from the top). Off is where a first visit starts. There is no wordmark and no
  track counter — the page is the clock and one button.
- **Repeat, per platform.** YouTube and SoundCloud hand off, or replay, when the
  track ends; replaying is just `play()` on a finished player, which both restart
  from the beginning. Bandcamp has no end event, so **repeat** books the hand-off
  from the duration instead, timed from the click-through that says playback
  began — which is why every Bandcamp entry gets a duration whether or not
  `tracks.yaml` gives it one. **Repeat one** does nothing on Bandcamp: its embed
  can't be restarted any more than it can be started.
- **Nothing can autoplay a Bandcamp track**, by four independent locks: the
  adapter reports `caps.control: false` and every `play()` call in the app is
  gated on it; the adapter's own `play()` is an empty function; the embed URL
  carries no autoplay parameter; and the iframe is given no `allow="autoplay"`,
  so it cannot borrow this page's user activation either.
- **Repeat still can't start a Bandcamp track for you.** If it hands off into
  one, the record is on screen and waiting for one tap. Nothing on the open web
  can do better with their embed.
- **A random track on every refresh**, sequential from there.
- **Known iOS limitation:** crossing a platform boundary (a YouTube track ending
  into a SoundCloud one) can land paused, because the fresh iframe never
  received a user gesture. The UI just returns to "paused" with the play button
  prominent — one tap resumes. There is no workaround worth building.
- **Reduced motion** replaces the sweep with one-second ticks and drops the
  buffering pulse.

## Mirrored clocks

`src/lib/faces/clocksdev/` holds forty clocks copied byte-for-byte from
[clocks.dev](https://clocks.dev/). They are unmodified — `.prettierignore`
covers them, because reformatting a copy stops it being one — and they are
Svelte, which is the only reason this project has a Svelte dependency at all.
Nothing is server-rendered by it; `clock.ts` mounts one component at a time into
the clock box.

**They are public domain.** clocks.dev's publish flow has authors agree to
"release your clock's code into the public domain, where anyone may use, modify,
and share it" ([clocks.dev/create](https://clocks.dev/create)), so mirroring them
verbatim is exactly what the terms allow. Every author is still named in the
about panel: a public domain dedication gives away the copyright, not the
authorship, and twenty-three people drew these.

The one seam between those components and this site is `time.ts`. They ask for an
hour, a minute and a second; what they get is **track** time:

- **seconds and minutes** are the track, running. Zero when it starts, counting
  up in real time, so a clock reads `00:00:00` the moment a track does.
- **hours** are the _playlist_. Track n of N puts the hour hand at `n / N × 12`,
  so the hour says how far through the list you are and holds still for the
  length of a track.
- the **sub-second** is real and unrounded, which is what makes the sweep smooth:
  every one of these animates off `millisecond` or off `progress.*`, and both
  come straight off the same fractional elapsed time. Their own `time.progress.*`
  contract — the sub-unit fractions six of them sweep on — is an object, not a
  number, and is honoured exactly.

So the components are untouched copies and the site still tells track time.

`npm test` mounts all forty, drives them through a track, and unmounts them.
Nobody here can look at forty clocks; CI can at least prove none of them throws
or sits frozen.

### Picking which ones are allowed

Not all forty suit this page, and some barely move at the speed a track runs at.

```bash
npm run dev        # then open /faces/1
```

Ten clocks a page, all running, each numbered by its place in `faces.json`.
Four checkboxes each:

| box              | what it means                                                                |
| ---------------- | ---------------------------------------------------------------------------- |
| **include**      | off and this clock is never dealt to a track                                 |
| **10×**          | its seconds run ten times faster, for one too still to read otherwise        |
| **numbers only** | drop every run of text with no digit in it — the poster goes, the time stays |
| **no writing**   | drop the numbers, colons and marks too, leaving only what the clock draws    |

The last two work on the mounted DOM and never on the components themselves, so
the mirrors stay copies. **no writing** wins over **numbers only** if both are
set. Whitespace survives either — blanking it collapses the layout the clock is
built in. **❚❚** freezes the page, **10×** at the
top ticks all ten at once, and **faces.json** copies the result to the clipboard
— paste it over [`faces.json`](./faces.json) at the root, which is what the build
reads. Selections survive page changes (localStorage), so all four pages are one
sitting.

`faces.json` is the only thing that matters afterwards: `include: false` and a
clock is never dealt to a track, `x10: true` and its seconds run ten times faster
on the live site, `notext: true` and only its numbers survive, `nonumbers: true`
and nothing written survives at all. A face missing from the file is included at 1×, so a newly
mirrored clock shows up rather than vanishing. Turning them all off fails the
build rather than shipping an empty clock.

The picker is dev-server only — `getStaticPaths` returns nothing in a production
build, so `/faces` is not in `dist/` and never deploys.

## Deploy

A push to `main` deploys, via
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) — which is the
whole point, since `tracks.yaml` gets edited from a phone as often as from an
editor. The workflow runs `npm run deploy`, the same command a laptop does:

```bash
npm run deploy        # build, then push to Cloudflare Pages
```

It needs two repo secrets, both under Settings → Secrets → Actions:

| secret                  | where it comes from                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | dash.cloudflare.com → My Profile → API Tokens → Create Token → **Cloudflare Pages: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | `npx wrangler whoami`                                                                     |

The project is **`notonspotify`** on Cloudflare Pages, production branch `main`,
and it is **direct upload** — Cloudflare never builds anything. The workflow
above is the only build there is, which is what makes it a gate: a schema error
in `tracks.yaml`, or a clock that stops mounting, fails there and nothing is
published. Cloudflare keeps serving the last good deploy.

It used to ride along on the `jaan-io` project as a preview branch, at
<https://notonspotify.jaan-io.pages.dev>. That could never have reached
`notonspotify.jaan.io`: a Pages custom domain attaches to a project's
**production** deployment, and a preview branch is only ever reachable at its
own `*.pages.dev` alias — so the canonical URL the pages were already claiming
was unservable from where they sat. Its own project is what fixed that.

### Two things outside this repo

Nothing here would recreate either, and each is a click away from taking the
site down, so they are written down rather than left in a dashboard.

- **The custom domain.** `notonspotify.jaan.io` is a custom domain on the
  `notonspotify` Pages project, added in the dashboard — Wrangler has no
  `pages domain` command. Adding it created the proxied CNAME to
  `notonspotify.pages.dev` in the `jaan.io` zone, and issued the certificate.
  Removing it puts the site back at `notonspotify.pages.dev`, still live, still
  claiming a canonical URL that no longer resolves.
- **`jaan.io/notonspotify` → here**, as line 49–50 of the `jaan-io` repo's
  `public/_redirects`. A 302 rather than a 301, because a 301 is cached by the
  browser forever and this address is younger than the redirect pointing at it.

```bash
# What made the project, once. Kept for the record, not to be re-run.
wrangler pages project create notonspotify --production-branch=main
```
