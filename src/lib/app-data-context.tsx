"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Atividade, ChecklistTemplate, LookupItem, LookupKind } from "./types";
import type { WidgetPreferenciaResolvida } from "./dashboard-widgets";

interface LookupState {
  empresa: LookupItem[];
  unidade: LookupItem[];
  tipoAtividade: LookupItem[];
  servicoProduto: LookupItem[];
  escopo: LookupItem[];
  amostragem: LookupItem[];
  categoriaRegistro: LookupItem[];
  categoriaPlanilha: LookupItem[];
  tipoAtividadeGeral: LookupItem[];
  setorInterno: LookupItem[];
}

const EMPTY_LOOKUPS: LookupState = {
  empresa: [],
  unidade: [],
  tipoAtividade: [],
  servicoProduto: [],
  escopo: [],
  amostragem: [],
  categoriaRegistro: [],
  categoriaPlanilha: [],
  tipoAtividadeGeral: [],
  setorInterno: [],
};

// A write that hasn't been confirmed by the server yet. load() re-applies
// these on top of whatever it just fetched so a refetch that lands mid-edit
// can't silently revert an in-flight change or resurrect a deleted item.
type PendingOp<T> =
  | { type: "add"; item: T }
  | { type: "update"; patch: Partial<T> }
  | { type: "delete" };

function applyPending<T extends { id: string }>(
  items: T[],
  pending: Map<string, PendingOp<T>>
): T[] {
  if (pending.size === 0) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const [id, op] of pending) {
    if (op.type === "delete") {
      byId.delete(id);
    } else if (op.type === "update") {
      const existing = byId.get(id);
      if (existing) byId.set(id, { ...existing, ...op.patch });
    } else if (op.type === "add") {
      if (!byId.has(id)) byId.set(id, op.item);
    }
  }
  return Array.from(byId.values());
}

interface AppDataContextValue {
  lookups: LookupState;
  atividades: Atividade[];
  checklistTemplates: ChecklistTemplate[];
  widgetPreferencias: WidgetPreferenciaResolvida[];
  updateWidgetPreferencias: (list: WidgetPreferenciaResolvida[]) => void;
  loading: boolean;
  dataError: string | null;
  dismissDataError: () => void;
  addLookupItem: (kind: LookupKind, name: string, empresaId?: string | null) => string;
  renameLookupItem: (kind: LookupKind, id: string, name: string) => void;
  deactivateLookupItem: (kind: LookupKind, id: string) => void;
  activateLookupItem: (kind: LookupKind, id: string) => void;
  setLookupItemCor: (kind: LookupKind, id: string, cor: LookupItem["cor"]) => void;
  reorderLookupItem: (kind: LookupKind, id: string, direction: "up" | "down") => void;
  addAtividade: (atividade: Atividade) => void;
  updateAtividade: (id: string, patch: Partial<Atividade>) => void;
  deleteAtividade: (id: string) => void;
  addChecklistTemplate: (template: ChecklistTemplate) => void;
  updateChecklistTemplate: (id: string, template: ChecklistTemplate) => void;
  deleteChecklistTemplate: (id: string) => void;
  refetch: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function makeId() {
  return crypto.randomUUID();
}

function groupLookups(items: (LookupItem & { kind: LookupKind })[]): LookupState {
  const grouped = { ...EMPTY_LOOKUPS };
  for (const item of items) {
    grouped[item.kind] = [
      ...grouped[item.kind],
      {
        id: item.id,
        name: item.name,
        active: item.active,
        empresaId: item.empresaId,
        cor: item.cor ?? null,
        ordem: item.ordem ?? 0,
      },
    ];
  }
  for (const kind of Object.keys(grouped) as LookupKind[]) {
    grouped[kind] = [...grouped[kind]].sort((a, b) => a.ordem - b.ordem);
  }
  return grouped;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [lookups, setLookups] = useState<LookupState>(EMPTY_LOOKUPS);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [widgetPreferencias, setWidgetPreferencias] = useState<WidgetPreferenciaResolvida[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Tracks writes that have been applied optimistically but not yet
  // acknowledged by the server, keyed by entity id, per entity type.
  const pendingAtividades = useRef<Map<string, PendingOp<Atividade>>>(new Map());

  // Guards against an older load() response landing after a newer one.
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    try {
      const [lookupsRes, atividadesRes, checklistTemplatesRes, widgetPreferenciasRes] = await Promise.all([
        fetch("/api/lookups"),
        fetch("/api/atividades"),
        fetch("/api/checklist-templates"),
        fetch("/api/widget-preferencias"),
      ]);

      if (loadSeq.current !== seq) return;

      if (lookupsRes.ok) {
        const data = await lookupsRes.json();
        if (loadSeq.current !== seq) return;
        setLookups(groupLookups(data));
      }
      if (atividadesRes.ok) {
        const data = await atividadesRes.json();
        if (loadSeq.current !== seq) return;
        setAtividades(applyPending(data, pendingAtividades.current));
      }
      if (checklistTemplatesRes.ok) {
        const data = await checklistTemplatesRes.json();
        if (loadSeq.current !== seq) return;
        setChecklistTemplates(data);
      }
      if (widgetPreferenciasRes.ok) {
        const data = await widgetPreferenciasRes.json();
        if (loadSeq.current !== seq) return;
        setWidgetPreferencias(data);
      }
    } catch (error) {
      if (loadSeq.current !== seq) return;
      console.error("Falha ao carregar dados", error);
      setDataError("Falha ao carregar os dados. Verifique sua conexão e tente novamente.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      await load();
      if (!cancelled) setLoading(false);
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissDataError = useCallback(() => setDataError(null), []);

  const updateWidgetPreferencias = useCallback((list: WidgetPreferenciaResolvida[]) => {
    setWidgetPreferencias((previous) => {
      fetch("/api/widget-preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`PUT widget-preferencias falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao salvar preferências de widget", error);
          setWidgetPreferencias(previous);
          setDataError("Não foi possível salvar a preferência de widget. A alteração foi desfeita.");
        });
      return list;
    });
  }, []);

  const addLookupItem = useCallback(
    (kind: LookupKind, name: string, empresaId?: string | null) => {
      const id = makeId();
      setLookups((prev) => ({
        ...prev,
        [kind]: [
          ...prev[kind],
          { id, name, active: true, empresaId: empresaId ?? null, cor: null, ordem: prev[kind].length },
        ],
      }));
      fetch("/api/lookups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kind, name, empresaId }),
      }).catch((error) => console.error("Falha ao criar item", error));
      return id;
    },
    []
  );

  const renameLookupItem = useCallback(
    (kind: LookupKind, id: string, name: string) => {
      setLookups((prev) => ({
        ...prev,
        [kind]: prev[kind].map((item) =>
          item.id === id ? { ...item, name } : item
        ),
      }));
      fetch(`/api/lookups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).catch((error) => console.error("Falha ao renomear item", error));
    },
    []
  );

  const deactivateLookupItem = useCallback((kind: LookupKind, id: string) => {
    setLookups((prev) => ({
      ...prev,
      [kind]: prev[kind].map((item) =>
        item.id === id ? { ...item, active: false } : item
      ),
    }));
    fetch(`/api/lookups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    }).catch((error) => console.error("Falha ao desativar item", error));
  }, []);

