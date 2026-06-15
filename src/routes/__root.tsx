import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { TopBar } from "../components/villa/TopBar";
import { BottomNav } from "../components/villa/BottomNav";
import { SecureLockReset } from "../components/villa/SecureLockReset";
import { DailyCheckIn } from "../components/villa/DailyCheckIn";
import { useApp } from "../lib/store";
import { useT } from "../lib/i18n";
import { PageTransition, SplashOverlay } from "../components/villa/PageTransition";
import { getCurrentUser, getTodayMood, getOnboardingState } from "../lib/auth";

function NotFoundComponent() {
  const t = useT();
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-6xl text-accent">404</h1>
        <h2 className="mt-4 font-serif text-2xl">{t("error.notFoundTitle") || "A path that doesn't lead anywhere"}</h2>
        <p className="mt-3 text-muted-foreground">{t("error.notFoundDesc") || "Take a breath. We'll bring you back."}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          {t("error.goHome") || "Return home"}
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT();
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">{t("error.somethingStumbled") || "Something stumbled."}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.tryAgain") || "Let's try again, gently."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground"
          >
            {t("error.tryAgainBtn") || "Try again"}
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5">
            {t("error.goHome") || "Go home"}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1c1915" },
      { title: "The Villageless Mama — A sanctuary for postpartum" },
      {
        name: "description",
        content:
          "A sensory, ad-free companion for postpartum mothers. Editorial essays, rituals, breathing, and quiet support.",
      },
      { name: "keywords", content: "postpartum, motherhood, matrescence, maternal mental health, breathing, meditation, parenting support" },
      { name: "author", content: "The Villageless Mama" },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: "The Villageless Mama" },
      { property: "og:title", content: "The Villageless Mama — A sanctuary for postpartum" },
      { property: "og:description", content: "A sensory, ad-free companion for postpartum mothers. Editorial essays, rituals, breathing, and quiet support." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The Villageless Mama" },
      { name: "twitter:description", content: "A sensory companion for postpartum mothers." },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/Amblem.jpg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Work+Sans:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeSync() {
  const { theme, softer } = useApp();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("softer", softer);
  }, [theme, softer]);
  return null;
}

function DailyCheckInManager() {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkDaily() {
      try {
        const user = await getCurrentUser();
        if (!user || cancelled) return;

        setUserId(user.id);

        // Check if user already checked in today
        const todayMood = await getTodayMood(user.id);
        if (!todayMood && !cancelled) {
          // Show modal after 1.5 second delay for better UX
          setTimeout(() => {
            if (!cancelled) setShowCheckIn(true);
          }, 1500);
        }
      } catch (err) {
        console.error("Error checking daily mood:", err);
      }
    }

    checkDaily();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!userId) return null;

  return <DailyCheckIn open={showCheckIn} onClose={() => setShowCheckIn(false)} userId={userId} />;
}

// Yeni (onboarding tamamlamamış) kullanıcıyı sihirbaza yönlendirir.
function OnboardingManager() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    // Onboarding sayfasının kendisinde veya auth/giriş akışında tetikleme
    if (pathname.startsWith("/auth/onboarding") || pathname.startsWith("/auth/login")) return;

    async function check() {
      try {
        const user = await getCurrentUser();
        if (!user || cancelled) return;
        const state = await getOnboardingState(user.id);
        if (!state.onboarded && !cancelled) {
          navigate({ to: "/auth/onboarding" });
        }
      } catch (err) {
        console.error("Onboarding check error:", err);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [pathname, navigate]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <OnboardingManager />
      <DailyCheckInManager />
      <SecureLockReset />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.2 0.01 60)",
            color: "oklch(0.9 0.01 60)",
            border: "1px solid oklch(0.3 0.01 60)",
            borderRadius: "1rem",
          },
        }}
      />
      {showSplash && <SplashOverlay onComplete={() => setShowSplash(false)} />}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <TopBar />
        <main className="flex-1 pb-28">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
