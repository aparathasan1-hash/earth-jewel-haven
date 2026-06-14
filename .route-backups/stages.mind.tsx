import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { SecureLockGate } from "@/components/villa/SecureLockGate";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/stages/mind")({
  head: () => ({
    meta: [
      { title: "Mother's Mind — The Villageless Mama" },
      {
        name: "description",
        content: "Essays on womanhood, care, and the inner life of a mother.",
      },
      { property: "og:title", content: "Mother's Mind" },
      { property: "og:url", content: "/stages/mind" },
    ],
    links: [{ rel: "canonical", href: "/stages/mind" }],
  }),
  component: Mind,
});

const essayKeys = [
  {
    titleKey: "mind.essay1Title",
    subKey: "mind.essay1Sub",
    bodyKeys: ["mind.essay1Body1", "mind.essay1Body2", "mind.essay1Body3"],
  },
  {
    titleKey: "mind.essay2Title",
    subKey: "mind.essay2Sub",
    bodyKeys: ["mind.essay2Body1", "mind.essay2Body2", "mind.essay2Body3"],
  },
  {
    titleKey: "mind.essay3Title",
    subKey: "mind.essay3Sub",
    bodyKeys: ["mind.essay3Body1"],
  },
];

function Mind() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <SecureLockGate label={t("mind.eyebrow")}>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[oklch(0.4_0.06_300_/_0.08)] via-transparent to-transparent" />
      <div className="relative">
        <SectionTitle
          eyebrow={t("mind.eyebrow")}
          title={t("mind.heading")}
          lede={t("mind.lede")}
        />
        {open === null ? (
          <ul className="space-y-3">
            {essayKeys.map((e, i) => (
              <li key={e.titleKey}>
                <button onClick={() => setOpen(i)} className="block w-full text-left">
                  <Paper className="transition-colors hover:bg-secondary/40">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
                      {t("mind.essayLabel")} · {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl">{t(e.titleKey)}</h3>
                    <p className="mt-1 text-muted-foreground">{t(e.subKey)}</p>
                  </Paper>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <article className="animate-fade-up">
            <button
              onClick={() => setOpen(null)}
              className="mb-4 text-xs uppercase tracking-[0.22em] text-accent"
            >
              {t("mind.backLink")}
            </button>
            <Paper className="prose-book px-7 py-10 sm:px-12 sm:py-14">
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">{t("mind.essayLabel")}</p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{t(essayKeys[open].titleKey)}</h1>
              <p className="mt-2 italic text-muted-foreground">{t(essayKeys[open].subKey)}</p>
              <div className="mt-6 text-lg leading-relaxed text-foreground">
                {essayKeys[open].bodyKeys.map((bk, i) => (
                  <p key={i}>{t(bk)}</p>
                ))}
              </div>
            </Paper>
          </article>
        )}
      </div>
    </SecureLockGate>
  );
}
