"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClipboardCheck, LayoutDashboard, ListChecks, FileText, Table2, Users, LogOut } from "lucide-react";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/atividades", label: "Atividades", icon: ListChecks },
  { href: "/atividades-gerais", label: "Execuções", icon: ClipboardCheck },
  { href: "/registros", label: "Registros", icon: FileText },
  { href: "/planilhas", label: "Planilhas", icon: Table2 },
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
      {/* Sidebar sólida na cor da paleta base #1F2C43 com texto branco,
          disponível em todas as telas grandes. */}
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col gap-4 p-3 sm:flex">
        <div className="flex h-full flex-col gap-4 rounded-3xl bg-[#26314c] p-4 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
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

      <main className="w-full flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 bg-[#26314c] text-white ring-1 ring-white/10 sm:hidden">
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
