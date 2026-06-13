import { createFileRoute } from "@tanstack/react-router";
import { SectionTitle, Paper } from "@/components/villa/Paper";

export const Route = createFileRoute("/stages/nursery")({
  head: () => ({
    meta: [
      { title: "Nursery — The Villageless Mama" },
      { name: "description", content: "Small practical rituals for the baby: bathing, swaddling, the ritual of fabric." },
      { property: "og:title", content: "Nursery" },
      { property: "og:url", content: "/stages/nursery" },
    ],
    links: [{ rel: "canonical", href: "/stages/nursery" }],
  }),
  component: Nursery,
});

const rituals = [
  { title: "How to wash a baby", body: "Warm cloth, warm room. Begin at the eyes, end at the feet. The order matters more than the soap." },
  { title: "The ritual of fabric", body: "One cloth for sleep. One for play. Washed in the same water as yours. Familiar scent is a kind of safety." },
  { title: "The wrap, slowly", body: "Lay the cloth in a diamond. Fold the top corner. Place the baby. Snug the arms. Quiet the hands." },
  { title: "Nail trimming, without fear", body: "While they nurse or sleep. Use the soft file, not the clipper, for the first weeks." },
  { title: "A bedtime sequence", body: "Dim → wipe → cream → sing one line, the same line, always. Repetition is the lullaby." },
];

function Nursery() {
  return (
    <div>
      <SectionTitle eyebrow="Nursery" title="Small rituals, repeated softly." lede="The baby learns the world from your hands." />
      <div className="grid gap-3 sm:grid-cols-2">
        {rituals.map((r) => (
          <Paper key={r.title}>
            <h3 className="font-serif text-lg">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
          </Paper>
        ))}
      </div>
    </div>
  );
}
