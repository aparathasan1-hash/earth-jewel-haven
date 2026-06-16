import { useEffect, useState } from "react";
import { Loader2, Trash2, Milk, Moon, Baby as BabyIcon, Utensils, Sun } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getFeedingLogs,
  saveFeedingLog,
  deleteFeedingLog,
  getSleepLogs,
  startSleepLog,
  endSleepLog,
  deleteSleepLog,
  type FeedingLog,
  type SleepLog,
} from "@/lib/auth";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CareTracker({ babyId }: { babyId: string }) {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [feedings, setFeedings] = useState<FeedingLog[]>([]);
  const [sleeps, setSleeps] = useState<SleepLog[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [f, s] = await Promise.all([getFeedingLogs(babyId), getSleepLogs(babyId)]);
    setFeedings(f);
    setSleeps(s);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId]);

  const openSleep = sleeps.find((s) => s.end_at == null) ?? null;

  async function logFeeding(kind: "breast" | "bottle" | "solid") {
    setBusy(true);
    try {
      await saveFeedingLog({ baby_id: babyId, kind });
      await load();
      toast.success(t("care.logged") || "Logged 🌿");
    } catch (err) {
      console.error("❌ Feeding log error:", err);
      toast.error(t("care.error") || "Could not log");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSleep() {
    setBusy(true);
    try {
      if (openSleep) {
        await endSleepLog(openSleep.id);
        toast.success(t("care.sleepEnded") || "Sleep ended 🌿");
      } else {
        await startSleepLog(babyId);
        toast.success(t("care.sleepStarted") || "Sleep started 🌙");
      }
      await load();
    } catch (err) {
      console.error("❌ Sleep log error:", err);
      toast.error(t("care.error") || "Could not log");
    } finally {
      setBusy(false);
    }
  }

  async function removeFeeding(id: string) {
    await deleteFeedingLog(id);
    setFeedings((p) => p.filter((x) => x.id !== id));
  }
  async function removeSleep(id: string) {
    await deleteSleepLog(id);
    setSleeps((p) => p.filter((x) => x.id !== id));
  }

  // Bugün özeti
  const feedsToday = feedings.filter((f) => isToday(f.logged_at)).length;
  const sleepMsToday = sleeps
    .filter((s) => s.end_at && isToday(s.start_at))
    .reduce((acc, s) => acc + (new Date(s.end_at as string).getTime() - new Date(s.start_at).getTime()), 0);
  const sleepHoursToday = (sleepMsToday / 3600000).toFixed(1);

  const feedIcon = { breast: BabyIcon, bottle: Milk, solid: Utensils } as const;
  const feedLabel = {
    breast: t("care.breast") || "Breast",
    bottle: t("care.bottle") || "Bottle",
    solid: t("care.solid") || "Solid",
  } as const;

  // Beslenme + uyku loglarını birleşik son liste
  const recent = [
    ...feedings.map((f) => ({ type: "feed" as const, at: f.logged_at, item: f })),
    ...sleeps.map((s) => ({ type: "sleep" as const, at: s.start_at, item: s })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Bugün özeti */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-serif text-accent">{feedsToday}</p>
          <p className="text-[11px] text-muted-foreground">{t("care.feedsToday") || "Feeds today"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-serif text-accent">{sleepHoursToday}h</p>
          <p className="text-[11px] text-muted-foreground">{t("care.sleepToday") || "Sleep today"}</p>
        </div>
      </div>

      {/* Hızlı log butonları */}
      <div className="flex flex-wrap gap-2">
        {(["breast", "bottle", "solid"] as const).map((k) => {
          const Icon = feedIcon[k];
          return (
            <button
              key={k}
              onClick={() => logFeeding(k)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
            >
              <Icon className="h-4 w-4 text-accent" /> {feedLabel[k]}
            </button>
          );
        })}
        <button
          onClick={toggleSleep}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50 ${
            openSleep
              ? "bg-accent text-accent-foreground"
              : "border border-border bg-card hover:border-accent"
          }`}
        >
          {openSleep ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-accent" />}
          {openSleep ? t("care.wakeUp") || "Woke up" : t("care.startSleep") || "Sleep"}
        </button>
      </div>

      {openSleep && (
        <p className="mt-2 text-xs text-accent">
          {(t("care.sleepingSince") || "Sleeping since {time}").replace("{time}", fmtTime(openSleep.start_at))}
        </p>
      )}

      {/* Son loglar */}
      {recent.length > 0 && (
        <div className="mt-4 space-y-2">
          {recent.map((r) =>
            r.type === "feed" ? (
              <div key={`f-${r.item.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Milk className="h-4 w-4 text-accent" />
                  {feedLabel[(r.item as FeedingLog).kind]}
                  <span className="text-muted-foreground">{fmtTime(r.at)}</span>
                </span>
                <button onClick={() => removeFeeding(r.item.id)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div key={`s-${r.item.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-accent" />
                  {fmtTime((r.item as SleepLog).start_at)}
                  {(r.item as SleepLog).end_at ? ` – ${fmtTime((r.item as SleepLog).end_at as string)}` : ` · ${t("care.ongoing") || "ongoing"}`}
                </span>
                <button onClick={() => removeSleep(r.item.id)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
