"use client";

import { useEffect, useState } from "react";
import type { ViewMode } from "@/components/view-toggle";

// Memória automática do último modo usado (cards/lista), por tela — Cap. 5.
export function useViewMode(storageKey: string): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>("cards");

  useEffect(() => {
    function hydrateView() {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "cards" || stored === "lista") setView(stored);
    }
    hydrateView();
  }, [storageKey]);

  function update(v: ViewMode) {
    setView(v);
    window.localStorage.setItem(storageKey, v);
  }

  return [view, update];
}
