import { createFileRoute } from "@tanstack/react-router";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/stages/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery Room — The Villageless Mama" },
      { name: "description", content: "Gentle, day-by-day notes for physical postpartum healing." },
      { property: "og:title", content: "Recovery Room" },
      { property: "og:url", content: "/stages/recovery" },
    ],
    links: [{ rel: "canonical", href: "/stages/recovery" }],
  }),
  component: Recovery,
});

const dayKeys = [
  { rangeKey: "recovery.day1", bodyKey: "recovery.day1Body" },
  { rangeKey: "recovery.day2", bodyKey: "recovery.day2Body" },
  { rangeKey: "recovery.day3", bodyKey: "recovery.day3Body" },
  { rangeKey: "recovery.day4", bodyKey: "recovery.day4Body" },
  { rangeKey: "recovery.day5", bodyKey: "recovery.day5Body" },
  { rangeKey: "recovery.day6", bodyKey: "recovery.day6Body" },
];

const comfortKeys = [
  { titleKey: "recovery.comfort1Title", bodyKey: "recovery.comfort1Body" },
  { titleKey: "recovery.comfort2Title", bodyKey: "recovery.comfort2Body" },
  { titleKey: "recovery.comfort3Title", bodyKey: "recovery.comfort3Body" },
  { titleKey: "recovery.comfort4Title", bodyKey: "recovery.comfort4Body" },
];

function Recovery() {
  const t = useT();
  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[oklch(0.55_0.08_45_/_0.08)] via-transparent to-transparent" />
      <div className="relative">
        <SectionTitle
          eyebrow={t("recovery.eyebrow")}
          title={t("recovery.heading")}
          lede={t("recovery.lede")}
        />
        <ol className="space-y-3">
          {dayKeys.map((d, i) => (
            <li key={d.rangeKey}>
              <Paper className="flex gap-5 px-5 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-serif">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{t(d.rangeKey)}</p>
                  <p className="mt-1 text-foreground">{t(d.bodyKey)}</p>
                </div>
              </Paper>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-accent">{t("recovery.comfortEyebrow")}</p>
          <h2 className="mb-6 font-serif text-2xl">{t("recovery.comfortTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {comfortKeys.map((n) => (
              <Paper key={n.titleKey}>
                <h3 className="font-serif text-lg">{t(n.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(n.bodyKey)}</p>
              </Paper>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
