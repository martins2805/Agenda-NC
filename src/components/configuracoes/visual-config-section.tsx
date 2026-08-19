"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { cn } from "@/lib/utils";
import {
  VISUAL_ELEMENTS,
  VISUAL_GROUP_LABELS,
  VISUAL_COR_OPTIONS,
  VISUAL_TAMANHOS,
  VISUAL_TAMANHO_LABELS,
  configPadrao,
  type ConfiguracaoVisual,
  type VisualCor,
  type VisualGroup,
  type VisualTamanho,
} from "@/lib/visual-config";

// PROMPT 3 (3.1): cor e tamanho dos elementos semânticos, configurados num
// lugar só. A aplicação em todas as telas é feita por VisualConfigStyle — esta
// tela só edita o dado.

function CorPicker({
  value,
  onChange,
}: {
  value: VisualCor | null;
  onChange: (cor: VisualCor | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        title="Cor padrão do sistema"
        onClick={() => onChange(null)}
        className={cn(
          "size-5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/40",
          value === null && "ring-2 ring-ring ring-offset-1"
        )}
      />
      {VISUAL_COR_OPTIONS.map((cor) => (
        <button
          key={cor}
          type="button"
          title={cor}
          onClick={() => onChange(cor)}
          style={{ background: `var(--${cor})` }}
          className={cn(
            "size-5 shrink-0 rounded-full border border-black/10",
            value === cor && "ring-2 ring-ring ring-offset-1"
          )}
        />
      ))}
    </div>
  );
}

export function VisualConfigSection() {
  const { configuracoesVisuais, updateConfiguracoesVisuais, restaurarConfiguracaoVisualPadrao } =
    useAppData();

  const porChave = new Map(configuracoesVisuais.map((c) => [c.chave, c]));
  const atual = (chave: string): ConfiguracaoVisual => porChave.get(chave) ?? configPadrao(chave);

  function patch(chave: string, p: Partial<ConfiguracaoVisual>) {
    const base = VISUAL_ELEMENTS.map((el) => atual(el.chave));
    updateConfiguracoesVisuais(
      base.map((c) => (c.chave === chave ? { ...c, ...p } : c))
    );
  }

  // O tamanho vale para todas as etiquetas de uma vez (é uma escala só), então
  // é editado uma vez e gravado na primeira chave do registro.
  const chaveTamanho = VISUAL_ELEMENTS[0]?.chave;
  const tamanhoAtual: VisualTamanho =
    (chaveTamanho && atual(chaveTamanho).tamanho) || "normal";

  const grupos = Array.from(new Set(VISUAL_ELEMENTS.map((e) => e.grupo))) as VisualGroup[];
  const personalizado = configuracoesVisuais.some((c) => c.cor || c.tamanho || !c.visivel);

  return (
    <section className="panel-card flex flex-col gap-5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg tracking-tight">Aparência dos campos</h2>
          <p className="text-sm text-muted-foreground">
            Cor e tamanho de status, prioridade, prazo e negociação. A alteração vale
            para todas as telas em que o elemento aparece — cards, lista, detalhe,
            dashboard e calendário.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={!personalizado}
          onClick={restaurarConfiguracaoVisualPadrao}
          title="Voltar todas as cores e tamanhos ao padrão do sistema"
        >
          <RotateCcw className="size-3.5" />
          Restaurar padrão
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Tamanho das etiquetas
        </span>
        <div className="flex flex-wrap gap-1">
          {VISUAL_TAMANHOS.map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={tamanhoAtual === t ? "default" : "ghost"}
              onClick={() => chaveTamanho && patch(chaveTamanho, { tamanho: t })}
            >
              {VISUAL_TAMANHO_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>

      {grupos.map((grupo) => (
        <div key={grupo} className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {VISUAL_GROUP_LABELS[grupo]}
          </span>
          <div className="flex flex-col gap-2">
            {VISUAL_ELEMENTS.filter((el) => el.grupo === grupo).map((el) => {
              const cfg = atual(el.chave);
              return (
                <div
                  key={el.chave}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide text-white uppercase"
                    style={{ background: `var(--${cfg.cor ?? el.token})` }}
                  >
                    {el.rotulo}
                  </span>
                  <CorPicker value={cfg.cor} onChange={(cor) => patch(el.chave, { cor })} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
