import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section id="overview" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-accent/50 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <p className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Fresh project
        </p>
        <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          A clean foundation, ready for whatever you build next.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          This page replaces the empty placeholder. Everything here — colours, type, layout — is
          yours to reshape. Tell me what the project is for and it becomes that.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#features"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Take a look
            <ArrowRight className="size-4" />
          </a>
          <a
            href="#contact"
            className="inline-flex h-11 items-center rounded-md border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Start a conversation
          </a>
        </div>
      </div>
    </section>
  );
}