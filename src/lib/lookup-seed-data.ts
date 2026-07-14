import type { LookupKind } from "@/lib/types";

function entries(kind: LookupKind, names: string[]) {
  return names.map((name) => ({ kind, name }));
}

export const LOOKUP_SEED_DATA: { kind: LookupKind; name: string }[] = [
  ...entries("tipoAtividade", [
    "Proposta",
    "Faturamento",
    "Suporte",
    "Interno",
    "Aceite",
    "Levantamento",
    "Email",
    "Agendamento",
    "Oportunidade",
  ]),
  ...entries(
    "servicoProduto",
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
  ),
  ...entries(
    "escopo",
    [
      "Energia",
      "Meio Ambiente",
      "Qualidade",
      "Responsabilidade Social",
      "Saúde e Segurança Ocupacional",
      "Segurança de Alimentos",
    ].sort((a, b) => a.localeCompare(b, "pt-BR"))
  ),
  ...entries(
    "amostragem",
    ["Amostral", "Amostral X Integral", "Integral"].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    )
  ),
  ...entries("categoriaRegistro", [
    "Reunião",
    "Processos Internos",
    "Propostas",
    "Treinamentos",
    "Procedimentos",
    "Dados",
    "Produtos/Serviços",
    "Alinhamentos",
  ]),
  ...entries("categoriaPlanilha", [
    "Vendas",
    "Comissão",
    "Faturamento",
    "Processos Internos",
    "Propostas",
    "Dimensionamentos",
    "Dados",
    "Produtos/Serviços",
    "Consultoria",
  ]),
  ...entries("tipoAtividadeGeral", ["Geral", "Interna", "Administrativa"]),
  ...entries("setorInterno", ["Comercial", "Operacional", "Financeiro", "Administrativo"]),
];
