export function SiteFooter() {
  return (
    <footer id="contact" className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-6 border-t border-border pt-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl tracking-tight text-foreground">
            Ready when you are.
          </p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Describe the app you have in mind and this page gets rebuilt around it.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Starter. All rights reserved.
        </p>
      </div>
    </footer>
  );
}