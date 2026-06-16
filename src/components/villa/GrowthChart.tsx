import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useT } from "@/lib/i18n";
import type { BabyMeasurement } from "@/lib/auth";
import {
  whoBands,
  whoPercentile,
  ageInMonths,
  percentileLabel,
  MAX_AGE_MONTHS,
  type BabySex,
  type GrowthMetric,
} from "@/lib/who-growth";

type Props = {
  birthDate: string;
  sex: "girl" | "boy" | "other" | null;
  measurements: BabyMeasurement[];
};

export function GrowthChart({ birthDate, sex, measurements }: Props) {
  const t = useT();
  const [metric, setMetric] = useState<GrowthMetric>("weight");
  const whoSex: BabySex | null = sex === "girl" || sex === "boy" ? sex : null;

  const babyPoints = useMemo(
    () =>
      measurements
        .map((m) => {
          const value = metric === "weight" ? m.weight_kg : m.height_cm;
          if (value == null) return null;
          const month = ageInMonths(birthDate, m.date);
          if (month < 0 || month > MAX_AGE_MONTHS) return null;
          return { month: Math.round(month * 100) / 100, measure: value };
        })
        .filter((p): p is { month: number; measure: number } => p !== null),
    [measurements, metric, birthDate]
  );

  const bands = useMemo(() => (whoSex ? whoBands(whoSex, metric) : null), [whoSex, metric]);

  const data = useMemo(() => {
    const rows: Array<Record<string, number | null>> = [];
    if (bands) {
      for (const b of bands) {
        rows.push({ month: b.month, p3: b.p3, p15: b.p15, p50: b.p50, p85: b.p85, p97: b.p97, measure: null });
      }
    }
    for (const p of babyPoints) {
      rows.push({ month: p.month, measure: p.measure });
    }
    return rows.sort((a, b) => (a.month as number) - (b.month as number));
  }, [bands, babyPoints]);

  // Son ölçümün persentili
  const latest = useMemo(() => {
    if (!whoSex || babyPoints.length === 0) return null;
    const last = babyPoints[babyPoints.length - 1];
    const p = whoPercentile(last.month, last.measure, whoSex, metric);
    return p == null ? null : p;
  }, [whoSex, babyPoints, metric]);

  const unit = metric === "weight" ? "kg" : "cm";
  const hasData = babyPoints.length > 0;

  return (
    <div>
      {/* Metric seçici */}
      <div className="mb-3 flex gap-2">
        {(["weight", "height"] as GrowthMetric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              metric === m
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "weight" ? t("baby.weight") || "Weight" : t("baby.height") || "Height"}
          </button>
        ))}
      </div>

      {latest != null && (
        <p className="mb-2 text-sm text-accent">
          {(t("baby.percentileLabel") || "Around the {p} percentile 🌿").replace(
            "{p}",
            percentileLabel(latest)
          )}
        </p>
      )}

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              type="number"
              domain={[0, MAX_AGE_MONTHS]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              label={{ value: t("baby.ageMonths") || "Age (months)", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              width={40}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [`${value} ${unit}`, name]}
              labelFormatter={(m: number) => `${Math.round(m)} ${t("baby.monthsShort") || "mo"}`}
            />
            {bands && (
              <>
                <Line type="monotone" dataKey="p3" stroke="var(--muted-foreground)" strokeWidth={1} strokeOpacity={0.35} dot={false} connectNulls name="P3" />
                <Line type="monotone" dataKey="p15" stroke="var(--muted-foreground)" strokeWidth={1} strokeOpacity={0.25} dot={false} connectNulls name="P15" />
                <Line type="monotone" dataKey="p50" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeOpacity={0.6} strokeDasharray="4 3" dot={false} connectNulls name="P50" />
                <Line type="monotone" dataKey="p85" stroke="var(--muted-foreground)" strokeWidth={1} strokeOpacity={0.25} dot={false} connectNulls name="P85" />
                <Line type="monotone" dataKey="p97" stroke="var(--muted-foreground)" strokeWidth={1} strokeOpacity={0.35} dot={false} connectNulls name="P97" />
              </>
            )}
            <Line
              type="monotone"
              dataKey="measure"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--primary)" }}
              connectNulls
              name={metric === "weight" ? t("baby.weight") || "Weight" : t("baby.height") || "Height"}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!hasData && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("baby.noMeasurements") || "Add a measurement to see the curve."}
        </p>
      )}
      {!whoSex && hasData && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {t("baby.noPercentileNoSex") || "Set baby's sex to see WHO percentile bands."}
        </p>
      )}
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {t("baby.growthDisclaimer") ||
          "WHO reference (0–24 mo). Informational only, not medical advice."}
      </p>
    </div>
  );
}
