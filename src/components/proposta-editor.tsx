"use client";

import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManagedMultiSelect } from "@/components/managed-multi-select";
import { useAppData } from "@/lib/app-data-context";
import { makePropostaId } from "@/lib/app-data-context";
import { formatCurrency, formatLocalDateTime, todayLocalDateString } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import {
  STATUS_NEGOCIACAO_OPTIONS,
  STATUS_NEGOCIACAO_LABELS,
  TIPO_PROPOSTA_OPTIONS,
} from "@/lib/types";
import { STATUS_NEGOCIACAO_STYLES } from "@/lib/status-colors";
import type { Proposta } from "@/lib/types";

const NONE = "__none__";

function emptyProposta(numero: number): Proposta {
  return {
    id: makePropostaId(),
    numero,
    tipo: null,
    servicoProdutoIds: [],
    detalhe: "",
    escopoIds: [],
    amostragemIds: [],
    quantidade: null,
    valorUnitario: null,
    valorTotal: null,
    observacao: "",
    prazoInicio: null,
    prazoFim: null,
    statusNegociacao: null,
  };
}

interface PropostaEditorProps {
  propostas: Proposta[];
  onChange: (propostas: Proposta[]) => void;
}

export function PropostaEditor({ propostas, onChange }: PropostaEditorProps) {
  const {
    lookups,
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
  } = useAppData();

  function setCount(count: number) {
    const next = Math.max(1, count);
    if (next === propostas.length) return;
    if (next > propostas.length) {
      const added = Array.from({ length: next - propostas.length }, (_, i) =>
        emptyProposta(propostas.length + i + 1)
      );
      onChange([...propostas, ...added]);
    } else {
      onChange(propostas.slice(0, next).map((p, i) => ({ ...p, numero: i + 1 })));
    }
  }

  function updateProposta(id: string, patch: Partial<Proposta>) {
    onChange(propostas.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function handleQuantidadeChange(p: Proposta, value: number | null) {
    let valorTotal = p.valorTotal;
    let valorUnitario = p.valorUnitario;
    if (value !== null && p.valorUnitario !== null) {
      valorTotal = Number((value * p.valorUnitario).toFixed(2));
    } else if (value !== null && p.valorTotal !== null && value !== 0) {
      valorUnitario = Number((p.valorTotal / value).toFixed(2));
    }
    updateProposta(p.id, { quantidade: value, valorTotal, valorUnitario });
  }

  function handleValorUnitarioChange(p: Proposta, value: number | null) {
    let valorTotal = p.valorTotal;
    if (value !== null && p.quantidade !== null) {
      valorTotal = Number((value * p.quantidade).toFixed(2));
    }
    updateProposta(p.id, { valorUnitario: value, valorTotal });
  }

  function handleValorTotalChange(p: Proposta, value: number | null) {
    let valorUnitario = p.valorUnitario;
    if (value !== null && p.quantidade !== null && p.quantidade !== 0) {
      valorUnitario = Number((value / p.quantidade).toFixed(2));
    }
    updateProposta(p.id, { valorTotal: value, valorUnitario });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label>Número de propostas</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCount(propostas.length - 1)}
            disabled={propostas.length <= 1}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-6 text-center font-medium">{propostas.length}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCount(propostas.length + 1)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {propostas.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <CardTitle className="text-base">Proposta {p.numero}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={p.tipo ?? NONE}
                  onValueChange={(v) =>
                    updateProposta(p.id, { tipo: v === NONE ? null : (v as Proposta["tipo"]) })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="MRR ou PS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Não definido</SelectItem>
                    {TIPO_PROPOSTA_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Status da negociação</Label>
                <Select
                  value={p.statusNegociacao ?? NONE}
                  onValueChange={(v) =>
                    updateProposta(p.id, {
                      statusNegociacao: v === NONE ? null : (v as Proposta["statusNegociacao"]),
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Não definido</SelectItem>
                    {STATUS_NEGOCIACAO_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_NEGOCIACAO_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {p.statusNegociacao && (
                  <span
                    className={cn(
                      "w-fit rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
                      STATUS_NEGOCIACAO_STYLES[p.statusNegociacao]
                    )}
                  >
                    {STATUS_NEGOCIACAO_LABELS[p.statusNegociacao]}
                  </span>
                )}
              </div>
            </div>

            <ManagedMultiSelect
              label="Serviço/Produto"
              items={lookups.servicoProduto}
              value={p.servicoProdutoIds}
              onChange={(ids) => updateProposta(p.id, { servicoProdutoIds: ids })}
              onCreate={(name) => addLookupItem("servicoProduto", name)}
              onRename={(id, name) => renameLookupItem("servicoProduto", id, name)}
              onDeactivate={(id) => deactivateLookupItem("servicoProduto", id)}
            />

            <div className="flex flex-col gap-1.5">
              <Label>Detalhe do serviço/produto</Label>
              <Textarea
                rows={2}
                value={p.detalhe}
                onChange={(e) => updateProposta(p.id, { detalhe: e.target.value })}
                placeholder="Texto livre sobre o que será disponibilizado (opcional)"
              />
            </div>

            <ManagedMultiSelect
              label="Escopo"
              items={lookups.escopo}
              value={p.escopoIds}
              onChange={(ids) => updateProposta(p.id, { escopoIds: ids })}
              onCreate={(name) => addLookupItem("escopo", name)}
              onRename={(id, name) => renameLookupItem("escopo", id, name)}
              onDeactivate={(id) => deactivateLookupItem("escopo", id)}
            />
            <ManagedMultiSelect
              label="Amostragem"
              items={lookups.amostragem}
              value={p.amostragemIds}
              onChange={(ids) => updateProposta(p.id, { amostragemIds: ids })}
              onCreate={(name) => addLookupItem("amostragem", name)}
              onRename={(id, name) => renameLookupItem("amostragem", id, name)}
              onDeactivate={(id) => deactivateLookupItem("amostragem", id)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={p.quantidade ?? ""}
                  onChange={(e) =>
                    handleQuantidadeChange(
                      p,
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Valor unitário</Label>
                <Input
                  type="number"
                  value={p.valorUnitario ?? ""}
                  onChange={(e) =>
                    handleValorUnitarioChange(
                      p,
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Valor total</Label>
                <Input
                  type="number"
                  value={p.valorTotal ?? ""}
                  onChange={(e) =>
                    handleValorTotalChange(
                      p,
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
            {p.valorTotal !== null && (
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(p.valorTotal)}
              </p>
            )}

            <div className="flex flex-col gap-1.5 rounded-md border border-dashed p-2.5">
              <div className="flex items-center justify-between">
                <Label>Prazo de execução</Label>
                {p.prazoInicio ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    title="Remover prazo"
                    onClick={() => updateProposta(p.id, { prazoInicio: null, prazoFim: null })}
                  >
                    <X className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs text-muted-foreground"
                    onClick={() =>
                      updateProposta(p.id, { prazoInicio: todayLocalDateString() })
                    }
                  >
                    <Plus className="size-3.5" />
                    Definir prazo
                  </Button>
                )}
              </div>
              {p.prazoInicio && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={p.prazoInicio}
                      onChange={(e) =>
                        updateProposta(p.id, { prazoInicio: e.target.value || null })
                      }
                      className="h-8 w-fit text-xs"
                    />
                    <span className="text-xs text-muted-foreground">
                      {p.prazoFim ? "início" : formatLocalDateTime(p.prazoInicio)}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={p.prazoFim !== null}
                      onCheckedChange={(checked) =>
                        updateProposta(p.id, {
                          prazoFim: checked === true ? todayLocalDateString() : null,
                        })
                      }
                    />
                    Definir período (data final)
                  </label>
                  {p.prazoFim && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="datetime-local"
                        value={p.prazoFim}
                        onChange={(e) =>
                          updateProposta(p.id, { prazoFim: e.target.value || null })
                        }
                        className="h-8 w-fit text-xs"
                      />
                      <span className="text-xs text-muted-foreground">
                        fim — {formatLocalDateTime(p.prazoFim)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Observação</Label>
              <Textarea
                rows={2}
                value={p.observacao}
                onChange={(e) => updateProposta(p.id, { observacao: e.target.value })}
                placeholder="Observações sobre esta proposta (opcional)"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
