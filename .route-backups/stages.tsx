import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Heart, Baby, LifeBuoy, Wind, HandHeart, Feather } from "lucide-react";
import { SectionTitle } from "@/components/villa/Paper";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/stages")({
  head: () => ({
    meta: [
      { title: "The 4th Trimester — The Villageless Mama" },
      {
        name: "description",
        content:
          "Six gentle rooms for the 4th trimester: Recovery, Nursery, Crisis, Quiet, Support, Mind.",
      },
      { property: "og:title", content: "The 4th Trimester" },
      { property: "og:description", content: "Six rooms for the postpartum months." },
      { property: "og:url", content: "/stages" },
    ],
    links: [{ rel: "canonical", href: "/stages" }],
  }),
  component: StagesLayout,
});

const rooms = [
  { to: "/stages/recovery", titleKey: "stages.recovery.title", descKey: "stages.recovery.desc", icon: Heart },
  { to: "/stages/nursery", titleKey: "stages.nursery.title", descKey: "stages.nursery.desc", icon: Baby },
  { to: "/stages/crisis", titleKey: "stages.crisis.title", descKey: "stages.crisis.desc", icon: LifeBuoy },
  { to: "/stages/quiet", titleKey: "stages.quiet.title", descKey: "stages.quiet.desc", icon: Wind },
  { to: "/stages/support", titleKey: "stages.support.title", descKey: "stages.support.desc", icon: HandHeart },
  { to: "/stages/mind", titleKey: "stages.mind.title", descKey: "stages.mind.desc", icon: Feather },
] as const;

function StagesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  const isOverview = pathname === "/stages";

  if (!isOverview) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-6">
        <Link
          to="/stages"
          className="mb-6 inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-accent"
        >
          {t("stages.backLink")}
        </Link>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8">
      <SectionTitle
        eyebrow={t("stages.eyebrow")}
        title={t("stages.heading")}
        lede={t("stages.lede")}
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {rooms.map((r) => (
          <li key={r.to}>
            <Link
              to={r.to}
              className="group block h-full rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-accent">
                  <r.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-serif text-xl">{t(r.titleKey)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(r.descKey)}</p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
