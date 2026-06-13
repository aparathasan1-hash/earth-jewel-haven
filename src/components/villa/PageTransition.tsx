import { motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

const roomColors: Record<string, string> = {
  "/": "oklch(0.19 0.012 60)",
  "/stages": "oklch(0.19 0.012 60)",
  "/stages/recovery": "oklch(0.55 0.08 45)",
  "/stages/nursery": "oklch(0.5 0.07 280)",
  "/stages/crisis": "oklch(0.15 0.03 260)",
  "/stages/quiet": "oklch(0.2 0.04 150)",
  "/stages/support": "oklch(0.5 0.1 60)",
  "/stages/mind": "oklch(0.4 0.06 300)",
  "/vault": "oklch(0.19 0.012 60)",
  "/privacy": "oklch(0.19 0.012 60)",
};

function getRoomColor(pathname: string): string {
  if (roomColors[pathname]) return roomColors[pathname];
  for (const [prefix, color] of Object.entries(roomColors)) {
    if (pathname.startsWith(prefix) && prefix !== "/") return color;
  }
  return roomColors["/"];
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const roomColor = getRoomColor(pathname);

  return (
    <div className="relative">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Color flash overlay — only on route change */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: 0.6, backgroundColor: roomColor }}
          animate={{ opacity: 0, backgroundColor: roomColor }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {children}
      </motion.div>
    </div>
  );
}

export function SplashOverlay({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 1.2, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <img
          src="/Amblem.jpg"
          alt="The Villageless Mama"
          className="h-80 w-auto max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-accent/20"
        />
        <motion.p
          className="font-serif text-2xl text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          The Villageless Mama
        </motion.p>
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          A sanctuary for postpartum
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
