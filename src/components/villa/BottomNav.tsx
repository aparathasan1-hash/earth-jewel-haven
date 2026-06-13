import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Layers, Wind, Feather } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/vault", label: "Vault", icon: BookOpen },
  { to: "/stages", label: "Stages", icon: Layers },
  { to: "/stages/quiet", label: "Breathe", icon: Wind },
  { to: "/stages/mind", label: "Mind", icon: Feather },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2 pt-1.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 min-h-14 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
                <span className="font-medium tracking-wide">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
