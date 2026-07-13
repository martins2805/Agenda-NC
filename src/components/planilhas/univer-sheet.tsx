"use client";

import { useEffect, useRef } from "react";
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

export function UniverSheet({
  workbookId,
  workbookName,
  initialData,
  onChange,
  className,
}: UniverSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workbookId]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden rounded-lg border", className ?? "h-[520px]")}
    />
  );
}
