"use client";

import { useAppData } from "@/lib/app-data-context";
import { resolveWidgetPreferencias, WIDGET_DEFINITIONS } from "@/lib/dashboard-widgets";
import type { ActivityFilters } from "@/lib/activity-filters";
import type { Atividade, AtividadeGeral, Planilha, Registro } from "@/lib/types";
import { ResumoGeralWidget } from "@/components/dashboard/widgets/resumo-geral-widget";
import { StatusWidget } from "@/components/dashboard/widgets/status-widget";
import { PrioridadeWidget } from "@/components/dashboard/widgets/prioridade-widget";

interface DashboardWidgetsProps {
  filters: ActivityFilters;
  atividades: Atividade[];
  atividadesGerais: AtividadeGeral[];
  registros: Registro[];
  planilhas: Planilha[];
}

// Motor de widgets do Dashboard (S8): renderiza os widgets visíveis, na ordem
// e no tamanho persistidos em WidgetPreferencia — incluir/ocultar/reordenar/
// redimensionar não exige alterar este componente (Cap. 4, "Comportamento
// esperado"). Reordenar/ocultar/redimensionar acontece no painel de
// configuração (dashboard-widget-config.tsx), não aqui.
export function DashboardWidgets({ filters, atividades, atividadesGerais, registros, planilhas }: DashboardWidgetsProps) {
  const { widgetPreferencias } = useAppData();
  const resolved = resolveWidgetPreferencias(widgetPreferencias).filter((p) => p.visivel);

  if (resolved.length === 0) {
    return (
      <p className="panel-card p-4 text-sm text-muted-foreground">
        Nenhum widget visível — abra as configurações do dashboard para reativar algum.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      {resolved.map((pref) => {
        const def = WIDGET_DEFINITIONS.find((d) => d.id === pref.widgetId);
        if (!def) return null;
        return (
          <section
            key={pref.widgetId}
            className={`flex flex-col gap-3 ${pref.tamanho === "largo" ? "lg:col-span-2" : ""}`}
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{def.titulo}</h3>
            {def.id === "resumo-geral" && (
              <ResumoGeralWidget
                filters={filters}
                atividades={atividades}
                atividadesGerais={atividadesGerais}
                registros={registros}
                planilhas={planilhas}
              />
            )}
            {def.id === "status" && <StatusWidget filters={filters} atividades={atividades} />}
            {def.id === "prioridade" && <PrioridadeWidget filters={filters} atividades={atividades} />}
          </section>
        );
      })}
    </div>
  );
}
