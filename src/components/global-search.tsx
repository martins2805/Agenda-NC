"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, FileText, Table2, Search } from "lucide-react";
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

// Busca global (S13). O escopo foi restrito a Atividades na S15 (D17) e voltou
// a cobrir Execuções, Registros e Planilhas no PROMPT 3 (2.1 / D20). Todos os dados já estão
// carregados no AppDataProvider — nenhuma chamada de rede extra, só
// filtragem local, igual ao resto do motor de filtros do sistema.

const GRUPO_TITULO = {
  atividade: "Atividades",
  registro: "Registros",
  planilha: "Planilhas",
} as const;

const GRUPO_ICONE = {
  atividade: ListChecks,
  registro: FileText,
  planilha: Table2,
} as const;

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
  const { atividades, registros, planilhas, lookups } = useAppData();

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
  // PROMPT 3 (2.1) / D20: com os módulos de volta, a busca volta a cobrir
  // Registros e Planilhas. O pré-processamento acima vale para os três — é o
  // que evita reprocessar HTML pesado a cada tecla.
  const corpus = useMemo(() => {
    const empresaName = (id: string | null) => lookups.empresa.find((e) => e.id === id)?.name ?? "";
    return [
      ...atividades.map((a) => ({
        tipo: "atividade" as const,
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
      })),
      ...registros.map((r) => ({
        tipo: "registro" as const,
        item: {
          id: r.id,
          label: r.nome || r.assunto || "Registro sem nome",
          sublabel: empresaName(r.empresaId) || "Sem empresa",
          href: `/registros?open=${r.id}`,
        } satisfies ResultItem,
        texto: [
          r.nome,
          r.assunto,
          r.contato,
          empresaName(r.empresaId),
          ...r.tabs.map((t) => `${t.titulo} ${htmlToSearchText(t.conteudo)}`),
        ]
          .join(" ")
          .toLowerCase(),
      })),
      ...planilhas.map((p) => ({
        tipo: "planilha" as const,
        item: {
          id: p.id,
          label: p.nome || "Planilha sem nome",
          sublabel: empresaName(p.empresaId) || "Sem empresa",
          href: `/planilhas?open=${p.id}`,
        } satisfies ResultItem,
        texto: [p.nome, p.assunto, empresaName(p.empresaId)].join(" ").toLowerCase(),
      })),
    ];
  }, [atividades, registros, planilhas, lookups]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: (ResultItem & { tipo: string })[] = [];
    for (const entry of corpus) {
      if (entry.texto.includes(q)) {
        out.push({ ...entry.item, tipo: entry.tipo });
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
      {/* Texto em --foreground pleno: sobre o pill de vidro, o cinza "muted"
          perdia contraste contra o wallpaper (reclamação real do usuário). */}
      <Button
        type="button"
        variant="outline"
        className="glass-pill h-8 w-full max-w-xs justify-start gap-2 text-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left text-xs font-medium">Pesquisar...</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          Ctrl K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Pesquisa global"
        description="Busca em Atividades, Registros e Planilhas"
      >
        <CommandInput
          placeholder="Buscar em atividades, registros e planilhas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() === "" ? (
            <CommandEmpty>Digite para buscar em atividades, registros e planilhas.</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>Nenhum resultado para &ldquo;{query}&rdquo;.</CommandEmpty>
          ) : (
            (["atividade", "registro", "planilha"] as const).map((tipo) => {
              const doTipo = results.filter((r) => r.tipo === tipo);
              if (doTipo.length === 0) return null;
              const Icone = GRUPO_ICONE[tipo];
              return (
                <CommandGroup key={tipo} heading={GRUPO_TITULO[tipo]}>
                  {doTipo.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${tipo}-${item.id}`}
                      onSelect={() => select(item)}
                    >
                      <Icone className="size-3.5" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
