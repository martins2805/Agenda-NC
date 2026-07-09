"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Atividade,
  LookupItem,
  LookupKind,
  Planilha,
  Registro,
} from "./types";

interface LookupState {
  empresa: LookupItem[];
  unidade: LookupItem[];
  assunto: LookupItem[];
  tipoAtividade: LookupItem[];
  servicoProduto: LookupItem[];
  escopo: LookupItem[];
  amostragem: LookupItem[];
  categoriaRegistro: LookupItem[];
  categoriaPlanilha: LookupItem[];
}

const EMPTY_LOOKUPS: LookupState = {
  empresa: [],
  unidade: [],
  assunto: [],
  tipoAtividade: [],
  servicoProduto: [],
  escopo: [],
  amostragem: [],
  categoriaRegistro: [],
  categoriaPlanilha: [],
};

interface AppDataContextValue {
  lookups: LookupState;
  atividades: Atividade[];
  registros: Registro[];
  planilhas: Planilha[];
  loading: boolean;
  addLookupItem: (kind: LookupKind, name: string) => string;
  renameLookupItem: (kind: LookupKind, id: string, name: string) => void;
  deactivateLookupItem: (kind: LookupKind, id: string) => void;
  addAtividade: (atividade: Atividade) => void;
  updateAtividade: (id: string, patch: Partial<Atividade>) => void;
  deleteAtividade: (id: string) => void;
  addRegistro: (registro: Registro) => void;
  updateRegistro: (id: string, patch: Partial<Registro>) => void;
  deleteRegistro: (id: string) => void;
  addPlanilha: (planilha: Planilha) => void;
  updatePlanilha: (id: string, patch: Partial<Planilha>) => void;
  deletePlanilha: (id: string) => void;
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
      { id: item.id, name: item.name, active: item.active },
    ];
  }
  return grouped;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [lookups, setLookups] = useState<LookupState>(EMPTY_LOOKUPS);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [planilhas, setPlanilhas] = useState<Planilha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [lookupsRes, atividadesRes, registrosRes] = await Promise.all([
          fetch("/api/lookups"),
          fetch("/api/atividades"),
          fetch("/api/registros"),
        ]);
        if (cancelled) return;

        if (lookupsRes.ok) {
          const data = await lookupsRes.json();
          setLookups(groupLookups(data));
        }
        if (atividadesRes.ok) {
          const data = await atividadesRes.json();
          setAtividades(data);
        }
        if (registrosRes.ok) {
          const data = await registrosRes.json();
          setRegistros(data);
        }
      } catch (error) {
        console.error("Falha ao carregar dados iniciais", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addLookupItem = useCallback((kind: LookupKind, name: string) => {
    const id = makeId();
    setLookups((prev) => ({
      ...prev,
      [kind]: [...prev[kind], { id, name, active: true }],
    }));
    fetch("/api/lookups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind, name }),
    }).catch((error) => console.error("Falha ao criar item", error));
    return id;
  }, []);

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
    fetch("/api/atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(atividade),
    }).catch((error) => console.error("Falha ao criar atividade", error));
  }, []);

  const updateAtividade = useCallback((id: string, patch: Partial<Atividade>) => {
    setAtividades((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      const updated = next.find((a) => a.id === id);
      if (updated) {
        fetch(`/api/atividades/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }).catch((error) => console.error("Falha ao atualizar atividade", error));
      }
      return next;
    });
  }, []);

  const deleteAtividade = useCallback((id: string) => {
    setAtividades((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/atividades/${id}`, { method: "DELETE" }).catch((error) =>
      console.error("Falha ao excluir atividade", error)
    );
  }, []);

  const addRegistro = useCallback((registro: Registro) => {
    setRegistros((prev) => [registro, ...prev]);
    fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registro),
    }).catch((error) => console.error("Falha ao criar registro", error));
  }, []);

  const updateRegistro = useCallback((id: string, patch: Partial<Registro>) => {
    setRegistros((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      const updated = next.find((r) => r.id === id);
      if (updated) {
        fetch(`/api/registros/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }).catch((error) => console.error("Falha ao atualizar registro", error));
      }
      return next;
    });
  }, []);

  const deleteRegistro = useCallback((id: string) => {
    setRegistros((prev) => prev.filter((r) => r.id !== id));
    fetch(`/api/registros/${id}`, { method: "DELETE" }).catch((error) =>
      console.error("Falha ao excluir registro", error)
    );
  }, []);

  const addPlanilha = useCallback((planilha: Planilha) => {
    setPlanilhas((prev) => [planilha, ...prev]);
  }, []);

  const updatePlanilha = useCallback((id: string, patch: Partial<Planilha>) => {
    setPlanilhas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const deletePlanilha = useCallback((id: string) => {
    setPlanilhas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      lookups,
      atividades,
      registros,
      planilhas,
      loading,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addRegistro,
      updateRegistro,
      deleteRegistro,
      addPlanilha,
      updatePlanilha,
      deletePlanilha,
    }),
    [
      lookups,
      atividades,
      registros,
      planilhas,
      loading,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addRegistro,
      updateRegistro,
      deleteRegistro,
      addPlanilha,
      updatePlanilha,
      deletePlanilha,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
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

export function makeRegistroId() {
  return makeId();
}

export function makeRegistroTabId() {
  return makeId();
}

export function makePlanilhaId() {
  return makeId();
}
