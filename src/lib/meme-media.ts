import { memeCategories, type MemeCategory } from "./dashboard-data";

// Every image / gif dropped into src/assets/memes/<Folder>/ is picked up
// automatically at build time — no code change needed when folders arrive.
const rawFiles = import.meta.glob("../assets/memes/**/*.{jpg,jpeg,png,gif,webp,avif}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

// CDN-hosted assets are stored as .asset.json pointers next to the folders.
const pointerFiles = import.meta.glob("../assets/memes/**/*.asset.json", {
  eager: true,
  import: "default",
}) as Record<string, { url: string; original_filename?: string }>;

const files: Record<string, string> = {
  ...rawFiles,
  ...Object.fromEntries(
    Object.entries(pointerFiles).map(([path, pointer]) => [
      path.replace(/\.asset\.json$/, ""),
      pointer.url,
    ]),
  ),
};

export type MemeItem = {
  id: string;
  src: string | null;
  folder: string;
  isGif: boolean;
};

function byFolder(folder: string): MemeItem[] {
  return Object.entries(files)
    .filter(([path]) => path.includes(`/memes/${folder}/`))
    .map(([path, src]) => ({
      id: path,
      src,
      folder,
      isGif: /\.gif$/i.test(path),
    }));
}

// Deterministic shuffle so SSR and client render identical picks
// (Math.random caused hydration mismatches). Seed mixes folder so
// each category gets a different ordering.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const h = (() => {
      let v = 2166136261 ^ (seed.charCodeAt(i % seed.length) + i * 37);
      v = Math.imul(v ^ (v >>> 13), 16777619);
      return (v >>> 0) / 0xffffffff;
    })();
    const j = Math.floor(h * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** 5 deterministic media items from a category folder; placeholders while empty. */
export function sampleCategory(category: MemeCategory, count = 5, seed?: string): MemeItem[] {
  const pool = byFolder(category.folder);
  if (pool.length === 0) {
    return Array.from({ length: count }, (_, i) => ({
      id: `${category.key}-placeholder-${i}`,
      src: null,
      folder: category.folder,
      isGif: false,
    }));
  }
  const picked = seededShuffle(pool, seed ? `${seed}:${category.folder}` : category.folder).slice(
    0,
    Math.min(count, pool.length),
  );
  while (picked.length < count) picked.push(pool[picked.length % pool.length]!);
  return picked;
}

export function sampleAllCategories(count = 5, seed?: string) {
  return memeCategories.map((category) => ({
    category,
    items: sampleCategory(category, count, seed),
  }));
}

/** Random seed string for per-visit shuffling. */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Look up a single meme asset URL by a path fragment (e.g. "Legendary/Original_Doge"). */
export function mediaByPath(fragment: string): string | null {
  const hit = Object.entries(files).find(([path]) =>
    path.toLowerCase().includes(fragment.toLowerCase()),
  );
  return hit ? hit[1] : null;
}