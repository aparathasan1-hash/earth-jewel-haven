import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

type BreathSession = {
  date: string; // "2026-06-13"
  totalSeconds: number;
  cycles: number;
  pattern: string;
};

type Store = {
  theme: Theme;
  softer: boolean;
  secureLock: boolean;
  unlocked: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSofter: () => void;
  toggleSecureLock: () => void;
  setUnlocked: (u: boolean) => void;

  // Breathing history
  breathHistory: BreathSession[];
  addBreathSession: (session: BreathSession) => void;

  // Daily goal (in seconds)
  dailyGoal: number; // default 300 = 5 minutes
  setDailyGoal: (seconds: number) => void;
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getTodayTotal(history: BreathSession[]): number {
  const today = getToday();
  return history
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.totalSeconds, 0);
}

export const useApp = create<Store>()(
  persist(
    (set, get) => ({
      theme: "dark",
      softer: false,
      secureLock: false,
      unlocked: true,
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      toggleSofter: () => set({ softer: !get().softer }),
      toggleSecureLock: () => {
        const next = !get().secureLock;
        set({ secureLock: next, unlocked: !next });
      },
      setUnlocked: (u) => set({ unlocked: u }),

      breathHistory: [],
      addBreathSession: (session) =>
        set({ breathHistory: [...get().breathHistory, session] }),

      dailyGoal: 300, // 5 minutes default
      setDailyGoal: (seconds) => set({ dailyGoal: seconds }),
    }),
    {
      name: "villa-prefs",
      partialize: (state) => ({
        theme: state.theme,
        softer: state.softer,
        secureLock: state.secureLock,
        breathHistory: state.breathHistory,
        dailyGoal: state.dailyGoal,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.secureLock) state.unlocked = false;
      },
    },
  ),
);
