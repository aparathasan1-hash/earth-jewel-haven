import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sun, Moon, Droplet, Shield, ShieldCheck, User, LogIn, LogOut, Settings, LayoutDashboard, Newspaper, Users, Sparkles, Compass, Radio, Gift, LineChart } from "lucide-react";
import { useApp } from "@/lib/store";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { useLang, setLang, useT, type Lang } from "@/lib/i18n";
import { getCurrentUser, signOut, getProfile, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const languages: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

export function TopBar() {
  const { theme, toggleTheme, softer, toggleSofter } = useApp();
  const lang = useLang();
  const t = useT();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser(u: { id: string; email?: string } | null) {
      if (!mounted) return;
      if (u) {
        setUser(u);
        const p = await getProfile(u.id);
        if (mounted) setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
    }

    // İlk yükleme
    getCurrentUser().then(loadUser);

    // Oturum değişimlerini canlı dinle (login/logout sonrası menü anında güncellensin)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setProfile(null);
    setUserMenuOpen(false);
    navigate({ to: "/" });
  }

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

          {/* Notifications */}
          {user && <NotificationBell userId={user.id} />}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-2xl border border-border bg-card p-2 shadow-xl">
                  {user ? (
                    <>
                      <div className="border-b border-border px-3 py-2">
                        <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                        <p className="text-xs text-muted-foreground">@{profile?.username || "user"}</p>
                      </div>
                      <Link
                        to="/auth/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <Link
                        to="/auth/assistant"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-accent hover:bg-secondary/40"
                      >
                        <Sparkles className="h-4 w-4" /> {t("nav.assistant") || "Yanında"}
                      </Link>
                      <Link
                        to="/auth/feed"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Newspaper className="h-4 w-4" /> {t("nav.feed") || "Feed"}
                      </Link>
                      <Link
                        to="/auth/friends"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Users className="h-4 w-4" /> {t("nav.friends") || "Friends"}
                      </Link>
                      <Link
                        to="/auth/discover"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Compass className="h-4 w-4" /> {t("nav.discover") || "Discover"}
                      </Link>
                      <Link
                        to="/auth/invite"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Gift className="h-4 w-4" /> {t("nav.invite") || "Invite"}
                      </Link>
                      <Link
                        to="/auth/insights"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <LineChart className="h-4 w-4" /> {t("nav.insights") || "Insights"}
                      </Link>
                      <Link
                        to="/auth/expert"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <ShieldCheck className="h-4 w-4" /> {t("nav.expert") || "Verified expert"}
                      </Link>
                      <Link
                        to="/auth/live"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Radio className="h-4 w-4" /> {t("nav.live") || "Live"}
                      </Link>
                      <Link
                        to="/auth/community"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" /> Community
                      </Link>
                      <Link
                        to="/auth/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" /> {t("settings.title") || "Settings"}
                      </Link>
                      {profile?.is_admin && (
                        <Link
                          to="/auth/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Admin
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/auth/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <LogIn className="h-4 w-4" /> Sign In
                      </Link>
                      <Link
                        to="/auth/signup"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      >
                        <User className="h-4 w-4" /> Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

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
