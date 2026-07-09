"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Table2, LogOut } from "lucide-react";
import { logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/atividades", label: "Atividades", icon: LayoutDashboard },
  { href: "/registros", label: "Registros", icon: FileText },
  { href: "/planilhas", label: "Planilhas", icon: Table2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-600 text-sm font-black text-white shadow-md">
              NC
            </div>
            <span className="text-lg font-bold tracking-tight">Agenda NC</span>
          </div>
          <div className="flex items-center gap-1">
            <nav className="hidden gap-1 sm:flex">
              {NAV_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background sm:hidden">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
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
