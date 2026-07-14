"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
  onSegmentClick?: (index: number) => void;
}

export function DonutChart({
  segments,
  size = 132,
  thickness = 16,
  centerLabel,
  centerValue,
  className,
  onSegmentClick,
}: DonutChartProps) {
  const uid = useId();
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  type Arc = DonutSegment & { i: number; fraction: number; dasharray: string; dashoffset: number };
  const { arcs } = segments.reduce<{ arcs: Arc[]; cumulative: number }>(
    (acc, s, i) => {
      const fraction = total > 0 ? s.value / total : 0;
      const length = fraction * circumference;
      acc.arcs.push({
        ...s,
        i,
        fraction,
        dasharray: `${length} ${circumference - length}`,
        dashoffset: -acc.cumulative,
      });
      acc.cumulative += length;
      return acc;
    },
    { arcs: [], cumulative: 0 }
  );

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={thickness}
          />
          {arcs.map((a) => (
            <circle
              key={`${uid}-${a.label}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.i ? thickness + 4 : thickness}
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              onMouseEnter={() => setActive(a.i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => onSegmentClick?.(a.i)}
              className="cursor-pointer transition-[stroke-width] duration-200"
              style={{ transformOrigin: "center", opacity: active === null || active === a.i ? 1 : 0.45 }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="kpi-value text-2xl leading-none">
            {active !== null ? arcs[active].value : (centerValue ?? total)}
          </span>
          <span className="mt-1 text-center text-[10px] leading-tight text-muted-foreground">
            {active !== null ? arcs[active].label : (centerLabel ?? "total")}
          </span>
        </div>
      </div>
      <ul className="grid w-full min-w-0 grid-cols-1 gap-1 sm:grid-cols-2">
        {arcs.map((a) => (
          <li
            key={a.label}
            onMouseEnter={() => setActive(a.i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => onSegmentClick?.(a.i)}
            className={cn(
              "flex min-w-0 items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs transition-colors",
              onSegmentClick ? "cursor-pointer" : "cursor-default"
            )}
            style={{ background: active === a.i ? "var(--muted)" : "transparent" }}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: a.color }}
              />
              <span className="truncate" title={a.label}>
                {a.label}
              </span>
            </span>
            <span className="shrink-0 font-mono font-semibold">
              {a.value}
              <span className="ml-1 text-muted-foreground">
                {total > 0 ? Math.round((a.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
