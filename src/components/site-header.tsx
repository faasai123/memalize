import { Link } from "@tanstack/react-router";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-primary font-display text-lg leading-none text-primary-foreground">
            S
          </span>
          <span className="font-display text-xl tracking-tight text-foreground">Starter</span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex" aria-label="Main">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Get started
        </a>
      </div>
    </header>
  );
}