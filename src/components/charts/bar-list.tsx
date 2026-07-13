"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BarListItem {
  label: string;
  value: number;
  color: string;
}

export function BarList({
  items,
  className,
}: {
  items: BarListItem[];
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item, i) => (
        <li
          key={item.label}
          className="flex flex-col gap-1"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-mono font-semibold">{item.value}</span>
          </div>
          <div className="progress-track">
            <span
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color,
                opacity: hover === null || hover === i ? 1 : 0.5,
                transition: "width 0.4s ease, opacity 0.2s ease",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
