import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sun, Moon, Droplet, Shield } from "lucide-react";
import { useApp } from "@/lib/store";
import { Logo } from "./Logo";
import { useLang, setLang, type Lang } from "@/lib/i18n";

const languages: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

export function TopBar() {
  const { theme, toggleTheme, softer, toggleSofter } = useApp();
  const lang = useLang();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-foreground">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground text-xs font-medium uppercase tracking-wider"
              aria-label="Switch language"
            >
              {lang}
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-12 z-50 min-w-[120px] rounded-2xl border border-border bg-card p-2 shadow-xl">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        lang === l.code
                          ? "bg-secondary text-accent font-medium"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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
