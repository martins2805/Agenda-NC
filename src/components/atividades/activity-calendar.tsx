"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckSquare, ListChecks } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_STYLES } from "@/lib/status-colors";
import type { Atividade, AtividadeGeral } from "@/lib/types";

type EntryKind = "atividade" | "checklist" | "execucao" | "geral";

interface CalendarEntry {
  kind: EntryKind;
  atividade?: Atividade;
  atividadeGeral?: AtividadeGeral;
  empresaId: string | null;
  tipos: string[];
  texto: string | null;
  concluido?: boolean;
}

const ALL = "__all__";

const KIND_LABELS: Record<EntryKind, string> = {
  atividade: "Atividade",
  checklist: "Item de checklist",
  geral: "Execução",
  execucao: "Proposta",
};

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ActivityCalendar({
  atividades,
  atividadesGerais,
}: {
  atividades: Atividade[];
  atividadesGerais: AtividadeGeral[];
}) {
  const { lookups } = useAppData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [filterEmpresaId, setFilterEmpresaId] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<EntryKind | null>(null);

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
        push(a.prazo, { kind: "atividade", atividade: a, empresaId: a.empresaId, tipos, texto: null });
      }
      a.checklist.forEach((c) => {
        if (c.prazo) {
          push(c.prazo, {
            kind: "checklist",
            atividade: a,
            empresaId: a.empresaId,
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
          empresaId: a.empresaId,
          tipos,
          texto: `Proposta ${p.numero}`,
        });
        if (p.prazoFim && p.prazoFim !== p.prazoInicio) {
          push(p.prazoFim, {
            kind: "execucao",
            atividade: a,
            empresaId: a.empresaId,
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
          empresaId: a.empresaId,
          tipos,
          texto: a.assunto,
        });
      }
      a.checklist.forEach((item) => {
        if (item.prazo) {
          push(item.prazo, {
            kind: "geral",
            atividadeGeral: a,
            empresaId: item.empresaId ?? a.empresaId,
            tipos,
            texto: item.texto,
          });
        }
      });
    });
    return map;
  }, [atividades, atividadesGerais, lookups.tipoAtividade, lookups.tipoAtividadeGeral]);

  const filteredEntriesByDate = useMemo(() => {
    if (!filterEmpresaId && !filterKind) return entriesByDate;
    const map = new Map<string, CalendarEntry[]>();
    for (const [key, list] of entriesByDate) {
      const filtered = list.filter(
        (entry) =>
          (!filterEmpresaId || entry.empresaId === filterEmpresaId) &&
          (!filterKind || entry.kind === filterKind)
      );
      if (filtered.length > 0) map.set(key, filtered);
    }
    return map;
  }, [entriesByDate, filterEmpresaId, filterKind]);

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const entries = selectedKey ? filteredEntriesByDate.get(selectedKey) ?? [] : [];

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-[#3E4C59] p-4 text-white shadow-[0_18px_40px_-24px_rgba(31,44,67,0.6)]">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          items={{
            [ALL]: "Todas as empresas",
            ...Object.fromEntries(
              lookups.empresa.filter((e) => e.active).map((e) => [e.id, e.name])
            ),
          }}
          value={filterEmpresaId ?? ALL}
          onValueChange={(v) => setFilterEmpresaId(v === ALL ? null : v)}
        >
          <SelectTrigger className="w-full bg-[var(--background)]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as empresas</SelectItem>
            {lookups.empresa
              .filter((e) => e.active)
              .map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          items={{
            [ALL]: "Todos os tipos de prazo",
            ...KIND_LABELS,
          }}
          value={filterKind ?? ALL}
          onValueChange={(v) => setFilterKind(v === ALL ? null : (v as EntryKind))}
        >
          <SelectTrigger className="w-full bg-[var(--background)]">
            <SelectValue placeholder="Tipo de prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os tipos de prazo</SelectItem>
            {(Object.keys(KIND_LABELS) as EntryKind[]).map((kind) => (
              <SelectItem key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <Calendar
        mode="single"
        locale={{ code: "pt-BR" } as never}
        selected={selectedDate}
        onSelect={(date) =>
          setSelectedDate((prev) =>
            prev && date && toKey(prev) === toKey(date) ? undefined : date
          )
        }
        modifiers={{ hasItems: (date) => filteredEntriesByDate.has(toKey(date)) }}
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
                              ? `${entry.tipos.join(", ") || "Execução"} · ${
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
                          {KIND_LABELS[entry.kind]}
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
    </div>
  );
}
