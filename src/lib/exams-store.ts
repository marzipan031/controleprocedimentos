import { useCallback, useEffect, useState } from "react";

export type ExamRecord = {
  id: string;
  patient: string;
  date: string; // yyyy-MM-dd
  /** Texto legível dos tipos (ex.: "Endoscopia + Colonoscopia"). */
  type: string;
  /** Lista de tipos marcados. Registros antigos podem não ter. */
  types?: string[];
  chief: string;
  observation: string;
  findings?: string;
  biopsy?: boolean;
  interesting?: boolean;
  created_at: string;
};

export const DEFAULT_TYPES = [
  "Endoscopia",
  "Colonoscopia",
  "Gastrostomia",
  "Ecoendoscopia",
];

export const DEFAULT_CHIEFS = ["Dr. Silva", "Dra. Martins"];

const KEYS = {
  records: "exames:records",
  types: "exames:types",
  chiefs: "exames:chiefs",
  previousEndoscopias: "exames:previousEndoscopias",
  previousGastrostomias: "exames:previousGastrostomias",
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

export function useExamsData() {
  const [records, setRecords, recordsHydrated] = usePersistentState<ExamRecord[]>(
    KEYS.records,
    [],
  );
  const [types, setTypes, typesHydrated] = usePersistentState<string[]>(
    KEYS.types,
    DEFAULT_TYPES,
  );
  const [chiefs, setChiefs] = usePersistentState<string[]>(KEYS.chiefs, DEFAULT_CHIEFS);
  const [previousEndoscopias, setPreviousEndoscopias] = usePersistentState<number>(
    KEYS.previousEndoscopias,
    0,
  );
  const [previousGastrostomias, setPreviousGastrostomias] = usePersistentState<number>(
    KEYS.previousGastrostomias,
    0,
  );

  /** Migração: "EDA + Colono" vira Endoscopia + Colonoscopia. */
  useEffect(() => {
    if (!recordsHydrated) return;
    setRecords((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        const list = r.types?.length ? r.types : r.type ? [r.type] : [];
        const expanded: string[] = [];
        for (const t of list) {
          const items = t === BOTH ? [ENDO, COLONO] : [t];
          for (const i of items) if (!expanded.includes(i)) expanded.push(i);
        }
        if (expanded.join(" + ") === (r.types ?? []).join(" + ") && r.type === expanded.join(" + "))
          return r;
        changed = true;
        return { ...r, types: expanded, type: expanded.join(" + ") };
      });
      return changed ? next : prev;
    });
  }, [recordsHydrated, setRecords]);

  useEffect(() => {
    if (!typesHydrated) return;
    setTypes((prev) => (prev.includes(BOTH) ? prev.filter((t) => t !== BOTH) : prev));
  }, [typesHydrated, setTypes]);

  const addRecord = useCallback(
    (r: Omit<ExamRecord, "id" | "created_at">) =>
      setRecords((prev) => [
        { ...r, id: crypto.randomUUID(), created_at: new Date().toISOString() },
        ...prev,
      ]),
    [setRecords],
  );

  const updateRecord = useCallback(
    (id: string, patch: Partial<ExamRecord>) =>
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
    (rows: ExamRecord[]) =>
      setRecords((prev) => {
        const existing = new Set(prev.map((r) => r.id));
        return [...rows.filter((r) => !existing.has(r.id)), ...prev];
      }),
    [setRecords],
  );

  return {
    records,
    types,
    chiefs,
    previousEndoscopias,
    previousGastrostomias,
    addRecord,
    updateRecord,
    removeRecord,
    removeMany,
    restoreRecords,
    setTypes,
    setChiefs,
    setPreviousEndoscopias,
    setPreviousGastrostomias,
  };
}

export const ENDO = "Endoscopia";
export const COLONO = "Colonoscopia";
export const BOTH = "EDA + Colono";

/** Tipos marcados de um registro (compatível com registros antigos). */
export function recordTypes(r: ExamRecord): string[] {
  if (r.types?.length) return r.types;
  if (r.type === BOTH) return [ENDO, COLONO];
  return r.type ? [r.type] : [];
}

export function hasType(r: ExamRecord, t: string) {
  return recordTypes(r).includes(t);
}

export function countEndoscopias(rows: ExamRecord[]) {
  return rows.filter((r) => hasType(r, ENDO)).length;
}
export function countColonoscopias(rows: ExamRecord[]) {
  return rows.filter((r) => hasType(r, COLONO)).length;
}

/** Registros que possuem Endoscopia E Colonoscopia marcadas simultaneamente. */
export function countBoth(rows: ExamRecord[]) {
  return rows.filter((r) => hasType(r, ENDO) && hasType(r, COLONO)).length;
}

export function countOutros(rows: ExamRecord[]) {
  return rows.reduce(
    (acc, r) => acc + recordTypes(r).filter((t) => t !== ENDO && t !== COLONO).length,
    0,
  );
}

/** Total de procedimentos individuais: cada tipo marcado conta 1. */
export function countTotalProcedimentos(rows: ExamRecord[]) {
  return rows.reduce((acc, r) => acc + recordTypes(r).length, 0);
}

/** Cada tipo marcado conta como 1 procedimento. */
export function countTotal(rows: ExamRecord[]) {
  return countTotalProcedimentos(rows);
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

export function toCSV(rows: ExamRecord[]) {
  const head = [
    "Data",
    "Paciente",
    "Tipo de Exame",
    "Chefe Responsável",
    "Observação",
    "Achados Endoscópicos",
    "Checar Biópsia",
    "Interessante",
  ];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [
      formatDateBR(r.date),
      r.patient,
      r.type,
      r.chief,
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
