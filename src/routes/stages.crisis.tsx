import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { AmbientPlayer } from "@/components/villa/AmbientPlayer";
import { PermissionCards } from "@/components/villa/PermissionCards";
import { SecureLockGate } from "@/components/villa/SecureLockGate";

export const Route = createFileRoute("/stages/crisis")({
  head: () => ({
    meta: [
      { title: "Crisis Room — The Villageless Mama" },
      { name: "description", content: "When everything is too much: ambient audio, quick troubleshooting, and permission reminders." },
      { property: "og:title", content: "Crisis Room" },
      { property: "og:url", content: "/stages/crisis" },
    ],
    links: [{ rel: "canonical", href: "/stages/crisis" }],
  }),
  component: Crisis,
});

const guides = [
  { q: "The baby won't stop crying", a: "Check: hungry, hot, hurting, tired, lonely. If all five are no, hold them, walk slowly, hum. You are not failing." },
  { q: "I can't stop crying", a: "Sit down. One hand on your chest, one on your belly. Exhale longer than you inhale. This wave will pass through you, not break you." },
  { q: "The latch hurts", a: "Unlatch with your little finger. Bring baby to breast, not breast to baby. Wider mouth, chin first, deeper pull." },
  { q: "I can't sleep even when they sleep", a: "Don't force it. Lie down. Close your eyes. Rest counts. Sleep will come back." },
];

function Crisis() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <SecureLockGate label="the Crisis Room">
      <SectionTitle
        eyebrow="Crisis Room"
        title="Breathe. You're here now."
        lede="A few quiet tools, gathered. Use one, or all."
      />

      <Paper className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Ambient sanctuary</p>
        <h2 className="mt-2 font-serif text-2xl">Choose a sound to hold the room.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Loops gently. Adjust device volume.</p>
        <div className="mt-5">
          <AmbientPlayer />
        </div>
      </Paper>

      <div className="mb-8">
        <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-accent">Quick troubleshooting</p>
        <div className="space-y-2">
          {guides.map((g, i) => (
            <div key={g.q} className="rounded-2xl border border-border bg-card">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left min-h-14"
              >
                <span className="font-serif text-base">{g.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground animate-fade-up">{g.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-accent">Permission reminders</p>
        <PermissionCards />
      </div>
    </SecureLockGate>
  );
}
