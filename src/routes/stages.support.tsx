import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { SectionTitle, Paper } from "@/components/villa/Paper";

export const Route = createFileRoute("/stages/support")({
  head: () => ({
    meta: [
      { title: "Virtual Support Hand — The Villageless Mama" },
      { name: "description", content: "Book a 30-minute quiet co-working call. No agenda. Just company." },
      { property: "og:title", content: "Virtual Support Hand" },
      { property: "og:url", content: "/stages/support" },
    ],
    links: [{ rel: "canonical", href: "/stages/support" }],
  }),
  component: Support,
});

const slots = ["Tonight · 9:30 PM", "Tomorrow · 6:00 AM", "Tomorrow · 11:00 AM", "Friday · 2:00 PM"];

function Support() {
  const [name, setName] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);

  if (booked) {
    return (
      <div>
        <SectionTitle eyebrow="You're in" title="Held for you." />
        <Paper className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-6 w-6" />
          </div>
          <p className="font-serif text-xl">{booked}</p>
          <p className="mt-2 text-sm text-muted-foreground">We'll be there. Camera optional. Pyjamas welcome.</p>
          <button onClick={() => { setBooked(null); setSlot(null); setName(""); }} className="mt-6 rounded-full border border-border px-5 py-2.5 text-sm">
            Book another
          </button>
        </Paper>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Virtual Support Hand"
        title="A 30-minute quiet co-working call."
        lede="No agenda. Camera on or off. Feed, fold, nap, breathe — together."
      />
      <Paper>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-accent">Your first name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
            placeholder="(only what you'd like us to call you)"
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-xs uppercase tracking-[0.2em] text-accent">Choose a time</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {slots.map((s) => (
              <label key={s} className={`cursor-pointer rounded-xl border px-4 py-3 ${slot === s ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                <input type="radio" name="slot" className="sr-only" checked={slot === s} onChange={() => setSlot(s)} />
                <span className="font-serif">{s}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          disabled={!name || !slot}
          onClick={() => setBooked(`${name}, you're on for ${slot}.`)}
          className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
        >
          Hold my spot
        </button>
      </Paper>
    </div>
  );
}
