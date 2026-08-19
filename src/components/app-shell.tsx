"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  FileText,
  Table2,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/global-search";
import { VisualConfigStyle } from "@/components/visual-config-style";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/atividades", label: "Atividades", icon: ListChecks },
  // PROMPT 3 (2.1) / D20: os três módulos voltaram à navegação. A D17 os havia
  // tirado daqui em 2026-08-14, sem migration — nada foi perdido no banco.
  { href: "/atividades-gerais", label: "Execuções", icon: ClipboardCheck },
  { href: "/registros", label: "Registros", icon: FileText },
  { href: "/planilhas", label: "Planilhas", icon: Table2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const ADMIN_NAV_ITEM = { href: "/usuarios", label: "Usuários", icon: Users };

export function AppShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const NAV_ITEMS = isAdmin ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS;

  return (
    <div className="flex min-h-full">
      {/* Redefine os tokens semânticos conforme a aba Configurações (PROMPT 3,
          3.2): um ponto só, valendo para todas as telas do shell. */}
      <VisualConfigStyle />
      {/* Sidebar sólida na cor da paleta base #1F2C43 com texto branco,
          disponível em todas as telas grandes. */}
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col gap-4 p-3 sm:flex">
        <div className="glass-dark flex h-full flex-col gap-4 rounded-3xl p-4 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-xs font-bold text-white">
              NC
            </div>
            <span className="font-display text-lg tracking-tight italic text-white">
              Agenda NC
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form action={logout} className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-white/80 hover:bg-white/10 hover:text-white"
              type="submit"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* min-w-0 (e sem w-full): sem isso o main soma 100% da viewport à
          largura da sidebar e joga o conteúdo da direita para fora da tela. */}
      <main className="min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pb-10">
        {/* A tela de Atividades usa um container mais largo: a visão em lista
            exibe todas as colunas sem cortar dados (Regra 7); as demais telas
            mantêm o max-w-6xl original. */}
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-4",
            // Comparação exata: `startsWith` casaria também com
            // /atividades-gerais, que não precisa da largura extra.
            pathname === "/atividades" ? "max-w-none" : "max-w-6xl"
          )}
        >
          {/* Header mínimo, idêntico em todas as telas — só a busca global
              (Ctrl+K), que cobre Atividades (S13: "busca global de verdade,
              em todos os objetos"; escopo restrito na S15 — ver D17). */}
          <div className="flex justify-end">
            <GlobalSearch />
          </div>
          {children}
        </div>
      </main>

      {/* Tab bar mobile em cápsula flutuante, inset das bordas — iOS 26
          ("barra de abas embutida", diretrizes de 2026-08-17). */}
      <nav className="glass-dark fixed inset-x-4 bottom-3 z-40 overflow-hidden rounded-full text-white ring-1 ring-white/15 sm:hidden">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 font-mono text-[10px] tracking-wide uppercase transition-colors",
                  active ? "text-white" : "text-white/60"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
