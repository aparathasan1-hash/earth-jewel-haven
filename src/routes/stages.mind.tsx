import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { SecureLockGate } from "@/components/villa/SecureLockGate";

export const Route = createFileRoute("/stages/mind")({
  head: () => ({
    meta: [
      { title: "Mother's Mind — The Villageless Mama" },
      { name: "description", content: "Essays on womanhood, care, and the inner life of a mother." },
      { property: "og:title", content: "Mother's Mind" },
      { property: "og:url", content: "/stages/mind" },
    ],
    links: [{ rel: "canonical", href: "/stages/mind" }],
  }),
  component: Mind,
});

const essays = [
  {
    title: "Matrescence",
    sub: "On becoming the woman who already exists inside you.",
    body: [
      "There is a word for what is happening to you. It is older than the internet, older than the hospital. Matrescence. Like adolescence, but quieter, more private, and far less prepared for.",
      "Your hormones are doing what they did at thirteen. Your sense of self is unstitching to make room. The grief is real. The widening is real. So is the woman on the other side.",
      "You are not losing yourself. You are doubling.",
    ],
  },
  {
    title: "The kitchen at 3am",
    sub: "On the small, holy hour.",
    body: [
      "The fridge hums. The kettle ticks. The baby is finally heavy on your shoulder, breathing the breath of the truly asleep.",
      "No one will ever know this hour but you. Not even the child you held through it.",
      "Let it count. Let it count.",
    ],
  },
  {
    title: "Care, returned",
    sub: "On letting yourself be tended.",
    body: [
      "You spent the day giving care in increments smaller than a teaspoon. Now sit. Let the water be warm. Let someone else hand you the towel, if there is someone. If there isn't, hand it to yourself, slowly, like you mean it.",
    ],
  },
];

function Mind() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <SecureLockGate label="Mother's Mind">
      <SectionTitle eyebrow="Mother's Mind" title="Essays for the inner life." lede="Read one in the dark. Close it when you're done." />
      {open === null ? (
        <ul className="space-y-3">
          {essays.map((e, i) => (
            <li key={e.title}>
              <button onClick={() => setOpen(i)} className="block w-full text-left">
                <Paper className="transition-colors hover:bg-secondary/40">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Essay · {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-serif text-2xl">{e.title}</h3>
                  <p className="mt-1 text-muted-foreground">{e.sub}</p>
                </Paper>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <article className="animate-fade-up">
          <button onClick={() => setOpen(null)} className="mb-4 text-xs uppercase tracking-[0.22em] text-accent">← Back to essays</button>
          <Paper className="prose-book px-7 py-10 sm:px-12 sm:py-14">
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Essay</p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{essays[open].title}</h1>
            <p className="mt-2 italic text-muted-foreground">{essays[open].sub}</p>
            <div className="mt-6 text-lg leading-relaxed text-foreground">
              {essays[open].body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </Paper>
        </article>
      )}
    </SecureLockGate>
  );
}
