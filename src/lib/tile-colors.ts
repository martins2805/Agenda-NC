export const TILE_COLORS = [
  "bg-[var(--chart-1)] text-white",
  "bg-[var(--chart-3)] text-white",
  "bg-[var(--chart-2)] text-white",
  "bg-[var(--chart-4)] text-[var(--chart-1)]",
  "bg-[var(--chart-5)] text-[var(--chart-1)]",
  "bg-foreground text-background",
];

export function tileColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}
