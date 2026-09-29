import type { HistoricalPricePoint } from "@/data/market-history";

type ChartProps = {
  data: number[];
  className?: string;
  label?: string;
  isPositive?: boolean;
};

function coordinates(data: number[], width: number, height: number, inset = 4) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return data.map((value, index) => ({
    x: inset + (index / Math.max(data.length - 1, 1)) * (width - inset * 2),
    y: height - inset - ((value - min) / range) * (height - inset * 2),
  }));
}

function makeLinePath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => (index === 0 ? "M" : "L") + " " + point.x + " " + point.y)
    .join(" ");
}

export function Sparkline({ data, className = "", label = "Historical stock price trend", isPositive }: ChartProps) {
  if (data.length < 2 || data.some((value) => !Number.isFinite(value))) {
    return <span className={"sparkline-unavailable " + className} role="img" aria-label={label}>—</span>;
  }

  const positive = isPositive ?? data[data.length - 1] >= data[0];
  const points = coordinates(data, 92, 32, 3);
  const path = makeLinePath(points);

  return (
    <svg
      className={"sparkline " + (positive ? "positive" : "negative") + " " + className}
      viewBox="0 0 92 32"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PerformanceChart({
  data,
  label = "Historical value over time",
  isPositive,
}: ChartProps) {
  if (data.length < 2 || data.some((value) => !Number.isFinite(value))) {
    return <div className="chart-empty" role="status">Historical price data is unavailable.</div>;
  }

  const positive = isPositive ?? data[data.length - 1] >= data[0];
  const width = 760;
  const height = 208;
  const points = coordinates(data, width, height, 6);
  const linePath = makeLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = linePath + " L " + last.x + " " + height + " L " + first.x + " " + height + " Z";

  return (
    <div className={"performance-chart " + (positive ? "chart-positive" : "chart-negative")}>
      <svg viewBox={"0 0 " + width + " " + height} preserveAspectRatio="none" role="img" aria-label={label}>
        <defs>
          <linearGradient id="portfolioFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fill)" stopOpacity=".22" />
            <stop offset="100%" stopColor="var(--chart-fill)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="chart-grid">
          <line x1="0" y1="20" x2={width} y2="20" />
          <line x1="0" y1="76" x2={width} y2="76" />
          <line x1="0" y1="132" x2={width} y2="132" />
          <line x1="0" y1="188" x2={width} y2="188" />
        </g>
        <path d={areaPath} fill="url(#portfolioFill)" />
        <path d={linePath} fill="none" stroke="var(--chart-line)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={last.x} cy={last.y} r="4" fill="var(--chart-line)" className="chart-marker" />
      </svg>
    </div>
  );
}

export function CandlestickChart({
  data,
  label = "Historical OHLC stock candles",
}: {
  data: HistoricalPricePoint[];
  label?: string;
}) {
  if (data.length < 2) {
    return <div className="chart-empty" role="status">Historical price data is unavailable.</div>;
  }

  const width = 760;
  const height = 208;
  const inset = 8;
  const min = Math.min(...data.map((candle) => candle.low));
  const max = Math.max(...data.map((candle) => candle.high));
  const range = max - min || 1;
  const innerWidth = width - inset * 2;
  const innerHeight = height - inset * 2;
  const step = innerWidth / data.length;
  const y = (price: number) => height - inset - ((price - min) / range) * innerHeight;
  const candleWidth = Math.max(1, Math.min(9, step * 0.64));

  return (
    <div className="candlestick-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
        <g className="chart-grid">
          <line x1="0" y1="20" x2={width} y2="20" />
          <line x1="0" y1="76" x2={width} y2="76" />
          <line x1="0" y1="132" x2={width} y2="132" />
          <line x1="0" y1="188" x2={width} y2="188" />
        </g>
        {data.map((candle, index) => {
          const x = inset + (index + 0.5) * step;
          const openY = y(candle.open);
          const closeY = y(candle.close);
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(1, Math.abs(closeY - openY));
          const direction = candle.close >= candle.open ? "up" : "down";
          return (
            <g key={candle.timestamp} className={`candle candle-${direction}`}>
              <title>{`${new Date(candle.timestamp).toLocaleDateString()} O ${candle.open.toFixed(2)} H ${candle.high.toFixed(2)} L ${candle.low.toFixed(2)} C ${candle.close.toFixed(2)}`}</title>
              <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} rx="0.7" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function AllocationDonut({ segments }: { segments: { weight: number; color: string }[] }) {
  const stops = segments.map((segment, index) => {
    const start = segments.slice(0, index).reduce((total, item) => total + item.weight, 0);
    const end = start + segment.weight;
    return segment.color + " " + start + "% " + end + "%";
  });

  return (
    <div
      className="allocation-donut"
      style={{ background: "conic-gradient(" + stops.join(", ") + ")" }}
      role="img"
      aria-label="Portfolio allocation chart"
    >
      <div className="donut-center">
        <span>5 assets</span>
        <strong>100%</strong>
      </div>
    </div>
  );
}
