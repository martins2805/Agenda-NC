"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Atividade, LookupItem, LookupKind, Registro } from "./types";
import {
  SEED_AMOSTRAGENS,
  SEED_ASSUNTOS,
  SEED_CATEGORIAS_REGISTRO,
  SEED_EMPRESAS,
  SEED_ESCOPOS,
  SEED_SERVICOS_PRODUTO,
  SEED_TIPOS_ATIVIDADE,
  SEED_UNIDADES,
} from "./mock-data";

interface LookupState {
  empresa: LookupItem[];
  unidade: LookupItem[];
  assunto: LookupItem[];
  tipoAtividade: LookupItem[];
  servicoProduto: LookupItem[];
  escopo: LookupItem[];
  amostragem: LookupItem[];
  categoriaRegistro: LookupItem[];
}

interface AppDataContextValue {
  lookups: LookupState;
  atividades: Atividade[];
  registros: Registro[];
  addLookupItem: (kind: LookupKind, name: string) => string;
  renameLookupItem: (kind: LookupKind, id: string, name: string) => void;
  deactivateLookupItem: (kind: LookupKind, id: string) => void;
  addAtividade: (atividade: Atividade) => void;
  updateAtividade: (id: string, patch: Partial<Atividade>) => void;
  deleteAtividade: (id: string) => void;
  addRegistro: (registro: Registro) => void;
  updateRegistro: (id: string, patch: Partial<Registro>) => void;
  deleteRegistro: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

let runtimeIdCounter = 0;
function makeId(prefix: string) {
  runtimeIdCounter += 1;
  return `${prefix}-new-${runtimeIdCounter}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [lookups, setLookups] = useState<LookupState>({
    empresa: SEED_EMPRESAS,
    unidade: SEED_UNIDADES,
    assunto: SEED_ASSUNTOS,
    tipoAtividade: SEED_TIPOS_ATIVIDADE,
    servicoProduto: SEED_SERVICOS_PRODUTO,
    escopo: SEED_ESCOPOS,
    amostragem: SEED_AMOSTRAGENS,
    categoriaRegistro: SEED_CATEGORIAS_REGISTRO,
  });
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const addLookupItem = useCallback((kind: LookupKind, name: string) => {
    const id = makeId(kind);
    setLookups((prev) => ({
      ...prev,
      [kind]: [...prev[kind], { id, name, active: true }],
    }));
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
  }, []);

  const addAtividade = useCallback((atividade: Atividade) => {
    setAtividades((prev) => [atividade, ...prev]);
  }, []);

  const updateAtividade = useCallback((id: string, patch: Partial<Atividade>) => {
    setAtividades((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }, []);

  const deleteAtividade = useCallback((id: string) => {
    setAtividades((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addRegistro = useCallback((registro: Registro) => {
    setRegistros((prev) => [registro, ...prev]);
  }, []);

  const updateRegistro = useCallback((id: string, patch: Partial<Registro>) => {
    setRegistros((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }, []);

  const deleteRegistro = useCallback((id: string) => {
    setRegistros((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      lookups,
      atividades,
      registros,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addRegistro,
      updateRegistro,
      deleteRegistro,
    }),
    [
      lookups,
      atividades,
      registros,
      addLookupItem,
      renameLookupItem,
      deactivateLookupItem,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addRegistro,
      updateRegistro,
      deleteRegistro,
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
  return makeId("atividade");
}

export function makePropostaId() {
  return makeId("proposta");
}

export function makeChecklistItemId() {
  return makeId("checklist");
}

export function makeRegistroId() {
  return makeId("registro");
}

export function makeRegistroTabId() {
  return makeId("registroTab");
}
