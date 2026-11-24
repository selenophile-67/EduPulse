import { useMemo } from 'react';
import { cn } from '../lib/cn';

export function LineChart({
  data,
  height = 220,
  color = '#f97316',
  suffix = '',
  className,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  suffix?: string;
  className?: string;
}) {
  const width = 640;
  const padX = 34;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = 0;
  const points = data.map((d, index) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
    const y = padY + innerH - ((d.value - min) / (max - min || 1)) * innerH;
    return { ...d, x, y };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = points.length ? `${path} L${points[points.length - 1].x},${padY + innerH} L${points[0].x},${padY + innerH} Z` : '';
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => padY + innerH * ratio);

  if (!data.length) {
    return <div className={cn('flex h-40 items-center justify-center text-sm text-ink-muted', className)}>No data yet</div>;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-auto w-full', className)} role="img" aria-label="Performance trend">
      <defs>
        <linearGradient id={`area-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((y, index) => (
        <line key={index} x1={padX} x2={width - padX} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.09" strokeDasharray="4 6" />
      ))}
      {area && <path d={area} fill={`url(#area-${color.replace('#', '')})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.label + p.x}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
          <text x={p.x} y={Math.max(12, p.y - 10)} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.65" fontWeight="600">
            {Math.round(p.value * 10) / 10}{suffix}
          </text>
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="9.5" fill="currentColor" fillOpacity="0.5">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({
  data,
  suffix = '%',
  maxValue,
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  suffix?: string;
  maxValue?: number;
  className?: string;
}) {
  const max = maxValue || Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <div className={cn('py-8 text-center text-sm text-ink-muted', className)}>No data yet</div>;
  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-ink-soft">{item.label}</span>
            <span className="shrink-0 font-semibold text-ink">{Math.round(item.value * 10) / 10}{suffix}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.min(100, (item.value / max) * 100)}%`, background: item.color || (item.value >= 70 ? '#10b981' : item.value >= 45 ? '#f59e0b' : '#ef4444') }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  size = 156,
  thickness = 16,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcs = useMemo(() => {
    let offset = 0;
    return segments.map((segment) => {
      const fraction = total ? segment.value / total : 0;
      const arc = { ...segment, dash: fraction * circumference, offset };
      offset += fraction * circumference;
      return arc;
    });
  }, [segments, total, circumference]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
          {arcs.map((arc) => (
            arc.dash > 0 && (
              <circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={thickness}
                strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="round"
              />
            )
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-ink">{centerValue ?? total}</span>
          {centerLabel && <span className="text-[10px] uppercase tracking-wide text-ink-muted">{centerLabel}</span>}
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
            <span className="text-ink-muted">{segment.label}</span>
            <span className="font-semibold text-ink">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
