export type LookupKind =
  | "empresa"
  | "unidade"
  | "assunto"
  | "tipoAtividade"
  | "servicoProduto"
  | "escopo"
  | "amostragem"
  | "categoriaRegistro"
  | "categoriaPlanilha"
  | "tipoAtividadeGeral"
  | "setorInterno";

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

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
  prazo: string | null; // ISO date
}

export interface ChecklistGeralItem {
  id: string;
  parentId: string | null;
  texto: string;
  status: "Concluído" | "Pendente" | "Em andamento";
  prioridade: Prioridade;
  prazo: string | null;
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
  prazoInicio: string | null;
  prazoFim: string | null;
}

export interface Atividade {
  id: string;
  empresaId: string | null;
  unidadeId: string | null;
  assuntoId: string | null;
  tipoAtividadeIds: string[];
  emailConteudo: string;
  oportunidadeTexto: string;
  propostas: Proposta[];
  contato: string;
  prazo: string | null; // ISO date
  descricao: string;
  alinhamentos: string;
  status: StatusConclusao;
  prioridade: Prioridade;
  checklist: ChecklistItem[];
  createdAt: string; // ISO datetime
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
  assuntoId: string | null;
  categoriaIds: string[];
  tabs: RegistroTab[];
  atividadeId: string | null;
  createdAt: string; // ISO datetime
}

export interface Planilha {
  id: string;
  nome: string;
  empresaId: string | null;
  unidadeId: string | null;
  assuntoId: string | null;
  categoriaIds: string[];
  atividadeId: string | null;
  conteudo: Record<string, unknown> | null;
  createdAt: string; // ISO datetime
}

export interface AtividadeGeral {
  id: string;
  tipoIds: string[];
  assunto: string;
  vinculos: string;
  prazo: string | null;
  descricao: string;
  status: StatusConclusao;
  prioridade: Prioridade;
  setorIds: string[];
  checklist: ChecklistGeralItem[];
  createdAt: string;
}
