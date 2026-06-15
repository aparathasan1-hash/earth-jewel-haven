// WHO Child Growth Standards (2006) — LMS tabanlı persentil hesabı.
// Bilgilendirme amaçlıdır; tıbbi tanı/tavsiye DEĞİLDİR.
// Veri: weight-for-age + length/height-for-age, 0–24 ay, kız/erkek.
// LMS yöntemi: z = ((X/M)^L - 1) / (L*S)  (L=0 ise z = ln(X/M)/S)
//             X(z) = M*(1 + L*S*z)^(1/L)  (L=0 ise M*exp(S*z))

export type BabySex = "girl" | "boy";
export type GrowthMetric = "weight" | "height";

type LMS = [L: number, M: number, S: number];

// Aylık LMS dizileri (index = ay, 0..24).
const WEIGHT_BOYS: LMS[] = [
  [-0.3521, 3.3464, 0.14602], [-0.2024, 4.4709, 0.13395], [-0.1336, 5.5675, 0.12385],
  [-0.0880, 6.3762, 0.11727], [-0.0517, 7.0023, 0.11316], [-0.0205, 7.5105, 0.11080],
  [0.0070, 7.9340, 0.10958], [0.0307, 8.2970, 0.10902], [0.0512, 8.6151, 0.10882],
  [0.0710, 8.9014, 0.10881], [0.0876, 9.1649, 0.10891], [0.1052, 9.4122, 0.10906],
  [0.1187, 9.6479, 0.10925], [0.1325, 9.8749, 0.10949], [0.1430, 10.0953, 0.10976],
  [0.1532, 10.3108, 0.11007], [0.1632, 10.5228, 0.11041], [0.1730, 10.7319, 0.11079],
  [0.1825, 10.9385, 0.11119], [0.1918, 11.1430, 0.11164], [0.2008, 11.3462, 0.11211],
  [0.2096, 11.5486, 0.11261], [0.2182, 11.7504, 0.11314], [0.2266, 11.9514, 0.11369],
  [0.2348, 12.1515, 0.11426],
];

const WEIGHT_GIRLS: LMS[] = [
  [0.3809, 3.2322, 0.14171], [0.1714, 4.1873, 0.13724], [0.0962, 5.1282, 0.13000],
  [0.0402, 5.8458, 0.12619], [-0.0050, 6.4237, 0.12402], [-0.0430, 6.8985, 0.12274],
  [-0.0756, 7.2970, 0.12204], [-0.1039, 7.6422, 0.12178], [-0.1288, 7.9487, 0.12181],
  [-0.1507, 8.2254, 0.12199], [-0.1707, 8.4800, 0.12223], [-0.1885, 8.7192, 0.12247],
  [-0.2024, 8.9481, 0.12268], [-0.2158, 9.1699, 0.12283], [-0.2278, 9.3870, 0.12294],
  [-0.2384, 9.6008, 0.12299], [-0.2491, 9.8124, 0.12303], [-0.2587, 10.0226, 0.12306],
  [-0.2683, 10.2315, 0.12309], [-0.2771, 10.4393, 0.12315], [-0.2851, 10.6464, 0.12323],
  [-0.2931, 10.8534, 0.12335], [-0.3006, 11.0608, 0.12350], [-0.3076, 11.2688, 0.12369],
  [-0.3141, 11.4775, 0.12390],
];

// Length-for-age (L=1 tüm yaşlarda).
const HEIGHT_BOYS: LMS[] = [
  [1, 49.8842, 0.03795], [1, 54.7244, 0.03557], [1, 58.4249, 0.03424],
  [1, 61.4292, 0.03328], [1, 63.8860, 0.03257], [1, 65.9026, 0.03204],
  [1, 67.6236, 0.03165], [1, 69.1645, 0.03139], [1, 70.5994, 0.03124],
  [1, 71.9687, 0.03117], [1, 73.2812, 0.03118], [1, 74.5388, 0.03125],
  [1, 75.7488, 0.03137], [1, 76.9186, 0.03154], [1, 78.0497, 0.03174],
  [1, 79.1458, 0.03197], [1, 80.2113, 0.03222], [1, 81.2487, 0.03250],
  [1, 82.2587, 0.03279], [1, 83.2418, 0.03310], [1, 84.1996, 0.03342],
  [1, 85.1348, 0.03376], [1, 86.0477, 0.03410], [1, 86.9410, 0.03445],
  [1, 87.8161, 0.03479],
];

