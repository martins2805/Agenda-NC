import { parseLocalDate } from "../calculations";
import type { PrazoRange } from "./types";

export function matchesPrazoRange(prazo: string | null, mode: PrazoRange) {
  if (!prazo) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseLocalDate(prazo);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (mode === "atrasadas") return diffDays < 0;
  if (mode === "hoje") return diffDays === 0;
  if (mode === "7dias") return diffDays >= 0 && diffDays <= 7;
  if (mode === "30dias") return diffDays >= 0 && diffDays <= 30;
  return true;
}

// Um dos intervalos selecionados basta (OR). Sem seleção, não filtra por prazo.
export function matchesPrazos(prazo: string | null, ranges: PrazoRange[]) {
  if (ranges.length === 0) return true;
  return ranges.some((range) => matchesPrazoRange(prazo, range));
}
