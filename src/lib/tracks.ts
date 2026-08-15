export const TRACKS = [
  {
    id: "researcher",
    label: "Researcher",
    tagline: "Analyse the data",
    description: "Full dashboard depth: segments, emotion breakdowns and exports.",
    emoji: "🔬",
  },
  {
    id: "educator",
    label: "Educator",
    tagline: "Teach with memes",
    description: "Classroom-ready insights and shareable summaries.",
    emoji: "🎓",
  },
  {
    id: "student",
    label: "Student",
    tagline: "Learn & contribute",
    description: "Take the survey, collect memes and see your own emotion profile.",
    emoji: "📚",
  },
  {
    id: "general",
    label: "General",
    tagline: "Just curious",
    description: "A simple view of how memes make people feel.",
    emoji: "✨",
  },
] as const;

export type TrackId = (typeof TRACKS)[number]["id"];