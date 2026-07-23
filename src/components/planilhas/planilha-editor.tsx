"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Link2,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManagedSelect } from "@/components/managed-select";
import { ManagedMultiSelect } from "@/components/managed-multi-select";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { ActivityForm } from "@/components/atividades/activity-form";
import { useAppData, useAssuntoSuggestions } from "@/lib/app-data-context";
import { useToast } from "@/components/ui/toast";
import type { Planilha } from "@/lib/types";
import type { UniverSheetHandle, SheetCellValue } from "@/components/planilhas/univer-sheet";

const UniverSheet = dynamic(
  () => import("@/components/planilhas/univer-sheet").then((m) => m.UniverSheet),
  { ssr: false }
);

// Escopo mínimo de import/export (S12, "armadilha: não virar um Excel"):
// só valores de célula, sem fórmulas/estilos. Resolve a maior parte do uso
// real (spec explicitamente recomenda isso em vez de replicar o Univer).
function normalizeXlsxCell(value: unknown): SheetCellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  if (typeof value === "object") {
    const obj = value as { text?: unknown; result?: unknown; richText?: { text: string }[] };
    if (Array.isArray(obj.richText)) return obj.richText.map((r) => r.text).join("");
    if (obj.result !== undefined) return normalizeXlsxCell(obj.result);
    if (obj.text !== undefined) return normalizeXlsxCell(obj.text);
  }
  return String(value);
}

interface PlanilhaEditorProps {
  planilha: Planilha;
  onChange: (planilha: Planilha) => void;
  onBack: () => void;
  onDelete: () => void;
}

export function PlanilhaEditor({
  planilha,
  onChange,
  onBack,
  onDelete,
}: PlanilhaEditorProps) {
  const {
    lookups,
    atividades,
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
  } = useAppData();
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [importing, setImporting] = useState(false);
  const assuntoSuggestions = useAssuntoSuggestions();
  const sheetRef = useRef<UniverSheetHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  function patch(p: Partial<Planilha>) {
    onChange({ ...planilha, ...p });
  }

  async function handleExportXlsx() {
    const rows = sheetRef.current?.exportGrid() ?? [];
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet((planilha.nome || "Planilha").slice(0, 31));
    rows.forEach((row) => worksheet.addRow(row));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${planilha.nome || "planilha"}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        toast.add({ type: "error", title: "Planilha vazia", description: "Nenhuma aba encontrada no arquivo." });
        return;
      }
      const rows: SheetCellValue[][] = [];
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        const values = (row.values as unknown[]).slice(1); // exceljs indexa a partir de 1
        rows.push(values.map(normalizeXlsxCell));
      });
      sheetRef.current?.importGrid(rows);
      toast.add({ type: "success", title: "Importado", description: `${rows.length} linhas carregadas.` });
    } catch {
      toast.add({ type: "error", title: "Falha ao importar", description: "Verifique se o arquivo é um .xlsx válido." });
    } finally {
      setImporting(false);
    }
  }

  const linkedAtividades = atividades.filter((a) => planilha.atividadeIds.includes(a.id));

  function atividadeLabel(a: (typeof atividades)[number]) {
    const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
    return [empresa?.name, a.assunto].filter(Boolean).join(" · ") || "Atividade sem empresa/assunto";
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Excluir planilha
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Nome da planilha</Label>
        <Input
          value={planilha.nome}
          onChange={(e) => patch({ nome: e.target.value })}
          placeholder="Ex: Comissões — Julho 2026"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ManagedSelect
          label="Empresa"
          items={lookups.empresa}
          value={planilha.empresaId}
          onChange={(id) =>
            patch(
              id === planilha.empresaId
                ? { empresaId: id }
                : { empresaId: id, unidadeId: null }
            )
          }
          onCreate={(name) => addLookupItem("empresa", name)}
          onRename={(id, name) => renameLookupItem("empresa", id, name)}
          onDeactivate={(id) => deactivateLookupItem("empresa", id)}
        />
        <ManagedSelect
          label="Unidade"
          items={lookups.unidade.filter(
            (u) => !u.empresaId || u.empresaId === planilha.empresaId
          )}
          value={planilha.unidadeId}
          onChange={(id) => patch({ unidadeId: id })}
          onCreate={(name) => addLookupItem("unidade", name, planilha.empresaId)}
          onRename={(id, name) => renameLookupItem("unidade", id, name)}
          onDeactivate={(id) => deactivateLookupItem("unidade", id)}
        />
        <div className="flex flex-col gap-1.5">
          <Label>Assunto</Label>
          <Input
            list="assunto-sugestoes-planilha"
            value={planilha.assunto}
            onChange={(e) => patch({ assunto: e.target.value })}
            placeholder="Descreva o assunto em poucas palavras"
          />
          <datalist id="assunto-sugestoes-planilha">
            {assuntoSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <ManagedMultiSelect
        label="Tipo / categoria"
        items={lookups.categoriaPlanilha}
        value={planilha.categoriaIds}
        onChange={(ids) => patch({ categoriaIds: ids })}
        onCreate={(name) => addLookupItem("categoriaPlanilha", name)}
        onRename={(id, name) => renameLookupItem("categoriaPlanilha", id, name)}
        onDeactivate={(id) => deactivateLookupItem("categoriaPlanilha", id)}
      />

      <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
        <Label className="flex items-center gap-1.5">
          <Link2 className="size-3.5" />
          Atividade vinculada (anexo)
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-full sm:flex-1">
            <FilterMultiSelect
              placeholder="Nenhuma atividade vinculada"
              options={atividades.map((a) => ({ value: a.id, label: atividadeLabel(a) }))}
              value={planilha.atividadeIds}
              onChange={(ids) => patch({ atividadeIds: ids })}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-1.5"
            onClick={() => setActivityFormOpen(true)}
          >
            <Plus className="size-4" />
            Nova atividade
          </Button>
        </div>
        {linkedAtividades.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Vinculado a {linkedAtividades.length === 1 ? "1 atividade" : `${linkedAtividades.length} atividades`}
            {linkedAtividades.length === 1 ? ` (status "${linkedAtividades[0].status}")` : ""}.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Planilha</Label>
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              {importing ? "Importando..." : "Importar XLSX"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={handleExportXlsx}
            >
              <Download className="size-3.5" />
              Exportar XLSX
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  <Minimize2 className="size-3.5" />
                  Reduzir
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5" />
                  Expandir
                </>
              )}
            </Button>
          </div>
        </div>
        <UniverSheet
          ref={sheetRef}
          workbookId={planilha.id}
          workbookName={planilha.nome || "Planilha"}
          initialData={planilha.conteudo}
          onChange={(conteudo) => patch({ conteudo })}
          className={expanded ? "h-[85vh]" : "h-[520px]"}
        />
      </div>

      <ActivityForm
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        editing={null}
        onCreated={(id) => patch({ atividadeIds: [...planilha.atividadeIds, id] })}
      />
    </div>
  );
}
