"use client";

import { useAppData } from "@/lib/app-data-context";
import { visualConfigToCss } from "@/lib/visual-config";

// PROMPT 3 (3.2 e item 6): a configuração é aplicada num lugar só. Como toda
// tela já lê estas cores por `var(--token)`, redefinir os tokens no :root faz
// cards, lista, detalhe, dashboard e calendário mudarem juntos — sem nenhuma
// tela ganhar configuração própria (que é o que o item 3.2 proíbe).
//
// Sem configuração salva, `visualConfigToCss` devolve string vazia e nada é
// emitido: o globals.css continua valendo integralmente.
export function VisualConfigStyle() {
  const { configuracoesVisuais } = useAppData();
  const css = visualConfigToCss(configuracoesVisuais);
  if (!css) return null;
  return <style data-visual-config>{css}</style>;
}
