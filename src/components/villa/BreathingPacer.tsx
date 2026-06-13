import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, getTodayTotal } from "@/lib/store";
import { useT } from "@/lib/i18n";

type Phase = "inhale" | "hold" | "exhale";

interface Pattern {
  labelKey: string;
  phases: { phase: Phase; secs: number; labelKey: string }[];
}

const patterns: Pattern[] = [
  {
    labelKey: "breathing.pattern446",
    phases: [
      { phase: "inhale", secs: 4, labelKey: "breathing.inhale" },
      { phase: "hold", secs: 4, labelKey: "breathing.hold" },
      { phase: "exhale", secs: 6, labelKey: "breathing.release" },
    ],
  },
  {
    labelKey: "breathing.pattern478",
    phases: [
      { phase: "inhale", secs: 4, labelKey: "breathing.inhale" },
      { phase: "hold", secs: 7, labelKey: "breathing.hold" },
      { phase: "exhale", secs: 8, labelKey: "breathing.release" },
    ],
  },
  {
    labelKey: "breathing.patternBox",
    phases: [
      { phase: "inhale", secs: 4, labelKey: "breathing.inhale" },
      { phase: "hold", secs: 4, labelKey: "breathing.hold" },
      { phase: "exhale", secs: 4, labelKey: "breathing.release" },
      { phase: "hold", secs: 4, labelKey: "breathing.empty" },
    ],
  },
  {
    labelKey: "breathing.patternSimple",
    phases: [
      { phase: "inhale", secs: 4, labelKey: "breathing.inhale" },
      { phase: "exhale", secs: 6, labelKey: "breathing.release" },
    ],
  },
];

const forestImage = "/orman-ağaçları-1.jpg";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const goalOptions = [
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
];

