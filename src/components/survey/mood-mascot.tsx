import type { Emotion } from "@/lib/dashboard-data";

export type MascotMood = Emotion | "neutral";

type MascotMeta = {
  color: string;
  anim: string;
  name: string;
  line: string;
};

const META: Record<MascotMood, MascotMeta> = {
  happy: {
    color: "var(--chart-happy)",
    anim: "mascot-bob",
    name: "Sunny",
    line: "You laughed the most — keep scrolling!",
  },
  sad: {
    color: "var(--chart-sad)",
    anim: "mascot-droop",
    name: "Drippy",
    line: "Some memes hit right in the feelings.",
  },
  angry: {
    color: "var(--chart-angry)",
    anim: "mascot-shake",
    name: "Blaze",
    line: "Those memes really pressed your buttons.",
  },
  stressed: {
    color: "var(--chart-stressed)",
    anim: "mascot-wobble",
    name: "Zappy",
    line: "A bit wired — take a breath between memes.",
  },
  bored: {
    color: "var(--chart-bored)",
    anim: "mascot-droop",
    name: "Snoozy",
    line: "Mostly unimpressed. Tough crowd!",
  },
  neutral: {
    color: "var(--muted-foreground)",
    anim: "mascot-bob",
    name: "Even",
    line: "Perfectly balanced across every emotion.",
  },
};

function Face({ mood, color }: { mood: MascotMood; color: string }) {
  const eye = (cx: number) => {
    switch (mood) {
      case "happy":
        return (
          <path
            key={cx}
            d={`M ${cx - 7} 62 q 7 -9 14 0`}
            fill="none"
            stroke="var(--background)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      case "angry":
        return (
          <g key={cx}>
            <circle cx={cx} cy={62} r={5} fill="var(--background)" />
            <path
              d={`M ${cx - 9} 50 L ${cx + 8} 56`}
              stroke="var(--background)"
              strokeWidth="4"
              strokeLinecap="round"
              transform={cx > 60 ? `rotate(-20 ${cx} 53)` : undefined}
            />
          </g>
        );
      case "bored":
        return (
          <path
            key={cx}
            d={`M ${cx - 7} 62 h 14`}
            stroke="var(--background)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      case "stressed":
        return (
          <g key={cx}>
            <circle cx={cx} cy={62} r={7} fill="var(--background)" />
            <circle cx={cx} cy={62} r={3} fill={color} />
          </g>
        );
      default:
        return <circle key={cx} className="mascot-blink" cx={cx} cy={62} r={5.5} fill="var(--background)" />;
    }
  };

  const mouth = () => {
    switch (mood) {
      case "happy":
        return <path d="M 48 78 q 12 14 24 0 z" fill="var(--background)" />;
      case "sad":
        return (
          <path d="M 50 84 q 10 -10 20 0" fill="none" stroke="var(--background)" strokeWidth="4" strokeLinecap="round" />
        );
      case "angry":
        return (
          <path d="M 48 84 q 12 -12 24 0 q -12 6 -24 0 z" fill="var(--background)" />
        );
      case "stressed":
        return (
          <path
            d="M 48 80 l 6 6 l 6 -6 l 6 6 l 6 -6"
            fill="none"
            stroke="var(--background)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case "bored":
        return <path d="M 50 82 h 20" stroke="var(--background)" strokeWidth="4" strokeLinecap="round" />;
      default:
        return <path d="M 52 80 q 8 6 16 0" fill="none" stroke="var(--background)" strokeWidth="4" strokeLinecap="round" />;
    }
  };

  return (
    <>
      {eye(46)}
      {eye(74)}
      {mouth()}
    </>
  );
}

function Mascot({ mood }: { mood: MascotMood }) {
  const meta = META[mood];
  return (
    <div className="flex w-28 shrink-0 flex-col items-center gap-2">
      <svg viewBox="0 0 120 120" className={`size-24 ${meta.anim}`} role="img" aria-label={`${meta.name} the ${mood} mascot`}>
        <circle className="mascot-ring" cx="60" cy="62" r="42" fill={meta.color} opacity="0.18" />
        {/* body */}
        <path
          d="M 60 16 C 88 16 104 38 104 64 C 104 92 86 108 60 108 C 34 108 16 92 16 64 C 16 38 32 16 60 16 Z"
          fill={meta.color}
        />
        {/* cheeks */}
        <circle cx="32" cy="76" r="6" fill="var(--background)" opacity="0.28" />
        <circle cx="88" cy="76" r="6" fill="var(--background)" opacity="0.28" />
        {/* little arms */}
        <circle cx="12" cy="70" r="7" fill={meta.color} />
        <circle cx="108" cy="70" r="7" fill={meta.color} />
        <Face mood={mood} color={meta.color} />
        {mood === "sad" ? (
          <circle cx="78" cy="76" r="4" fill="var(--chart-sad)" stroke="var(--background)" strokeWidth="2" />
        ) : null}
        {mood === "angry" ? (
          <>
            <path d="M 22 26 l 8 10" stroke={meta.color} strokeWidth="4" strokeLinecap="round" />
            <path d="M 98 26 l -8 10" stroke={meta.color} strokeWidth="4" strokeLinecap="round" />
          </>
        ) : null}
        {mood === "bored" ? (
          <text x="94" y="30" fontSize="16" fill={meta.color} fontFamily="monospace">
            z
          </text>
        ) : null}
        {mood === "stressed" ? (
          <>
            <path d="M 26 22 l 8 8 M 34 22 l -8 8" stroke={meta.color} strokeWidth="3" strokeLinecap="round" />
            <path d="M 88 20 l 8 8 M 96 20 l -8 8" stroke={meta.color} strokeWidth="3" strokeLinecap="round" />
          </>
        ) : null}
      </svg>
      <p className="text-center font-mono text-[10px] uppercase tracking-wide" style={{ color: meta.color }}>
        {meta.name}
      </p>
    </div>
  );
}

export function MoodMascots({ moods }: { moods: MascotMood[] }) {
  const list = moods.length ? moods : (["neutral"] as MascotMood[]);
  const primary = META[list[0]!];
  return (
    <section className="glass card-rise mt-4 flex flex-wrap items-center gap-5 rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-end gap-3">
        {list.map((m) => (
          <Mascot key={m} mood={m} />
        ))}
      </div>
      <div className="min-w-[200px] flex-1">
        <p className="font-mono text-[11px] text-muted-foreground">Your mood buddy</p>
        <p className="mt-1 font-display text-xl font-semibold" style={{ color: primary.color }}>
          {list.map((m) => META[m].name).join(" & ")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{primary.line}</p>
      </div>
    </section>
  );
}
