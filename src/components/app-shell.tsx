"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Table2, Users, LogOut, Trash2 } from "lucide-react";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";

const BASE_NAV_ITEMS = [
  { href: "/atividades", label: "Atividades", icon: LayoutDashboard },
  { href: "/registros", label: "Registros", icon: FileText },
  { href: "/planilhas", label: "Planilhas", icon: Table2 },
  { href: "/lixeira", label: "Lixeira", icon: Trash2 },
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 p-4 sm:flex">
        <div className="relative flex h-full flex-col gap-6 overflow-hidden rounded-2xl bg-sidebar p-4 text-sidebar-foreground shadow-xl shadow-[var(--base-1)]/25">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 20% 0%, color-mix(in oklch, var(--base-3), transparent 55%), transparent 70%)",
            }}
          />

          <div className="relative flex items-center gap-3 px-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary font-mono text-xs font-bold text-sidebar-primary-foreground shadow-md">
              NC
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg tracking-tight italic">Agenda NC</span>
              <span className="ledger-label text-sidebar-foreground/50">painel executivo</span>
            </div>
          </div>

          <nav className="relative flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "border-transparent text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="divider-dashed relative border-sidebar-border" />

          <div className="relative flex flex-col gap-2 rounded-xl bg-sidebar-accent/40 p-3 text-xs">
            <span className="ledger-label text-sidebar-foreground/50">status do sistema</span>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--status-concluido)]" />
              <span className="text-sidebar-foreground/80">Sincronizado</span>
            </div>
          </div>

          <form action={logout} className="relative mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
              type="submit"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <main className="w-full flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background sm:hidden">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 font-mono text-[10px] tracking-wide uppercase",
                  active ? "text-primary" : "text-muted-foreground"
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
