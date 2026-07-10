"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Table2, Users, LogOut } from "lucide-react";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/atividades", label: "Atividades", icon: LayoutDashboard },
  { href: "/registros", label: "Registros", icon: FileText },
  { href: "/planilhas", label: "Planilhas", icon: Table2 },
  { href: "/usuarios", label: "Usuários", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 p-4 sm:flex">
        <div className="flex flex-col gap-6 rounded-2xl border border-sidebar-border bg-sidebar p-4 h-full">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs font-bold text-accent-foreground">
              NC
            </div>
            <span className="font-display text-lg tracking-tight italic text-sidebar-foreground">
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
                    "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                      : "border-transparent text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form action={logout} className="mt-auto">
            <Button variant="ghost" className="w-full justify-start gap-3 px-3" type="submit">
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
