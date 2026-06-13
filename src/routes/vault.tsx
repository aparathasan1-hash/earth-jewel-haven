import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, FileText, Headphones, BookOpen, GraduationCap, ArrowLeft } from "lucide-react";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { vaultItems, type VaultItem } from "@/lib/vault-content";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "The Vault — The Villageless Mama" },
      {
        name: "description",
        content:
          "A searchable archive of essays, printables, audio, and courses for postpartum mothers.",
      },
      { property: "og:title", content: "The Vault" },
      { property: "og:description", content: "A quiet, searchable archive." },
      { property: "og:url", content: "/vault" },
    ],
    links: [{ rel: "canonical", href: "/vault" }],
  }),
  component: Vault,
});

const iconFor = (t: VaultItem["type"]) =>
  t === "Essay"
    ? BookOpen
    : t === "Printable"
      ? FileText
      : t === "Audio"
        ? Headphones
        : GraduationCap;

function VaultDetail({ item, onBack }: { item: VaultItem; onBack: () => void }) {
  const t = useT();
  return (
    <article className="animate-fade-up">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("vault.backLink")}
      </button>

      <Paper className="prose-book px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">{item.type}</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{item.title}</h1>
        <p className="mt-2 text-muted-foreground">{item.blurb}</p>

        {item.body?.map((p, i) => (
          <p key={i} className="mt-4 text-lg leading-relaxed">
            {p}
          </p>
        ))}

        {item.printable?.map((line, i) => (
          <p
            key={i}
            className="mt-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 font-serif text-lg"
          >
            {line}
          </p>
        ))}

        {item.audioNote && (
          <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-5">
            <p className="text-sm text-foreground">{item.audioNote}</p>
            <Link
              to="/stages/crisis"
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              {t("vault.openCrisisAudio")}
            </Link>
          </div>
        )}

        {item.comingSoon && (
          <p className="mt-6 text-sm italic text-muted-foreground">
            {t("vault.comingSoon")}
          </p>
        )}
      </Paper>
    </article>
  );
}

function Vault() {
  const t = useT();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return vaultItems;
    return vaultItems.filter((i) =>
      [i.title, i.blurb, i.type, ...i.tags].join(" ").toLowerCase().includes(s),
    );
  }, [q]);

  const selected = selectedId ? vaultItems.find((i) => i.id === selectedId) : null;

  if (selected) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-8">
        <VaultDetail item={selected} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8">
      <SectionTitle
        eyebrow={t("vault.eyebrow")}
        title={t("vault.heading")}
        lede={t("vault.lede")}
      />

      <div className="sticky top-[68px] z-20 -mx-5 mb-6 bg-background/85 px-5 py-3 backdrop-blur-lg">
        <label className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-sm">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("vault.searchPlaceholder")}
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            type="search"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              {t("vault.clearBtn")}
            </button>
          )}
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("vault.resultCount", { count: filtered.length, total: vaultItems.length })}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((i) => {
          const Icon = iconFor(i.type);
          return (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => setSelectedId(i.id)}
                className="animate-fade-up w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-secondary/40"
              >
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
                        <span
                          key={t}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            {t("vault.noResults", { query: q })}
          </li>
        )}
      </ul>
    </div>
  );
}
