import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const reminders = [
  "You are allowed to rest.",
  "You don't have to enjoy every moment.",
  "Asking for help is not a failure.",
  "Your body is healing on its own timeline.",
  "Lower the bar. Then lower it again.",
  "Crying is not a problem to be solved.",
  "You are the right mother for this baby.",
];

export function PermissionCards() {
  const [i, setI] = useState(0);
  return (
    <button
      onClick={() => setI((p) => (p + 1) % reminders.length)}
      className="relative block w-full overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 text-left min-h-44"
      aria-label="Next reminder"
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="font-serif text-2xl leading-snug text-foreground sm:text-3xl"
        >
          {reminders[i]}
        </motion.p>
      </AnimatePresence>
      <span className="mt-6 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Tap for another</span>
    </button>
  );
}
