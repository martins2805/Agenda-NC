"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckSquare, ListChecks } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade, Prioridade } from "@/lib/types";

interface CalendarEntry {
  kind: "atividade" | "checklist";
  atividade: Atividade;
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

export function ActivityCalendar({ atividades }: { atividades: Atividade[] }) {
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
    });
    return map;
  }, [atividades, lookups.tipoAtividade]);

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const entries = selectedKey ? entriesByDate.get(selectedKey) ?? [] : [];

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:gap-6">
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
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                  const empresa = lookups.empresa.find(
                    (e) => e.id === entry.atividade.empresaId
                  );
                  return (
                    <li
                      key={i}
                      className="flex flex-col gap-1.5 rounded-md border px-2.5 py-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">
                          {entry.kind === "atividade"
                            ? (empresa?.name ?? "Sem empresa")
                            : entry.texto}
                        </span>
                        <Badge
                          variant="outline"
                          className="flex shrink-0 items-center gap-1 text-[10px] uppercase"
                        >
                          {entry.kind === "atividade" ? (
                            <CalendarDays className="size-3" />
                          ) : (
                            <CheckSquare className="size-3" />
                          )}
                          {entry.kind === "atividade" ? "Atividade" : "Item de checklist"}
                        </Badge>
                      </div>
                      {entry.kind === "checklist" && (
                        <span className="text-xs text-muted-foreground">
                          {empresa?.name ?? "Sem empresa"}
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium tracking-wide uppercase ${PRIORIDADE_STYLES[entry.atividade.prioridade]}`}
                        >
                          {entry.atividade.prioridade}
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
