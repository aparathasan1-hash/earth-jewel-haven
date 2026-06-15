import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { Paper } from "@/components/villa/Paper";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Villageless Mama — A sanctuary for postpartum" },
      {
        name: "description",
        content:
          "A quiet, ad-free digital village for postpartum mothers. Rituals, essays, breathing, audio sanctuary.",
      },
      { property: "og:title", content: "The Villageless Mama" },
      { property: "og:description", content: "A quiet companion for the 4th trimester." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  const t = useT();
  const [opened, setOpened] = useState<string | null>(null);

  const guides = [
    {
      id: "g1",
      titleKey: "home.guide1Title",
      descKey: "home.guide1Desc",
      bodyKeys: [
        "home.guide1Body1",
        "home.guide1Body2",
        "home.guide1Body3",
        "home.guide1Body4",
        "home.guide1Body5",
      ],
    },
    {
      id: "g2",
      titleKey: "home.guide2Title",
      descKey: "home.guide2Desc",
      bodyKeys: [
        "home.guide2Body1",
        "home.guide2Body2",
        "home.guide2Body3",
        "home.guide2Body4",
      ],
    },
    {
      id: "g3",
      titleKey: "home.guide3Title",
      descKey: "home.guide3Desc",
      bodyKeys: [
        "home.guide3Body1",
        "home.guide3Body2",
        "home.guide3Body3",
        "home.guide3Body4",
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 pt-8">
      {/* Hero */}
      <section className="py-10">
        {/* Amblem */}
        <div className="mb-8 flex justify-center">
          <img
            src="/Amblem.jpg"
            alt={t("site.shortTitle")}
            className="h-24 w-auto rounded-2xl object-contain shadow-lg ring-1 ring-accent/10"
          />
        </div>

        <p className="mb-4 text-center text-[11px] uppercase tracking-[0.3em] text-accent">
          {t("home.eyebrow")}
        </p>
        <h1 className="text-center font-serif text-4xl leading-tight sm:text-6xl">
          {t("home.heading")}
        </h1>
        <p className="mt-6 text-center text-lg text-muted-foreground">
          {t("home.subheading")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/stages"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground"
          >
            {t("home.enterStages")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/vault"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3"
          >
            {t("home.openVault")}
          </Link>
        </div>
      </section>

      {/* Welcome essay */}
      <Paper className="prose-book my-10 px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">{t("home.welcomeEyebrow")}</p>
        <h2 className="mt-3 font-serif text-2xl sm:text-3xl">{t("home.welcomeTitle")}</h2>
        <p className="mt-4 text-foreground">{t("home.welcomeP1")}</p>
        <p>{t("home.welcomeP2")}</p>
      </Paper>

      {/* Explore more */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/stages/mind"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/40"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">{t("home.readEyebrow")}</p>
            <p className="mt-1 font-serif text-xl">{t("home.readTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("home.readDesc")}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        </Link>
        <Link
          to="/stages/quiet"
          className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/40"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">{t("home.breatheEyebrow")}</p>
            <p className="mt-1 font-serif text-xl">{t("home.breatheTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("home.breatheDesc")}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        </Link>
      </section>

      {/* Guides */}
      <section className="mt-14">
        <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-accent">{t("home.guidesEyebrow")}</p>
        <h2 className="font-serif text-3xl">{t("home.guidesTitle")}</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">{t("home.guidesDesc")}</p>

        <div className="mt-6 grid gap-4">
          {guides.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpened(opened === g.id ? null : g.id)}
                className="flex w-full min-h-14 items-center justify-between gap-4 p-5 text-left"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg">{t(g.titleKey)}</span>
                    <span className="block text-sm text-muted-foreground">{t(g.descKey)}</span>
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-border px-4 py-2 text-sm">
                  {opened === g.id ? t("home.closeLabel") : t("home.readLabel")}
                </span>
              </button>

              {opened === g.id && (
                <div className="animate-fade-up border-t border-border bg-background/40 px-5 py-5">
                  <div className="prose-book space-y-3 text-foreground">
                    {g.bodyKeys.map((bk, i) => (
                      <p key={i}>{t(bk)}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          {t("home.footer")}{" "}
          <Link to="/privacy" className="underline underline-offset-4">
            {t("home.privacyLink")}
          </Link>
        </p>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link to="/terms" className="hover:text-foreground hover:underline underline-offset-4">
            {t("legal.terms") || "Terms of Service"}
          </Link>
          <Link to="/data-policy" className="hover:text-foreground hover:underline underline-offset-4">
            {t("legal.privacy") || "Privacy & Data Policy"}
          </Link>
          <Link to="/community-guidelines" className="hover:text-foreground hover:underline underline-offset-4">
            {t("legal.guidelines") || "Community Guidelines"}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
