import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHeart } from "lucide-react";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/stages/support")({
  head: () => ({
    meta: [
      { title: "Virtual Support Hand — The Villageless Mama" },
      {
        name: "description",
        content: "Quiet co-working calls for postpartum mothers — coming soon.",
      },
      { property: "og:title", content: "Virtual Support Hand" },
      { property: "og:url", content: "/stages/support" },
    ],
    links: [{ rel: "canonical", href: "/stages/support" }],
  }),
  component: Support,
});

function Support() {
  const t = useT();
  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[oklch(0.5_0.1_60_/_0.08)] via-transparent to-transparent" />
      <div className="relative">
        <SectionTitle
          eyebrow={t("support.eyebrow")}
          title={t("support.heading")}
          lede={t("support.lede")}
        />

        <Paper className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary text-accent">
            <HandHeart className="h-6 w-6" />
          </div>
          <p className="font-serif text-xl">{t("support.comingSoon")}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("support.untilThen")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/stages/quiet"
              className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              {t("stages.quiet.title")}
            </Link>
            <Link to="/vault" className="rounded-full border border-border px-5 py-2.5 text-sm">
              {t("nav.vault")}
            </Link>
          </div>
        </Paper>
      </div>
    </div>
  );
}
