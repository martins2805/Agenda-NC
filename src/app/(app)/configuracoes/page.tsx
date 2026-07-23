"use client";

import { useState } from "react";
import { ArchiveRestore, Archive, ArrowDown, ArrowUp, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/lib/app-data-context";
import { LOOKUP_COR_OPTIONS, type LookupCor, type LookupItem, type LookupKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BackupExport } from "@/components/backup-export";

// Tela de catálogos (S3). CRUD com cor, ordem e arquivamento — a mesma
// fonte que alimenta os selects/multi-selects em todo o resto do sistema
// (src/lib/app-data-context.tsx). Criar um item aqui aparece nos
// formulários imediatamente, sem redeploy, porque é o mesmo estado.

const KIND_LABELS: Record<LookupKind, string> = {
  empresa: "Empresas",
  unidade: "Unidades",
  tipoAtividade: "Tipos de atividade",
  servicoProduto: "Produtos / Serviços",
  escopo: "Escopo",
  amostragem: "Amostragem",
  categoriaRegistro: "Categorias de registro",
  categoriaPlanilha: "Categorias de planilha",
  tipoAtividadeGeral: "Tipos de execução",
  setorInterno: "Setores internos",
};

const KIND_ORDER: LookupKind[] = [
  "empresa",
  "unidade",
  "tipoAtividade",
  "servicoProduto",
  "escopo",
  "amostragem",
  "categoriaRegistro",
  "categoriaPlanilha",
  "tipoAtividadeGeral",
  "setorInterno",
];

const COR_SWATCH: Record<LookupCor, string> = {
  "base-1": "var(--base-1)",
  "base-2": "var(--base-2)",
  "base-3": "var(--base-3)",
  "base-4": "var(--base-4)",
};

function CorPicker({
  value,
  onChange,
}: {
  value: LookupCor | null;
  onChange: (cor: LookupCor | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        title="Cor automática"
        onClick={() => onChange(null)}
        className={cn(
          "size-5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/40",
          value === null && "ring-2 ring-ring ring-offset-1"
        )}
      />
      {LOOKUP_COR_OPTIONS.map((cor) => (
        <button
          key={cor}
          type="button"
          title={cor}
          onClick={() => onChange(cor)}
          style={{ background: COR_SWATCH[cor] }}
          className={cn(
            "size-5 shrink-0 rounded-full border border-black/10",
            value === cor && "ring-2 ring-ring ring-offset-1"
          )}
        />
      ))}
    </div>
  );
}

function ItemRow({
  item,
  kind,
  canMoveUp,
  canMoveDown,
}: {
  item: LookupItem;
  kind: LookupKind;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const { renameLookupItem, deactivateLookupItem, setLookupItemCor, reorderLookupItem } = useAppData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);

  function commit() {
    setEditing(false);
    if (name.trim() && name.trim() !== item.name) renameLookupItem(kind, item.id, name.trim());
    else setName(item.name);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/50">
      <div className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-5"
          disabled={!canMoveUp}
          onClick={() => reorderLookupItem(kind, item.id, "up")}
        >
          <ArrowUp className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-5"
          disabled={!canMoveDown}
          onClick={() => reorderLookupItem(kind, item.id, "down")}
        >
          <ArrowDown className="size-3" />
        </Button>
      </div>
      <CorPicker value={item.cor} onChange={(cor) => setLookupItemCor(kind, item.id, cor)} />
      {editing ? (
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="h-8 flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 truncate text-left text-sm"
          title="Clique para renomear"
        >
          {item.name}
        </button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground"
        title="Arquivar"
        onClick={() => deactivateLookupItem(kind, item.id)}
      >
        <Archive className="size-3.5" />
      </Button>
    </div>
  );
}

function CatalogSection({ kind }: { kind: LookupKind }) {
  const { lookups, addLookupItem, activateLookupItem } = useAppData();
  const [newName, setNewName] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const items = lookups[kind];
  const active = items.filter((i) => i.active).sort((a, b) => a.ordem - b.ordem);
  const archived = items.filter((i) => !i.active);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addLookupItem(kind, trimmed);
    setNewName("");
  }

  return (
    <div className="panel-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{KIND_LABELS[kind]}</h3>
        <Badge variant="secondary">{active.length}</Badge>
      </div>

      <div className="flex flex-col gap-0.5">
        {active.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum item ativo.</p>
        )}
        {active.map((item, i) => (
          <ItemRow
            key={item.id}
            item={item}
            kind={kind}
            canMoveUp={i > 0}
            canMoveDown={i < active.length - 1}
          />
        ))}
      </div>

      <div className="flex gap-1.5">
        <Input
          placeholder="Novo item..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8"
        />
        <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1" onClick={handleAdd}>
          <Plus className="size-3.5" />
          Adicionar
        </Button>
      </div>

      {archived.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          <button
            type="button"
            className="text-left text-xs text-muted-foreground hover:underline"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Ocultar" : "Mostrar"} {archived.length} arquivado(s)
          </button>
          {showArchived &&
            archived.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                <span className="flex-1 truncate line-through">{item.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  title="Reativar"
                  onClick={() => activateLookupItem(kind, item.id)}
                >
                  <ArchiveRestore className="size-3.5" />
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// "unidade" pertence a uma empresa — recebe tratamento próprio: cria dentro
// do contexto de uma empresa selecionada, em vez de uma lista solta.
function UnidadeSection() {
  const { lookups, addLookupItem, activateLookupItem, renameLookupItem, deactivateLookupItem, setLookupItemCor, reorderLookupItem } =
    useAppData();
  const empresasAtivas = lookups.empresa.filter((e) => e.active).sort((a, b) => a.ordem - b.ordem);
  const [empresaId, setEmpresaId] = useState<string | null>(empresasAtivas[0]?.id ?? null);
  const [newName, setNewName] = useState("");

  const unidades = lookups.unidade.filter((u) => u.empresaId === empresaId);
  const active = unidades.filter((u) => u.active).sort((a, b) => a.ordem - b.ordem);
  const archived = unidades.filter((u) => !u.active);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || !empresaId) return;
    addLookupItem("unidade", trimmed, empresaId);
    setNewName("");
  }

  if (empresasAtivas.length === 0) {
    return (
      <div className="panel-card p-5 text-sm text-muted-foreground">
        Cadastre uma empresa antes de criar unidades.
      </div>
    );
  }

  return (
    <div className="panel-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{KIND_LABELS.unidade}</h3>
        <Badge variant="secondary">{active.length}</Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Empresa</Label>
        <Select value={empresaId ?? undefined} onValueChange={setEmpresaId}>
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {empresasAtivas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-0.5">
        {active.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nenhuma unidade ativa nesta empresa.</p>
        )}
        {active.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/50">
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5"
                disabled={i === 0}
                onClick={() => reorderLookupItem("unidade", item.id, "up")}
              >
                <ArrowUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5"
                disabled={i === active.length - 1}
                onClick={() => reorderLookupItem("unidade", item.id, "down")}
              >
                <ArrowDown className="size-3" />
              </Button>
            </div>
            <CorPicker value={item.cor} onChange={(cor) => setLookupItemCor("unidade", item.id, cor)} />
            <span
              className="flex-1 truncate text-left text-sm"
              onDoubleClick={() => {
                const novo = window.prompt("Renomear unidade", item.name);
                if (novo?.trim()) renameLookupItem("unidade", item.id, novo.trim());
              }}
              title="Duplo clique para renomear"
            >
              {item.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              title="Arquivar"
              onClick={() => deactivateLookupItem("unidade", item.id)}
            >
              <Archive className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <Input
          placeholder="Nova unidade..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8"
        />
        <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1" onClick={handleAdd}>
          <Plus className="size-3.5" />
          Adicionar
        </Button>
      </div>

      {archived.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          {archived.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
              <span className="flex-1 truncate line-through">{item.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                title="Reativar"
                onClick={() => activateLookupItem("unidade", item.id)}
              >
                <ArchiveRestore className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { loading } = useAppData();

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando catálogos...</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Catálogos usados nos formulários do sistema. Arquivar um item o remove das listas de
          seleção, mas preserva os registros que já o usam.
        </p>
      </div>

      <BackupExport />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {KIND_ORDER.map((kind) =>
          kind === "unidade" ? <UnidadeSection key={kind} /> : <CatalogSection key={kind} kind={kind} />
        )}
      </div>
    </div>
  );
}
