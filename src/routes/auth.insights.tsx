import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Heart,
  Wind,
  Baby as BabyIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Moon,
  Milk,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getMoodEntries,
  getBreathSessions,
  getBabies,
  getFeedingLogs,
  getSleepLogs,
  type Baby,
} from "@/lib/auth";
import {
  moodInsight,
  breathInsight,
  careInsight,
  type MoodInsight,
  type BreathInsight,
  type CareInsight,
  type Trend,
} from "@/lib/insights";

export const Route = createFileRoute("/auth/insights")({
  head: () => ({
    meta: [
      { title: "Weekly insights — The Villageless Mama" },
      { name: "description", content: "A gentle look at your week." },
    ],
  }),
  component: InsightsPage,
});

type BabyCare = { baby: Baby; care: CareInsight };

function InsightsPage() {
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState<MoodInsight | null>(null);
  const [breath, setBreath] = useState<BreathInsight | null>(null);
  const [babies, setBabies] = useState<BabyCare[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      try {
        const [moods, breaths, babyList] = await Promise.all([
          getMoodEntries(user.id),
          getBreathSessions(user.id),
          getBabies(user.id),
        ]);
        const cares = await Promise.all(
          babyList.map(async (b) => {
            const [f, s] = await Promise.all([
              getFeedingLogs(b.id, 300),
              getSleepLogs(b.id, 300),
            ]);
            return { baby: b, care: careInsight(f, s) } as BabyCare;
          })
        );
        if (!cancelled) {
          setMood(moodInsight(moods));
          setBreath(breathInsight(breaths));
          setBabies(cares);
        }
      } catch (err) {
        console.error("❌ Insights load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const moodEmojis = ["😢", "😟", "😐", "🙂", "😊"];
  const gentleNote = buildGentleNote(t, mood, breath);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <Link
          to="/auth/profile"
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-2xl text-foreground">
          <Sparkles className="h-6 w-6 text-accent" /> {t("insights.title") || "Your week"}
        </h1>
      </div>
      <p className="mb-6 pl-11 text-sm text-muted-foreground">
        {t("insights.subtitle") || "A gentle look at the last 7 days. No judgment — just a mirror."}
      </p>

      {/* Gentle note */}
      {gentleNote && (
        <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">
          {gentleNote}
        </div>
      )}

      <div className="space-y-4">
        {/* Mood card */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Heart className="h-4 w-4 text-accent" /> {t("insights.mood") || "Mood"}
          </h2>
          {mood && mood.count > 0 ? (
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl">{moodEmojis[Math.round(mood.avg ?? 1) - 1]}</span>
                  <span className="font-serif text-2xl text-foreground">
                    {(mood.avg ?? 0).toFixed(1)}
                  </span>
                  <TrendIcon trend={mood.trend} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("insights.moodAvg") || "average mood"}
                </p>
              </div>
              <div className="border-l border-border pl-6">
                <p className="font-serif text-2xl text-foreground">{mood.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("insights.checkIns") || "check-ins this week"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("insights.moodEmpty") || "No check-ins yet this week. The daily check-in is always here."}
            </p>
          )}
        </section>

        {/* Breathing card */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Wind className="h-4 w-4 text-accent" /> {t("insights.breathing") || "Breathing"}
          </h2>
          {breath && (breath.sessions > 0 || breath.streak > 0) ? (
            <div className="grid grid-cols-3 gap-4">
              <Stat value={breath.sessions} label={t("insights.sessions") || "sessions"} />
              <Stat value={breath.minutes} label={t("insights.minutes") || "minutes"} />
              <Stat
                value={breath.streak}
                label={t("insights.streak") || "day streak"}
                highlight={breath.streak >= 3}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("insights.breathEmpty") || "No breathing sessions this week. Even one minute counts."}{" "}
              <Link to="/stages/quiet" className="text-accent underline underline-offset-4">
                {t("insights.breatheNow") || "Breathe now"}
              </Link>
            </p>
          )}
        </section>

        {/* Per-baby care cards */}
        {babies.map(({ baby, care }) => (
          <section key={baby.id} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <BabyIcon className="h-4 w-4 text-accent" /> {baby.name}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent">
                  <Milk className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-serif text-xl text-foreground">{care.feeds}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("insights.feeds") || "feeds"} · ~{care.feedsPerDay}/{t("insights.day") || "day"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent">
                  <Moon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-serif text-xl text-foreground">{care.sleepHours}h</p>
                  <p className="text-xs text-muted-foreground">
                    {t("insights.sleep") || "sleep"} · ~{care.sleepPerDay}h/{t("insights.day") || "day"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("insights.disclaimer") ||
          "These reflect only what you logged. They are not medical guidance."}
      </p>
    </div>
  );
}

function Stat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`font-serif text-2xl ${highlight ? "text-accent" : "text-foreground"}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <TrendingUp className="h-5 w-5 text-accent" />;
  if (trend === "down") return <TrendingDown className="h-5 w-5 text-muted-foreground" />;
  return <Minus className="h-5 w-5 text-muted-foreground" />;
}

function buildGentleNote(
  t: (k: string) => string,
  mood: MoodInsight | null,
  breath: BreathInsight | null
): string | null {
  if (breath && breath.streak >= 3) {
    return (
      t("insights.noteStreak") ||
      `A ${breath.streak}-day breathing streak. Your nervous system thanks you. 🌿`
    ).replace("{n}", String(breath.streak));
  }
  if (mood && mood.trend === "down") {
    return (
      t("insights.noteMoodDown") ||
      "This week felt heavier. That's allowed. The Quiet Room and Crisis support are here if you need them."
    );
  }
  if (mood && mood.trend === "up") {
    return t("insights.noteMoodUp") || "Your mood lifted a little this week. Gently noted. 🌿";
  }
  return null;
}
