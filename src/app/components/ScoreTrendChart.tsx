import type { FeedbackEntry } from "@/lib/api";

interface ChartPoint {
  key: string;
  label: string;
  score: number;
  timestamp: number;
}

interface ScoreTrendChartProps {
  feedbacks: FeedbackEntry[];
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 156;
const PAD = { top: 12, right: 10, bottom: 36, left: 28 };
const RANGE_DAYS = 30;
const MIN_LABEL_GAP = 34;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatChartLabel(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function buildChartPoints(feedbacks: FeedbackEntry[]): ChartPoint[] {
  const rangeEnd = startOfDay(new Date());
  const rangeStart = new Date(rangeEnd);
  rangeStart.setDate(rangeStart.getDate() - RANGE_DAYS);

  const grouped = new Map<string, number[]>();

  feedbacks.forEach((item) => {
    const createdAt = new Date(item.createdAt);
    const day = startOfDay(createdAt);

    if (day < rangeStart || day > rangeEnd) return;

    const key = day.toISOString().slice(0, 10);
    const ratings = grouped.get(key) ?? [];
    ratings.push(item.rating);
    grouped.set(key, ratings);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, ratings]) => ({
      key,
      label: formatChartLabel(key),
      score: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      timestamp: startOfDay(new Date(`${key}T12:00:00`)).getTime(),
    }));
}

function pickVisibleLabels(coords: { x: number }[]) {
  if (coords.length === 0) return [];

  const visible = coords.map(() => false);
  visible[0] = true;
  let lastShown = 0;

  for (let i = 1; i < coords.length; i += 1) {
    if (coords[i].x - coords[lastShown].x >= MIN_LABEL_GAP) {
      visible[i] = true;
      lastShown = i;
    }
  }

  const lastIndex = coords.length - 1;
  if (!visible[lastIndex]) {
    if (coords[lastIndex].x - coords[lastShown].x < MIN_LABEL_GAP && lastShown !== 0) {
      visible[lastShown] = false;
    }
    visible[lastIndex] = true;
  }

  return visible;
}

export function ScoreTrendChart({ feedbacks }: ScoreTrendChartProps) {
  const points = buildChartPoints(feedbacks);
  const plotW = CHART_WIDTH - PAD.left - PAD.right;
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const rangeEnd = startOfDay(new Date()).getTime();
  const rangeStart = rangeEnd - RANGE_DAYS * 24 * 60 * 60 * 1000;
  const rangeSpan = rangeEnd - rangeStart;

  const coords =
    points.length > 0
      ? points.map((point) => {
          const x =
            points.length === 1
              ? PAD.left + plotW / 2
              : PAD.left + ((point.timestamp - rangeStart) / rangeSpan) * plotW;
          const y = PAD.top + plotH - ((point.score - 1) / 3) * plotH;
          return { ...point, x, y };
        })
      : [];

  const visibleLabels = pickVisibleLabels(coords);

  const linePath =
    coords.length > 0
      ? coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
      : "";

  const yTicks = [4, 3, 2, 1];

  return (
    <div className="w-full pt-2">
      <p className="text-[10px] font-light text-black/35 mb-2">
        Rentang maks. 1 bulan · hanya tanggal dengan feedback
      </p>

      {points.length === 0 ? (
        <div className="h-[156px] flex items-center justify-center border border-black/10 rounded-[12px]">
          <p className="text-[12px] font-light text-black/30">Belum ada data skor</p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-[156px]"
          aria-label="Line chart skor layanan 30 hari terakhir"
        >
          {yTicks.map((tick) => {
            const y = PAD.top + plotH - ((tick - 1) / 3) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={CHART_WIDTH - PAD.right}
                  y2={y}
                  stroke="black"
                  strokeOpacity={0.06}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-black/40 text-[9px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <line
            x1={PAD.left}
            y1={PAD.top + plotH}
            x2={CHART_WIDTH - PAD.right}
            y2={PAD.top + plotH}
            stroke="black"
            strokeOpacity={0.1}
            strokeWidth={1}
          />

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="black"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {coords.map((point, index) => (
            <g key={point.key}>
              <circle cx={point.x} cy={point.y} r={3} fill="black">
                <title>{`${point.label} · Skor ${point.score.toFixed(1)}`}</title>
              </circle>
              {visibleLabels[index] && (
                <text
                  x={point.x}
                  y={CHART_HEIGHT - 10}
                  textAnchor="end"
                  transform={`rotate(-38, ${point.x}, ${CHART_HEIGHT - 10})`}
                  className="fill-black/50 text-[8px]"
                >
                  {point.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
