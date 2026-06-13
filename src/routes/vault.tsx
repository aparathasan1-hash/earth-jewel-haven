import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, FileText, Headphones, BookOpen, GraduationCap } from "lucide-react";
import { SectionTitle } from "@/components/villa/Paper";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "The Vault — The Villageless Mama" },
      { name: "description", content: "A searchable archive of essays, printables, audio, and courses for postpartum mothers." },
      { property: "og:title", content: "The Vault" },
      { property: "og:description", content: "A quiet, searchable archive." },
      { property: "og:url", content: "/vault" },
    ],
    links: [{ rel: "canonical", href: "/vault" }],
  }),
  component: Vault,
});

type Item = { id: string; title: string; type: "Essay" | "Printable" | "Audio" | "Course"; tags: string[]; blurb: string };

const items: Item[] = [
  { id: "1", title: "When the family you came from is the wound", type: "Essay", tags: ["narcissistic family", "matrescence"], blurb: "On mothering without a mother to lean on." },
  { id: "2", title: "Scripts for low-contact holidays", type: "Printable", tags: ["narcissistic family", "boundaries"], blurb: "Printable cards for hard conversations." },
  { id: "3", title: "Rage hum — 11 min", type: "Audio", tags: ["narcissistic family", "regulation"], blurb: "A vocal release for inherited anger." },
  { id: "4", title: "Latch & let-down", type: "Essay", tags: ["nursing", "early days"], blurb: "Small adjustments that change everything." },
  { id: "5", title: "First bath, slow", type: "Printable", tags: ["ritual", "nursery"], blurb: "A printable sequence for unhurried bathing." },
  { id: "6", title: "Rain for a long night", type: "Audio", tags: ["sleep", "calm"], blurb: "60 minutes of even, steady rain." },
  { id: "7", title: "Matrescence (course)", type: "Course", tags: ["identity"], blurb: "Coming soon — a 6-week slow course." },
  { id: "8", title: "The body keeps the postpartum", type: "Essay", tags: ["recovery", "somatic"], blurb: "Notes on healing in tissue." },
  { id: "9", title: "A letter to your nervous system", type: "Printable", tags: ["regulation"], blurb: "Tape it to the fridge." },
];

const iconFor = (t: Item["type"]) =>
  t === "Essay" ? BookOpen : t === "Printable" ? FileText : t === "Audio" ? Headphones : GraduationCap;

function Vault() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) =>
      [i.title, i.blurb, i.type, ...i.tags].join(" ").toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8">
      <SectionTitle
        eyebrow="The Vault"
        title="An archive you can search slowly."
        lede="Essays, printables, audio, and courses. Try a phrase like 'narcissistic family'."
      />

      <div className="sticky top-[68px] z-20 -mx-5 mb-6 bg-background/85 px-5 py-3 backdrop-blur-lg">
        <label className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-sm">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the vault…"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            type="search"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-xs uppercase tracking-wider text-muted-foreground">
              Clear
            </button>
          )}
        </label>
        <p className="mt-2 text-xs text-muted-foreground">{filtered.length} of {items.length} pieces</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((i) => {
          const Icon = iconFor(i.type);
          return (
            <li key={i.id} className="animate-fade-up rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-accent">{i.type}</p>
                  <h3 className="mt-1 font-serif text-lg leading-snug">{i.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{i.blurb}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {i.tags.map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Nothing yet under "{q}". Try a softer word.
          </li>
        )}
      </ul>
    </div>
  );
}
