// Segment-aware views over the mock dashboard data.
// Each segment (all users / gender / age group) derives a deterministic
// variation of the base data so every chart can be sliced consistently.

import {
  memeCategories,
  metrics,
  feedSamples,
  type MemeCategory,
  type Metric,
  type Emotion,
} from "./dashboard-data";
import { rangeMeta, type TimeRange } from "./time-range";

export type Segment = { id: string; label: string; short: string };
export type SegmentGroup = { key: string; label: string; options: Segment[] };

export const segmentGroups: SegmentGroup[] = [
  {
    key: "all",
    label: "All users",
    options: [{ id: "all", label: "All users", short: "All" }],
  },
  {
    key: "gender",
    label: "Gender",
    options: [
      { id: "gender:male", label: "Male", short: "Male" },
      { id: "gender:female", label: "Female", short: "Female" },
      { id: "gender:other", label: "Other", short: "Other" },
    ],
  },
  {
    key: "age",
    label: "Age group",
    options: [
      { id: "age:u12", label: "Under 12", short: "<12" },
      { id: "age:13-15", label: "13 – 15", short: "13–15" },
      { id: "age:16-18", label: "16 – 18", short: "16–18" },
      { id: "age:19-21", label: "19 – 21", short: "19–21" },
      { id: "age:22-24", label: "22 – 24", short: "22–24" },
      { id: "age:25+", label: "25 and above", short: "25+" },
    ],
  },
];

export const allSegments: Segment[] = segmentGroups.flatMap((g) => g.options);

// A segment id can combine one option per group, e.g. "gender:male+age:u12".
export function parseSegment(id: string): string[] {
  if (!id || id === "all") return [];
  return id.split("+").filter(Boolean);
}

export function buildSegmentId(parts: string[]): string {
  const ordered = segmentGroups
    .flatMap((g) => g.options.map((o) => o.id))
    .filter((oid) => parts.includes(oid) && oid !== "all");
  return ordered.length ? ordered.join("+") : "all";
}

export function toggleSegmentPart(id: string, optionId: string): string {
  if (optionId === "all") return "all";
  const group = segmentGroups.find((g) => g.options.some((o) => o.id === optionId));
  const parts = parseSegment(id).filter(
    (p) => !group || !group.options.some((o) => o.id === p),
  );
  const already = parseSegment(id).includes(optionId);
  return buildSegmentId(already ? parts : [...parts, optionId]);
}

export function findSegment(id: string): Segment {
  const parts = parseSegment(id);
  if (!parts.length) return allSegments[0]!;
  const segs = parts
    .map((p) => allSegments.find((s) => s.id === p))
    .filter((s): s is Segment => Boolean(s));
  if (!segs.length) return allSegments[0]!;
  if (segs.length === 1) return segs[0]!;
  return {
    id: buildSegmentId(parts),
    label: segs.map((s) => s.label).join(" · "),
    short: segs.map((s) => s.short).join(" · "),
  };
}

// deterministic pseudo-random in [-1, 1]
function jitter(seed: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 2000) / 1000 - 1);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Tiny memo cache: the dashboard recomputes the same deterministic slices on
// every render (segment/range/emotion rarely change), so cache by key.
function memoize<A extends unknown[], R>(fn: (...args: A) => R) {
  const cache = new Map<string, R>();
  return (...args: A): R => {
    const k = args.join("|");
    const hit = cache.get(k);
    if (hit !== undefined) return hit;
    const value = fn(...args);
    if (cache.size > 300) cache.clear();
    cache.set(k, value);
    return value;
  };
}

export function segmentShare(id: string) {
  const parts = parseSegment(id);
  if (!parts.length) return 1;
  return parts.reduce((acc, p) => {
    if (p.startsWith("gender:")) return acc * (0.3 + jitter(p, 7) * 0.08);
    return acc * (0.14 + jitter(p, 11) * 0.05) * (parts.length > 1 ? 3.2 : 1);
  }, 1);
}

// salt mixes segment + range so each range yields a distinct, deterministic
// variation of the category profiles even for the "all" segment.
function salt(id: string, range: TimeRange) {
  return id + "|" + range;
}

export const segmentCategories = memoize(function segmentCategories(
  id: string,
  range: TimeRange = "1D",
): MemeCategory[] {
  const s = salt(id, range);
  const raw = memeCategories.map((c, i) => ({
    ...c,
    avgHappy: +clamp(c.avgHappy + jitter(s + c.key, i) * 1.6, 1, 10).toFixed(1),
    share: Math.max(2, c.share + Math.round(jitter(s + c.key, i + 50) * 4)),
  }));
  const total = raw.reduce((sum, c) => sum + c.share, 0);
  return raw.map((c) => ({ ...c, share: Math.round((c.share / total) * 100) }));
});

// Base emotion averages (1-10) used to seed the generated timeline.
const timelineBases: Record<Emotion, number> = {
  happy: 6.8,
  sad: 4.2,
  angry: 3.6,
  stressed: 5.1,
  bored: 4.6,
};
const timelineAmp: Record<Emotion, number> = {
  happy: 1.2,
  sad: 1.1,
  angry: 0.9,
  stressed: 1.0,
  bored: 1.3,
};

