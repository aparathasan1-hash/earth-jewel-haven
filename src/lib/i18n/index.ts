import { useCallback, useSyncExternalStore } from "react";

export type Lang = "en" | "tr";

const STORAGE_KEY = "villa-lang";

let currentLang: Lang = "en";

function getStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "tr") return stored;
  } catch {}
  return "en";
}

function storeLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return currentLang;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  storeLang(lang);
  listeners.forEach((cb) => cb());
}

export function useLang() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Translation cache
const cache = new Map<Lang, Record<string, unknown>>();

async function loadTranslations(lang: Lang): Promise<Record<string, unknown>> {
  if (cache.has(lang)) return cache.get(lang)!;
  const mod = await import(`./translations/${lang}.json`);
  cache.set(lang, mod.default);
  return mod.default;
}

// Preload all available languages on init
const INIT_LANG = getStoredLang();
currentLang = INIT_LANG;

loadTranslations(INIT_LANG);
// Preload other language in background
if (INIT_LANG === "en") loadTranslations("tr");
else loadTranslations("en");

export function useT() {
  const lang = useLang();

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const dict = cache.get(lang) ?? cache.get("en") ?? {};
      const keys = path.split(".");
      let val: unknown = dict;
      for (const k of keys) {
        if (val && typeof val === "object" && k in (val as Record<string, unknown>)) {
          val = (val as Record<string, unknown>)[k];
        } else {
          // Fallback to English
          const enDict = cache.get("en") ?? {};
          val = enDict;
          for (const k2 of keys) {
            if (val && typeof val === "object" && k2 in (val as Record<string, unknown>)) {
              val = (val as Record<string, unknown>)[k2];
            } else {
              return path;
            }
          }
          break;
        }
      }
      let str = typeof val === "string" ? val : path;
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          str = str.replace(`{${key}}`, String(value));
        }
      }
      return str;
    },
    [lang],
  );

  return t;
}
