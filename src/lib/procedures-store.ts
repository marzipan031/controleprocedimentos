import { useCallback, useEffect, useState } from "react";

export type ProcedureRecord = {
  id: string;
  patient: string;
  date: string; // yyyy-MM-dd
  /** Texto legível dos tipos (ex.: "Endoscopia + Colonoscopia"). */
  type: string;
  /** Lista de tipos marcados. Fonte da verdade. */
  types?: string[];
  chief: string;
  observation: string;
  findings?: string;
  biopsy?: boolean;
  interesting?: boolean;
  created_at: string;
};

/** Valor histórico (pré-app) somado ao card de um tipo específico. */
export type HistoricalCount = {
  id: string;
  type: string;
  value: number;
};

/** Card de combinação: conta registros que têm TODOS os tipos listados. */
export type ComboCard = {
  id: string;
  types: string[];
};

export const DEFAULT_TYPES = ["Endoscopia", "Colonoscopia", "Gastrostomia", "Ecoendoscopia"];

export const DEFAULT_CHIEFS = ["Dr. Silva", "Dra. Martins"];

export const DEFAULT_COMBO_CARDS: ComboCard[] = [
  { id: "combo-endoscopia-colonoscopia", types: ["Endoscopia", "Colonoscopia"] },
];

const KEYS = {
  records: "procedimentos:records",
  types: "procedimentos:types",
  chiefs: "procedimentos:chiefs",
  historicalCounts: "procedimentos:historicalCounts",
  comboCards: "procedimentos:comboCards",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Simple localStorage-backed state. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}

export function useProceduresData() {
  const [records, setRecords] = usePersistentState<ProcedureRecord[]>(KEYS.records, []);
  const [types, setTypes] = usePersistentState<string[]>(KEYS.types, DEFAULT_TYPES);
  const [chiefs, setChiefs] = usePersistentState<string[]>(KEYS.chiefs, DEFAULT_CHIEFS);
  const [historicalCounts, setHistoricalCounts] = usePersistentState<HistoricalCount[]>(
    KEYS.historicalCounts,
    [],
  );
  const [comboCards, setComboCards] = usePersistentState<ComboCard[]>(
    KEYS.comboCards,
    DEFAULT_COMBO_CARDS,
  );

  const addRecord = useCallback(
    (r: Omit<ProcedureRecord, "id" | "created_at">) =>
      setRecords((prev) => [
        { ...r, id: crypto.randomUUID(), created_at: new Date().toISOString() },
        ...prev,
      ]),
    [setRecords],
  );

  const updateRecord = useCallback(
    (id: string, patch: Partial<ProcedureRecord>) =>
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [setRecords],
  );

  const removeRecord = useCallback(
    (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id)),
    [setRecords],
  );

  const removeMany = useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      setRecords((prev) => prev.filter((r) => !set.has(r.id)));
    },
    [setRecords],
  );

  /** Re-insert previously removed records (undo). */
  const restoreRecords = useCallback(
    (rows: ProcedureRecord[]) =>
      setRecords((prev) => {
        const existing = new Set(prev.map((r) => r.id));
        return [...rows.filter((r) => !existing.has(r.id)), ...prev];
      }),
    [setRecords],
  );

  const addHistoricalCount = useCallback(
    (type: string, value: number) =>
      setHistoricalCounts((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type, value: Math.max(0, value) },
      ]),
    [setHistoricalCounts],
  );

  const updateHistoricalCount = useCallback(
    (id: string, value: number) =>
      setHistoricalCounts((prev) =>
        prev.map((h) => (h.id === id ? { ...h, value: Math.max(0, value) } : h)),
      ),
    [setHistoricalCounts],
  );

  const removeHistoricalCount = useCallback(
    (id: string) => setHistoricalCounts((prev) => prev.filter((h) => h.id !== id)),
    [setHistoricalCounts],
  );

  const addComboCard = useCallback(
    (comboTypes: string[]) =>
      setComboCards((prev) => [...prev, { id: crypto.randomUUID(), types: [...comboTypes] }]),
    [setComboCards],
  );

  const removeComboCard = useCallback(
    (id: string) => setComboCards((prev) => prev.filter((c) => c.id !== id)),
    [setComboCards],
  );

  return {
    records,
    types,
    chiefs,
    historicalCounts,
    comboCards,
    addRecord,
    updateRecord,
    removeRecord,
    removeMany,
    restoreRecords,
    setTypes,
    setChiefs,
    addHistoricalCount,
    updateHistoricalCount,
    removeHistoricalCount,
    addComboCard,
    removeComboCard,
  };
}

/** Tipos marcados de um registro. */
export function procedureTypes(r: ProcedureRecord): string[] {
  if (r.types?.length) return r.types;
  return r.type ? [r.type] : [];
}

export function hasType(r: ProcedureRecord, t: string) {
  return procedureTypes(r).includes(t);
}

/** Registros que têm o tipo marcado (1 por registro). */
export function countByType(rows: ProcedureRecord[], type: string) {
  return rows.filter((r) => hasType(r, type)).length;
}

/** Registros que têm TODOS os tipos da combinação marcados ao mesmo tempo. */
export function countCombo(rows: ProcedureRecord[], comboTypes: string[]) {
  return rows.filter((r) => comboTypes.every((t) => hasType(r, t))).length;
}

/** Total de procedimentos individuais: cada tipo marcado conta 1. */
export function countTotalProcedimentos(rows: ProcedureRecord[]) {
  return rows.reduce((acc, r) => acc + procedureTypes(r).length, 0);
}

/** Soma de todas as entradas de histórico para um tipo. */
export function historicalForType(historicalCounts: HistoricalCount[], type: string) {
  return historicalCounts
    .filter((h) => h.type === type)
    .reduce((acc, h) => acc + h.value, 0);
}

export function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function todayISO() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function toCSV(rows: ProcedureRecord[]) {
  const head = [
    "Data",
    "Paciente",
    "Tipo de Procedimento",
    "Chefe Responsável",
    "Observação",
    "Achados",
    "Checar Biópsia",
    "Interessante",
  ];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [
      formatDateBR(r.date),
      r.patient,
      r.type,
      r.chief || "-",
      r.observation || "-",
      r.findings || "-",
      r.biopsy ? "Sim" : "Não",
      r.interesting ? "Sim" : "Não",
    ]
      .map(esc)
      .join(";"),
  );
  return "\uFEFF" + [head.map(esc).join(";"), ...body].join("\n");
}
