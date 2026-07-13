"use client";

import { useId, useState } from "react";

export function TrendLine({
  points,
  color = "var(--base-1)",
  height = 56,
}: {
  points: number[];
  color?: string;
  height?: number;
}) {
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const width = 200;
  const max = Math.max(1, ...points);
  const min = Math.min(0, ...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: i * step,
    y: height - ((p - min) / range) * (height - 8) - 4,
  }));

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${uid}-fill)`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "d 0.3s ease" }}
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hover === i ? 4 : 2.5}
            fill={color}
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-1 -translate-x-1/2 -translate-y-full rounded-md bg-[var(--base-1)] px-1.5 py-0.5 font-mono text-[10px] text-white shadow"
          style={{ left: `${(coords[hover].x / width) * 100}%` }}
        >
          {points[hover]}
        </div>
      )}
    </div>
  );
}
