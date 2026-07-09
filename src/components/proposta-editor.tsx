"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagedMultiSelect } from "@/components/managed-multi-select";
import { useAppData } from "@/lib/app-data-context";
import { makePropostaId } from "@/lib/app-data-context";
import { formatCurrency } from "@/lib/calculations";
import type { Proposta } from "@/lib/types";

function emptyProposta(numero: number): Proposta {
  return {
    id: makePropostaId(),
    numero,
    servicoProdutoIds: [],
    escopoIds: [],
    amostragemIds: [],
    quantidade: null,
    valorUnitario: null,
    valorTotal: null,
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
            <ManagedMultiSelect
              label="Serviço/Produto"
              items={lookups.servicoProduto}
              value={p.servicoProdutoIds}
              onChange={(ids) => updateProposta(p.id, { servicoProdutoIds: ids })}
              onCreate={(name) => addLookupItem("servicoProduto", name)}
              onRename={(id, name) => renameLookupItem("servicoProduto", id, name)}
              onDeactivate={(id) => deactivateLookupItem("servicoProduto", id)}
            />
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
