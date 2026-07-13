export type LookupKind =
  | "empresa"
  | "unidade"
  | "tipoAtividade"
  | "servicoProduto"
  | "escopo"
  | "amostragem"
  | "categoriaRegistro"
  | "categoriaPlanilha";

export interface LookupItem {
  id: string;
  name: string;
  active: boolean;
  empresaId?: string | null; // usado apenas por itens do tipo "unidade"
}

export type StatusConclusao =
  | "Concluído"
  | "Pendente"
  | "Aguardando retorno interno"
  | "Aguardando retorno cliente";

export const STATUS_OPTIONS: StatusConclusao[] = [
  "Pendente",
  "Aguardando retorno interno",
  "Aguardando retorno cliente",
  "Concluído",
];

export type Prioridade = "Urgente" | "Importante" | "Médio" | "Baixo";

export const PRIORIDADE_OPTIONS: Prioridade[] = [
  "Urgente",
  "Importante",
  "Médio",
  "Baixo",
];

export type TipoProposta = "MRR" | "PS";

export const TIPO_PROPOSTA_OPTIONS: TipoProposta[] = ["MRR", "PS"];

export type StatusNegociacao = "em_andamento" | "fup" | "aceite" | "na";

export const STATUS_NEGOCIACAO_OPTIONS: StatusNegociacao[] = [
  "em_andamento",
  "fup",
  "aceite",
  "na",
];

export const STATUS_NEGOCIACAO_LABELS: Record<StatusNegociacao, string> = {
  em_andamento: "Em andamento",
  fup: "FUP",
  aceite: "Aceite",
  na: "N/A",
};

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
  prazo: string | null; // "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm"
  parentId: string | null;
}

export interface ChecklistTemplateItem {
  id: string;
  texto: string;
  parentId: string | null;
}

export interface ChecklistTemplate {
  id: string;
  nome: string;
  itens: ChecklistTemplateItem[];
}

export interface Proposta {
  id: string;
  numero: number;
  tipo: TipoProposta | null;
  servicoProdutoIds: string[];
  detalhe: string;
  escopoIds: string[];
  amostragemIds: string[];
  quantidade: number | null;
  valorUnitario: number | null;
  valorTotal: number | null;
  observacao: string;
  prazoInicio: string | null;
  prazoFim: string | null;
  statusNegociacao: StatusNegociacao | null;
}

export interface Atividade {
  id: string;
  empresaId: string | null;
  unidadeId: string | null;
  assunto: string;
  tipoAtividadeIds: string[];
  emailConteudo: string;
  oportunidadeTexto: string;
  propostas: Proposta[];
  contato: string;
  prazo: string | null; // "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm"
  descricao: string;
  alinhamentos: string;
  status: StatusConclusao;
  prioridade: Prioridade;
  checklist: ChecklistItem[];
  createdAt: string; // ISO datetime
  deletedAt?: string | null; // ISO datetime, presente apenas na lixeira
}

export interface RegistroTab {
  id: string;
  titulo: string;
  conteudo: string; // TipTap HTML
}

export interface Registro {
  id: string;
  nome: string;
  empresaId: string | null;
  unidadeId: string | null;
  contato: string;
  assunto: string;
  categoriaIds: string[];
  tabs: RegistroTab[];
  atividadeId: string | null;
  createdAt: string; // ISO datetime
  deletedAt?: string | null;
}

export interface Planilha {
  id: string;
  nome: string;
  empresaId: string | null;
  unidadeId: string | null;
  assunto: string;
  categoriaIds: string[];
  atividadeId: string | null;
  conteudo: Record<string, unknown> | null;
  createdAt: string; // ISO datetime
  deletedAt?: string | null;
}
