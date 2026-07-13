"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface VerticalBarSegment {
  label: string;
  value: number;
  color: string;
}

interface VerticalBarChartProps {
  segments: VerticalBarSegment[];
  height?: number;
  className?: string;
  onSegmentClick?: (index: number) => void;
}

export function VerticalBarChart({
  segments,
  height = 132,
  className,
  onSegmentClick,
}: VerticalBarChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const max = Math.max(1, ...segments.map((s) => s.value));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {segments.map((s, i) => {
          const pct = s.value / max;
          const isActive = active === i;
          return (
            <div
              key={s.label}
              className={cn(
                "flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1",
                onSegmentClick ? "cursor-pointer" : "cursor-default"
              )}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => onSegmentClick?.(i)}
            >
              <span className="font-mono text-[11px] font-semibold">
                {isActive ? s.value : s.value > 0 ? s.value : ""}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md transition-[height,opacity] duration-300"
                  style={{
                    height: `${Math.max(pct * 100, s.value > 0 ? 4 : 0)}%`,
                    background: s.color,
                    opacity: active === null || isActive ? 1 : 0.45,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-start gap-2">
        {segments.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground",
              onSegmentClick && "cursor-pointer"
            )}
            title={`${s.label}: ${s.value} (${total > 0 ? Math.round((s.value / total) * 100) : 0}%)`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => onSegmentClick?.(i)}
          >
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
