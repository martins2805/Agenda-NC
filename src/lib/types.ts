export type LookupKind =
  | "empresa"
  | "unidade"
  | "tipoAtividade"
  | "servicoProduto"
  | "escopo"
  | "amostragem"
  | "categoriaRegistro"
  | "categoriaPlanilha"
  | "tipoAtividadeGeral"
  | "setorInterno";

// Nome de um token de cor da paleta base (--base-1..4), nunca um hex livre —
// mantém o catálogo dentro da Regra 02 (zero valor visual hardcoded).
export type LookupCor = "base-1" | "base-2" | "base-3" | "base-4";
export const LOOKUP_COR_OPTIONS: LookupCor[] = ["base-1", "base-2", "base-3", "base-4"];

export interface LookupItem {
  id: string;
  name: string;
  active: boolean;
  empresaId?: string | null; // usado apenas por itens do tipo "unidade"
  cor: LookupCor | null; // null = cor automática (hash determinístico, tileColorFor)
  ordem: number;
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

export type StatusNegociacao = "em_andamento" | "fup" | "aceite" | "na";

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
  prazo: string | null; // ISO date
  parentId?: string | null;
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

export type StatusGeral = "Concluído" | "Pendente" | "Em andamento";

export const STATUS_GERAL_OPTIONS: StatusGeral[] = ["Pendente", "Em andamento", "Concluído"];

export interface ChecklistGeralItem {
  id: string;
  parentId: string | null;
  texto: string;
  status: StatusGeral;
  prioridade: Prioridade;
  prazo: string | null;
  empresaId: string | null;
  unidadeId: string | null;
}

export interface Proposta {
  id: string;
  numero: number;
  servicoProdutoIds: string[];
  escopoIds: string[];
  amostragemIds: string[];
  quantidade: number | null;
  valorUnitario: number | null;
  valorTotal: number | null;
  tipo?: string | null;
  detalhe: string;
  observacao: string;
  prazoInicio: string | null;
  prazoFim: string | null;
  statusNegociacao: StatusNegociacao | null;
}

export interface Link {
  id: string;
  titulo: string;
  url: string;
}

export interface Anexo {
  id: string;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
  createdAt: string; // ISO datetime
}

export interface HistoricoEntry {
  id: string;
  campo: "status" | "prazo" | "prioridade";
  valorAnterior: string | null;
  valorNovo: string | null;
  createdAt: string; // ISO datetime
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
  prazo: string | null; // ISO date (prazo inicial para Agendamento)
  prazoFim: string | null; // prazo final, usado quando o tipo é "Agendamento"
  descricao: string;
  alinhamentos: string;
  status: StatusConclusao;
  prioridade: Prioridade;
  checklist: ChecklistItem[];
  links: Link[];
  anexos: Anexo[];
  createdAt: string; // ISO datetime
  deletedAt?: string | null;
  concluidoEm: string | null; // ISO datetime, setado pelo servidor (D13)
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
  atividadeIds: string[];
  atividadeGeralIds: string[];
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
  atividadeIds: string[];
  atividadeGeralIds: string[];
  conteudo: Record<string, unknown> | null;
  createdAt: string; // ISO datetime
  deletedAt?: string | null;
}

export interface AtividadeGeral {
  id: string;
  empresaId: string | null;
  unidadeId: string | null;
  tipoIds: string[];
  assunto: string;
  vinculos: string;
  prazo: string | null;
  descricao: string;
  status: StatusGeral;
  prioridade: Prioridade;
  setorIds: string[];
  checklist: ChecklistGeralItem[];
  atividadeIds: string[];
  createdAt: string;
}
