/**
 * tracks.yaml → src/generated/playlist.json
 *
 * Two kinds of failure, treated very differently on purpose (spec §3.1):
 *
 *   Schema errors FAIL THE BUILD, naming the entry and the field. An author
 *   mistake should be loud — and because Cloudflare Pages keeps the last good
 *   deploy live, a failed build can't take the site down, it just doesn't ship.
 *
 *   Network errors DON'T. A Bandcamp page that times out drops that one entry
 *   with a warning; everything else deploys. Flaky networks don't get to hold
 *   an edit hostage.
 *
 * SKIP_RESOLVE=1 skips every network call, for working on the UI offline.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";
import type { Platform, ResolvedTrack } from "../src/lib/adapters/types.ts";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const IN = resolvePath(ROOT, "tracks.yaml");
const OUT = resolvePath(ROOT, "src/generated/playlist.json");
const OFFLINE = process.env.SKIP_RESOLVE === "1";
const TIMEOUT = 15_000;

// ── Schema ──────────────────────────────────────────────────────────────────

const HOSTS: Record<Platform, RegExp> = {
  youtube: /^(www\.|m\.|music\.)?youtube\.com$|^youtu\.be$/,
  soundcloud: /^(www\.|on\.|m\.)?soundcloud\.com$/,
  bandcamp: /(^|\.)bandcamp\.com$/,
};

function platformOf(url: string): Platform | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const [platform, re] of Object.entries(HOSTS)) {
    if (re.test(host)) return platform as Platform;
  }
  return null;
}

// .strict() so a typo'd key ("aritst:") fails the build instead of silently
// dropping the value the author thought they were setting.
const TrackInput = z
  .object({
    url: z.string().refine((u) => platformOf(u) !== null, {
      message: "must be a youtube.com, youtu.be, soundcloud.com or *.bandcamp.com URL",
    }),
    title: z.string().min(1),
    artist: z.string().min(1),
    // Where to send someone who wants the record rather than the stream: the
    // artist's Bandcamp page, their site, wherever they'd rather be found. Only
    // ever a link out — it is never played, so unlike `url` it isn't restricted
    // to the three platforms. http(s) only, because this ends up as an href and
    // a `javascript:` one would be a script tag with extra steps.
    link: z
      .url()
      .refine((u) => /^https?:$/.test(new URL(u).protocol), { message: "must be http or https" })
      .optional(),
    // A flag, not a rating: the entries without it aren't worse, they just
    // haven't been called out. `banger: false` is accepted and means the same
    // as leaving it off — a strict schema shouldn't fail a build over someone
    // spelling "no" out loud.
    banger: z.boolean().optional(),
    year: z.number().int().min(1850).max(2100).optional(),
    duration: z.number().int().positive().optional(),
    start: z.number().int().nonnegative().optional(),
    note: z.string().optional(),
  })
  .strict();

type TrackInput = z.infer<typeof TrackInput>;

function fail(message: string): never {
  console.error(`\ntracks.yaml: ${message}\n`);
  process.exit(1);
}

function validate(raw: unknown): TrackInput[] {
  if (!Array.isArray(raw)) fail("expected a list of tracks at the top level");
  return raw.map((entry, i) => {
    const parsed = TrackInput.safeParse(entry);
    if (!parsed.success) {
      const label =
        entry && typeof entry === "object" && "url" in entry
          ? String((entry as { url: unknown }).url)
          : "(no url)";
      const problems = parsed.error.issues
        .map((issue) => `    ${issue.path.join(".") || "(entry)"}: ${issue.message}`)
        .join("\n");
      fail(`entry ${i + 1} (${label}) is not valid:\n${problems}`);
    }
    return parsed.data;
  });
}

// ── Per-platform resolution ─────────────────────────────────────────────────

/** Pure string work — every YouTube URL shape, minus playlist/radio cruft. */
function youtubeId(url: string): string {
  const u = new URL(url);
  const path = u.pathname.replace(/^\/+/, "");
  const id =
    u.searchParams.get("v") ??
    (u.hostname.endsWith("youtu.be")
      ? path
      : (path.match(/^(?:embed|shorts|live|v)\/([\w-]{11})/)?.[1] ?? ""));
  const clean = id.slice(0, 11);
  if (!/^[\w-]{11}$/.test(clean)) throw new Error(`no video id in ${url}`);
  return clean;
}

