import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Heart, Baby, LifeBuoy, Wind, HandHeart, Feather } from "lucide-react";
import { SectionTitle } from "@/components/villa/Paper";

export const Route = createFileRoute("/stages")({
  head: () => ({
    meta: [
      { title: "The 4th Trimester — The Villageless Mama" },
      { name: "description", content: "Six gentle rooms for the 4th trimester: Recovery, Nursery, Crisis, Quiet, Support, Mind." },
      { property: "og:title", content: "The 4th Trimester" },
      { property: "og:description", content: "Six rooms for the postpartum months." },
      { property: "og:url", content: "/stages" },
    ],
    links: [{ rel: "canonical", href: "/stages" }],
  }),
  component: StagesLayout,
});

const rooms = [
  { to: "/stages/recovery", title: "Recovery Room", desc: "Physical healing, day by day.", icon: Heart },
  { to: "/stages/nursery", title: "Nursery", desc: "Small rituals with the baby.", icon: Baby },
  { to: "/stages/crisis", title: "Crisis Room", desc: "When everything is too much.", icon: LifeBuoy },
  { to: "/stages/quiet", title: "Quiet Room", desc: "A breath, paced for you.", icon: Wind },
  { to: "/stages/support", title: "Virtual Support Hand", desc: "A 30-minute quiet co-working call.", icon: HandHeart },
  { to: "/stages/mind", title: "Mother's Mind", desc: "Essays on womanhood and care.", icon: Feather },
] as const;

function StagesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOverview = pathname === "/stages";

  if (!isOverview) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-6">
        <Link to="/stages" className="mb-6 inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-accent">
          ← All rooms
        </Link>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8">
      <SectionTitle
        eyebrow="The Framework"
        title="Six rooms for the 4th trimester."
        lede="Step into the room you need. Leave the others for later."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {rooms.map((r) => (
          <li key={r.to}>
            <Link
              to={r.to}
              className="group block h-full rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-accent">
                  <r.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-serif text-xl">{r.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
