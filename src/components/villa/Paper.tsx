import type { ReactNode } from "react";

export function Paper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede?: string }) {
  return (
    <header className="mb-8">
      {eyebrow && (
        <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
      )}
      <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
      {lede && <p className="mt-3 max-w-prose text-muted-foreground">{lede}</p>}
    </header>
  );
}