async function get(url: string, method: "GET" | "HEAD" = "GET"): Promise<Response> {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT),
    // Bandcamp and SoundCloud both serve different (or no) HTML to a bare
    // fetch; a browser UA is the difference between a page and a 403.
    headers: { "user-agent": "Mozilla/5.0 (compatible; notonspotify.jaan.io build)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

/** on.soundcloud.com/xxxx → the canonical track URL the widget accepts. */
async function soundcloudUrl(url: string): Promise<string> {
  const u = new URL(url);
  if (u.hostname !== "on.soundcloud.com") return `${u.origin}${u.pathname}`;
  if (OFFLINE) return url;
  const final = new URL((await get(url)).url);
  if (final.hostname === "on.soundcloud.com") throw new Error(`short link didn't expand: ${url}`);
  return `${final.origin}${final.pathname}`;
}

/** "P00H56M06S" → 3366. */
function isoSeconds(iso: string): number {
  const m = iso.match(/^P(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/**
 * How long the embed will play for, from the page's own schema.org block: a
 * track page carries its duration at the top level, an album page carries one
 * per track and the embed plays the lot.
 *
 * This is what makes the Bandcamp estimate and autoplay's hand-off work without
 * anyone timing records by hand — and it is metadata off the page, not the
 * stream URLs underneath it, which stay firmly out of bounds (spec §12.1).
 */
function bandcampDuration(html: string): number | undefined {
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!block) return undefined;
  try {
    const data = JSON.parse(block) as {
      duration?: string;
      track?: { itemListElement?: { item?: { duration?: string } }[] };
    };
    const total = data.duration
      ? isoSeconds(data.duration)
      : (data.track?.itemListElement ?? []).reduce(
          (sum, entry) => sum + isoSeconds(entry.item?.duration ?? ""),
          0,
        );
    return total > 0 ? Math.round(total) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Bandcamp gives no API, so the item id comes off the page. Primary source is
 * the bc-page-properties meta tag ({"item_type":"a","item_id":123}); the
 * og:video URL carries the same id as /album=123/ and is the fallback.
 */
async function bandcampInfo(url: string): Promise<{ embedRef: string; duration?: number }> {
  if (OFFLINE) return { embedRef: "album=0" };
  const html = await (await get(url)).text();
  const duration = bandcampDuration(html);

  const props = html.match(/<meta[^>]+name="bc-page-properties"[^>]+content="([^"]+)"/i)?.[1];
  if (props) {
    try {
      const { item_type, item_id } = JSON.parse(
        props.replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
      ) as { item_type?: string; item_id?: number };
      if (item_id && (item_type === "a" || item_type === "t")) {
        return { embedRef: `${item_type === "a" ? "album" : "track"}=${item_id}`, duration };
      }
    } catch {
      /* fall through to og:video */
    }
  }

  const og = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i)?.[1];
  const kind = og?.match(/\/(album|track)=(\d+)/);
  if (kind) return { embedRef: `${kind[1]}=${kind[2]}`, duration };

  throw new Error(`couldn't find a Bandcamp item id on ${url}`);
}

async function resolveOne(input: TrackInput): Promise<ResolvedTrack> {
  const platform = platformOf(input.url)!;
  const bc = platform === "bandcamp" ? await bandcampInfo(input.url) : undefined;
  const embedRef =
    platform === "youtube"
      ? youtubeId(input.url)
      : platform === "soundcloud"
        ? await soundcloudUrl(input.url)
        : bc!.embedRef;
  // tracks.yaml wins when it says something: the owner timing a record by ear
  // beats the metadata, and it's the only way to override a wrong one.
  const duration = input.duration ?? bc?.duration;

  return {
    platform,
    embedRef,
    title: input.title,
    artist: input.artist,
    ...(input.link !== undefined && { link: input.link }),
    ...(input.banger === true && { banger: true as const }),
    ...(input.year !== undefined && { year: input.year }),
    ...(duration !== undefined && { duration }),
    // Bandcamp's embed has no seek, so a start offset there would be a lie.
    ...(input.start !== undefined && platform !== "bandcamp" && { start: input.start }),
    ...(input.note !== undefined && { note: input.note }),
    sourceUrl: input.url,
  };
}

// ── Run ─────────────────────────────────────────────────────────────────────

const inputs = validate(parse(readFileSync(IN, "utf8")));
if (inputs.length === 0) fail("the playlist is empty");

const settled = await Promise.all(
  inputs.map(async (input, i) => {
    try {
      return await resolveOne(input);
    } catch (error) {
      console.warn(
        `  ⚠ skipping entry ${i + 1} (${input.artist} — ${input.title}): ${
          error instanceof Error ? error.message : error
        }`,
      );
      return null;
    }
  }),
);

const playlist = settled.filter((track): track is ResolvedTrack => track !== null);
if (playlist.length === 0) fail("every entry failed to resolve — refusing to ship an empty player");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(playlist, null, 2)}\n`);

const counts = playlist.reduce<Record<string, number>>(
  (acc, t) => ({ ...acc, [t.platform]: (acc[t.platform] ?? 0) + 1 }),
  {},
);
console.log(
  `  ✓ ${playlist.length}/${inputs.length} tracks resolved` +
    `${OFFLINE ? " (SKIP_RESOLVE=1, placeholders)" : ""} — ` +
    Object.entries(counts)
      .map(([k, v]) => `${v} ${k}`)
      .join(", "),
);
