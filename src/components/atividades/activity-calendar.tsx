"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_STYLES } from "@/lib/status-colors";
import {
  DEFAULT_CALENDAR_FILTERS,
  hasActiveCalendarFilters,
  matchesPrazoEntry,
  prazoEntryFromApi,
  tipoPrazoLabel,
  type CalendarFilters,
  type PrazoEntry,
  type PrazoUnificadoApiRow,
} from "@/lib/prazo-filters";
import { CalendarFilterBar } from "@/components/atividades/calendar-filter-bar";

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Só a Atividade tem prazo com hora (usado no bloco "Agendamento") — os demais
// (checklist, checklist de execução, prazo de execução, prazoFim de proposta)
// são datas simples.
function isDateTimeField(entry: PrazoEntry): boolean {
  return entry.objetoTipo === "atividade" && entry.tipoPrazo === "atividade";
}

function PrazoEditavel({ entry, onSave }: { entry: PrazoEntry; onSave: (valor: string | null) => void }) {
  const [editing, setEditing] = useState(false);
  const datetime = isDateTimeField(entry);

  if (editing) {
    return (
      <Input
        type={datetime ? "datetime-local" : "date"}
        autoFocus
        defaultValue={datetime ? entry.data : entry.data.slice(0, 10)}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          onSave(e.target.value || null);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 w-fit text-xs"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
      className="text-muted-foreground hover:underline"
    >
      Alterar prazo
    </button>
  );
}

export function ActivityCalendar() {
  const { lookups, atividades, atividadesGerais, updateAtividade, updateAtividadeGeral, updateRegistro } =
    useAppData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [prazos, setPrazos] = useState<PrazoEntry[]>([]);

  // Consumidor exclusivo de prazo_unificado (S1/S7) — nenhuma agregação de
  // prazos é recalculada aqui, só lida da view via /api/prazos.
  const fetchPrazos = useCallback(() => {
    fetch("/api/prazos")
      .then((res) => (res.ok ? (res.json() as Promise<PrazoUnificadoApiRow[]>) : []))
      .then((rows) => setPrazos(rows.map(prazoEntryFromApi)))
      .catch(() => setPrazos([]));
  }, []);

  useEffect(() => {
    fetchPrazos();
  }, [fetchPrazos]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, PrazoEntry[]>();
    for (const p of prazos) {
      const key = p.data.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [prazos]);

  const filteredEntriesByDate = useMemo(() => {
    if (!hasActiveCalendarFilters(filters)) return entriesByDate;
    const map = new Map<string, PrazoEntry[]>();
    for (const [key, list] of entriesByDate) {
      const filtered = list.filter((entry) => matchesPrazoEntry(entry, filters, lookups));
      if (filtered.length > 0) map.set(key, filtered);
    }
    return map;
  }, [entriesByDate, filters, lookups]);

  const selectedKey = selectedDate ? toKey(selectedDate) : null;
  const entries = selectedKey ? (filteredEntriesByDate.get(selectedKey) ?? []) : [];

  // Despacha a edição para as mesmas funções do AppDataProvider usadas no
  // resto do app — o dashboard e as demais telas refletem sem refresh manual
  // (Regra 10), já que é o mesmo estado compartilhado.
  function editarPrazo(entry: PrazoEntry, novoValor: string | null) {
    if (entry.objetoTipo === "registro") {
      updateRegistro(entry.objetoId, { prazo: novoValor });
    } else if (entry.objetoTipo === "atividade") {
      const atividade = atividades.find((a) => a.id === entry.objetoId);
      if (!atividade) return;
      if (entry.tipoPrazo === "atividade") {
        updateAtividade(atividade.id, { prazo: novoValor });
      } else if (entry.tipoPrazo === "checklist") {
        updateAtividade(atividade.id, {
          checklist: atividade.checklist.map((c) => (c.id === entry.origemId ? { ...c, prazo: novoValor } : c)),
        });
      } else if (entry.tipoPrazo === "proposta") {
        updateAtividade(atividade.id, {
          propostas: atividade.propostas.map((p) => (p.id === entry.origemId ? { ...p, prazoFim: novoValor } : p)),
        });
      }
    } else {
      const geral = atividadesGerais.find((g) => g.id === entry.objetoId);
      if (!geral) return;
      if (entry.tipoPrazo === "atividade") {
        updateAtividadeGeral(geral.id, { prazo: novoValor });
      } else if (entry.tipoPrazo === "checklist") {
        updateAtividadeGeral(geral.id, {
          checklist: geral.checklist.map((c) => (c.id === entry.origemId ? { ...c, prazo: novoValor } : c)),
        });
      }
    }
    // /api/prazos é uma cópia separada do estado global — busca de novo depois
    // da própria edição (não é um botão "Atualizar", é consequência da ação).
    window.setTimeout(fetchPrazos, 400);
  }

  return (
    <div className="panel-card flex flex-col gap-4 p-4">
      <Calendar
        mode="single"
        locale={{ code: "pt-BR" } as never}
        selected={selectedDate}
        onSelect={(date) =>
          setSelectedDate((prev) => (prev && date && toKey(prev) === toKey(date) ? undefined : date))
        }
        modifiers={{ hasItems: (date) => filteredEntriesByDate.has(toKey(date)) }}
        modifiersClassNames={{
          hasItems:
            "relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
        }}
        className="w-full rounded-md bg-card"
      />

      <CalendarFilterBar filters={filters} onChange={setFilters} />

      <div className="flex flex-col gap-2 rounded-md bg-card p-3">
        <h4 className="text-sm font-semibold">Prazos vinculados</h4>
        {!selectedDate ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <CalendarDays className="size-8" />
            <p className="text-sm">Clique em um dia para ver os prazos vinculados a ele.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium">
              {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada agendado para este dia.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => {
                  const empresa = lookups.empresa.find((e) => e.id === entry.empresaId)?.name ?? "Sem empresa";
                  const unidade = lookups.unidade.find((u) => u.id === entry.unidadeId)?.name;
                  const href =
                    entry.objetoTipo === "registro"
                      ? `/registros?open=${entry.objetoId}`
                      : entry.objetoTipo === "atividade"
                        ? `/atividades?open=${entry.objetoId}`
                        : `/atividades-gerais?open=${entry.objetoId}`;
                  return (
                    <li
                      key={`${entry.tipoPrazo}-${entry.origemId}`}
                      className="flex flex-col gap-1.5 rounded-md border px-2.5 py-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={href} className="font-medium text-primary hover:underline">
                          {empresa}
                          {unidade && <span className="text-muted-foreground"> · {unidade}</span>}
                        </Link>
                        <span className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {tipoPrazoLabel(entry)}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{entry.titulo || "Sem assunto"}</p>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        {entry.prioridade ? (
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium tracking-wide uppercase ${PRIORIDADE_STYLES[entry.prioridade]}`}
                          >
                            {entry.prioridade}
                          </span>
                        ) : (
                          <span />
                        )}
                        <PrazoEditavel entry={entry} onSave={(valor) => editarPrazo(entry, valor)} />
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
