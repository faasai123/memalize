import { Layers, Palette, Rocket } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Structured routing",
    body: "Each section can become its own page with its own metadata whenever the site grows.",
  },
  {
    icon: Palette,
    title: "Token-driven design",
    body: "Colours, radii and type live in one file, so a full restyle is a single edit away.",
  },
  {
    icon: Rocket,
    title: "Ready to extend",
    body: "Add a database, logins or server logic on top without unpicking anything here.",
  },
];

export function FeatureRow() {
  return (
    <section id="features" className="border-y border-border bg-card/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          What is already in place
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl border border-border bg-background p-6">
              <span className="grid size-10 place-items-center rounded-md bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}