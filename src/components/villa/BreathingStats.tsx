import { useApp, getTodayTotal } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { X, Calendar, Clock, Target, Flame, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
};

function getWeekTotal(history: { date: string; totalSeconds: number }[]): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  return history
    .filter((s) => s.date >= weekStartStr)
    .reduce((sum, s) => sum + s.totalSeconds, 0);
}

function getStreak(history: { date: string; totalSeconds: number }[], dailyGoal: number): number {
  const dates = new Set(
    history
      .filter((s) => s.totalSeconds >= dailyGoal)
      .map((s) => s.date),
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (dates.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function BreathingStats({ open, onClose }: Props) {
  const t = useT();
  const { breathHistory, dailyGoal, setDailyGoal } = useApp();

  const todayTotal = getTodayTotal(breathHistory);
  const weekTotal = getWeekTotal(breathHistory);
  const allTimeTotal = breathHistory.reduce((sum, s) => sum + s.totalSeconds, 0);
  const streak = getStreak(breathHistory, dailyGoal);
  const totalSessions = breathHistory.length;

  // Group by date for the list
  const sessionsByDate = breathHistory
    .slice()
    .reverse()
    .reduce(
      (acc, s) => {
        if (!acc[s.date]) acc[s.date] = [];
        acc[s.date].push(s);
        return acc;
      },
      {} as Record<string, typeof breathHistory>,
    );

  const goalOptions = [120, 300, 600, 900]; // 2min, 5min, 10min, 15min

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-card border border-border p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-foreground">
                {t("quiet.statsTitle")}
              </h2>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard
                icon={<Clock className="h-4 w-4" />}
                label={t("quiet.statsToday")}
                value={formatTime(todayTotal)}
                progress={dailyGoal > 0 ? todayTotal / dailyGoal : 0}
              />
              <StatCard
                icon={<Calendar className="h-4 w-4" />}
                label={t("quiet.statsWeek")}
                value={formatTime(weekTotal)}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label={t("quiet.statsAllTime")}
                value={formatTime(allTimeTotal)}
              />
              <StatCard
                icon={<Flame className="h-4 w-4" />}
                label={t("quiet.statsStreak")}
                value={`${streak} ${t("quiet.statsDays")}`}
              />
            </div>

            {/* Daily goal */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">
                  {t("quiet.todayGoal")}
                </span>
              </div>
              <div className="flex gap-2">
                {goalOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => setDailyGoal(g)}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                      dailyGoal === g
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {formatTime(g)}
                  </button>
                ))}
              </div>
            </div>

            {/* Session history */}
            {totalSessions > 0 && (
              <div>
                <h3 className="text-sm text-muted-foreground font-medium mb-3">
                  {t("quiet.statsHistory")} ({totalSessions})
                </h3>
                <div className="space-y-2">
                  {Object.entries(sessionsByDate).slice(0, 14).map(([date, sessions]) => {
                    const total = sessions.reduce((s, sess) => s + sess.totalSeconds, 0);
                    const isToday = date === new Date().toISOString().split("T")[0];
                    return (
                      <div
                        key={date}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                          isToday ? "bg-accent/10" : "bg-secondary/40"
                        }`}
                      >
                        <span className="text-sm text-foreground">
                          {isToday ? t("quiet.statsToday") : date}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {sessions.length} {t("quiet.statsSessions")}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {formatTime(total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalSessions === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("quiet.statsEmpty")}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatCard({
  icon,
  label,
  value,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress?: number;
}) {
  return (
    <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3">
      <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
