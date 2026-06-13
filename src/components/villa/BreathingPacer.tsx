import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Phase = "inhale" | "hold" | "exhale";
const cycle: { phase: Phase; secs: number; label: string }[] = [
  { phase: "inhale", secs: 4, label: "Breathe in" },
  { phase: "hold", secs: 4, label: "Hold" },
  { phase: "exhale", secs: 6, label: "Release" },
];

export function BreathingPacer() {
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % cycle.length), cycle[idx].secs * 1000);
    return () => clearTimeout(t);
  }, [idx, running]);

  const current = cycle[idx];
  const scale = current.phase === "inhale" ? 1 : current.phase === "hold" ? 1 : 0.55;

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="relative grid h-72 w-72 place-items-center">
        <motion.div
          className="absolute h-full w-full rounded-full bg-primary/15"
          animate={{ scale: running ? scale : 0.7 }}
          transition={{ duration: running ? current.secs : 0.6, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute h-2/3 w-2/3 rounded-full bg-primary/25"
          animate={{ scale: running ? scale : 0.7 }}
          transition={{ duration: running ? current.secs : 0.6, ease: "easeInOut" }}
        />
        <motion.div
          className="relative grid h-1/2 w-1/2 place-items-center rounded-full bg-primary text-primary-foreground"
          animate={{ scale: running ? scale : 0.7 }}
          transition={{ duration: running ? current.secs : 0.6, ease: "easeInOut" }}
        >
          <span className="font-serif text-xl">{running ? current.label : "Begin"}</span>
        </motion.div>
      </div>
      <button
        onClick={() => { setRunning((r) => !r); setIdx(0); }}
        className="rounded-full bg-accent px-8 py-3 text-accent-foreground font-medium"
      >
        {running ? "Pause" : "Start breathing"}
      </button>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        A 4-4-6 rhythm. Your breath is enough. There is nothing else to do right now.
      </p>
    </div>
  );
}
