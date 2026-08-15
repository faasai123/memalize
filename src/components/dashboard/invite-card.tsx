import { Link } from "@tanstack/react-router";
import { ClipboardList, Sparkles, Smile } from "lucide-react";

type Invite = {
  icon: typeof ClipboardList;
  title: string;
  body: string;
  accent: string;
};

const INVITES: Invite[] = [
  {
    icon: ClipboardList,
    title: "Take the survey",
    body: "Rate how each meme makes you feel across five emotions — it takes about three minutes.",
    accent: "var(--primary)",
  },
  {
    icon: Sparkles,
    title: "Find a meme",
    body: "Ten collectible memes drift around the survey page. Spot them all to complete your set.",
    accent: "var(--chart-happy)",
  },
  {
    icon: Smile,
    title: "Get your mood mascot",
    body: "Finish the survey to meet the animated buddy that matches your dominant emotion.",
    accent: "var(--blue-glow)",
  },
];

export function InviteCard() {
  return (
    <section
      className="card-rise glass flex flex-col rounded-2xl border border-border p-5"
      style={{ animationDelay: "640ms" }}
    >
      <h2 className="font-display text-base font-semibold text-foreground">
        Join the study
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Three things you can do right now
      </p>

      <ul className="mt-4 space-y-3">
        {INVITES.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.title}>
              <Link
                to="/survey"
                className="feed-row group flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3 transition-colors hover:border-foreground/20"
              >
                <span
                  className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    color: it.accent,
                    background: "color-mix(in oklab, var(--foreground) 6%, transparent)",
                  }}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {it.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {it.body}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
