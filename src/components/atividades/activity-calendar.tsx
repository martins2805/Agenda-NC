"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckSquare, ListChecks, FileSignature } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/app-data-context";
import { dateOnlyPart } from "@/lib/calculations";
import type { Atividade } from "@/lib/types";
import { PRIORIDADE_STYLES } from "@/lib/status-colors";

interface CalendarEntry {
  kind: "atividade" | "checklist" | "execucao";
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

const DOT_CLASS =
  "relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full";

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
        push(dateOnlyPart(a.prazo), { kind: "atividade", atividade: a, tipos, texto: null });
      }
      a.checklist.forEach((c) => {
        if (c.prazo) {
          push(dateOnlyPart(c.prazo), {
            kind: "checklist",
            atividade: a,
            tipos,
            texto: c.texto,
            concluido: c.concluido,
          });
        }
      });
      a.propostas.forEach((p) => {
        if (p.prazoInicio) {
          push(dateOnlyPart(p.prazoInicio), {
            kind: "execucao",
            atividade: a,
            tipos,
            texto: `Proposta ${p.numero} — início`,
          });
        }
        if (p.prazoFim) {
          push(dateOnlyPart(p.prazoFim), {
            kind: "execucao",
            atividade: a,
            tipos,
            texto: `Proposta ${p.numero} — fim`,
          });
        }
      });
    });
    return map;
  }, [atividades, lookups.tipoAtividade]);

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const entries = selectedKey ? entriesByDate.get(selectedKey) ?? [] : [];

  const dayInfo = useMemo(() => {
    const map = new Map<string, { count: number; priority: Atividade["prioridade"] | null }>();
    entriesByDate.forEach((list, key) => {
      const uniqueAtividadeIds = new Set(list.map((e) => e.atividade.id));
      map.set(key, {
        count: uniqueAtividadeIds.size,
        priority: uniqueAtividadeIds.size === 1 ? list[0].atividade.prioridade : null,
      });
    });
    return map;
  }, [entriesByDate]);

  function hasSinglePriority(date: Date, prioridade: Atividade["prioridade"]) {
    const info = dayInfo.get(toKey(date));
    return info?.count === 1 && info.priority === prioridade;
  }

  return (
    <div className="panel-card flex flex-col gap-4 bg-[var(--base-3)] p-4 sm:flex-row">
      <Calendar
        mode="single"
        locale={{ code: "pt-BR" } as never}
        selected={selectedDate}
        onSelect={(date) =>
          setSelectedDate((prev) =>
            prev && date && toKey(prev) === toKey(date) ? undefined : date
          )
        }
        className="w-full rounded-xl bg-card p-3 sm:flex-[2]"
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_caption: "flex h-9 w-full items-center justify-center font-semibold text-[var(--base-1)]",
          weekday: "flex-1 rounded-md text-[0.8rem] font-medium text-[var(--base-2)] select-none",
          button_previous: "text-[var(--base-1)] hover:bg-[var(--base-3)]/30",
          button_next: "text-[var(--base-1)] hover:bg-[var(--base-3)]/30",
          today: "rounded-md bg-[var(--base-3)]/40 text-[var(--base-1)] font-semibold data-[selected=true]:rounded-none",
        }}
        modifiers={{
          singleUrgente: (date) => hasSinglePriority(date, "Urgente"),
          singleImportante: (date) => hasSinglePriority(date, "Importante"),
          singleMedio: (date) => hasSinglePriority(date, "Médio"),
          singleBaixo: (date) => hasSinglePriority(date, "Baixo"),
          multiplas: (date) => (dayInfo.get(toKey(date))?.count ?? 0) > 1,
        }}
        modifiersClassNames={{
          singleUrgente: `${DOT_CLASS} after:bg-[var(--prioridade-urgente)]`,
          singleImportante: `${DOT_CLASS} after:bg-[var(--prioridade-importante)]`,
          singleMedio: `${DOT_CLASS} after:bg-[var(--prioridade-medio)]`,
          singleBaixo: `${DOT_CLASS} after:bg-[var(--prioridade-baixo)]`,
          multiplas: `${DOT_CLASS} after:bg-[var(--base-1)]`,
        }}
      />

      <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-card p-3 sm:flex-[1]">
        {!selectedDate ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <CalendarDays className="size-8 text-[var(--base-3)]" />
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
                  const isExecucao = entry.kind === "execucao";
                  return (
                    <li
                      key={i}
                      className={
                        isExecucao
                          ? "flex flex-col gap-1.5 rounded-md border border-dashed border-[var(--base-4)] bg-muted/20 px-2.5 py-2 text-sm opacity-80"
                          : "flex flex-col gap-1.5 rounded-md border px-2.5 py-2 text-sm"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={isExecucao ? "font-normal text-muted-foreground" : "font-medium"}>
                          {entry.kind === "atividade"
                            ? (empresa?.name ?? "Sem empresa")
                            : entry.texto}
                        </span>
                        <Badge
                          variant={isExecucao ? "secondary" : "outline"}
                          className={
                            isExecucao
                              ? "flex shrink-0 items-center gap-1 border-none bg-[var(--base-3)]/25 text-[10px] font-normal text-muted-foreground uppercase"
                              : "flex shrink-0 items-center gap-1 text-[10px] uppercase"
                          }
                        >
                          {entry.kind === "atividade" && <CalendarDays className="size-3" />}
                          {entry.kind === "checklist" && <CheckSquare className="size-3" />}
                          {entry.kind === "execucao" && <FileSignature className="size-3" />}
                          {entry.kind === "atividade" && "Atividade"}
                          {entry.kind === "checklist" && "Item de checklist"}
                          {entry.kind === "execucao" && "Execução"}
                        </Badge>
                      </div>
                      {entry.kind !== "atividade" && (
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
