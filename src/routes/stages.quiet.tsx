import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BreathingPacer } from "@/components/villa/BreathingPacer";
import { BreathingStats } from "@/components/villa/BreathingStats";
import { useT } from "@/lib/i18n";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/stages/quiet")({
  head: () => ({
    meta: [
      { title: "Quiet Room — The Villageless Mama" },
      { name: "description", content: "A somatic breathing pacer with a forest that breathes with you." },
      { property: "og:title", content: "Quiet Room" },
      { property: "og:url", content: "/stages/quiet" },
    ],
    links: [{ rel: "canonical", href: "/stages/quiet" }],
  }),
  component: Quiet,
});

function Quiet() {
  const t = useT();
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <div className="relative">
      <BreathingPacer />

      {/* Stats button */}
      <button
        onClick={() => setStatsOpen(true)}
        className="fixed bottom-20 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 transition-colors"
        aria-label={t("quiet.statsTitle")}
      >
        <BarChart3 className="h-5 w-5" />
      </button>

      <BreathingStats open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}
