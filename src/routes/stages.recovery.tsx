import { createFileRoute } from "@tanstack/react-router";
import { SectionTitle, Paper } from "@/components/villa/Paper";

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

const days = [
  { range: "Day 1–3", body: "Bed. Pads. Water beside you. Skin-to-skin. Nothing else is required." },
  { range: "Day 4–7", body: "The 'baby blues' wave. Notice the milk-let-down emotion. Tears are biology." },
  { range: "Week 2", body: "Bleeding shifts colour. Sitz baths. Soft food. Short windows on a chair." },
  { range: "Week 3–4", body: "Pelvic floor remembers itself slowly. Breathe down before you stand." },
  { range: "Week 5–6", body: "Light walks at your own threshold. Stop before tired." },
  { range: "Beyond", body: "Healing is not a deadline. You will keep softening for a year." },
];

function Recovery() {
  return (
    <div>
      <SectionTitle
        eyebrow="Recovery"
        title="Your body is healing on its own clock."
        lede="A slow map of the first weeks. Use it as a permission slip."
      />
      <ol className="space-y-3">
        {days.map((d, i) => (
          <li key={d.range}>
            <Paper className="flex gap-5 px-5 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-serif">
                {i + 1}
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{d.range}</p>
                <p className="mt-1 text-foreground">{d.body}</p>
              </div>
            </Paper>
          </li>
        ))}
      </ol>
    </div>
  );
}