// Generates a deterministic, range-aware timeline: number of samples, axis
// labels (m/h/d/mo ago), and per-emotion values all change with the range.
export const segmentTimeline = memoize(function segmentTimeline(
  id: string,
  range: TimeRange = "1D",
) {
  const meta = rangeMeta[range];
  const n = meta.points;
  const s = salt(id, range);
  const emotionsKeys = Object.keys(timelineBases) as Emotion[];
  return Array.from({ length: n }, (_, idx) => {
    const i = n - 1 - idx; // newest sample last
    const point: { t: string; [k: string]: number | string } = {
      t: meta.stepLabel(i, n),
    };
    for (const e of emotionsKeys) {
      const j = jitter(s + e, i) * 1.4;
      const v =
        timelineBases[e] + Math.sin((i + e.length) / 3) * timelineAmp[e] + j;
      point[e] = +clamp(v, 1, 10).toFixed(1);
    }
    return point;
  });
});

export const segmentMetrics = memoize(function segmentMetrics(
  id: string,
  range: TimeRange = "1D",
): Metric[] {
  const share = segmentShare(id);
  const scale = rangeMeta[range].scale;
  const s = salt(id, range);
  const emoKeys = Object.keys(timelineBases) as Emotion[];
  return metrics.map((m, i) => {
    const j = jitter(s + m.key, i);
    let value = m.value;
    if (m.key === "responses") {
      value = Math.round(12847 * share * scale).toLocaleString("en-US");
    } else if (m.key === "rate") {
      value = String(Math.max(1, Math.round(284 * share)));
    } else if (m.key === "happiness") {
      value = clamp(6.4 + j * 1.2, 1, 10).toFixed(1);
    } else {
      // emotional diversity: how evenly the 5 emotions are represented.
      // High when all emotion averages are close, low when one dominates.
      const vals = emoKeys.map(
        (e) => timelineBases[e] + jitter(s + e, i) * 1.0,
      );
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance =
        vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      const std = Math.sqrt(variance);
      value = `${clamp(100 - std * 22 + j * 3, 30, 99.9).toFixed(1)}%`;
    }
    const deltaVal = j * 6;
    return {
      ...m,
      value,
      trend: deltaVal >= 0 ? "up" : "down",
      delta: `${deltaVal >= 0 ? "+" : ""}${deltaVal.toFixed(1)}%`,
      spark: m.spark.map((v, k) =>
        +(v * (1 + jitter(s + m.key + k, k) * 0.12)).toFixed(2),
      ),
    } as Metric;
  });
});

export function segmentFeedSamples(
  id: string,
  range: TimeRange = "1D",
) {
  const s = salt(id, range);
  return feedSamples.map((item, i) => ({
    ...item,
    score: Math.round(clamp(item.score + jitter(s + item.category, i) * 2, 1, 10)),
  }));
}

// Average score (1-10) per category for a single emotion, within a segment.
// "happy" uses the base avgHappy; other emotions are derived deterministically
// so each emotion has its own distinct profile instead of one blended chart.
export type CategoryEmotionPoint = {
  key: string;
  label: string;
  value: number;
};

export const segmentCategoryEmotion = memoize(function segmentCategoryEmotion(
  id: string,
  emotion: Emotion,
  range: TimeRange = "1D",
): CategoryEmotionPoint[] {
  const base = segmentCategories(id, range);
  const s = salt(id, range);
  return base.map((c: MemeCategory, i) => {
    let value: number;
    if (emotion === "happy") {
      value = c.avgHappy;
    } else if (emotion === "sad" || emotion === "angry") {
      // roughly inverse of happiness, with per-emotion variation
      value = 11 - c.avgHappy + jitter(s + c.key + emotion, i + 3) * 1.5;
    } else {
      // stressed / bored sit in the middle, driven by their own jitter
      value = 5.5 - (c.avgHappy - 6) * 0.4 + jitter(s + c.key + emotion, i + 9) * 2;
    }
    return { key: c.key, label: c.label, value: +clamp(value, 1, 10).toFixed(1) };
  });
});

// Percentage split of a single emotion across meme categories (sums to 100).
export const segmentCategoryEmotionShare = memoize(function segmentCategoryEmotionShare(
  id: string,
  emotion: Emotion,
  range: TimeRange = "1D",
): (CategoryEmotionPoint & { share: number })[] {
  const points = segmentCategoryEmotion(id, emotion, range);
  const cats = segmentCategories(id, range);
  const weights = points.map((p, i) => {
    const base = cats[i]?.share ?? 10;
    return Math.max(0.5, base * (p.value / 6));
  });
  const total = weights.reduce((sum, w) => sum + w, 0) || 1;
  const raw = weights.map((w) => (w / total) * 100);
  // round to whole percents while keeping the total at 100
  const floored = raw.map((v) => Math.floor(v));
  let remainder = 100 - floored.reduce((sum, v) => sum + v, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (const o of order) {
    if (remainder <= 0) break;
    floored[o.i]! += 1;
    remainder -= 1;
  }
  return points.map((p, i) => ({ ...p, share: floored[i]! }));
});
