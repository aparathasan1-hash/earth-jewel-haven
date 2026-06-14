import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { AmbientPlayer } from "@/components/villa/AmbientPlayer";
import { PermissionCards } from "@/components/villa/PermissionCards";
import { SecureLockGate } from "@/components/villa/SecureLockGate";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/stages/crisis")({
  head: () => ({
    meta: [
      { title: "Crisis Room — The Villageless Mama" },
      {
        name: "description",
        content:
          "When everything is too much: ambient audio, quick troubleshooting, and permission reminders.",
      },
      { property: "og:title", content: "Crisis Room" },
      { property: "og:url", content: "/stages/crisis" },
    ],
    links: [{ rel: "canonical", href: "/stages/crisis" }],
  }),
  component: Crisis,
});

const guideKeys = [
  { qKey: "crisis.q1", aKey: "crisis.a1" },
  { qKey: "crisis.q2", aKey: "crisis.a2" },
  { qKey: "crisis.q3", aKey: "crisis.a3" },
  { qKey: "crisis.q4", aKey: "crisis.a4" },
  { qKey: "crisis.q5", aKey: "crisis.a5" },
  { qKey: "crisis.q6", aKey: "crisis.a6" },
  { qKey: "crisis.q7", aKey: "crisis.a7" },
];

function Crisis() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <SecureLockGate label={t("crisis.eyebrow")}>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[oklch(0.15_0.03_260_/_0.12)] via-transparent to-transparent" />
      <div className="relative">
        <SectionTitle
          eyebrow={t("crisis.eyebrow")}
          title={t("crisis.heading")}
          lede={t("crisis.lede")}
        />

        <Paper className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">{t("crisis.ambientEyebrow")}</p>
          <h2 className="mt-2 font-serif text-2xl">{t("crisis.ambientTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("crisis.ambientDesc")}</p>
          <div className="mt-5">
            <AmbientPlayer />
          </div>
        </Paper>

        <div className="mb-8">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-accent">
            {t("crisis.troubleshootEyebrow")}
          </p>
          <div className="space-y-2">
            {guideKeys.map((g, i) => (
              <div key={g.qKey} className="rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left min-h-14"
                >
                  <span className="font-serif text-base">{t(g.qKey)}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                  />
                </button>
                {open === i && (
                  <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground animate-fade-up">
                    {t(g.aKey)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-accent">
            {t("crisis.permissionEyebrow")}
          </p>
          <PermissionCards />
        </div>
      </div>
    </SecureLockGate>
  );
}
