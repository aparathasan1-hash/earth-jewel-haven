import { createFileRoute } from "@tanstack/react-router";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/stages/nursery")({
  head: () => ({
    meta: [
      { title: "Nursery — The Villageless Mama" },
      {
        name: "description",
        content: "Small practical rituals for the baby: bathing, swaddling, the ritual of fabric.",
      },
      { property: "og:title", content: "Nursery" },
      { property: "og:url", content: "/stages/nursery" },
    ],
    links: [{ rel: "canonical", href: "/stages/nursery" }],
  }),
  component: Nursery,
});

const ritualKeys = [
  { titleKey: "nursery.ritual1Title", bodyKey: "nursery.ritual1Body" },
  { titleKey: "nursery.ritual2Title", bodyKey: "nursery.ritual2Body" },
  { titleKey: "nursery.ritual3Title", bodyKey: "nursery.ritual3Body" },
  { titleKey: "nursery.ritual4Title", bodyKey: "nursery.ritual4Body" },
  { titleKey: "nursery.ritual5Title", bodyKey: "nursery.ritual5Body" },
  { titleKey: "nursery.ritual6Title", bodyKey: "nursery.ritual6Body" },
  { titleKey: "nursery.ritual7Title", bodyKey: "nursery.ritual7Body" },
  { titleKey: "nursery.ritual8Title", bodyKey: "nursery.ritual8Body" },
];

function Nursery() {
  const t = useT();
  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[oklch(0.5_0.07_280_/_0.08)] via-transparent to-transparent" />
      <div className="relative">
        <SectionTitle
          eyebrow={t("nursery.eyebrow")}
          title={t("nursery.heading")}
          lede={t("nursery.lede")}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {ritualKeys.map((r) => (
            <Paper key={r.titleKey}>
              <h3 className="font-serif text-lg">{t(r.titleKey)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(r.bodyKey)}</p>
            </Paper>
          ))}
        </div>
      </div>
    </div>
  );
}
