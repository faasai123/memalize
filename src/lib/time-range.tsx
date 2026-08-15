import { createContext, useContext, useState, type ReactNode } from "react";

export type TimeRange = "1H" | "1D" | "1W" | "1M" | "1Y" | "ALL";

export type RangeMeta = {
  /** Human label, e.g. "last hour". */
  label: string;
  /** Short label rendered on the range switcher button. */
  short: string;
  /** Short unit shown on the trend axis, e.g. "m". */
  unit: string;
  /** Number of timeline samples for this range. */
  points: number;
  /** Label for the i-th sample (0 = oldest, n-1 = newest). */
  stepLabel: (i: number, n: number) => string;
  /** Multiplier applied to cumulative response counts. */
  scale: number;
};

export const rangeMeta: Record<TimeRange, RangeMeta> = {
  "1H": {
    label: "last hour",
    short: "1H",
    unit: "m",
    points: 24,
    stepLabel: (i) => `${23 - i}m`,
    scale: 0.015,
  },
  "1D": {
    label: "last 24 hours",
    short: "1D",
    unit: "h",
    points: 24,
    stepLabel: (i) => `${23 - i}h`,
    scale: 0.5,
  },
  "1W": {
    label: "last 7 days",
    short: "1W",
    unit: "d",
    points: 7,
    stepLabel: (i) => `${6 - i}d`,
    scale: 3,
  },
  "1M": {
    label: "last 30 days",
    short: "1M",
    unit: "d",
    points: 30,
    stepLabel: (i) => `${29 - i}d`,
    scale: 12,
  },
  "1Y": {
    label: "last 12 months",
    short: "1Y",
    unit: "mo",
    points: 12,
    stepLabel: (i) => `${11 - i}mo`,
    scale: 150,
  },
  ALL: {
    label: "since launch",
    short: "Since launch",
    unit: "mo",
    points: 30,
    stepLabel: (i) => `${29 - i}mo`,
    scale: 420,
  },
};

export const timeRangeKeys: TimeRange[] = ["1H", "1D", "1W", "1M", "1Y", "ALL"];

type Ctx = { range: TimeRange; setRange: (r: TimeRange) => void };

const TimeRangeCtx = createContext<Ctx>({ range: "1D", setRange: () => {} });

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<TimeRange>("1D");
  return (
    <TimeRangeCtx.Provider value={{ range, setRange }}>
      {children}
    </TimeRangeCtx.Provider>
  );
}

export function useTimeRange() {
  return useContext(TimeRangeCtx);
}
