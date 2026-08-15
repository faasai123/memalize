// Derives "key insights" from the segment-aware mock data: which meme type
// drives which emotion hardest, how strong the signal is, and why it matters.

import { emotions, type Emotion } from "./dashboard-data";
import {
  segmentCategories,
  segmentCategoryEmotion,
  findSegment,
} from "./dashboard-segments";
import type { TimeRange } from "./time-range";

export type Insight = {
  key: string;
  /** Short kicker, e.g. "Biggest mood lift". */
  title: string;
  /** Meme category or emotion the insight is about. */
  subject: string;
  /** Headline number, already formatted. */
  value: string;
  /** One-line reading of what it means. */
  detail: string;
  /** Emotion driving the insight (used for colour). */
  emotion: Emotion;
  /** 0-100 strength used for the bar. */
  strength: number;
};

const label = (e: Emotion) => emotions.find((x) => x.key === e)!.label;

export function buildInsights(
  segment: string,
  range: TimeRange,
): { insights: Insight[]; headline: string } {
  const cats = segmentCategories(segment, range);
  const byEmotion = Object.fromEntries(
    emotions.map((e) => [e.key, segmentCategoryEmotion(segment, e.key, range)]),
  ) as Record<Emotion, { key: string; label: string; value: number }[]>;

  const at = (e: Emotion, key: string) =>
    byEmotion[e].find((p) => p.key === key)?.value ?? 0;

  const top = (e: Emotion) =>
    [...byEmotion[e]].sort((a, b) => b.value - a.value)[0]!;

  const happiest = top("happy");
  const angriest = top("angry");
  const mostStressful = top("stressed");

  // Category whose emotions differ most from each other = most divisive.
  const polarizing = [...cats]
    .map((c) => {
      const vals = emotions.map((e) => at(e.key, c.key));
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const spread = Math.sqrt(
        vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length,
      );
      return { ...c, spread };
    })
    .sort((a, b) => b.spread - a.spread)[0]!;

  // Overall dominant emotion, weighted by each category's share of responses.
  const weighted = emotions
    .map((e) => ({
      key: e.key,
      score:
        cats.reduce((s, c) => s + at(e.key, c.key) * c.share, 0) /
        (cats.reduce((s, c) => s + c.share, 0) || 1),
    }))
    .sort((a, b) => b.score - a.score);
  const dominant = weighted[0]!;

  const insights: Insight[] = [
    {
      key: "lift",
      title: "Biggest mood lift",
      subject: happiest.label,
      value: happiest.value.toFixed(1),
      detail: `Highest happiness score of all meme types — ${(
        happiest.value - (weighted.find((w) => w.key === "happy")?.score ?? 0)
      ).toFixed(1)} above the average.`,
      emotion: "happy",
      strength: happiest.value * 10,
    },
    {
      key: "drain",
      title: "Heaviest emotional cost",
      subject: mostStressful.label,
      value: mostStressful.value.toFixed(1),
      detail: `Leaves viewers the most stressed — worth flagging for wellbeing research.`,
      emotion: "stressed",
      strength: mostStressful.value * 10,
    },
    {
      key: "anger",
      title: "Strongest anger trigger",
      subject: angriest.label,
      value: angriest.value.toFixed(1),
      detail: `Scores highest for anger, ahead of every other category.`,
      emotion: "angry",
      strength: angriest.value * 10,
    },
    {
      key: "divisive",
      title: "Most divisive type",
      subject: polarizing.label,
      value: `±${polarizing.spread.toFixed(1)}`,
      detail: `Emotional responses are spread widest here — people either love it or hate it.`,
      emotion: "sad",
      strength: Math.min(100, polarizing.spread * 42),
    },
    {
      key: "dominant",
      title: "Dominant reaction overall",
      subject: label(dominant.key),
      value: dominant.score.toFixed(1),
      detail: `Weighted by how often each meme type is served, ${label(
        dominant.key,
      ).toLowerCase()} leads the whole sample.`,
      emotion: dominant.key,
      strength: dominant.score * 10,
    },
  ];

  const headline = `${findSegment(segment).label} · ${label(dominant.key).toLowerCase()}-leaning`;
  return { insights, headline };
}
