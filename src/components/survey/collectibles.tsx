import { Sparkles } from "lucide-react";
import { mediaByPath } from "@/lib/meme-media";

export type Collectible = {
  id: string;
  name: string;
  rarity: string;
  src: string | null;
  /** vertical position as a % of the survey column */
  top: string;
  side: "left" | "right";
  color: string;
  /** drift animation variant */
  drift: "a" | "b" | "c";
  /** peeks in from the edge — only partly visible until hovered */
  peek?: boolean;
  /** extra horizontal nudge in px */
  offset?: number;
  /** animation delay in seconds */
  delay?: number;
};

// Larger pool of candidate collectible memes. Each survey visit draws a
// random subset of COUNT and scatters them at randomized positions/sides.
type PoolEntry = Omit<Collectible, "top" | "side" | "drift" | "peek" | "delay" | "offset"> & {
  path: string;
};

const POOL: PoolEntry[] = [
  { id: "doge", name: "Doge", rarity: "Legendary", src: mediaByPath("Legendary/Original_Doge"), color: "var(--chart-happy)", path: "Legendary/Original_Doge" },
  { id: "nyan", name: "Nyan Cat", rarity: "Legendary", src: mediaByPath("Legendary/4879-nyan-cat"), color: "var(--blue-glow)", path: "Legendary/4879-nyan-cat" },
  { id: "67", name: "67 Kid", rarity: "Brainrot", src: mediaByPath("Brainrot/67-kid"), color: "var(--chart-stressed)", path: "Brainrot/67-kid" },
  { id: "pepe", name: "Pepe", rarity: "Legendary", src: mediaByPath("Legendary/pepe_the_frog"), color: "var(--chart-sad)", path: "Legendary/pepe_the_frog" },
  { id: "beluga", name: "Beluga", rarity: "Animal", src: mediaByPath("Animal/Beluga"), color: "var(--red-glow)", path: "Animal/Beluga" },
  { id: "tralalero", name: "Tralalero Tralala", rarity: "Brainrot", src: mediaByPath("Brainrot/Tralalero_Tralala"), color: "var(--chart-bored)", path: "Brainrot/Tralalero_Tralala" },
  { id: "success", name: "Success Kid", rarity: "Legendary", src: mediaByPath("Legendary/Success_Kid"), color: "var(--chart-happy)", path: "Legendary/Success_Kid" },
  { id: "disaster", name: "Disaster Girl", rarity: "Legendary", src: mediaByPath("Legendary/Disaster_Girl"), color: "var(--chart-angry)", path: "Legendary/Disaster_Girl" },
  { id: "skibidi", name: "Skibidi Toilet", rarity: "Brainrot", src: mediaByPath("Brainrot/skibidi_toilet"), color: "var(--chart-sad)", path: "Brainrot/skibidi_toilet" },
  { id: "yippee", name: "Yippee Cat", rarity: "Animal", src: mediaByPath("Animal/happy-cat-yippee"), color: "var(--blue-glow)", path: "Animal/happy-cat-yippee" },
  { id: "popeye", name: "Popeye Kid", rarity: "Legendary", src: mediaByPath("Legendary/Awkward_Look_Popeye"), color: "var(--chart-happy)", path: "Legendary/Awkward_Look_Popeye" },
  { id: "cena", name: "John Cena", rarity: "Legendary", src: mediaByPath("Legendary/John_Cena"), color: "var(--blue-glow)", path: "Legendary/John_Cena" },
  { id: "ppap", name: "PPAP", rarity: "Legendary", src: mediaByPath("Legendary/PPAP"), color: "var(--chart-angry)", path: "Legendary/PPAP" },
  { id: "surprised", name: "Surprised Black Man", rarity: "Legendary", src: mediaByPath("Legendary/Surprised_Black_Man"), color: "var(--chart-stressed)", path: "Legendary/Surprised_Black_Man" },
  { id: "wazowski", name: "Mike Wazowski", rarity: "Cursed", src: mediaByPath("Cursed_edited_photos/mike_wazowski"), color: "var(--chart-bored)", path: "Cursed_edited_photos/mike_wazowski" },
  { id: "incredible", name: "Mr. Incredible", rarity: "Cursed", src: mediaByPath("Cursed_edited_photos/mr_incredible"), color: "var(--red-glow)", path: "Cursed_edited_photos/mr_incredible" },
  { id: "drake", name: "Drake", rarity: "Phrase", src: mediaByPath("Photo_with_Phrase_or_Sentence/Drake_Hotline_Bling"), color: "var(--chart-happy)", path: "Photo_with_Phrase_or_Sentence/Drake_Hotline_Bling" },
  { id: "anakin", name: "Anakin & Padme", rarity: "Phrase", src: mediaByPath("Photo_with_Phrase_or_Sentence/Anakin_and_Padme"), color: "var(--chart-sad)", path: "Photo_with_Phrase_or_Sentence/Anakin_and_Padme" },
  { id: "mrbeast", name: "MrBeast", rarity: "Thumbnail", src: mediaByPath("Thumbnail/MrBeast"), color: "var(--blue-glow)", path: "Thumbnail/MrBeast" },
  { id: "curry", name: "Stephen Curry", rarity: "Thumbnail", src: mediaByPath("Thumbnail/Stephen_Curry"), color: "var(--chart-happy)", path: "Thumbnail/Stephen_Curry" },
  { id: "ishowspeed", name: "iShowspeed", rarity: "IRL", src: mediaByPath("Unintended_shot_IRL/iShowspeed"), color: "var(--chart-stressed)", path: "Unintended_shot_IRL/iShowspeed" },
  { id: "yusuf", name: "Yusuf Dikeç", rarity: "IRL", src: mediaByPath("Unintended_shot_IRL/Yusuf_Dikec"), color: "var(--chart-angry)", path: "Unintended_shot_IRL/Yusuf_Dikec" },
  { id: "dads", name: "Dad's Nads", rarity: "IRL", src: mediaByPath("Unintended_shot_IRL/dads-nads"), color: "var(--chart-bored)", path: "Unintended_shot_IRL/dads-nads" },
  { id: "thinking", name: "Thinking", rarity: "Legendary", src: mediaByPath("Legendary/Thinking"), color: "var(--chart-bored)", path: "Legendary/Thinking" },
];

