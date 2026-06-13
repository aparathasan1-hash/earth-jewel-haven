import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Download, ExternalLink, FileText } from "lucide-react";
import { Paper } from "@/components/villa/Paper";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Villageless Mama — A sanctuary for postpartum" },
      { name: "description", content: "A quiet, ad-free digital village for postpartum mothers. Rituals, essays, breathing, audio sanctuary." },
      { property: "og:title", content: "The Villageless Mama" },
      { property: "og:description", content: "A quiet companion for the 4th trimester." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const guides = [
  { id: "g1", title: "The Soft Days Guide", desc: "A 14-day gentle plan for the first weeks at home.", price: "$9" },
  { id: "g2", title: "Night Rituals", desc: "Wordless practices for 2:30am.", price: "$6" },
  { id: "g3", title: "Letters to the Healing Body", desc: "A printable companion of permission.", price: "Free" },
];

function Landing() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-8">
      {/* Hero */}
      <section className="py-10">
        <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent">A companion · est. softly</p>
        <h1 className="font-serif text-4xl leading-tight sm:text-6xl">
          A village made of paper,<br />
          <em className="text-accent">made for you.</em>
        </h1>
        <p className="mt-6 max-w-prose text-lg text-muted-foreground">
          For the mother awake at 2:30am with a baby on her chest. For the mother who was
          promised a village and met silence instead. Here is a small one, in your pocket.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/stages" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground">
            Enter the 4th Trimester <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/vault" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3">
            Open The Vault
          </Link>
        </div>
      </section>

      {/* Welcome essay */}
      <Paper className="prose-book my-10 px-7 py-10 sm:px-12 sm:py-14">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">A welcome</p>
        <h2 className="mt-3 font-serif text-2xl sm:text-3xl">On being villageless</h2>
        <p className="mt-4 text-foreground">
          Somewhere along the way, we forgot how to gather around a new mother. We sent
          flowers. We sent silence. We sent her home, alone with a small body and a self
          she no longer recognised. This place is a paper village — slow, quiet, made of
          essays and rituals and the kind of audio that doesn't ask anything of you.
        </p>
        <p>
          There are no popups here. No tracking. No bright red badges. Read what you need.
          Close the tab when the baby stirs. Come back the next night, and the next.
        </p>
      </Paper>

      {/* Outside links */}
      <section className="grid gap-4 sm:grid-cols-2">
        <a href="https://substack.com" target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Newsletter</p>
            <p className="mt-1 font-serif text-xl">Letters on Substack</p>
            <p className="text-sm text-muted-foreground">Slow essays, monthly.</p>
          </div>
          <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        </a>
        <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Mood</p>
            <p className="mt-1 font-serif text-xl">Pinterest mood-board</p>
            <p className="text-sm text-muted-foreground">A visual companion.</p>
          </div>
          <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        </a>
      </section>

      {/* Guides */}
      <section className="mt-14">
        <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-accent">From the shelf</p>
        <h2 className="font-serif text-3xl">Take a guide</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Tap a guide. It opens here, instantly. No checkout pages. No accounts.
        </p>

        <div className="mt-6 grid gap-4">
          {guides.map((g) => (
            <div key={g.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpened(opened === g.id ? null : g.id)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left min-h-14"
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif text-lg truncate">{g.title}</span>
                    <span className="block text-sm text-muted-foreground">{g.desc}</span>
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {opened === g.id ? "Close" : g.price === "Free" ? "Get" : `Buy ${g.price}`}
                </span>
              </button>

              {opened === g.id && (
                <div className="animate-fade-up border-t border-border bg-background/40 p-5">
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-secondary">
                    <iframe
                      title={g.title}
                      src="https://docs.google.com/gview?embedded=true&url=https%3A%2F%2Fwww.africau.edu%2Fimages%2Fdefault%2Fsample.pdf"
                      className="h-full w-full"
                    />
                  </div>
                  <a
                    href="https://www.africau.edu/images/default/sample.pdf"
                    download
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5"
                  >
                    <Download className="h-4 w-4" /> Save to your device
                  </a>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Delivered instantly. It's yours to keep.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>Made slowly. No trackers. <Link to="/privacy" className="underline underline-offset-4">Our zero-data promise →</Link></p>
      </footer>
    </div>
  );
}
