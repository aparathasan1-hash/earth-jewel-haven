import { createFileRoute } from "@tanstack/react-router";
import { SectionTitle } from "@/components/villa/Paper";
import { BreathingPacer } from "@/components/villa/BreathingPacer";

export const Route = createFileRoute("/stages/quiet")({
  head: () => ({
    meta: [
      { title: "Quiet Room — The Villageless Mama" },
      { name: "description", content: "A somatic breathing pacer. A wave that breathes with you." },
      { property: "og:title", content: "Quiet Room" },
      { property: "og:url", content: "/stages/quiet" },
    ],
    links: [{ rel: "canonical", href: "/stages/quiet" }],
  }),
  component: Quiet,
});

function Quiet() {
  return (
    <div>
      <SectionTitle eyebrow="Quiet Room" title="A wave that breathes with you." lede="Follow the circle. Nothing else." />
      <BreathingPacer />
    </div>
  );
}
