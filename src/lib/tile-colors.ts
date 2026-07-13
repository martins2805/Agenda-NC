// Neutral base-palette tints for tiles/chips that don't represent status,
// priority or deadline (e.g. category badges, "por tipo" tiles).
export const TILE_COLORS = [
  "bg-[var(--base-1)] text-white",
  "bg-[var(--base-2)] text-white",
  "bg-[var(--base-3)] text-[var(--base-1)]",
  "bg-[var(--base-4)] text-[var(--base-1)]",
];

export function tileColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}
