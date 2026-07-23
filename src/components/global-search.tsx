"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, FileText, ListChecks, Search, Table2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";

// Busca global de verdade (S13): um único campo cobre os 4 objetos do
// sistema (Atividades, Execuções, Registros, Planilhas), não só o módulo
// atual. Todos os dados já estão carregados no AppDataProvider — nenhuma
// chamada de rede extra, só filtragem local, igual ao resto do motor de
// filtros do sistema.

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

interface ResultItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

const MAX_PER_GROUP = 6;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { atividades, atividadesGerais, registros, planilhas, lookups } = useAppData();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const empresaName = (id: string | null) => lookups.empresa.find((e) => e.id === id)?.name ?? "";
    if (!q) return null;

    const atividadeResults: ResultItem[] = atividades
      .filter((a) =>
        [a.assunto, a.contato, stripHtml(a.descricao), a.emailConteudo, a.oportunidadeTexto, empresaName(a.empresaId)]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((a) => ({
        id: a.id,
        label: a.assunto || "Atividade sem assunto",
        sublabel: empresaName(a.empresaId) || "Sem empresa",
        href: `/atividades?open=${a.id}`,
      }));

    const execucaoResults: ResultItem[] = atividadesGerais
      .filter((a) =>
        [a.assunto, stripHtml(a.descricao), empresaName(a.empresaId)].join(" ").toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((a) => ({
        id: a.id,
        label: a.assunto || "Execução sem assunto",
        sublabel: empresaName(a.empresaId) || "Sem empresa",
        href: `/atividades-gerais?open=${a.id}`,
      }));

    const registroResults: ResultItem[] = registros
      .filter((r) => !r.deletedAt)
      .filter((r) =>
        [r.nome, r.assunto, r.contato, empresaName(r.empresaId), ...r.tabs.map((t) => stripHtml(t.conteudo))]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((r) => ({
        id: r.id,
        label: r.nome || r.tabs[0]?.titulo || "Registro sem nome",
        sublabel: empresaName(r.empresaId) || "Sem empresa",
        href: `/registros?open=${r.id}`,
      }));

    const planilhaResults: ResultItem[] = planilhas
      .filter((p) => !p.deletedAt)
      .filter((p) => [p.nome, p.assunto, empresaName(p.empresaId)].join(" ").toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map((p) => ({
        id: p.id,
        label: p.nome || "Planilha sem nome",
        sublabel: empresaName(p.empresaId) || "Sem empresa",
        href: `/planilhas?open=${p.id}`,
      }));

    return { atividadeResults, execucaoResults, registroResults, planilhaResults };
  }, [query, atividades, atividadesGerais, registros, planilhas, lookups]);

  function select(item: ResultItem) {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  const totalResults = groups
    ? groups.atividadeResults.length +
      groups.execucaoResults.length +
      groups.registroResults.length +
      groups.planilhaResults.length
    : 0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-8 w-full max-w-xs justify-start gap-2 text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left text-xs">Pesquisar em tudo...</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          Ctrl K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Pesquisa global"
        description="Busca em Atividades, Execuções, Registros e Planilhas"
      >
        <CommandInput
          placeholder="Buscar em atividades, execuções, registros e planilhas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() === "" ? (
            <CommandEmpty>Digite para buscar em todo o sistema.</CommandEmpty>
          ) : totalResults === 0 ? (
            <CommandEmpty>Nenhum resultado para &ldquo;{query}&rdquo;.</CommandEmpty>
          ) : (
            <>
              {groups && groups.atividadeResults.length > 0 && (
                <CommandGroup heading="Atividades">
                  {groups.atividadeResults.map((item) => (
                    <CommandItem key={item.id} value={`atividade-${item.id}`} onSelect={() => select(item)}>
                      <ListChecks className="size-3.5" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">{item.sublabel}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {groups && groups.execucaoResults.length > 0 && (
                <CommandGroup heading="Execuções">
                  {groups.execucaoResults.map((item) => (
                    <CommandItem key={item.id} value={`execucao-${item.id}`} onSelect={() => select(item)}>
                      <ClipboardCheck className="size-3.5" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">{item.sublabel}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {groups && groups.registroResults.length > 0 && (
                <CommandGroup heading="Registros">
                  {groups.registroResults.map((item) => (
                    <CommandItem key={item.id} value={`registro-${item.id}`} onSelect={() => select(item)}>
                      <FileText className="size-3.5" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">{item.sublabel}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {groups && groups.planilhaResults.length > 0 && (
                <CommandGroup heading="Planilhas">
                  {groups.planilhaResults.map((item) => (
                    <CommandItem key={item.id} value={`planilha-${item.id}`} onSelect={() => select(item)}>
                      <Table2 className="size-3.5" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">{item.sublabel}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
