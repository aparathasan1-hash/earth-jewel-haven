import { useState } from "react";
import { MoodEntry } from "@/lib/auth";

type Props = {
  moodEntries: MoodEntry[];
};

function getMoodColor(mood: 1 | 2 | 3 | 4 | 5 | null): string {
  if (!mood) return "bg-secondary/20";
  const colors = [
    "bg-red-300", // Mood 1: 😢
    "bg-orange-300", // Mood 2: 😟
    "bg-yellow-300", // Mood 3: 😐
    "bg-green-300", // Mood 4: 🙂
    "bg-emerald-400", // Mood 5: 😊
  ];
  return colors[mood - 1];
}

function getLast52Weeks(): Date[] {
  const weeks: Date[] = [];
  const today = new Date();

  // Start from 52 weeks ago, Sunday
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay() - 52 * 7);

  for (let i = 0; i < 52 * 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    weeks.push(d);
  }

  return weeks;
}

export function MoodHeatmap({ moodEntries }: Props) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const days = getLast52Weeks();
  const moodMap = new Map(moodEntries.map((e) => [e.entry_date, e]));

  // Group by week and day
  const weeks: Array<Array<Date>> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const hoveredEntry = hoveredDate ? moodMap.get(hoveredDate) : null;

  const stats = {
    avgMood: moodEntries.length > 0
      ? Math.round((moodEntries.reduce((sum, e) => sum + e.mood, 0) / moodEntries.length) * 10) / 10
      : 0,
    totalEntries: moodEntries.length,
    bestMood: moodEntries.length > 0
      ? (Math.max(...moodEntries.map(e => e.mood)) as 1 | 2 | 3 | 4 | 5)
      : (0 as any),
  };

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div>
      {/* Heatmap */}
      <div className="mb-6 p-4 rounded-2xl bg-secondary/20 border border-border overflow-x-auto">
        <div className="mb-3 text-sm text-muted-foreground">Last 12 months</div>
        <div className="inline-flex gap-2 pb-2" style={{ minWidth: "100%" }}>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const entry = moodMap.get(dateStr);
                const dayName = ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];

                return (
                  <div
                    key={dateStr}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`
                      h-4 w-4 rounded-sm transition-all cursor-pointer
                      ${getMoodColor(entry?.mood || null)}
                      hover:ring-2 hover:ring-accent hover:scale-125
                    `}
                    title={`${dayName} ${formatDate(dateStr)}: ${entry ? `${entry.emoji} (${entry.mood}/5)` : "No entry"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredEntry && (
          <div className="mt-4 p-3 rounded-xl bg-secondary/40 border border-border text-sm">
            <p className="font-medium">{formatDate(hoveredEntry.entry_date)}</p>
            <p className="text-muted-foreground">
              {hoveredEntry.emoji} Mood: {hoveredEntry.mood}/5
            </p>
            {hoveredEntry.note && (
              <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                "{hoveredEntry.note}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Average Mood</p>
          <p className="mt-1 text-xl font-semibold">{stats.avgMood.toFixed(1)}/5</p>
        </div>
        <div className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Entries</p>
          <p className="mt-1 text-xl font-semibold">{stats.totalEntries}</p>
        </div>
        <div className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Best Mood</p>
          <p className="mt-1 text-xl font-semibold">
            {stats.bestMood > 0 ? ["😢", "😟", "😐", "🙂", "😊"][stats.bestMood - 1] : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
