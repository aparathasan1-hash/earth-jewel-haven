import { Link } from "@tanstack/react-router";
import { Sun, Moon, Droplet, Shield } from "lucide-react";
import { useApp } from "@/lib/store";
import { Logo } from "./Logo";

export function TopBar() {
  const { theme, toggleTheme, softer, toggleSofter } = useApp();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-foreground">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSofter}
            aria-label={softer ? "Restore contrast" : "Softer contrast"}
            className={`grid h-10 w-10 place-items-center rounded-full border border-border ${softer ? "bg-secondary text-accent" : "text-muted-foreground"}`}
          >
            <Droplet className="h-4 w-4" />
          </button>
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/privacy"
            aria-label="Privacy"
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground"
          >
            <Shield className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
