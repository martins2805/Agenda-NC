"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, Flame, FileClock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Atividade } from "@/lib/types";
import type { AtividadeGeral } from "@/lib/types";
import { parseLocalDate } from "@/lib/calculations";

const STATUS_COLORS: Record<string, string> = {
  Pendente: "#DA9B2B",
  "Aguardando retorno interno": "#3E4C59",
  "Aguardando retorno cliente": "#3E4C59",
  "Concluído": "#2E5749",
};

const PRIORIDADE_COLORS: Record<string, string> = {
  Urgente: "#780001",
  Importante: "#BF512C",
  "Médio": "#DA9B2B",
  Baixo: "#2E5749",
};

function isOverdue(atividade: Atividade) {
  if (!atividade.prazo || atividade.status === "Concluído") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseLocalDate(atividade.prazo).getTime() < today.getTime();
}

function findTipoByName(items: { id: string; name: string }[], name: string) {
  return items.find((item) => item.name.toLowerCase() === name.toLowerCase());
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: typeof ClipboardList;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: color }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="ledger-label truncate">{label}</p>
          <p className="font-mono text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function VerticalBars({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number; color: string }[];
}) {
  const max = Math.max(1, ...data.map((item) => item.count));

  return (
    <Card>
      <CardContent className="flex min-h-64 flex-col gap-4">
        <span className="ledger-label">{title}</span>
        <div className="flex flex-1 items-end gap-3">
          {data.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-md bg-muted/60 p-1">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${Math.max(5, (item.count / max) * 100)}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.label}: ${item.count}`}
                />
              </div>
              <span className="font-mono text-sm font-semibold">{item.count}</span>
              <span className="line-clamp-2 text-center text-[11px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats({
  atividades,
  atividadesGerais,
}: {
  atividades: Atividade[];
  atividadesGerais: AtividadeGeral[];
}) {
  const { lookups } = useAppData();
  const tipoProposta = findTipoByName(lookups.tipoAtividade, "Proposta");
  const propostas = tipoProposta
    ? atividades.filter((a) => a.tipoAtividadeIds.includes(tipoProposta.id))
    : [];
  const propostasPendentes = propostas.filter((a) => a.status === "Pendente");

  const statusData = STATUS_OPTIONS.map((status) => ({
    label: status,
    count: atividades.filter((a) => a.status === status).length,
    color: STATUS_COLORS[status] ?? "#3E4C59",
  }));
  const prioridadeData = PRIORIDADE_OPTIONS.map((prioridade) => ({
    label: prioridade,
    count: atividades.filter((a) => a.prioridade === prioridade).length,
    color: PRIORIDADE_COLORS[prioridade] ?? "#3E4C59",
  }));
  // Gráfico por empresa não representa status/prioridade/prazo → paleta base.
  const empresaData = lookups.empresa
    .filter((empresa) => empresa.active)
    .map((empresa, index) => ({
      label: empresa.name,
      count: atividades.filter((a) => a.empresaId === empresa.id).length,
      color: ["#1F2C43", "#3E4C59", "#8BAAAD", "#D8D8D8"][index % 4],
    }))
    .filter((item) => item.count > 0)
    .slice(0, 8);
  const propostaStatusData = STATUS_OPTIONS.map((status) => ({
    label: status,
    count: propostas.filter((a) => a.status === status).length,
    color: STATUS_COLORS[status] ?? "#3E4C59",
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de atividades" value={atividades.length} color="#1F2C43" icon={ClipboardList} />
        <StatCard label="Vencidas" value={atividades.filter(isOverdue).length} color="#780001" icon={AlertTriangle} />
        <StatCard label="Pendentes" value={atividades.filter((a) => a.status === "Pendente").length} color="#BF512C" icon={FileClock} />
        <StatCard label="Prioridade urgente" value={atividades.filter((a) => a.prioridade === "Urgente").length} color="#780001" icon={Flame} />
        <StatCard label="Prioridade importante" value={atividades.filter((a) => a.prioridade === "Importante").length} color="#BF512C" icon={Flame} />
        <StatCard label="Tipo propostas" value={propostas.length} color="#8BAAAD" icon={CheckCircle2} />
        <StatCard label="Propostas pendentes" value={propostasPendentes.length} color="#BF512C" icon={FileClock} />
        <Link href="/atividades-gerais">
          <StatCard label="Atividades gerais" value={atividadesGerais.length} color="#3E4C59" icon={ClipboardList} />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <VerticalBars title="Status das propostas" data={propostaStatusData} />
        <VerticalBars title="Status das atividades" data={statusData} />
        <VerticalBars title="Atividades por prioridade" data={prioridadeData} />
        <VerticalBars title="Atividades por empresa" data={empresaData.length ? empresaData : [{ label: "Sem dados", count: 0, color: "#D8D8D8" }]} />
      </div>
    </div>
  );
}
