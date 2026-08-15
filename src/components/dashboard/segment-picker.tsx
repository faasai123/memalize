import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { segmentGroups, parseSegment, toggleSegmentPart } from "@/lib/dashboard-segments";

export function SegmentPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const parts = parseSegment(value);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Filter
      </span>

      {segmentGroups.map((group) => {
        const active =
          group.key === "all"
            ? parts.length === 0
              ? group.options[0]
              : undefined
            : group.options.find((o) => parts.includes(o.id));
        const isOpen = open === group.key;
        const single = group.options.length === 1;
        const label = active ? active.label : group.label;

        return (
          <div key={group.key} className="relative">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => {
                if (single) {
                  onChange("all");
                  setOpen(null);
                } else {
                  setOpen(isOpen ? null : group.key);
                }
              }}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors " +
                (active
                  ? "text-primary"
                  : "bg-surface text-muted-foreground hover:text-foreground")
              }
              style={
                active
                  ? { background: "color-mix(in oklab, var(--primary) 14%, transparent)" }
                  : undefined
              }
            >
              {label}
              {!single && <ChevronDown className="size-3.5 opacity-70" />}
            </button>

            {isOpen && (
              <ul className="absolute left-0 top-full z-40 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                {group.options.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(toggleSegmentPart(value, opt.id));
                        setOpen(null);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-popover-foreground transition-colors hover:bg-accent"
                    >
                      {opt.label}
                      {parts.includes(opt.id) && (
                        <Check className="size-3.5 text-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
