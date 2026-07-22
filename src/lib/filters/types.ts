export type PrazoRange = "atrasadas" | "hoje" | "7dias" | "30dias";
export type OrderBy = "criacao" | "prazo" | "prioridade";

export const PRAZO_OPTIONS: { value: PrazoRange; label: string }[] = [
  { value: "atrasadas", label: "Atrasadas" },
  { value: "hoje", label: "Vencem hoje" },
  { value: "7dias", label: "Próximos 7 dias" },
  { value: "30dias", label: "Próximos 30 dias" },
];

export const ORDER_OPTIONS: { value: OrderBy; label: string }[] = [
  { value: "criacao", label: "Data de criação" },
  { value: "prazo", label: "Prazo" },
  { value: "prioridade", label: "Prioridade" },
];
