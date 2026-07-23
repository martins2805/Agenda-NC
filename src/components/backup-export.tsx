"use client";

import { DatabaseBackup } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAppData } from "@/lib/app-data-context";

// Backup e exportação (S13): o sistema é fonte única da verdade, então
// precisa de uma saída de dados que não dependa de acesso ao banco. Tudo
// que compõe o backup já está carregado no AppDataProvider (mesmo dado que
// alimenta as telas) — nenhuma chamada de rede extra.
export function BackupExport() {
  const { lookups, atividades, atividadesGerais, registros, planilhas, checklistTemplates, loading } =
    useAppData();
  const toast = useToast();

  function handleExport() {
    const backup = {
      exportadoEm: new Date().toISOString(),
      versao: 1,
      lookups,
      atividades,
      atividadesGerais,
      registros,
      planilhas,
      checklistTemplates,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const data = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `backup-agenda-nc-${data}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({ type: "success", title: "Backup exportado", description: `${a.download} baixado com sucesso.` });
  }

  return (
    <div className="panel-card flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Backup e exportação</h3>
        <DatabaseBackup className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        Baixa um arquivo JSON com todos os dados do sistema — atividades, execuções, registros,
        planilhas e catálogos — para guardar uma cópia fora do sistema.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-fit gap-1.5"
        disabled={loading}
        onClick={handleExport}
      >
        <DatabaseBackup className="size-3.5" />
        Exportar backup completo (JSON)
      </Button>
    </div>
  );
}
