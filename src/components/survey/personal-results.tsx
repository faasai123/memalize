import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  FileDown,
  Loader2,
  Maximize2,
  Printer,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { emotions, type Emotion, type MemeCategory } from "@/lib/dashboard-data";
import type { MemeItem } from "@/lib/meme-media";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { MoodMascots, type MascotMood } from "@/components/survey/mood-mascot";
import { CollectedPanelContent, COLLECTIBLES, type Collectible } from "@/components/survey/collectibles";

export type Ratings = Record<string, Partial<Record<Emotion, number>>>;

type Group = { category: MemeCategory; items: MemeItem[] };

const round = (n: number) => +n.toFixed(1);

/** Fixed desktop page width used for the print preview and the PDF capture. */
const PAGE_W = 1120;

function avg(list: number[]) {
  if (!list.length) return 0;
  return round(list.reduce((a, b) => a + b, 0) / list.length);
}

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="glass card-rise rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TinyTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-popover-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="tabular mt-1 text-muted-foreground">
          {p.name}: {p.value}
          {suffix ?? " / 10"}
        </p>
      ))}
    </div>
  );
}

export function PersonalResults({
  ratings,
  groups,
  gender,
  ageGroup,
  collected = [],
  collectibles = COLLECTIBLES,
  onEdit,
  savedNote,
}: {
  ratings: Ratings;
  groups: Group[];
  gender: string | null;
  ageGroup: string | null;
  collected?: string[];
  collectibles?: Collectible[];
  onEdit?: (() => void) | undefined;
  savedNote?: React.ReactNode;
}) {
  const [focus, setFocus] = useState<Emotion>("happy");
  const reportRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(0.75);
  const focusMeta = emotions.find((e) => e.key === focus)!;

  const before = ratings["q1-before"] ?? {};
  const after = ratings["q3-after"] ?? {};

  const memeKeys = groups.flatMap((g) => g.items.map((i) => i.id));
  const overall = emotions.map((e) => ({
    key: e.key,
    label: e.label,
    color: e.color,
    value: avg(memeKeys.map((k) => ratings[k]?.[e.key]).filter((n): n is number => n != null)),
  }));

  const perCategory = groups.map((g) => {
    const scores = Object.fromEntries(
      emotions.map((e) => [
        e.key,
        avg(g.items.map((i) => ratings[i.id]?.[e.key]).filter((n): n is number => n != null)),
      ]),
    ) as Record<Emotion, number>;
    return { key: g.category.key, label: g.category.label, ...scores };
  });

  const focusRanking = [...perCategory]
    .map((c) => ({ label: c.label, value: c[focus] }))
    .sort((a, b) => b.value - a.value);
  const maxFocus = Math.max(...focusRanking.map((c) => c.value), 1);

  // Percentage split of the focus emotion across meme categories
  const focusTotal = focusRanking.reduce((a, b) => a + b.value, 0) || 1;
  const focusShare = focusRanking.map((c) => ({
    label: c.label,
    value: round((c.value / focusTotal) * 100),
  }));

  const beforeAfter = emotions.map((e) => ({
    label: e.label,
    color: e.color,
    Before: before[e.key] ?? 0,
    After: after[e.key] ?? 0,
    shift: round((after[e.key] ?? 0) - (before[e.key] ?? 0)),
  }));

  const sortedOverall = [...overall].sort((a, b) => b.value - a.value);
  const topValue = sortedOverall[0]!.value;
  const tiedTop = sortedOverall.filter((o) => o.value === topValue);
  const allEqual = new Set(overall.map((o) => o.value)).size === 1;
  const dominantLabel = allEqual ? "Neutral" : tiedTop.map((o) => o.label).join(" · ");
  const dominantColor = allEqual ? "var(--muted-foreground)" : tiedTop[0]!.color;

  const happiest = [...perCategory].sort((a, b) => b.happy - a.happy)[0]!;
  const worst = [...perCategory].sort(
    (a, b) => b.angry + b.stressed + b.bored - (a.angry + a.stressed + a.bored),
  )[0]!;
  const moodShift = round((after.happy ?? 0) - (before.happy ?? 0));
  const diversitySpread = round(
    Math.max(...overall.map((o) => o.value)) - Math.min(...overall.map((o) => o.value)),
  );

  const dominantParts = allEqual
    ? [{ text: "Neutral", color: dominantColor }]
    : tiedTop.map((t) => ({ text: t.label, color: t.color }));

  const mascotMoods: MascotMood[] = allEqual
    ? ["neutral"]
    : (tiedTop.slice(0, 3).map((t) => t.key) as MascotMood[]);

  const stats: {
    label: string;
    value: string;
    hint: string;
    color: string;
    parts?: { text: string; color: string }[];
  }[] = [
    {
      label: "Your dominant emotion",
      value: dominantLabel,
      hint: allEqual
        ? `avg ${topValue} / 10 — even across all emotions`
        : `avg ${topValue} / 10 across all memes${tiedTop.length > 1 ? ` (${tiedTop.length} tied)` : ""}`,
      color: dominantColor,
      parts: dominantParts,
    },
    {
      label: "Happiness shift",
      value: `${moodShift > 0 ? "+" : ""}${moodShift}`,
      hint: `before ${before.happy ?? 0} → after ${after.happy ?? 0}`,
      color: moodShift >= 0 ? "var(--chart-happy)" : "var(--red-glow)",
    },
    {
      label: "Feel-good category",
      value: happiest.label,
      hint: `happy ${happiest.happy} / 10`,
      color: "var(--blue-glow)",
    },
    {
      label: "Emotional range",
      value: `${diversitySpread}`,
      hint: "gap between your highest and lowest emotion",
      color: "var(--red-glow)",
    },
  ];

  const exportPdf = async () => {
    const node = reportRef.current;
    if (!node || exporting) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      if (document.fonts?.ready) await document.fonts.ready;

      const bg = getComputedStyle(document.body).backgroundColor || "#0b0b0f";
      // Collect every stylesheet the page uses (including CSSOM-injected and
      // adopted sheets) so the capture keeps the real design system CSS.
      const collectCss = () => {
        const parts: string[] = [];
        const readSheet = (sheet: CSSStyleSheet) => {
          try {
            for (const rule of Array.from(sheet.cssRules)) parts.push(rule.cssText);
          } catch {
            /* cross-origin sheet — skipped */
          }
        };
        Array.from(document.styleSheets).forEach((s) => readSheet(s as CSSStyleSheet));
        const adopted: CSSStyleSheet[] =
          (document as Document & { adoptedStyleSheets?: CSSStyleSheet[] })
            .adoptedStyleSheets ?? [];
        adopted.forEach(readSheet);
        return parts.join("\n");
      };
      const cssText = collectCss();

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: bg,
        windowWidth: PAGE_W,
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (doc, el) => {
          // Re-inject the collected CSS in case the cloned document lost it.
          const injected = doc.createElement("style");
          injected.textContent =
            cssText +
            "\n[data-pdf-capture] *,[data-pdf-capture] *::before,[data-pdf-capture] *::after{animation:none!important;transition:none!important;}";
          doc.head.appendChild(injected);

          // Copy the theme class + root variables so tokens resolve identically.
          doc.documentElement.className = document.documentElement.className;
          doc.documentElement.setAttribute(
            "style",
            document.documentElement.getAttribute("style") ?? "",
          );
          doc.body.className = document.body.className;
          doc.body.style.background = bg;

          const target = el as HTMLElement;
          target.setAttribute("data-pdf-capture", "");
          target.style.width = `${PAGE_W}px`;
          target.style.maxWidth = "none";
          target.style.margin = "0";
          target.style.background = bg;
        },
      });
      // Single full-page PDF — identical look to the web page.
      const { jsPDF } = await import("jspdf");
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
        compress: true,
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("memalize-my-results.pdf");
    } finally {
      setExporting(false);
    }
  };

  const clampZoom = (z: number) => Math.min(2, Math.max(0.25, z));

  const fitZoom = useCallback(() => {
    const vp = previewViewportRef.current;
    if (!vp) return;
    setZoom(clampZoom((vp.clientWidth - 48) / PAGE_W));
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    fitZoom();
    const vp = previewViewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom((z) => clampZoom(z * Math.exp(-dy * 0.0015)));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      vp.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOpen, fitZoom]);

  const body = (chrome: boolean) => {
    const hidden = !chrome || exporting;
    return (
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            style={{ visibility: hidden ? "hidden" : "visible" }}
          >
            <ArrowLeft className="size-3.5" />
            Back to dashboard
          </Link>
          <div style={{ visibility: hidden ? "hidden" : "visible" }}>
            <ThemeToggle />
          </div>
        </div>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">Your personal report</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              How memes made <span style={{ color: "var(--blue-glow)" }}>you</span> feel
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {gender ?? "—"} · {ageGroup ?? "—"} · {memeKeys.length} memes rated across{" "}
              {groups.length} categories. This report uses only your own answers.
            </p>
            {savedNote ? <div className="mt-3">{savedNote}</div> : null}
          </div>
          <div className="flex gap-2" style={{ visibility: hidden ? "hidden" : "visible" }}>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:scale-[1.03] hover:border-[var(--blue-glow)] hover:text-foreground"
            >
              <Printer className="size-3.5" />
              Print preview
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:scale-[1.03] hover:border-[var(--blue-glow)] hover:text-foreground disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileDown className="size-3.5" />
              )}
              {exporting ? "Preparing PDF…" : "Export PDF"}
            </button>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:scale-[1.03] hover:border-[var(--red-glow)] hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Edit answers
              </button>
            ) : null}
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass card-rise rounded-2xl border border-border p-4">
              <p className="font-mono text-[11px] text-muted-foreground">{s.label}</p>
              <p className="tabular mt-2 font-display text-2xl font-semibold">
                {s.parts
                  ? s.parts.map((p, i) => (
                      <span key={p.text} style={{ color: p.color }}>
                        {i > 0 ? " · " : ""}
                        {p.text}
                      </span>
                    ))
                  : (s.value as string)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </div>

        <MoodMascots moods={mascotMoods} />

        <div className="mt-6">
          <Panel
            title="Memes you collected"
            subtitle={`You found ${collected.length} of ${collectibles.length} hidden meme circles while taking the survey`}
          >
            <CollectedPanelContent collected={collected} collectibles={collectibles} />
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel
            title="Your emotion profile"
            subtitle="Average score you gave each emotion across every meme (1–10)"
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={overall} outerRadius="72%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                  <Radar
                    name="You"
                    dataKey="value"
                    stroke="var(--blue-glow)"
                    fill="var(--blue-glow)"
                    fillOpacity={0.35}
                  />
                  <Tooltip content={<TinyTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Before vs after the memes"
            subtitle="Your Question 1 mood compared with your Question 3 mood"
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beforeAfter} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: "transparent" }} content={<TinyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Before" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="After" fill="var(--blue-glow)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
              {beforeAfter.map((b) => (
                <li key={b.label} className="tabular">
                  {b.label}:{" "}
                  <span style={{ color: b.shift >= 0 ? "var(--chart-happy)" : "var(--red-glow)" }}>
                    {b.shift > 0 ? "+" : ""}
                    {b.shift}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel
            title="Meme type ranking"
            subtitle={`Your average ${focusMeta.label.toLowerCase()} score per meme category`}
            action={
              <div className="flex flex-wrap gap-1.5">
                {emotions.map((e) => {
                  const active = e.key === focus;
                  return (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => setFocus(e.key)}
                      aria-pressed={active}
                      className="rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all hover:scale-[1.04]"
                      style={
                        active
                          ? {
                              borderColor: e.color,
                              background: `color-mix(in oklab, ${e.color} 20%, transparent)`,
                              color: "var(--foreground)",
                            }
                          : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                      }
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            }
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={focusRanking}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 10]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={96}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: "transparent" }} content={<TinyTooltip />} />
                  <Bar dataKey="value" name={focusMeta.label} radius={[0, 4, 4, 0]}>
                    {focusRanking.map((d) => (
                      <Cell
                        key={d.label}
                        fill={focusMeta.color}
                        fillOpacity={0.35 + 0.65 * (d.value / maxFocus)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title={`${focusMeta.label} split by meme type`}
            subtitle="Share of your total score for this emotion (adds up to 100%)"
          >
            <div className="space-y-2.5">
              {focusShare.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                    {d.label}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.value}%`,
                        background: focusMeta.color,
                        boxShadow: `0 0 12px -2px ${focusMeta.color}`,
                      }}
                    />
                  </div>
                  <span className="tabular w-12 text-right text-xs text-foreground">
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel
            title="All emotions, all meme types"
            subtitle="Your full personal matrix — every emotion plotted across every category"
          >
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perCategory} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TinyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {emotions.map((e) => (
                    <Line
                      key={e.key}
                      type="monotone"
                      dataKey={e.key}
                      name={e.label}
                      stroke={e.color}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="mt-6">
          <Panel title="What your answers say" subtitle="Read directly from your own ratings">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                {allEqual ? (
                  <>
                    Your reactions were remarkably{" "}
                    <span style={{ color: dominantColor }}>balanced</span> — every emotion scored{" "}
                    <span className="tabular text-foreground">{topValue}</span> / 10.
                  </>
                ) : (
                  <>
                    Your strongest overall reaction{tiedTop.length > 1 ? "s were" : " was"}{" "}
                    <span style={{ color: dominantColor }}>
                      {tiedTop.map((t) => t.label.toLowerCase()).join(" · ")}
                    </span>{" "}
                    at <span className="tabular text-foreground">{topValue}</span> / 10.
                  </>
                )}
              </li>
              <li>
                <span className="text-foreground">{happiest.label}</span> memes made you happiest (
                <span className="tabular">{happiest.happy}</span> / 10), while{" "}
                <span className="text-foreground">{worst.label}</span> memes triggered the most
                negative emotions.
              </li>
              <li>
                Browsing memes moved your happiness by{" "}
                <span
                  className="tabular"
                  style={{ color: moodShift >= 0 ? "var(--chart-happy)" : "var(--red-glow)" }}
                >
                  {moodShift > 0 ? "+" : ""}
                  {moodShift}
                </span>{" "}
                points and your stress by{" "}
                <span className="tabular">
                  {(after.stressed ?? 0) - (before.stressed ?? 0) > 0 ? "+" : ""}
                  {round((after.stressed ?? 0) - (before.stressed ?? 0))}
                </span>{" "}
                points.
              </li>
            </ul>
          </Panel>
        </div>

        <div
          className="mt-8 flex justify-center"
          style={{ visibility: hidden ? "hidden" : "visible" }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(120deg, var(--blue-glow), var(--red-glow))",
              color: "var(--primary-foreground)",
            }}
          >
            Compare with everyone on the dashboard
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="dashboard-bg" aria-hidden />
      <div ref={reportRef}>{body(true)}</div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground">Print preview</p>
              <p className="text-sm font-medium">Exactly what the PDF will look like</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-border p-1">
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setZoom((z) => clampZoom(z - 0.1))}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="tabular w-14 text-center text-xs text-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setZoom((z) => clampZoom(z + 0.1))}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Fit to width"
                  onClick={fitZoom}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Maximize2 className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={exportPdf}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-transform enabled:hover:scale-[1.03] disabled:opacity-60"
                style={{
                  background: "linear-gradient(120deg, var(--blue-glow), var(--red-glow))",
                  color: "var(--primary-foreground)",
                }}
              >
                {exporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileDown className="size-3.5" />
                )}
                {exporting ? "Preparing PDF…" : "Export PDF"}
              </button>
              <button
                type="button"
                aria-label="Close print preview"
                onClick={() => setPreviewOpen(false)}
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div ref={previewViewportRef} className="flex-1 overflow-auto p-6">
            <div style={{ width: "fit-content", margin: "0 auto" }}>
              <div style={{ width: PAGE_W, zoom }}>
                <div
                  ref={previewRef}
                  className="relative overflow-hidden rounded-xl border border-border shadow-2xl"
                  style={{ background: "var(--background)" }}
                >
                  <div className="dashboard-bg" aria-hidden />
                  {body(false)}
                </div>
              </div>
            </div>
          </div>
          <p className="border-t border-border px-4 py-2 text-center text-[11px] text-muted-foreground">
            Ctrl / ⌘ + scroll to zoom · Esc to close
          </p>
        </div>
      ) : null}
    </div>
  );
}