  const activateLookupItem = useCallback((kind: LookupKind, id: string) => {
    setLookups((prev) => ({
      ...prev,
      [kind]: prev[kind].map((item) => (item.id === id ? { ...item, active: true } : item)),
    }));
    fetch(`/api/lookups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    }).catch((error) => console.error("Falha ao reativar item", error));
  }, []);

  const setLookupItemCor = useCallback((kind: LookupKind, id: string, cor: LookupItem["cor"]) => {
    setLookups((prev) => ({
      ...prev,
      [kind]: prev[kind].map((item) => (item.id === id ? { ...item, cor } : item)),
    }));
    fetch(`/api/lookups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cor }),
    }).catch((error) => console.error("Falha ao alterar cor do item", error));
  }, []);

  // Troca a ordem com o vizinho imediato (acima/abaixo), só entre itens
  // ativos — arquivados não entram na ordenação visível.
  const reorderLookupItem = useCallback(
    (kind: LookupKind, id: string, direction: "up" | "down") => {
      setLookups((prev) => {
        const list = [...prev[kind]].sort((a, b) => a.ordem - b.ordem);
        const activeList = list.filter((i) => i.active);
        const idx = activeList.findIndex((i) => i.id === id);
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (idx === -1 || swapIdx < 0 || swapIdx >= activeList.length) return prev;

        const a = activeList[idx];
        const b = activeList[swapIdx];
        const aOrdem = a.ordem;
        const bOrdem = b.ordem;

        fetch(`/api/lookups/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: bOrdem }),
        }).catch((error) => console.error("Falha ao reordenar item", error));
        fetch(`/api/lookups/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: aOrdem }),
        }).catch((error) => console.error("Falha ao reordenar item", error));

        return {
          ...prev,
          [kind]: prev[kind].map((item) => {
            if (item.id === a.id) return { ...item, ordem: bOrdem };
            if (item.id === b.id) return { ...item, ordem: aOrdem };
            return item;
          }),
        };
      });
    },
    []
  );

  const addAtividade = useCallback((atividade: Atividade) => {
    setAtividades((prev) => [atividade, ...prev]);
    pendingAtividades.current.set(atividade.id, { type: "add", item: atividade });
    fetch("/api/atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atividade),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`POST atividade falhou: ${res.status}`);
      })
      .catch((error) => {
        console.error("Falha ao criar atividade", error);
        setAtividades((prev) => prev.filter((a) => a.id !== atividade.id));
        setDataError("Não foi possível criar a atividade. Tente novamente.");
      })
      .finally(() => pendingAtividades.current.delete(atividade.id));
  }, []);

  const updateAtividade = useCallback((id: string, patch: Partial<Atividade>) => {
    setAtividades((prev) => {
      const previous = prev.find((a) => a.id === id);
      if (!previous) return prev;
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      const updated = next.find((a) => a.id === id)!;

      pendingAtividades.current.set(id, { type: "update", patch });
      fetch(`/api/atividades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`PATCH atividade falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao atualizar atividade", error);
          setAtividades((cur) => cur.map((a) => (a.id === id ? previous : a)));
          setDataError("Não foi possível salvar a alteração na atividade. A edição foi desfeita.");
        })
        .finally(() => pendingAtividades.current.delete(id));

      return next;
    });
  }, []);

  const deleteAtividade = useCallback((id: string) => {
    setAtividades((prev) => {
      const removed = prev.find((a) => a.id === id);
      pendingAtividades.current.set(id, { type: "delete" });
      fetch(`/api/atividades/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`DELETE atividade falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao excluir atividade", error);
          if (removed) {
            setAtividades((cur) =>
              cur.some((a) => a.id === id) ? cur : [removed, ...cur]
            );
          }
          setDataError("Não foi possível excluir a atividade. Ela foi restaurada.");
        })
        .finally(() => pendingAtividades.current.delete(id));

      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const addChecklistTemplate = useCallback((template: ChecklistTemplate) => {
    setChecklistTemplates((prev) => [...prev, template]);
    fetch("/api/checklist-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    }).catch((error) => {
      console.error("Falha ao criar modelo de checklist", error);
      setChecklistTemplates((prev) => prev.filter((t) => t.id !== template.id));
      setDataError("Não foi possível criar o modelo de checklist. Tente novamente.");
    });
  }, []);

  const updateChecklistTemplate = useCallback((id: string, template: ChecklistTemplate) => {
    setChecklistTemplates((prev) => {
      const previous = prev.find((t) => t.id === id);
      fetch(`/api/checklist-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      }).catch((error) => {
        console.error("Falha ao atualizar modelo de checklist", error);
        if (previous) {
          setChecklistTemplates((cur) => cur.map((t) => (t.id === id ? previous : t)));
        }
        setDataError("Não foi possível salvar o modelo de checklist. A edição foi desfeita.");
      });
      return prev.map((t) => (t.id === id ? template : t));
    });
  }, []);

  const deleteChecklistTemplate = useCallback((id: string) => {
    setChecklistTemplates((prev) => {
      const removed = prev.find((t) => t.id === id);
      fetch(`/api/checklist-templates/${id}`, { method: "DELETE" }).catch((error) => {
        console.error("Falha ao excluir modelo de checklist", error);
        if (removed) {
          setChecklistTemplates((cur) =>
            cur.some((t) => t.id === id) ? cur : [...cur, removed]
          );
        }
        setDataError("Não foi possível excluir o modelo de checklist. Ele foi restaurado.");
      });
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const value = useMemo(
    () => ({
      lookups,
      atividades,
      checklistTemplates,
      widgetPreferencias,
      updateWidgetPreferencias,
      loading,
      dataError,
      dismissDataError,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      activateLookupItem,
      setLookupItemCor,
      reorderLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addChecklistTemplate,
      updateChecklistTemplate,
      deleteChecklistTemplate,
      refetch: load,
    }),
    [
      lookups,
      atividades,
      checklistTemplates,
      widgetPreferencias,
      updateWidgetPreferencias,
      loading,
      dataError,
      dismissDataError,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      activateLookupItem,
      setLookupItemCor,
      reorderLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addChecklistTemplate,
      updateChecklistTemplate,
      deleteChecklistTemplate,
      load,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
      {dataError && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm text-white shadow-lg">
            <span>{dataError}</span>
            <button
              type="button"
              onClick={dismissDataError}
              className="rounded-md px-2 py-1 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function useAssuntoSuggestions() {
  const { atividades } = useAppData();
  return Array.from(
    new Set(
      atividades
        .map((item) => item.assunto?.trim())
        .filter((assunto): assunto is string => !!assunto)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function makeAtividadeId() {
  return makeId();
}

export function makePropostaId() {
  return makeId();
}

export function makeChecklistItemId() {
  return makeId();
}

export function makeChecklistTemplateId() {
  return makeId();
}

export function makeChecklistTemplateItemId() {
  return makeId();
}

export function makeLinkId() {
  return makeId();
}
