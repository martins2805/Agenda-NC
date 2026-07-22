import type { OrderBy } from "./types";

// Serialização genérica de filtros para querystring, usada tanto por
// ActivityFilters quanto por ExecucaoFilters — é o que garante que o
// direcionamento do dashboard (deep-link) fale a mesma "língua" de filtros
// em qualquer tela de destino.

export interface ListKeyDef<F> {
  key: keyof F;
  param: string;
}

export function filtersToParams<F extends { keyword: string; ordenar: OrderBy }>(
  filters: F,
  listKeys: ListKeyDef<F>[]
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.keyword.trim()) sp.set("kw", filters.keyword.trim());
  for (const { key, param } of listKeys) {
    const value = filters[key] as unknown as string[];
    if (value.length > 0) sp.set(param, value.join(","));
  }
  if (filters.ordenar !== "criacao") sp.set("ord", filters.ordenar);
  return sp;
}

export function paramsToFilters<F extends { keyword: string; ordenar: OrderBy }>(
  sp: URLSearchParams,
  defaults: F,
  listKeys: ListKeyDef<F>[]
): F {
  const filters = { ...defaults, keyword: sp.get("kw") ?? "" };
  for (const { key, param } of listKeys) {
    const raw = sp.get(param);
    if (raw) {
      (filters[key] as unknown as string[]) = raw.split(",").filter(Boolean);
    }
  }
  const ord = sp.get("ord");
  if (ord === "prazo" || ord === "prioridade" || ord === "criacao") {
    filters.ordenar = ord;
  }
  return filters;
}
