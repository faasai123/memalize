import { Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

export function SurveyCta({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/survey"
      className={
        "cta-pop cta-attention group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-4 text-sm font-bold tracking-wide text-primary-foreground transition-transform duration-300 hover:-translate-y-1 active:translate-y-0 " +
        className
      }
      style={{ background: "var(--gradient-cta)" }}
    >
      {/* sheen sweep */}
      <span
        aria-hidden
        className="cta-sheen-bar pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />
      <ClipboardList className="size-4 shrink-0 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
      Take the survey
    </Link>
  );
}
