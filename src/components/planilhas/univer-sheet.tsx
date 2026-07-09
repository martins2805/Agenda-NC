"use client";

import { useEffect, useRef } from "react";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCorePtBR from "@univerjs/preset-sheets-core/locales/pt-BR";
import "@univerjs/preset-sheets-core/lib/index.css";

interface UniverSheetProps {
  workbookId: string;
  workbookName: string;
}

export function UniverSheet({ workbookId, workbookName }: UniverSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

    univerAPI.createWorkbook({ id: workbookId, name: workbookName });

    return () => {
      univer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workbookId]);

  return <div ref={containerRef} className="h-[520px] w-full overflow-hidden rounded-lg border" />;
}
