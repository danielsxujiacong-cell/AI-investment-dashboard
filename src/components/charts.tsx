type ChartProps = {
  data: number[];
  className?: string;
  label?: string;
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

export function Sparkline({ data, className = "" }: ChartProps) {
  const points = coordinates(data, 92, 32, 3);
  const path = makeLinePath(points);

  return (
    <svg className={"sparkline " + className} viewBox="0 0 92 32" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PerformanceChart({ data, label = "Portfolio value over time" }: ChartProps) {
  const width = 760;
  const height = 208;
  const points = coordinates(data, width, height, 6);
  const linePath = makeLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = linePath + " L " + last.x + " " + height + " L " + first.x + " " + height + " Z";

  return (
    <div className="performance-chart">
      <svg viewBox={"0 0 " + width + " " + height} preserveAspectRatio="none" role="img" aria-label={label}>
        <defs>
          <linearGradient id="portfolioFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8ab99d" stopOpacity=".22" />
            <stop offset="100%" stopColor="#8ab99d" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="chart-grid">
          <line x1="0" y1="20" x2={width} y2="20" />
          <line x1="0" y1="76" x2={width} y2="76" />
          <line x1="0" y1="132" x2={width} y2="132" />
          <line x1="0" y1="188" x2={width} y2="188" />
        </g>
        <path d={areaPath} fill="url(#portfolioFill)" />
        <path d={linePath} fill="none" stroke="#a1cbb0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={last.x} cy={last.y} r="4" fill="#a1cbb0" className="chart-marker" />
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
