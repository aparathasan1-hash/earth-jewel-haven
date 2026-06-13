import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Layers, Wind, Feather } from "lucide-react";
import { useT } from "@/lib/i18n";

const items = [
  { to: "/", labelKey: "nav.home", icon: Home },
  { to: "/vault", labelKey: "nav.vault", icon: BookOpen },
  { to: "/stages", labelKey: "nav.stages", icon: Layers },
  { to: "/stages/quiet", labelKey: "stages.quiet.title", icon: Wind },
  { to: "/stages/mind", labelKey: "stages.mind.title", icon: Feather },
] as const;

/** Routes with their own nav tab — don't highlight "Stages" when one of these is active */
const stagesShortcutPaths = ["/stages/quiet", "/stages/mind"];

function isNavActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  if (to === "/stages") {
    if (pathname === "/stages") return true;
    if (!pathname.startsWith("/stages/")) return false;
    return !stagesShortcutPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/85 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2 pt-1.5">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const active = isNavActive(pathname, to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 min-h-14 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
                <span className="font-medium tracking-wide">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
