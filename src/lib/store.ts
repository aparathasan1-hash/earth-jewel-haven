import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

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
};

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
      toggleSecureLock: () => set({ secureLock: !get().secureLock, unlocked: !get().secureLock ? false : true }),
      setUnlocked: (u) => set({ unlocked: u }),
    }),
    { name: "villa-prefs" }
  )
);