export function BreathingPacer() {
  const t = useT();
  const { breathHistory, addBreathSession, dailyGoal, setDailyGoal } = useApp();
  const [running, setRunning] = useState(false);
  const [patternIdx, setPatternIdx] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const phaseStartRef = useRef(Date.now());
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const pattern = patterns[patternIdx];
  const cycle = pattern.phases;
  const current = cycle[phaseIdx];

  const todayTotal = getTodayTotal(breathHistory);
  const todayProgress = dailyGoal > 0 ? Math.min(todayTotal / dailyGoal, 1) : 0;

  // Timer for phase transitions
  useEffect(() => {
    if (!running) return;
    const tm = setTimeout(
      () => {
        setPhaseIdx((i) => {
          const next = (i + 1) % cycle.length;
          if (i === cycle.length - 1) {
            setCycleCount((c) => c + 1);
          }
          return next;
        });
        phaseStartRef.current = Date.now();
        setPhaseElapsed(0);
      },
      current.secs * 1000,
    );
    return () => clearTimeout(tm);
  }, [phaseIdx, running, current.secs, cycle.length]);

  // Timer for total elapsed time
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTotalSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  // Timer for phase progress
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - phaseStartRef.current) / 1000);
      setPhaseElapsed(Math.min(elapsed, current.secs));
    }, 100);
    return () => clearInterval(interval);
  }, [running, phaseIdx, current.secs]);

  const phaseProgress = running ? phaseElapsed / current.secs : 0;

  // Daha koyu overlay renkleri
  const overlayColor =
    !running
      ? "rgba(0,0,0,0)"
      : current.phase === "inhale" || current.phase === "hold"
        ? "rgba(20, 80, 40, 0.55)"
        : "rgba(140, 70, 20, 0.6)";

  const overlayDuration = running ? current.secs : 0.6;

  function saveSession() {
    if (totalSeconds > 0) {
      addBreathSession({
        date: new Date().toISOString().split("T")[0],
        totalSeconds,
        cycles: cycleCount,
        pattern: t(pattern.labelKey),
      });
    }
  }

  function handleToggle() {
    if (running) {
      saveSession();
    } else {
      setPhaseIdx(0);
      setTotalSeconds(0);
      setCycleCount(0);
      setPhaseElapsed(0);
      phaseStartRef.current = Date.now();
    }
    setRunning((r) => !r);
  }

  function selectPattern(i: number) {
    if (running) return;
    setPatternIdx(i);
    setPhaseIdx(0);
    setTotalSeconds(0);
    setCycleCount(0);
    setPhaseElapsed(0);
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-10rem)] flex-col items-center justify-center overflow-hidden rounded-2xl">
      {/* Forest background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${forestImage})` }}
      />

      {/* Color overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: overlayColor }}
        transition={{ duration: overlayDuration, ease: "easeInOut" }}
      />

      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 py-6">
        {/* Timer display — always visible */}
        <div className="flex items-center gap-6 rounded-full bg-black/30 px-6 py-3 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/70">{t("quiet.duration")}</p>
            <p className="font-serif text-xl text-white drop-shadow-xl">
              {formatTime(totalSeconds)}
            </p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/70">{t("quiet.cycles")}</p>
            <p className="font-serif text-xl text-white drop-shadow-xl">{cycleCount}</p>
          </div>
        </div>

        {/* Phase label — always visible, bigger when running */}
        <motion.p
          className="font-serif text-white drop-shadow-xl"
          animate={{
            fontSize: running ? "2.25rem" : "1.25rem",
            opacity: running ? 1 : 0.9,
          }}
          transition={{ duration: 0.3 }}
        >
          {running ? t(current.labelKey) : t("quiet.idleLabel")}
        </motion.p>

        {/* Phase progress bar — only when running */}
        <AnimatePresence>
          {running && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/20"
            >
              <motion.div
                className="h-full rounded-full bg-white/70"
                animate={{ width: `${phaseProgress * 100}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase indicator dots — always visible */}
        <div className="flex gap-2">
          {cycle.map((c, i) => (
            <div
              key={c.phase + i}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === phaseIdx && running
                  ? "scale-125 bg-white"
                  : i < phaseIdx || (!running && i === 0)
                    ? "bg-white/50"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Pattern selector — only when paused */}
        <AnimatePresence>
          {!running && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <span className="mr-1 text-[10px] uppercase tracking-[0.15em] text-white/70">
                {t("quiet.rhythm")}
              </span>
              {patterns.map((p, i) => (
                <button
                  key={p.labelKey}
                  type="button"
                  onClick={() => selectPattern(i)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                    i === patternIdx
                      ? "bg-white/40 text-white"
                      : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white/90"
                  }`}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start/Pause button */}
        <button
          type="button"
          onClick={handleToggle}
          className="rounded-full bg-white/20 px-8 py-3 font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/35"
        >
          {running ? t("quiet.pauseBtn") : t("quiet.startBtn")}
        </button>

        {/* Description text — only when paused */}
        <AnimatePresence>
          {!running && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-sm text-center text-sm text-white/80 drop-shadow-xl"
            >
              {pattern.labelKey === "breathing.pattern446" && t("quiet.desc446")}
              {pattern.labelKey === "breathing.pattern478" && t("quiet.desc478")}
              {pattern.labelKey === "breathing.patternBox" && t("quiet.descBox")}
              {pattern.labelKey === "breathing.patternSimple" && t("quiet.descSimple")}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Daily goal progress — only when paused */}
        <AnimatePresence>
          {!running && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-white/70">
                    <span>{t("quiet.todayGoal")}</span>
                    <span>{formatTime(todayTotal)} / {formatTime(dailyGoal)}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white/60 transition-all duration-500"
                      style={{ width: `${todayProgress * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoalPicker(!showGoalPicker)}
                  className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[11px] text-white/70 transition-colors hover:bg-white/25 hover:text-white/90"
                >
                  {showGoalPicker ? t("quiet.goalDone") : t("quiet.goalBtn")}
                </button>
              </div>

              {/* Goal picker */}
              {showGoalPicker && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {goalOptions.map((g) => (
                    <button
                      key={g.seconds}
                      type="button"
                      onClick={() => {
                        setDailyGoal(g.seconds);
                        setShowGoalPicker(false);
                      }}
                      className={`rounded-full px-3 py-1 text-sm transition-all ${
                        dailyGoal === g.seconds
                          ? "bg-white/40 text-white"
                          : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white/90"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
