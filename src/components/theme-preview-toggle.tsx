"use client";

import { useEffect, useState } from "react";
import { History, Sparkles } from "lucide-react";

const STORAGE_KEY = "agenda-nc-layout-preview";

/**
 * Botão temporário para comparar o novo tema (vidro fosco) com o layout
 * anterior enquanto o layout final não é definido. Remover junto com o
 * bloco `[data-theme="legacy"]` em globals.css quando a decisão for final.
 */
export function ThemePreviewToggle() {
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) === "legacy";
    setLegacy(stored);
    document.documentElement.setAttribute("data-theme", stored ? "legacy" : "new");
  }, []);

  function toggle() {
    const next = !legacy;
    setLegacy(next);
    document.documentElement.setAttribute("data-theme", next ? "legacy" : "new");
    window.localStorage.setItem(STORAGE_KEY, next ? "legacy" : "new");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="sticky top-0 z-30 mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-medium text-[var(--card-foreground)] shadow-sm transition-opacity hover:opacity-80"
    >
      {legacy ? <Sparkles className="size-3.5" /> : <History className="size-3.5" />}
      {legacy ? "Ver layout novo (vidro fosco)" : "Ver layout anterior"}
    </button>
  );
}
