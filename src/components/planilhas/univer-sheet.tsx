"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCorePtBR from "@univerjs/preset-sheets-core/locales/pt-BR";
import "@univerjs/preset-sheets-core/lib/index.css";
import { cn } from "@/lib/utils";

interface UniverSheetProps {
  workbookId: string;
  workbookName: string;
  initialData?: Record<string, unknown> | null;
  onChange?: (snapshot: Record<string, unknown>) => void;
  className?: string;
}

// Univer's own CellValue não aceita null (só string|number|boolean) — aqui
// permitimos null para representar célula vazia; convertido para "" na
// escrita (ver importGrid).
export type SheetCellValue = string | number | boolean | null;

// Handle imperativo para import/export XLSX (S12) — mantém a API do Univer
// encapsulada aqui; quem importa/exporta (planilha-editor.tsx) só troca
// grades simples (linhas x colunas), sem conhecer o formato interno do
// Univer (snapshot de workbook).
export interface UniverSheetHandle {
  exportGrid: () => SheetCellValue[][];
  importGrid: (rows: SheetCellValue[][]) => void;
}

export const UniverSheet = forwardRef<UniverSheetHandle, UniverSheetProps>(function UniverSheet(
  { workbookId, workbookName, initialData, onChange, className },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const apiRef = useRef<ReturnType<typeof createUniver>["univerAPI"] | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useImperativeHandle(
    ref,
    () => ({
      exportGrid() {
        const api = apiRef.current;
        const sheet = api?.getActiveWorkbook()?.getActiveSheet();
        if (!sheet) return [];
        const range = sheet.getDataRange();
        return (range.getValues() as SheetCellValue[][]) ?? [];
      },
      importGrid(rows: SheetCellValue[][]) {
        const api = apiRef.current;
        const sheet = api?.getActiveWorkbook()?.getActiveSheet();
        if (!sheet || rows.length === 0) return;
        const numCols = Math.max(1, ...rows.map((r) => r.length));
        // Univer não aceita null em CellValue — célula vazia vira "".
        const normalized = rows.map((r) => {
          const row: (string | number | boolean)[] = [];
          for (let i = 0; i < numCols; i++) row.push(r[i] ?? "");
          return row;
        });
        sheet.getRange(0, 0, normalized.length, numCols).setValues(normalized);
      },
    }),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { univer, univerAPI } = createUniver({
      locale: LocaleType.PT_BR,
      locales: {
        [LocaleType.PT_BR]: mergeLocales(UniverPresetSheetsCorePtBR),
      },
      presets: [
        UniverSheetsCorePreset({
          container,
        }),
      ],
    });
    apiRef.current = univerAPI;

    univerAPI.createWorkbook(
      (initialData as never) ?? { id: workbookId, name: workbookName }
    );

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const disposable = univerAPI.onCommandExecuted(() => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const workbook = univerAPI.getActiveWorkbook();
        if (workbook)
          onChangeRef.current?.(workbook.save() as unknown as Record<string, unknown>);
      }, 800);
    });

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
      disposable.dispose();
      univer.dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workbookId]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden rounded-lg border", className ?? "h-[520px]")}
    />
  );
});
