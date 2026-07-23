"use client";

import { useState } from "react";
import {
  CalendarDays,
  FileText,
  Inbox,
  Link2,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// Página de referência viva do design system (S2). Não é uma tela do
// produto — é o teste de regressão visual das sprints seguintes: se algo
// aqui mudar sem intenção, uma tela em algum lugar também mudou.

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="size-8 shrink-0 rounded-lg border border-border"
        style={{ background: `var(${varName})` }}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-medium">{name}</span>
        <span className="ledger-label">{varName}</span>
      </div>
    </div>
  );
}

const LONG_TEXT =
  "Texto de teste com mais de quinhentos caracteres para confirmar que nenhum campo do sistema oculta conteúdo por transbordo — regra obrigatória do Cap. 3 e do preâmbulo LAYOUT do PROMPT 1. ".repeat(3);

const MULTISELECT_OPTIONS = [
  { value: "1", label: "Ius Natura" },
  { value: "2", label: "Grupo Weex" },
  { value: "3", label: "Onegreen Ambiental" },
  { value: "4", label: "Comercial Del Rio" },
];

export default function DesignSystemPage() {
  const [longValue, setLongValue] = useState(LONG_TEXT);
  const [multiValue, setMultiValue] = useState<string[]>(["1"]);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="ledger-label">Design system</p>
        <h1 className="font-display text-3xl italic tracking-tight">Agenda NC</h1>
        <p className="text-sm text-muted-foreground">
          Tokens, componentes e os 8 estados obrigatórios (Cap. 3). Referência viva — nenhuma
          tela do produto deve divergir do que está aqui.
        </p>
      </header>

      <Section title="Tipografia" description="Hierarquia por tamanho, peso e espaçamento — nunca só por cor.">
        <div className="panel-card flex flex-col gap-3 p-5">
          <p className="font-display text-2xl italic tracking-tight">Título principal</p>
          <p className="text-lg font-semibold">Título secundário</p>
          <p className="text-base font-medium">Subtítulo</p>
          <p className="text-sm">Texto — corpo padrão de leitura.</p>
          <p className="ledger-label">Informações auxiliares</p>
        </div>
      </Section>

      <Section title="Paleta base">
        <div className="panel-card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <Swatch name="Azul petróleo" varName="--base-1" />
          <Swatch name="Azul acinzentado" varName="--base-2" />
          <Swatch name="Azul esverdeado" varName="--base-3" />
          <Swatch name="Cinza claro" varName="--base-4" />
        </div>
      </Section>

      <Section
        title="Cores semânticas"
        description="Só carregam significado — nunca usadas como decoração. Fixas entre sprints e entre temas."
      >
        <div className="panel-card grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
          <Swatch name="Status: concluído" varName="--status-concluido" />
          <Swatch name="Status: pendente" varName="--status-pendente" />
          <Swatch name="Status: em andamento" varName="--status-em-andamento" />
          <Swatch name="Prioridade: urgente" varName="--prioridade-urgente" />
          <Swatch name="Prioridade: importante" varName="--prioridade-importante" />
          <Swatch name="Prioridade: médio" varName="--prioridade-medio" />
          <Swatch name="Prazo: vencido" varName="--prazo-vencido" />
          <Swatch name="Prazo: próximo" varName="--prazo-proximo" />
          <Swatch name="Prazo: em dia" varName="--prazo-em-dia" />
        </div>
      </Section>

      <Section
        title="Botões"
        description="Um único padrão: arredondados, foscos, minimalistas, espessura uniforme."
      >
        <div className="panel-card flex flex-wrap gap-3 p-5">
          <Button>Padrão</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Desabilitado</Button>
          <Button>
            <Loader2 className="size-4 animate-spin" />
            Carregando
          </Button>
        </div>
      </Section>

      <Section
        title="Estados obrigatórios"
        description="Normal, hover, selecionado, focado, desabilitado, erro, sucesso, carregando — os 8 do Cap. 3."
      >
        <div className="panel-card grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <Button variant="outline">Normal</Button>
          <Button variant="outline" className="bg-muted text-foreground">
            Hover (simulado)
          </Button>
          <Button variant="outline" aria-expanded="true">
            Selecionado
          </Button>
          <Button variant="outline" className="border-ring ring-3 ring-ring/50" autoFocus>
            Focado
          </Button>
          <Button variant="outline" disabled>
            Desabilitado
          </Button>
          <Button variant="outline" aria-invalid className="border-destructive ring-3 ring-destructive/20">
            Erro
          </Button>
          <Button variant="outline" className="border-[var(--status-concluido)] text-[var(--status-concluido)]">
            Sucesso
          </Button>
          <Button variant="outline" disabled>
            <Loader2 className="size-4 animate-spin" />
            Carregando
          </Button>
        </div>
      </Section>

      <Section title="Badges / etiquetas semânticas">
        <div className="panel-card flex flex-wrap gap-2 p-5">
          <Badge>Padrão</Badge>
          <Badge variant="secondary">Secundária</Badge>
          <Badge variant="outline">Contorno</Badge>
          <Badge variant="destructive">Destrutiva</Badge>
          <Badge className="text-white" style={{ background: "var(--status-concluido)" }}>Concluído</Badge>
          <Badge className="text-white" style={{ background: "var(--prioridade-urgente)" }}>Urgente</Badge>
          <Badge className="text-white" style={{ background: "var(--prazo-vencido)" }}>Vencido</Badge>
        </div>
      </Section>

      <Section
        title="Campos de texto"
        description="Todo campo cresce com o conteúdo — nenhum caractere fica oculto por transbordo."
      >
        <div className="panel-card flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <Label>Campo padrão</Label>
            <Input placeholder="Ex: Reunião de alinhamento" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Campo com erro</Label>
            <Input aria-invalid defaultValue="valor inválido" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Campo desabilitado</Label>
            <Input disabled defaultValue="Não editável" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Textarea auto-expansível — teste de 500+ caracteres</Label>
            <Textarea value={longValue} onChange={(e) => setLongValue(e.target.value)} />
            <p className="ledger-label">{longValue.length} caracteres, nada cortado</p>
          </div>
        </div>
      </Section>

      <Section title="Select e multi-select com typeahead">
        <div className="panel-card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Select simples</Label>
            <Select defaultValue="1">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MULTISELECT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Multi-select (filter-multi-select)</Label>
            <FilterMultiSelect
              placeholder="Selecionar empresas..."
              options={MULTISELECT_OPTIONS}
              value={multiValue}
              onChange={setMultiValue}
            />
          </div>
        </div>
      </Section>

      <Section title="Checkbox">
        <div className="panel-card flex flex-wrap items-center gap-6 p-5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked />
            Marcado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox />
            Desmarcado
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox disabled />
            Desabilitado
          </label>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card padrão</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cantos arredondados, sombra suave, fundo sólido — sem excesso de transparência.
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-[var(--prioridade-urgente)]">
            <CardHeader>
              <CardTitle>Card com indicador</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Borda colorida à esquerda para sinalizar prioridade/status.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Tabs">
        <div className="panel-card p-5">
          <Tabs defaultValue="geral">
            <TabsList>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="geral" className="pt-3 text-sm text-muted-foreground">
              Conteúdo da aba Geral.
            </TabsContent>
            <TabsContent value="vinculos" className="pt-3 text-sm text-muted-foreground">
              Conteúdo da aba Vínculos.
            </TabsContent>
            <TabsContent value="historico" className="pt-3 text-sm text-muted-foreground">
              Conteúdo da aba Histórico.
            </TabsContent>
          </Tabs>
        </div>
      </Section>

      <Section title="Drawer e Modal">
        <div className="panel-card flex flex-wrap gap-3 p-5">
          <Sheet>
            <SheetTrigger render={<Button variant="secondary" />}>Abrir drawer</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Drawer lateral</SheetTitle>
                <SheetDescription>Usado para edição sem sair da lista (ex.: Atividades).</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Abrir modal</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modal de confirmação</DialogTitle>
                <DialogDescription>Usado para ações que precisam de confirmação explícita.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="destructive">Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Section>

      <Section title="Tooltip">
        <div className="panel-card flex gap-3 p-5">
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon" />}>
              <Link2 className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Vincular a uma atividade</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      <Section title="Toast">
        <div className="panel-card flex flex-wrap gap-3 p-5">
          <Button
            variant="secondary"
            onClick={() =>
              toast.add({ type: "success", title: "Salvo", description: "Atividade atualizada." })
            }
          >
            Disparar sucesso
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.add({ type: "error", title: "Falha ao salvar" })}
          >
            Disparar erro
          </Button>
        </div>
      </Section>

      <Section title="Barra de progresso">
        <div className="panel-card flex flex-col gap-3 p-5">
          <Progress value={65} />
          <div className="stat-bar">
            <span style={{ width: "40%" }} />
          </div>
        </div>
      </Section>

      <Section title="Skeleton (carregando)">
        <div className="panel-card flex flex-col gap-3 p-5">
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setLoading((v) => !v)}>
            Alternar
          </Button>
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Conteúdo carregado.</p>
          )}
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Inbox}
          title="Nenhum registro encontrado"
          description="Ajuste os filtros ou crie o primeiro registro."
          action={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Criar registro
            </Button>
          }
        />
      </Section>

      <Section title="Paginação">
        <div className="panel-card p-5">
          <Pagination page={page} totalPages={8} onPageChange={setPage} />
        </div>
      </Section>

      <Section title="Calendário / seletor de data">
        <div className="panel-card w-fit p-3">
          <Calendar mode="single" className="p-0" />
        </div>
      </Section>

      <Section
        title="Sidebar e header"
        description="Definidos globalmente em app-shell.tsx — sólidos na cor da paleta base, iguais em todas as telas."
      >
        <div className="panel-card flex flex-col gap-3 p-5 sm:flex-row">
          <div className="flex w-full flex-col gap-2 rounded-2xl bg-[var(--sidebar-solid)] p-4 text-white sm:w-40">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold">
                NC
              </div>
              <span className="text-xs font-medium">Agenda NC</span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-white/70">
              <span className="rounded-lg bg-white/15 px-2 py-1 text-white">Dashboard</span>
              <span className="px-2 py-1">Atividades</span>
              <span className="px-2 py-1">Registros</span>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border p-4">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cabeçalho: saudação + busca global</span>
          </div>
        </div>
      </Section>

      <Section
        title="Prazo e prioridade (referência de cor fixa)"
        description="Regra 08 do PROMPT 1 — cor só representa significado, nunca decoração."
      >
        <div className="panel-card flex flex-wrap items-center gap-3 p-5">
          <Badge className="gap-1 text-white" style={{ background: "var(--prazo-vencido)" }}>
            <CalendarDays className="size-3" />
            Vencido
          </Badge>
          <Badge className="gap-1 text-white" style={{ background: "var(--prazo-proximo)" }}>
            <CalendarDays className="size-3" />
            Próximo
          </Badge>
          <Badge className="gap-1 text-white" style={{ background: "var(--prazo-em-dia)" }}>
            <CalendarDays className="size-3" />
            Em dia
          </Badge>
        </div>
      </Section>

      <Section
        title="Foco por teclado"
        description="Navegue com Tab a partir daqui — o anel de foco deve ser sempre visível."
      >
        <div className="panel-card flex flex-wrap gap-3 p-5">
          <Button variant="outline">Primeiro</Button>
          <Input className="w-40" placeholder="Segundo" />
          <Button variant="outline">Terceiro</Button>
        </div>
      </Section>

      <footer className={cn("flex items-center gap-2 pb-6 text-xs text-muted-foreground")}>
        <FileText className="size-3.5" />
        S2 — Design system. Página de teste de regressão para todas as sprints seguintes.
      </footer>
    </div>
  );
}
