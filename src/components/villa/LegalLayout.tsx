import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SectionTitle, Paper } from "@/components/villa/Paper";

export type LegalSection = { heading: string; paragraphs: string[] };

export function LegalLayout({
  eyebrow,
  title,
  updated,
  intro,
  sections,
  footer,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
  footer?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {eyebrow}
      </Link>

      <SectionTitle eyebrow={updated} title={title} lede={intro} />

      <div className="mt-6 space-y-5">
        {sections.map((s, i) => (
          <Paper key={i}>
            <h2 className="font-serif text-lg text-foreground">{s.heading}</h2>
            <div className="mt-2 space-y-2">
              {s.paragraphs.map((p, j) => (
                <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          </Paper>
        ))}
      </div>

      {footer && <p className="mt-10 text-xs text-muted-foreground">{footer}</p>}
    </div>
  );
}
