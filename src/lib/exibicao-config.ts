// PROMPT 3 (3.3 e 5.3): quais dados aparecem na atividade e em que ordem,
// configurado separadamente para a visualização em Lista e em Cards.
//
// Ponto importante do prompt: ocultar um campo da visualização NÃO o remove do
// cadastro. Este arquivo descreve só a exibição — nada aqui toca no que é
// gravado na atividade.

export type ExibicaoModo = "lista" | "card";

export interface CampoExibicao {
  /** Chave estável usada no banco. Nunca traduzir nem renomear. */
  campo: string;
  rotulo: string;
  /** Campos estruturais da lista (marcador de conclusão, ações) não se ocultam:
   *  sem eles a linha perde a interação, não só a informação. */
  fixo?: boolean;
}

// Ordem inicial = a ordem que a tela já tinha antes de virar configurável.
export const CAMPOS_LISTA: CampoExibicao[] = [
  { campo: "concluir", rotulo: "Concluir", fixo: true },
  { campo: "empresa", rotulo: "Empresa" },
  { campo: "unidade", rotulo: "Unidade" },
  { campo: "tipo", rotulo: "Tipo" },
  { campo: "assunto", rotulo: "Assunto" },
  { campo: "prazo", rotulo: "Prazo" },
  { campo: "status", rotulo: "Status" },
  { campo: "prioridade", rotulo: "Prioridade" },
  { campo: "checklist", rotulo: "Checklist" },
  { campo: "acoes", rotulo: "Ações", fixo: true },
];

export const CAMPOS_CARD: CampoExibicao[] = [
  { campo: "empresa", rotulo: "Empresa e unidade" },
  { campo: "tipo", rotulo: "Tipo de atividade" },
  { campo: "assunto", rotulo: "Assunto" },
  { campo: "descricao", rotulo: "Descrição" },
  { campo: "status", rotulo: "Status" },
  { campo: "prioridade", rotulo: "Prioridade" },
  { campo: "prazo", rotulo: "Prazo" },
  { campo: "contato", rotulo: "Contato" },
  { campo: "checklist", rotulo: "Checklist" },
  { campo: "propostas", rotulo: "Propostas" },
];

export function camposDe(modo: ExibicaoModo): CampoExibicao[] {
  return modo === "lista" ? CAMPOS_LISTA : CAMPOS_CARD;
}

/** Chave usada em ConfiguracaoVisual. Namespaced para não colidir com as cores. */
export function chaveExibicao(modo: ExibicaoModo, campo: string): string {
  return `${modo}:${campo}`;
}

export interface CampoResolvido extends CampoExibicao {
  visivel: boolean;
  ordem: number;
}

/**
 * Resolve a configuração contra os padrões. Campo sem linha no banco continua
 * visível, na posição do registro — nenhum campo "some" por falta de registro.
 */
export function resolverCampos(
  modo: ExibicaoModo,
  configs: { chave: string; visivel: boolean; ordem: number }[]
): CampoResolvido[] {
  const porChave = new Map(configs.map((c) => [c.chave, c]));
  return camposDe(modo)
    .map((campo, index) => {
      const cfg = porChave.get(chaveExibicao(modo, campo.campo));
      return {
        ...campo,
        // Campo fixo ignora a visibilidade salva: a linha precisa dele.
        visivel: campo.fixo ? true : (cfg?.visivel ?? true),
        ordem: cfg?.ordem ?? index,
      };
    })
    .sort((a, b) => a.ordem - b.ordem);
}

export function camposVisiveis(
  modo: ExibicaoModo,
  configs: { chave: string; visivel: boolean; ordem: number }[]
): CampoResolvido[] {
  return resolverCampos(modo, configs).filter((c) => c.visivel);
}
