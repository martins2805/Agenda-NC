"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckSquare, ListChecks } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade, AtividadeGeral, Prioridade } from "@/lib/types";

interface CalendarEntry {
  kind: "atividade" | "checklist" | "execucao" | "geral";
  atividade?: Atividade;
  atividadeGeral?: AtividadeGeral;
  tipos: string[];
  texto: string | null;
  concluido?: boolean;
}

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const PRIORIDADE_STYLES: Record<Prioridade, string> = {
  Urgente: "bg-[var(--chart-3)] text-white",
  Importante: "bg-[var(--chart-1)] text-white",
  Médio: "bg-[var(--chart-2)] text-white",
  Baixo: "bg-muted text-muted-foreground",
};

export function ActivityCalendar({
  atividades,
  atividadesGerais,
}: {
  atividades: Atividade[];
  atividadesGerais: AtividadeGeral[];
}) {
  const { lookups } = useAppData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    function push(key: string, entry: CalendarEntry) {
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    atividades.forEach((a) => {
      const tipos = lookups.tipoAtividade
        .filter((t) => a.tipoAtividadeIds.includes(t.id))
        .map((t) => t.name);
      if (a.prazo) {
        push(a.prazo, { kind: "atividade", atividade: a, tipos, texto: null });
      }
      a.checklist.forEach((c) => {
        if (c.prazo) {
          push(c.prazo, {
            kind: "checklist",
            atividade: a,
            tipos,
            texto: c.texto,
            concluido: c.concluido,
          });
        }
      });
      a.propostas.forEach((p) => {
        if (!p.prazoInicio) return;
        push(p.prazoInicio, {
          kind: "execucao",
          atividade: a,
          tipos,
          texto: `Proposta ${p.numero}`,
        });
        if (p.prazoFim && p.prazoFim !== p.prazoInicio) {
          push(p.prazoFim, {
            kind: "execucao",
            atividade: a,
            tipos,
            texto: `Proposta ${p.numero}`,
          });
        }
      });
    });
    atividadesGerais.forEach((a) => {
      const tipos = lookups.tipoAtividadeGeral
        .filter((t) => a.tipoIds.includes(t.id))
        .map((t) => t.name);
      if (a.prazo) {
        push(a.prazo, {
          kind: "geral",
          atividadeGeral: a,
          tipos,
          texto: a.assunto,
        });
      }
      a.checklist.forEach((item) => {
        if (item.prazo) {
          push(item.prazo, {
            kind: "geral",
            atividadeGeral: a,
            tipos,
            texto: item.texto,
          });
        }
      });
    });
    return map;
  }, [atividades, atividadesGerais, lookups.tipoAtividade, lookups.tipoAtividadeGeral]);

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const entries = selectedKey ? entriesByDate.get(selectedKey) ?? [] : [];

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-[var(--chart-1)] p-4 text-[var(--primary)] sm:flex-row sm:gap-6">
      <Calendar
        mode="single"
        locale={{ code: "pt-BR" } as never}
        selected={selectedDate}
        onSelect={(date) =>
          setSelectedDate((prev) =>
            prev && date && toKey(prev) === toKey(date) ? undefined : date
          )
        }
        modifiers={{ hasItems: (date) => entriesByDate.has(toKey(date)) }}
        modifiersClassNames={{
          hasItems:
            "relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
        }}
        className="shrink-0 rounded-md bg-[var(--background)]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-md bg-[var(--background)] p-3">
        {!selectedDate ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <CalendarDays className="size-8" />
            <p className="text-sm">Clique em um dia para ver o que há nele.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium">
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada agendado para este dia.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 overflow-y-auto">
                {entries.map((entry, i) => {
                  const empresa =
                    entry.atividade &&
                    lookups.empresa.find((e) => e.id === entry.atividade?.empresaId);
                  const prioridade =
                    entry.atividade?.prioridade ?? entry.atividadeGeral?.prioridade ?? "Médio";
                  return (
                    <li
                      key={i}
                      className="flex flex-col gap-1.5 rounded-md border px-2.5 py-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">
                          {entry.kind === "atividade"
                            ? (empresa?.name ?? "Sem empresa")
                            : entry.kind === "geral"
                              ? `${entry.tipos.join(", ") || "Atividade Geral"} · ${
                                  entry.atividadeGeral?.assunto || entry.texto || "Sem assunto"
                                }`
                            : entry.texto}
                        </span>
                        <Badge
                          variant="outline"
                          className="flex shrink-0 items-center gap-1 text-[10px] uppercase"
                        >
                          {entry.kind === "atividade" ? (
                            <CalendarDays className="size-3" />
                          ) : entry.kind === "checklist" ? (
                            <CheckSquare className="size-3" />
                          ) : entry.kind === "execucao" ? (
                            <ListChecks className="size-3" />
                          ) : (
                            <CalendarDays className="size-3" />
                          )}
                          {entry.kind === "atividade"
                            ? "Atividade"
                            : entry.kind === "checklist"
                              ? "Item de checklist"
                              : entry.kind === "execucao"
                                ? "Execucao"
                                : "Atividade Geral"}
                        </Badge>
                      </div>
                      {entry.kind !== "atividade" && (
                        <span className="text-xs text-muted-foreground">
                          {entry.kind === "geral"
                            ? `${entry.texto || "Prazo geral"} · ${prioridade}`
                            : empresa?.name ?? "Sem empresa"}
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium tracking-wide uppercase ${PRIORIDADE_STYLES[prioridade]}`}
                        >
                          {prioridade}
                        </span>
                        {entry.tipos.map((t) => (
                          <span
                            key={t}
                            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground"
                          >
                            <ListChecks className="size-3" />
                            {t}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
