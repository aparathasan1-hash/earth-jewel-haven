// Haftalık içgörü hesaplamaları — saf fonksiyonlar (test edilebilir, yan etkisiz).
// Mevcut verilerden (mood/breath/feeding/sleep) son 7 günü özetler. Tıbbi iddia YOK.
import type { MoodEntry, BreathSession, FeedingLog, SleepLog } from "./auth";

export type Trend = "up" | "down" | "flat";

// Yerel saat dilimine göre gün anahtarı (YYYY-MM-DD). UTC kaymasını önler.
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Bugünden geriye n günün anahtar kümesi (bugün dahil).
function lastNDayKeys(n: number): Set<string> {
  const keys = new Set<string>();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    keys.add(dayKey(d));
    d.setDate(d.getDate() - 1);
  }
  return keys;
}

export type MoodInsight = {
  count: number; // son 7 gün giriş sayısı
  avg: number | null; // ortalama ruh hâli 1-5
  prevAvg: number | null; // önceki 7 gün
  trend: Trend;
};

export function moodInsight(entries: MoodEntry[]): MoodInsight {
  const week = lastNDayKeys(7);
  const prevWeek = new Set<string>();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 7);
  for (let i = 0; i < 7; i++) {
    prevWeek.add(dayKey(d));
    d.setDate(d.getDate() - 1);
  }
  const k = (s: string) => s.slice(0, 10);
  const w = entries.filter((e) => week.has(k(e.entry_date)));
  const p = entries.filter((e) => prevWeek.has(k(e.entry_date)));
  const avg = w.length ? w.reduce((a, e) => a + e.mood, 0) / w.length : null;
  const prevAvg = p.length ? p.reduce((a, e) => a + e.mood, 0) / p.length : null;
  let trend: Trend = "flat";
  if (avg !== null && prevAvg !== null) {
    if (avg - prevAvg > 0.25) trend = "up";
    else if (prevAvg - avg > 0.25) trend = "down";
  }
  return { count: w.length, avg, prevAvg, trend };
}

export type BreathInsight = {
  sessions: number; // bu hafta seans sayısı
  minutes: number; // bu hafta toplam dakika
  streak: number; // bugüne kadar üst üste gün
};

export function breathInsight(sessions: BreathSession[]): BreathInsight {
  const week = lastNDayKeys(7);
  const k = (s: string) => s.slice(0, 10);
  const w = sessions.filter((s) => week.has(k(s.date)));
  const minutes = Math.round(w.reduce((a, s) => a + (s.total_seconds || 0), 0) / 60);

  // Streak: bugüne (yoksa düne) kadar kesintisiz gün sayısı
  const dayset = new Set(sessions.map((s) => k(s.date)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dayset.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dayset.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { sessions: w.length, minutes, streak };
}

export type CareInsight = {
  feeds: number; // son 7 gün
  feedsPerDay: number;
  sleepHours: number; // son 7 gün (tamamlanmış uykular)
  sleepPerDay: number;
};

export function careInsight(feeding: FeedingLog[], sleep: SleepLog[]): CareInsight {
  const week = lastNDayKeys(7);
  const feeds = feeding.filter((f) => week.has(dayKey(new Date(f.logged_at)))).length;
  let ms = 0;
  for (const s of sleep) {
    if (!s.end_at) continue;
    const start = new Date(s.start_at);
    if (!week.has(dayKey(start))) continue;
    ms += new Date(s.end_at).getTime() - start.getTime();
  }
  const sleepHours = Math.round((ms / 3_600_000) * 10) / 10;
  return {
    feeds,
    feedsPerDay: Math.round((feeds / 7) * 10) / 10,
    sleepHours,
    sleepPerDay: Math.round((sleepHours / 7) * 10) / 10,
  };
}
