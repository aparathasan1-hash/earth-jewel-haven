import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/store";

/** Re-lock private rooms whenever the route changes while Secure Lock is on. */
export function SecureLockReset() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { secureLock, setUnlocked } = useApp();

  useEffect(() => {
    if (secureLock) setUnlocked(false);
  }, [pathname, secureLock, setUnlocked]);

  return null;
}
