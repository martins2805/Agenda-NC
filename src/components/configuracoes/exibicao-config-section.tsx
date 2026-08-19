"use client";

import { Eye, EyeOff, ChevronUp, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { cn } from "@/lib/utils";
import {
  resolverCampos,
  chaveExibicao,
  type ExibicaoModo,
  type CampoResolvido,
} from "@/lib/exibicao-config";
import { configPadrao, type ConfiguracaoVisual } from "@/lib/visual-config";

// PROMPT 3 (3.3 / 5.3): quais dados aparecem na atividade e em que ordem,
// configurado separadamente para Lista e Cards. Ocultar aqui NÃO remove o
// campo do cadastro — é só exibição.

const MODO_LABEL: Record<ExibicaoModo, string> = {
  lista: "Visualização em Lista",
  card: "Visualização em Cards",
};

function ModoBloco({ modo }: { modo: ExibicaoModo }) {
  const { configuracoesVisuais, updateConfiguracoesVisuais } = useAppData();
  const campos = resolverCampos(modo, configuracoesVisuais);

  // Grava a lista inteira deste modo de uma vez, com a ordem normalizada —
  // assim a ordem persistida nunca fica com buracos.
  function persist(proximos: CampoResolvido[]) {
    const porChave = new Map(configuracoesVisuais.map((c) => [c.chave, c]));
    const atualizados: ConfiguracaoVisual[] = proximos.map((campo, i) => {
      const chave = chaveExibicao(modo, campo.campo);
      const base = porChave.get(chave) ?? configPadrao(chave, i);
      return { ...base, visivel: campo.visivel, ordem: i };
    });
    const chavesTocadas = new Set(atualizados.map((c) => c.chave));
    updateConfiguracoesVisuais([
      ...configuracoesVisuais.filter((c) => !chavesTocadas.has(c.chave)),
      ...atualizados,
    ]);
  }

  function mover(index: number, delta: number) {
    const destino = index + delta;
    if (destino < 0 || destino >= campos.length) return;
    const proximos = [...campos];
    const [movido] = proximos.splice(index, 1);
    proximos.splice(destino, 0, movido);
    persist(proximos);
  }

  function alternar(index: number) {
    persist(campos.map((c, i) => (i === index ? { ...c, visivel: !c.visivel } : c)));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{MODO_LABEL[modo]}</span>
      <div className="flex flex-col gap-1">
        {campos.map((campo, i) => (
          <div
            key={campo.campo}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-1.5",
              !campo.visivel && "opacity-60"
            )}
          >
            <div className="flex shrink-0 flex-col">
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-5"
                title="Mover para cima"
                disabled={i === 0}
                onClick={() => mover(i, -1)}
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-5"
                title="Mover para baixo"
                disabled={i === campos.length - 1}
                onClick={() => mover(i, 1)}
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>
            <span className="flex-1 text-sm">{campo.rotulo}</span>
            {campo.fixo ? (
              <span
                className="flex size-7 items-center justify-center text-muted-foreground"
                title="Coluna estrutural: sem ela a linha perde a interação"
              >
                <Lock className="size-3.5" />
              </span>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                title={campo.visivel ? "Ocultar da visualização" : "Mostrar na visualização"}
                onClick={() => alternar(i)}
              >
                {campo.visivel ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExibicaoConfigSection() {
  return (
    <section className="panel-card flex flex-col gap-5 p-4">
      <div>
        <h2 className="font-display text-lg tracking-tight">Exibição das atividades</h2>
        <p className="text-sm text-muted-foreground">
          Quais informações aparecem e em que ordem, separadamente para Lista e para
          Cards. Ocultar um campo aqui não o remove do cadastro da atividade — ele
          continua sendo preenchido e salvo normalmente.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ModoBloco modo="lista" />
        <ModoBloco modo="card" />
      </div>
    </section>
  );
}
