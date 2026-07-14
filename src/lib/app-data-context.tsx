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
import type {
  Atividade,
  AtividadeGeral,
  LookupItem,
  LookupKind,
  Planilha,
  Registro,
} from "./types";

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
  atividadesGerais: AtividadeGeral[];
  registros: Registro[];
  planilhas: Planilha[];
  loading: boolean;
  dataError: string | null;
  dismissDataError: () => void;
  addLookupItem: (kind: LookupKind, name: string, empresaId?: string | null) => string;
  renameLookupItem: (kind: LookupKind, id: string, name: string) => void;
  deactivateLookupItem: (kind: LookupKind, id: string) => void;
  addAtividade: (atividade: Atividade) => void;
  updateAtividade: (id: string, patch: Partial<Atividade>) => void;
  deleteAtividade: (id: string) => void;
  addAtividadeGeral: (atividade: AtividadeGeral) => void;
  updateAtividadeGeral: (id: string, patch: Partial<AtividadeGeral>) => void;
  deleteAtividadeGeral: (id: string) => void;
  addRegistro: (registro: Registro) => void;
  updateRegistro: (id: string, patch: Partial<Registro>) => void;
  deleteRegistro: (id: string) => void;
  addPlanilha: (planilha: Planilha) => void;
  updatePlanilha: (id: string, patch: Partial<Planilha>) => void;
  deletePlanilha: (id: string) => void;
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
      { id: item.id, name: item.name, active: item.active, empresaId: item.empresaId },
    ];
  }
  return grouped;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [lookups, setLookups] = useState<LookupState>(EMPTY_LOOKUPS);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [atividadesGerais, setAtividadesGerais] = useState<AtividadeGeral[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [planilhas, setPlanilhas] = useState<Planilha[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const planilhaSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  // Tracks writes that have been applied optimistically but not yet
  // acknowledged by the server, keyed by entity id, per entity type.
  const pendingAtividades = useRef<Map<string, PendingOp<Atividade>>>(new Map());
  const pendingAtividadesGerais = useRef<Map<string, PendingOp<AtividadeGeral>>>(new Map());
  const pendingRegistros = useRef<Map<string, PendingOp<Registro>>>(new Map());
  const pendingPlanilhas = useRef<Map<string, PendingOp<Planilha>>>(new Map());

  // Guards against an older load() response landing after a newer one.
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    try {
      const [lookupsRes, atividadesRes, atividadesGeraisRes, registrosRes, planilhasRes] =
        await Promise.all([
          fetch("/api/lookups"),
          fetch("/api/atividades"),
          fetch("/api/atividades-gerais"),
          fetch("/api/registros"),
          fetch("/api/planilhas"),
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
      if (atividadesGeraisRes.ok) {
        const data = await atividadesGeraisRes.json();
        if (loadSeq.current !== seq) return;
        setAtividadesGerais(applyPending(data, pendingAtividadesGerais.current));
      }
      if (registrosRes.ok) {
        const data = await registrosRes.json();
        if (loadSeq.current !== seq) return;
        setRegistros(applyPending(data, pendingRegistros.current));
      }
      if (planilhasRes.ok) {
        const data = await planilhasRes.json();
        if (loadSeq.current !== seq) return;
        setPlanilhas(applyPending(data, pendingPlanilhas.current));
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

  const addLookupItem = useCallback(
    (kind: LookupKind, name: string, empresaId?: string | null) => {
      const id = makeId();
      setLookups((prev) => ({
        ...prev,
        [kind]: [...prev[kind], { id, name, active: true, empresaId: empresaId ?? null }],
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

  const addAtividadeGeral = useCallback((atividade: AtividadeGeral) => {
    setAtividadesGerais((prev) => [atividade, ...prev]);
    pendingAtividadesGerais.current.set(atividade.id, { type: "add", item: atividade });
    fetch("/api/atividades-gerais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atividade),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`POST atividade geral falhou: ${res.status}`);
      })
      .catch((error) => {
        console.error("Falha ao criar atividade geral", error);
        setAtividadesGerais((prev) => prev.filter((a) => a.id !== atividade.id));
        setDataError("Nao foi possivel criar a atividade geral. Tente novamente.");
      })
      .finally(() => pendingAtividadesGerais.current.delete(atividade.id));
  }, []);

  const updateAtividadeGeral = useCallback((id: string, patch: Partial<AtividadeGeral>) => {
    setAtividadesGerais((prev) => {
      const previous = prev.find((a) => a.id === id);
      if (!previous) return prev;
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      const updated = next.find((a) => a.id === id)!;

      pendingAtividadesGerais.current.set(id, { type: "update", patch });
      fetch(`/api/atividades-gerais/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`PATCH atividade geral falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao atualizar atividade geral", error);
          setAtividadesGerais((cur) => cur.map((a) => (a.id === id ? previous : a)));
          setDataError("Nao foi possivel salvar a atividade geral. A edicao foi desfeita.");
        })
        .finally(() => pendingAtividadesGerais.current.delete(id));

      return next;
    });
  }, []);

  const deleteAtividadeGeral = useCallback((id: string) => {
    setAtividadesGerais((prev) => {
      const removed = prev.find((a) => a.id === id);
      pendingAtividadesGerais.current.set(id, { type: "delete" });
      fetch(`/api/atividades-gerais/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`DELETE atividade geral falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao excluir atividade geral", error);
          if (removed) {
            setAtividadesGerais((cur) =>
              cur.some((a) => a.id === id) ? cur : [removed, ...cur]
            );
          }
          setDataError("Nao foi possivel excluir a atividade geral. Ela foi restaurada.");
        })
        .finally(() => pendingAtividadesGerais.current.delete(id));

      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const addRegistro = useCallback((registro: Registro) => {
    setRegistros((prev) => [registro, ...prev]);
    pendingRegistros.current.set(registro.id, { type: "add", item: registro });
    fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registro),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`POST registro falhou: ${res.status}`);
      })
      .catch((error) => {
        console.error("Falha ao criar registro", error);
        setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
        setDataError("Não foi possível criar o registro. Tente novamente.");
      })
      .finally(() => pendingRegistros.current.delete(registro.id));
  }, []);

  const updateRegistro = useCallback((id: string, patch: Partial<Registro>) => {
    setRegistros((prev) => {
      const previous = prev.find((r) => r.id === id);
      if (!previous) return prev;
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      const updated = next.find((r) => r.id === id)!;

      pendingRegistros.current.set(id, { type: "update", patch });
      fetch(`/api/registros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`PATCH registro falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao atualizar registro", error);
          setRegistros((cur) => cur.map((r) => (r.id === id ? previous : r)));
          setDataError("Não foi possível salvar a alteração no registro. A edição foi desfeita.");
        })
        .finally(() => pendingRegistros.current.delete(id));

      return next;
    });
  }, []);

  const deleteRegistro = useCallback((id: string) => {
    setRegistros((prev) => {
      const removed = prev.find((r) => r.id === id);
      pendingRegistros.current.set(id, { type: "delete" });
      fetch(`/api/registros/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`DELETE registro falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao excluir registro", error);
          if (removed) {
            setRegistros((cur) =>
              cur.some((r) => r.id === id) ? cur : [removed, ...cur]
            );
          }
          setDataError("Não foi possível excluir o registro. Ele foi restaurado.");
        })
        .finally(() => pendingRegistros.current.delete(id));

      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const addPlanilha = useCallback((planilha: Planilha) => {
    setPlanilhas((prev) => [planilha, ...prev]);
    pendingPlanilhas.current.set(planilha.id, { type: "add", item: planilha });
    fetch("/api/planilhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planilha),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`POST planilha falhou: ${res.status}`);
      })
      .catch((error) => {
        console.error("Falha ao criar planilha", error);
        setPlanilhas((prev) => prev.filter((p) => p.id !== planilha.id));
        setDataError("Não foi possível criar a planilha. Tente novamente.");
      })
      .finally(() => pendingPlanilhas.current.delete(planilha.id));
  }, []);

  const updatePlanilha = useCallback((id: string, patch: Partial<Planilha>) => {
    setPlanilhas((prev) => {
      const previous = prev.find((p) => p.id === id);
      if (!previous) return prev;
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const updated = next.find((p) => p.id === id)!;

      pendingPlanilhas.current.set(id, { type: "update", patch });
      const existingTimer = planilhaSaveTimers.current.get(id);
      if (existingTimer) clearTimeout(existingTimer);
      const timer = setTimeout(() => {
        planilhaSaveTimers.current.delete(id);
        fetch(`/api/planilhas/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`PATCH planilha falhou: ${res.status}`);
          })
          .catch((error) => {
            console.error("Falha ao atualizar planilha", error);
            setPlanilhas((cur) => cur.map((p) => (p.id === id ? previous : p)));
            setDataError("Não foi possível salvar a alteração na planilha. A edição foi desfeita.");
          })
          .finally(() => pendingPlanilhas.current.delete(id));
      }, 600);
      planilhaSaveTimers.current.set(id, timer);

      return next;
    });
  }, []);

  const deletePlanilha = useCallback((id: string) => {
    setPlanilhas((prev) => {
      const removed = prev.find((p) => p.id === id);
      pendingPlanilhas.current.set(id, { type: "delete" });
      fetch(`/api/planilhas/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`DELETE planilha falhou: ${res.status}`);
        })
        .catch((error) => {
          console.error("Falha ao excluir planilha", error);
          if (removed) {
            setPlanilhas((cur) =>
              cur.some((p) => p.id === id) ? cur : [removed, ...cur]
            );
          }
          setDataError("Não foi possível excluir a planilha. Ela foi restaurada.");
        })
        .finally(() => pendingPlanilhas.current.delete(id));

      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const value = useMemo(
    () => ({
      lookups,
      atividades,
      atividadesGerais,
      registros,
      planilhas,
      loading,
      dataError,
      dismissDataError,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addAtividadeGeral,
      updateAtividadeGeral,
      deleteAtividadeGeral,
      addRegistro,
      updateRegistro,
      deleteRegistro,
      addPlanilha,
      updatePlanilha,
      deletePlanilha,
      refetch: load,
    }),
    [
      lookups,
      atividades,
      atividadesGerais,
      registros,
      planilhas,
      loading,
      dataError,
      dismissDataError,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addAtividadeGeral,
      updateAtividadeGeral,
      deleteAtividadeGeral,
      addRegistro,
      updateRegistro,
      deleteRegistro,
      addPlanilha,
      updatePlanilha,
      deletePlanilha,
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
  const { atividades, registros, planilhas } = useAppData();
  return Array.from(
    new Set(
      [...atividades, ...registros, ...planilhas]
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

export function makeAtividadeGeralId() {
  return makeId();
}

export function makeChecklistGeralItemId() {
  return makeId();
}

export function makeRegistroId() {
  return makeId();
}

export function makeRegistroTabId() {
  return makeId();
}

export function makePlanilhaId() {
  return makeId();
}
