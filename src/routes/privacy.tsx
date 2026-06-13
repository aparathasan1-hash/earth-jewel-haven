import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Fingerprint } from "lucide-react";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Zero Data Promise — The Villageless Mama" },
      { name: "description", content: "Our zero-tracking policy and the optional Face ID secure lock for private rooms." },
      { property: "og:title", content: "Zero Data Promise" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  const { secureLock, toggleSecureLock } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-5 pt-8">
      <SectionTitle eyebrow="Ethical tech" title="A zero-data promise." />

      <Paper className="flex items-start gap-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <div>
          <p className="font-serif text-xl">No analytics. No cookies. No third-party trackers.</p>
          <p className="mt-2 text-muted-foreground">
            We do not store your reading. We do not know who you are. The only data this app
            keeps is your theme preference and the Secure Lock setting — both live on your
            device, never on a server.
          </p>
        </div>
      </Paper>

      <Paper className="mt-6">
        <div className="flex items-start gap-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-accent">
            <Fingerprint className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl">Secure Lock</p>
            <p className="mt-2 text-muted-foreground">
              A soft veil over the private rooms — Mother's Mind and the Crisis Room. When
              someone else picks up your phone, they meet a quiet threshold instead of your
              reflections.
            </p>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-3 rounded-full border border-border bg-card px-5 py-3">
              <span className={`relative inline-block h-6 w-11 rounded-full transition-colors ${secureLock ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${secureLock ? "translate-x-5" : "translate-x-0.5"}`} />
              </span>
              <span className="text-sm font-medium">{secureLock ? "Secure Lock is on" : "Turn on Secure Lock"}</span>
              <input type="checkbox" className="sr-only" checked={secureLock} onChange={toggleSecureLock} />
            </label>
          </div>
        </div>
      </Paper>

      <p className="mt-10 text-sm text-muted-foreground">
        Last gentle review: this season. Questions live with the writer, not a corporation.
      </p>
    </div>
  );
}
