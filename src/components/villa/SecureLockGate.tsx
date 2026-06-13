import { useState, type ReactNode } from "react";
import { Fingerprint, Lock } from "lucide-react";
import { useApp } from "@/lib/store";

export function SecureLockGate({ children, label = "this space" }: { children: ReactNode; label?: string }) {
  const { secureLock, unlocked, setUnlocked } = useApp();
  const [pressing, setPressing] = useState(false);
  if (!secureLock || unlocked) return <>{children}</>;
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-secondary text-accent">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="font-serif text-2xl">A private threshold</h2>
      <p className="mt-3 text-muted-foreground">
        Secure Lock is on. Press and hold to enter {label}.
      </p>
      <button
        onMouseDown={() => { setPressing(true); setTimeout(() => setUnlocked(true), 700); }}
        onMouseUp={() => setPressing(false)}
        onTouchStart={() => { setPressing(true); setTimeout(() => setUnlocked(true), 700); }}
        onTouchEnd={() => setPressing(false)}
        className={`mt-8 inline-flex items-center gap-3 rounded-full border border-border px-6 py-4 transition-all ${pressing ? "scale-95 bg-primary text-primary-foreground" : "bg-card"}`}
      >
        <Fingerprint className="h-6 w-6" />
        <span className="font-medium">Hold to unlock</span>
      </button>
    </section>
  );
}