const SIDES = ["left", "right"] as const;
const DRIFTS = ["a", "b", "c"] as const;
export const COLLECTIBLE_COUNT = 10;

// Seeded shuffle so SSR + first client render agree, then the seed is
// randomized on mount for a fresh layout every survey visit.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    let v = 2166136261 ^ (seed.charCodeAt(i % seed.length) + i * 37);
    v = Math.imul(v ^ (v >>> 13), 16777619);
    const j = Math.floor(((v >>> 0) / 0xffffffff) * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function buildCollectibles(seed = "memalize"): Collectible[] {
  const picked = seededShuffle(POOL, seed).slice(0, COLLECTIBLE_COUNT);
  return picked.map((p, i) => {
    const top = `${Math.round((i / COLLECTIBLE_COUNT) * 100 + 3)}%`;
    const side = SIDES[(seed.charCodeAt(i % seed.length) + i) % 2]!;
    const drift = DRIFTS[(i + (seed.charCodeAt(0) || 0)) % 3]!;
    const peek = (seed.charCodeAt((i + 1) % seed.length) + i) % 3 === 0;
    const delay = ((seed.charCodeAt(i % seed.length) || 0) % 30) / 10;
    const offset = ((seed.charCodeAt((i + 3) % seed.length) || 0) % 14) - 7;
    return { ...p, top, side, drift, peek, delay, offset };
  });
}

/** Backwards-compatible default set for legacy callers (results page total). */
export const COLLECTIBLES: Collectible[] = buildCollectibles();

export function CollectibleField({
  collected,
  onCollect,
  collectibles = COLLECTIBLES,
}: {
  collected: string[];
  onCollect: (id: string) => void;
  collectibles?: Collectible[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 hidden md:block" aria-hidden={false}>
      {collectibles.map((c) => {
        const got = collected.includes(c.id);
        if (got) return null;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onCollect(c.id)}
            aria-label={`Collect ${c.name}`}
            title={`Collect ${c.name}`}
            className={`collect-drift-${c.drift}${c.peek ? " collect-peek" : ""} pointer-events-auto absolute size-14 overflow-hidden rounded-full border-2`}
            style={{
              top: c.top,
              [c.side]: `${c.peek ? -34 : -8 + (c.offset ?? 0)}px`,
              animationDelay: `${c.delay ?? 0}s`,
              borderColor: c.color,
              boxShadow: `0 0 22px -4px ${c.color}`,
              background: "var(--card)",
            }}
          >
            {c.src ? (
              <img src={c.src} alt={c.name} className="size-full object-contain p-0.5" />
            ) : (
              <Sparkles className="m-auto size-5" style={{ color: c.color }} />
            )}
            <span
              className="collect-ring pointer-events-none absolute inset-0 rounded-full border-2"
              style={{ borderColor: c.color }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function CollectibleHUD({
  collected,
  collectibles = COLLECTIBLES,
}: {
  collected: string[];
  collectibles?: Collectible[];
}) {
  return (
    <div className="glass fixed bottom-4 left-4 z-40 hidden rounded-2xl border border-border p-3 md:block">
      <p className="font-mono text-[10px] text-muted-foreground">
        Meme collection · {collected.length}/{collectibles.length}
      </p>
      <div className="mt-2 flex max-w-[220px] flex-wrap gap-1.5">
        {collectibles.map((c) => {
          const got = collected.includes(c.id);
          return (
            <div
              key={c.id}
              title={got ? c.name : "Not found yet"}
              className="size-8 overflow-hidden rounded-full border"
              style={{
                borderColor: got ? c.color : "var(--border)",
                boxShadow: got ? `0 0 14px -4px ${c.color}` : "none",
                filter: got ? "none" : "grayscale(1)",
                opacity: got ? 1 : 0.35,
              }}
            >
              {c.src ? (
                <img src={c.src} alt={c.name} className="size-full object-contain p-0.5" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CollectedPanelContent({
  collected,
  collectibles = COLLECTIBLES,
}: {
  collected: string[];
  collectibles?: Collectible[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {collectibles.map((c) => {
        const got = collected.includes(c.id);
        return (
          <div
            key={c.id}
            className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
            style={{
              borderColor: got ? c.color : "var(--border)",
              background: got
                ? `color-mix(in oklab, ${c.color} 12%, transparent)`
                : "transparent",
            }}
          >
            <div
              className="size-9 shrink-0 overflow-hidden rounded-full border"
              style={{
                borderColor: got ? c.color : "var(--border)",
                filter: got ? "none" : "grayscale(1)",
                opacity: got ? 1 : 0.4,
              }}
            >
              {c.src ? (
                <img src={c.src} alt={c.name} className="size-full object-contain p-0.5" />
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold">{got ? c.name : "???"}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {got ? c.rarity : "missed"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}