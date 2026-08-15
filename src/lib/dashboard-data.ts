// Mock data for the Memalize analytics dashboard.
// Shaped to match the uploaded questionnaire so a real backend can
// replace this module without touching the components.

export type Emotion = "happy" | "sad" | "angry" | "stressed" | "bored";

export const emotions: { key: Emotion; label: string; color: string }[] = [
  { key: "happy", label: "Happy", color: "var(--chart-happy)" },
  { key: "sad", label: "Sad", color: "var(--chart-sad)" },
  { key: "angry", label: "Angry", color: "var(--chart-angry)" },
  { key: "stressed", label: "Stressed", color: "var(--chart-stressed)" },
  { key: "bored", label: "Bored", color: "var(--chart-bored)" },
];

export type MemeCategory = {
  key: string;
  label: string;
  folder: string;
  share: number; // % of responses
  avgHappy: number; // 1-10
};

export const memeCategories: MemeCategory[] = [
  { key: "animal", label: "Animals", folder: "Animal", share: 18, avgHappy: 8.4 },
  { key: "legendary", label: "Legendary", folder: "Legendary", share: 14, avgHappy: 7.9 },
  { key: "irl", label: "IRL shots", folder: "Unintended_shot_IRL", share: 13, avgHappy: 6.6 },
  { key: "entertainment", label: "Entertainment", folder: "Entertainment_media", share: 12, avgHappy: 7.2 },
  { key: "text", label: "Text memes", folder: "Photo_with_Phrase_or_Sentence", share: 11, avgHappy: 7.0 },
  { key: "animation", label: "Animation", folder: "Animation_pause", share: 10, avgHappy: 6.8 },
  { key: "cursed", label: "Cursed", folder: "Cursed_edited_photos", share: 9, avgHappy: 4.1 },
  { key: "brainrot", label: "Brainrot", folder: "Brainrot", share: 8, avgHappy: 3.4 },
  { key: "thumbnail", label: "Thumbnail", folder: "Thumbnail", share: 5, avgHappy: 5.6 },
];

// 24 rolling 1-min samples of each emotion's average (1-10)
export const emotionTimeline: { t: string; [k: string]: number | string }[] = Array.from(
  { length: 24 },
  (_, i) => {
    const min = 23 - i;
    const wave = (phase: number, base: number, amp: number) =>
      Math.max(
        1,
        Math.min(10, base + Math.sin((i + phase) / 3) * amp + (Math.random() - 0.5) * 0.6),
      );
    return {
      t: `${String(min).padStart(2, "0")}m`,
      happy: +wave(0, 6.8, 1.2).toFixed(1),
      sad: +wave(2, 4.2, 1.1).toFixed(1),
      angry: +wave(4, 3.6, 0.9).toFixed(1),
      stressed: +wave(1, 5.1, 1.0).toFixed(1),
      bored: +wave(3, 4.6, 1.3).toFixed(1),
    };
  },
).reverse();

export type Metric = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  spark: number[];
  tone: "blue" | "red";
};

export const metrics: Metric[] = [
  {
    key: "responses",
    label: "Total responses",
    value: "12,847",
    delta: "+8.2%",
    trend: "up",
    tone: "blue",
    spark: [12, 18, 15, 22, 19, 28, 26, 34, 30, 38],
  },
  {
    key: "rate",
    label: "Responses / min",
    value: "284",
    delta: "+4.1%",
    trend: "up",
    tone: "red",
    spark: [20, 22, 19, 24, 28, 26, 30, 27, 33, 31],
  },
  {
    key: "happiness",
    label: "Avg happiness",
    value: "6.4",
    delta: "-0.3",
    trend: "down",
    tone: "blue",
    spark: [7.0, 6.8, 6.9, 6.6, 6.7, 6.5, 6.6, 6.4, 6.5, 6.4],
  },
  {
    key: "diversity",
    label: "Emotional diversity",
    value: "72.4%",
    delta: "+2.1%",
    trend: "up",
    tone: "red",
    spark: [68, 70, 69, 71, 70, 72, 71, 73, 72, 74],
  },
];

export type FeedItem = {
  id: number;
  category: string;
  emotion: Emotion;
  score: number;
  ago: string;
};

export const initialFeed: FeedItem[] = [
  { id: 1, category: "Animals", emotion: "happy", score: 9, ago: "just now" },
  { id: 2, category: "Brainrot", emotion: "bored", score: 2, ago: "6s" },
  { id: 3, category: "Cursed", emotion: "angry", score: 3, ago: "12s" },
  { id: 4, category: "Legendary", emotion: "happy", score: 8, ago: "21s" },
  { id: 5, category: "IRL shots", emotion: "stressed", score: 5, ago: "28s" },
  { id: 6, category: "Thumbnail", emotion: "happy", score: 7, ago: "33s" },
];

export const feedSamples: Omit<FeedItem, "id" | "ago">[] = [
  { category: "Animals", emotion: "happy", score: 9 },
  { category: "Brainrot", emotion: "bored", score: 2 },
  { category: "Cursed", emotion: "angry", score: 3 },
  { category: "Legendary", emotion: "happy", score: 8 },
  { category: "IRL shots", emotion: "stressed", score: 5 },
  { category: "Thumbnail", emotion: "happy", score: 7 },
  { category: "Animation", emotion: "sad", score: 4 },
  { category: "Entertainment", emotion: "happy", score: 8 },
  { category: "Text memes", emotion: "bored", score: 4 },
];
