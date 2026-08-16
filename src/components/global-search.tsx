"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Search } from "lucide-react";
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
import { htmlToSearchText } from "@/lib/utils";

// Busca global (S13). Escopo restrito a Atividades na S15 (D17) — Execuções,
// Registros e Planilhas saíram da interface. Todos os dados já estão
// carregados no AppDataProvider — nenhuma chamada de rede extra, só
// filtragem local, igual ao resto do motor de filtros do sistema.

interface ResultItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

const MAX_RESULTS = 8;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { atividades, lookups } = useAppData();

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

  // Corpus pré-processado UMA vez por mudança de dados — nunca por tecla.
  // Digitar recalculava stripHtml sobre descrições com imagens base64 de
  // megabytes para toda atividade, a cada caractere: derrubava a aba do
  // navegador (crash reproduzido em produção). Ver htmlToSearchText.
  const corpus = useMemo(() => {
    const empresaName = (id: string | null) => lookups.empresa.find((e) => e.id === id)?.name ?? "";
    return atividades.map((a) => ({
      item: {
        id: a.id,
        label: a.assunto || "Atividade sem assunto",
        sublabel: empresaName(a.empresaId) || "Sem empresa",
        href: `/atividades?open=${a.id}`,
      } satisfies ResultItem,
      texto: [
        a.assunto,
        a.contato,
        htmlToSearchText(a.descricao),
        a.emailConteudo,
        a.oportunidadeTexto,
        empresaName(a.empresaId),
      ]
        .join(" ")
        .toLowerCase(),
    }));
  }, [atividades, lookups]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: ResultItem[] = [];
    for (const entry of corpus) {
      if (entry.texto.includes(q)) {
        out.push(entry.item);
        if (out.length >= MAX_RESULTS) break;
      }
    }
    return out;
  }, [query, corpus]);

  function select(item: ResultItem) {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-8 w-full max-w-xs justify-start gap-2 text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left text-xs">Pesquisar atividades...</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          Ctrl K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Pesquisa global"
        description="Busca em Atividades"
      >
        <CommandInput
          placeholder="Buscar em atividades..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() === "" ? (
            <CommandEmpty>Digite para buscar em atividades.</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>Nenhum resultado para &ldquo;{query}&rdquo;.</CommandEmpty>
          ) : (
            <CommandGroup heading="Atividades">
              {results.map((item) => (
                <CommandItem key={item.id} value={`atividade-${item.id}`} onSelect={() => select(item)}>
                  <ListChecks className="size-3.5" />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{item.sublabel}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
