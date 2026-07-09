import type { LookupItem } from "./types";

let seedCounter = 0;
function seedId(prefix: string) {
  seedCounter += 1;
  return `${prefix}-${seedCounter}`;
}

function toItems(prefix: string, names: string[]): LookupItem[] {
  return names.map((name) => ({ id: seedId(prefix), name, active: true }));
}

export const SEED_TIPOS_ATIVIDADE = toItems("tipo", [
  "Proposta",
  "Faturamento",
  "Suporte",
  "Interno",
  "Aceite",
  "Levantamento",
  "Email",
  "Agendamento",
  "Oportunidade",
]);

export const SEED_SERVICOS_PRODUTO = toItems(
  "servico",
  [
    "ACL",
    "AJT",
    "Acompanhamento NT",
    "Aplicabilidade NT",
    "Atualização Indicadores de Riscos",
    "Auditoria Interna",
    "CAL",
    "CAL Internacional",
    "Cópia CAL",
    "Correlação AIPR",
    "ESG",
    "Escopo",
    "Guardião",
    "Input Onegreen",
    "Implantação Onegreen",
    "Ius Resíduos Implantação",
    "Ius Resíduos Licenciamento",
    "LV NT",
    "Levantamento Indicadores de Riscos",
    "Módulo AIPR",
    "Módulo Auditoria",
    "Módulo Docs",
    "Módulo Indicadores",
    "Módulo NC",
    "NR 1",
    "Onegreen",
    "Parecer",
    "Portal Ius",
    "Prospecção Internacional",
    "Qualificação Fornecedores",
    "Treinamento",
    "Unidade Territorial",
    "VCL",
    "VCL NT",
    "Weex",
  ].sort((a, b) => a.localeCompare(b, "pt-BR"))
);

export const SEED_ESCOPOS = toItems(
  "escopo",
  [
    "Energia",
    "Meio Ambiente",
    "Qualidade",
    "Responsabilidade Social",
    "Saúde e Segurança Ocupacional",
    "Segurança de Alimentos",
  ].sort((a, b) => a.localeCompare(b, "pt-BR"))
);

export const SEED_AMOSTRAGENS = toItems(
  "amostragem",
  ["Amostral", "Amostral X Integral", "Integral"].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  )
);

export const SEED_EMPRESAS = toItems("empresa", [
  "Ius Natura",
  "Grupo Arcelor",
  "Weex Indústria",
]);

export const SEED_UNIDADES = toItems("unidade", [
  "Matriz",
  "Unidade São Paulo",
  "Unidade Minas Gerais",
]);

export const SEED_ASSUNTOS = toItems("assunto", [
  "Renovação de contrato",
  "Levantamento de indicadores",
  "Alinhamento de escopo",
]);
