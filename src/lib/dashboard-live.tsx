// Live survey data layer.
//
// Every submitted survey (signed in or not) writes one anonymous row into
// `live_responses`. The dashboard loads those rows once, then subscribes to
// Postgres realtime inserts, so a survey finished by ANY user updates every
// chart on every open dashboard within a second — no refresh needed.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { emotions, type Emotion } from "./dashboard-data";
import { allSegments, parseSegment } from "./dashboard-segments";
import type { TimeRange } from "./time-range";
import type { CategoryEmotionPoint } from "./dashboard-segments";

/** scores: { [categoryKey]: { happy: 1-10, sad: ..., ... } } */
export type LiveScores = Record<string, Partial<Record<Emotion, number>>>;

export type LiveRow = {
  id: string;
  created_at: string;
  gender: string | null;
  age_group: string | null;
  scores: LiveScores;
};

export type LiveAgg = {
  /** number of responses matching the current segment + range */
  count: number;
  /** category key -> emotion -> { sum, n } */
  byCat: Record<string, Record<string, { sum: number; n: number }>>;
};

const rangeMs: Record<TimeRange, number> = {
  "1H": 3.6e6,
  "1D": 8.64e7,
  "1W": 6.048e8,
  "1M": 2.592e9,
  "1Y": 3.156e10,
  ALL: Number.POSITIVE_INFINITY,
};

type Ctx = {
  rows: LiveRow[];
  /** total rows ever loaded (all segments) */
  total: number;
  /** rows that arrived through realtime in this session */
  liveSince: number;
  /** ms timestamp of the newest insert seen, for "updated x ago" UI */
  lastAt: number | null;
  connected: boolean;
};

const LiveCtx = createContext<Ctx>({
  rows: [],
  total: 0,
  liveSince: 0,
  lastAt: null,
  connected: false,
});

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<LiveRow[]>([]);
  const [liveSince, setLiveSince] = useState(0);
  const [lastAt, setLastAt] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const push = (row: LiveRow, live: boolean) => {
      if (seen.current.has(row.id)) return;
      seen.current.add(row.id);
      setRows((prev) => [row, ...prev].slice(0, 5000));
      if (live) {
        setLiveSince((n) => n + 1);
        setLastAt(Date.now());
      }
    };

    (async () => {
      const { data } = await supabase
        .from("live_responses")
        .select("id, created_at, gender, age_group, scores")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (cancelled || !data) return;
      for (const r of [...data].reverse()) push(r as unknown as LiveRow, false);
    })();

    const channel = supabase
      .channel("live-responses")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_responses" },
        (payload) => push(payload.new as unknown as LiveRow, true),
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo(
    () => ({ rows, total: rows.length, liveSince, lastAt, connected }),
    [rows, liveSince, lastAt, connected],
  );

  return <LiveCtx.Provider value={value}>{children}</LiveCtx.Provider>;
}

export function useLiveData() {
  return useContext(LiveCtx);
}

function segmentFilters(segment: string) {
  const parts = parseSegment(segment);
  let gender: string | null = null;
  let age: string | null = null;
  for (const p of parts) {
    const label = allSegments.find((s) => s.id === p)?.label ?? null;
    if (p.startsWith("gender:")) gender = label;
    if (p.startsWith("age:")) age = label;
  }
  return { gender, age };
}

/** Aggregate the live rows matching a segment + time range. */
export function aggregate(
  rows: LiveRow[],
  segment: string,
  range: TimeRange,
): LiveAgg {
  const { gender, age } = segmentFilters(segment);
  const cutoff = Date.now() - rangeMs[range];
  const byCat: LiveAgg["byCat"] = {};
  let count = 0;
  for (const r of rows) {
    if (gender && r.gender !== gender) continue;
    if (age && r.age_group !== age) continue;
    if (Number.isFinite(cutoff) && new Date(r.created_at).getTime() < cutoff) continue;
    count += 1;
    for (const [cat, scores] of Object.entries(r.scores ?? {})) {
      const bucket = (byCat[cat] ??= {});
      for (const e of emotions) {
        const v = scores?.[e.key];
        if (typeof v !== "number") continue;
        const cell = (bucket[e.key] ??= { sum: 0, n: 0 });
        cell.sum += v;
        cell.n += 1;
      }
    }
  }
  return { count, byCat };
}

/** Hook form: aggregate for the current segment + range, recomputed on inserts. */
export function useLiveAgg(segment: string, range: TimeRange) {
  const { rows, liveSince, connected, lastAt } = useLiveData();
  const agg = useMemo(() => aggregate(rows, segment, range), [rows, segment, range]);
  return { agg, liveSince, connected, lastAt };
}

/**
 * Weight of the simulated baseline. Real answers are averaged in against it,
 * so the first responses nudge the charts and a larger sample takes over.
 */
export const BASELINE_WEIGHT = 6;

/** Blend a mock category/emotion series with real submitted scores. */
export function blendCategoryEmotion(
  points: CategoryEmotionPoint[],
  agg: LiveAgg,
  emotion: Emotion,
): CategoryEmotionPoint[] {
  if (!agg.count) return points;
  return points.map((p) => {
    const cell = agg.byCat[p.key]?.[emotion];
    if (!cell || !cell.n) return p;
    const value =
      (p.value * BASELINE_WEIGHT + cell.sum) / (BASELINE_WEIGHT + cell.n);
    return { ...p, value: +Math.min(10, Math.max(1, value)).toFixed(1) };
  });
}