const HEIGHT_GIRLS: LMS[] = [
  [1, 49.1477, 0.03790], [1, 53.6872, 0.03640], [1, 57.0673, 0.03568],
  [1, 59.8029, 0.03520], [1, 62.0899, 0.03486], [1, 64.0301, 0.03463],
  [1, 65.7311, 0.03448], [1, 67.2873, 0.03441], [1, 68.7498, 0.03440],
  [1, 70.1435, 0.03444], [1, 71.4818, 0.03452], [1, 72.7710, 0.03464],
  [1, 74.0150, 0.03479], [1, 75.2176, 0.03496], [1, 76.3817, 0.03514],
  [1, 77.5099, 0.03534], [1, 78.6055, 0.03555], [1, 79.6710, 0.03576],
  [1, 80.7079, 0.03598], [1, 81.7182, 0.03620], [1, 82.7036, 0.03643],
  [1, 83.6654, 0.03666], [1, 84.6040, 0.03688], [1, 85.5202, 0.03711],
  [1, 86.4153, 0.03734],
];

const TABLES: Record<BabySex, Record<GrowthMetric, LMS[]>> = {
  boy: { weight: WEIGHT_BOYS, height: HEIGHT_BOYS },
  girl: { weight: WEIGHT_GIRLS, height: HEIGHT_GIRLS },
};

export const MAX_AGE_MONTHS = 24;

// Standart normal CDF (Abramowitz & Stegun 7.1.26 erf yaklaşımı).
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

// Belirli yaş (kesirli ay) için LMS'i komşu aylar arasında lineer interpolasyonla bul.
function lmsAt(table: LMS[], ageMonths: number): LMS | null {
  if (ageMonths < 0 || ageMonths > MAX_AGE_MONTHS) return null;
  const lo = Math.floor(ageMonths);
  const hi = Math.min(lo + 1, MAX_AGE_MONTHS);
  const f = ageMonths - lo;
  const a = table[lo];
  const b = table[hi];
  if (!a || !b) return null;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

function zScore([L, M, S]: LMS, x: number): number {
  if (L === 0) return Math.log(x / M) / S;
  return (Math.pow(x / M, L) - 1) / (L * S);
}

function valueAtZ([L, M, S]: LMS, z: number): number {
  if (L === 0) return M * Math.exp(S * z);
  return M * Math.pow(1 + L * S * z, 1 / L);
}

/** Persentil (0–100) — yaş 0–24 ay dışıysa veya cinsiyet bilinmiyorsa null. */
export function whoPercentile(
  ageMonths: number,
  value: number,
  sex: BabySex,
  metric: GrowthMetric
): number | null {
  const lms = lmsAt(TABLES[sex][metric], ageMonths);
  if (!lms || !(value > 0)) return null;
  const p = normalCdf(zScore(lms, value)) * 100;
  return Math.max(0.1, Math.min(99.9, p));
}

export type WhoBandPoint = {
  month: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
};

// Persentil eğrileri (P3/P15/P50/P85/P97) — grafik arka planı için.
const Z_P3 = -1.880794, Z_P15 = -1.036433, Z_P50 = 0, Z_P85 = 1.036433, Z_P97 = 1.880794;

export function whoBands(sex: BabySex, metric: GrowthMetric): WhoBandPoint[] {
  const table = TABLES[sex][metric];
  return table.map((lms, month) => ({
    month,
    p3: round(valueAtZ(lms, Z_P3), metric),
    p15: round(valueAtZ(lms, Z_P15), metric),
    p50: round(valueAtZ(lms, Z_P50), metric),
    p85: round(valueAtZ(lms, Z_P85), metric),
    p97: round(valueAtZ(lms, Z_P97), metric),
  }));
}

function round(v: number, metric: GrowthMetric): number {
  return metric === "weight" ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10;
}

// Doğum tarihinden yaş (kesirli ay) — ölçüm tarihine göre.
export function ageInMonths(birthDate: string, atDate: string): number {
  const b = new Date(birthDate).getTime();
  const a = new Date(atDate).getTime();
  const days = (a - b) / (1000 * 60 * 60 * 24);
  return days / 30.4375;
}

// "12. persentil" gibi okunur etiket.
export function percentileLabel(p: number): string {
  return `${Math.round(p)}.`;
}
