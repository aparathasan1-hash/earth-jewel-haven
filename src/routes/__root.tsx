import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { TopBar } from "../components/villa/TopBar";
import { BottomNav } from "../components/villa/BottomNav";
import { SecureLockReset } from "../components/villa/SecureLockReset";
import { useApp } from "../lib/store";
import { PageTransition, SplashOverlay } from "../components/villa/PageTransition";
function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-6xl text-accent">404</h1>
        <h2 className="mt-4 font-serif text-2xl">A path that doesn't lead anywhere</h2>
        <p className="mt-3 text-muted-foreground">Take a breath. We'll bring you back.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">Something stumbled.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Let's try again, gently.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5">
            Go home
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
      { property: "og:site_name", content: "The Villageless Mama" },
      { property: "og:title", content: "The Villageless Mama" },
      { property: "og:description", content: "A sensory companion for postpartum mothers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <SecureLockReset />
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
