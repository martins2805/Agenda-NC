"use client";

import type { ActivityFilters } from "@/lib/activity-filters";
import type { Atividade } from "@/lib/types";
import { ResumoGeralWidget } from "@/components/dashboard/widgets/resumo-geral-widget";
import { StatusWidget } from "@/components/dashboard/widgets/status-widget";
import { PrioridadeWidget } from "@/components/dashboard/widgets/prioridade-widget";
import {
  PropostasWidget,
  EmpresasWidget,
  VisaoGeralWidget,
} from "@/components/atividades/dashboard-analytics";

// Mapa widgetId -> componente. Antes isto era um encadeamento de `if` dentro do
// motor, o que obrigava a editar o motor a cada widget novo — o oposto do que o
// próprio comentário do motor prometia. Fica separado de src/lib/dashboard-
// widgets.ts porque aquele arquivo é importado pela rota de API (servidor).

export interface WidgetProps {
  filters: ActivityFilters;
  atividades: Atividade[];
}

export const WIDGET_COMPONENTS: Record<string, React.ComponentType<WidgetProps>> = {
  "resumo-geral": ResumoGeralWidget,
  status: StatusWidget,
  prioridade: PrioridadeWidget,
  propostas: PropostasWidget,
  empresas: EmpresasWidget,
  "visao-geral": VisaoGeralWidget,
};
