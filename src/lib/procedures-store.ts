import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "./supabase";

export type ProcedureRecord = {
  id: string;
  patient: string;
  date: string; // yyyy-MM-dd
  /** Texto legível dos tipos (ex.: "Endoscopia + Colonoscopia"). */
  type: string;
  /** Lista de tipos marcados. Fonte da verdade. */
  types?: string[];
  /** Número de atendimento do paciente (opcional). */
  encounterNumber?: string;
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
  migrated: "procedimentos:migrated",
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

/**
 * Sem Supabase configurado, os dados ficam só no navegador (localStorage) —
 * mesmo comportamento de sempre, útil para rodar o app sem backend.
 */
function useLocalProceduresData() {
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
    loading: false,
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

// --- Mapeamento entre linhas do Supabase (snake_case) e o app ------------

type ProcedureRow = {
  id: string;
  patient: string;
  date: string;
  type: string;
  types: string[] | null;
  encounter_number: string | null;
  chief: string | null;
  observation: string | null;
  findings: string | null;
  biopsy: boolean | null;
  interesting: boolean | null;
  created_at: string;
};

function rowToRecord(row: ProcedureRow): ProcedureRecord {
  return {
    id: row.id,
    patient: row.patient,
    date: row.date,
    type: row.type,
    types: row.types ?? undefined,
    encounterNumber: row.encounter_number ?? undefined,
    chief: row.chief ?? "",
    observation: row.observation ?? "",
    findings: row.findings ?? "",
    biopsy: row.biopsy ?? false,
    interesting: row.interesting ?? false,
    created_at: row.created_at,
  };
}

/** Para inserir/restaurar um registro completo — ausências viram valores padrão. */
function recordToInsertRow(r: Partial<ProcedureRecord>) {
  const row: Record<string, unknown> = {
    patient: r.patient,
    date: r.date,
    type: r.type,
    types: r.types ?? [],
    encounter_number: r.encounterNumber || null,
    chief: r.chief || "",
    observation: r.observation || "",
    findings: r.findings || "",
    biopsy: !!r.biopsy,
    interesting: !!r.interesting,
  };
  if (r.id) row.id = r.id;
  if (r.created_at) row.created_at = r.created_at;
  return row;
}

/**
 * Para atualização parcial — só inclui os campos realmente presentes no
 * patch. Diferente de recordToInsertRow: aqui um campo ausente significa
 * "não mexer nele", não "limpar para o valor padrão".
 */
function recordToUpdateRow(patch: Partial<ProcedureRecord>) {
  const row: Record<string, unknown> = {};
  if (patch.patient !== undefined) row.patient = patch.patient;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.types !== undefined) row.types = patch.types;
  if (patch.encounterNumber !== undefined) row.encounter_number = patch.encounterNumber || null;
  if (patch.chief !== undefined) row.chief = patch.chief;
  if (patch.observation !== undefined) row.observation = patch.observation;
  if (patch.findings !== undefined) row.findings = patch.findings;
  if (patch.biopsy !== undefined) row.biopsy = patch.biopsy;
  if (patch.interesting !== undefined) row.interesting = patch.interesting;
  return row;
}

function rowToCombo(row: { id: string; types: string[] }): ComboCard {
  return { id: row.id, types: row.types ?? [] };
}

function rowToHistorical(row: { id: string; type: string; value: number }): HistoricalCount {
  return { id: row.id, type: row.type, value: row.value };
}

/**
 * O Supabase limita cada resposta a 1000 linhas por padrão — sem paginar,
 * quem tem mais de 1000 procedimentos via só os mais recentes e os mais
 * antigos "somem" (na verdade continuam no banco, só não são buscados).
 * Aqui buscamos em páginas até trazer tudo.
 */
async function fetchAllProcedures(targetId: string): Promise<{
  data: ProcedureRow[] | null;
  error: { message: string } | null;
}> {
  const pageSize = 1000;
  const all: ProcedureRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("procedures")
      .select("*")
      .eq("created_by", targetId)
      .order("date", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    const batch = (data as ProcedureRow[] | null) ?? [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return { data: all, error: null };
}

/**
 * Dados compartilhados da equipe na nuvem (Supabase), protegidos por login.
 *
 * Por padrão só traz os PRÓPRIOS procedimentos, mesmo para admin — os
 * dados de cada usuário não ficam misturados. Passe `viewUserId` (só
 * respeitado pelo RLS se quem está logado for admin) para ver os
 * procedimentos de outra pessoa especificamente.
 */
function useCloudProceduresData(viewUserId?: string) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ProcedureRecord[]>([]);
  const [types, setTypesState] = useState<string[]>([]);
  const [chiefs, setChiefsState] = useState<string[]>([]);
  const [historicalCounts, setHistoricalCounts] = useState<HistoricalCount[]>([]);
  const [comboCards, setComboCards] = useState<ComboCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const targetId = viewUserId || userData.user?.id;
      if (!targetId) {
        if (!cancelled) setLoading(false);
        return;
      }

      const [recRes, typesRes, chiefsRes, histRes, comboRes] = await Promise.all([
        fetchAllProcedures(targetId),
        supabase.from("procedure_types").select("*").order("created_at", { ascending: true }),
        supabase.from("chiefs").select("*").order("created_at", { ascending: true }),
        supabase.from("historical_counts").select("*"),
        supabase.from("combo_cards").select("*"),
      ]);
      if (cancelled) return;

      if (recRes.error) {
        toast.error("Não foi possível carregar todos os procedimentos da nuvem.");
      }

      let typeNames = (typesRes.data ?? []).map((r) => r.name as string);
      let chiefNames = (chiefsRes.data ?? []).map((r) => r.name as string);
      let combos = (comboRes.data ?? []).map(rowToCombo);

      // Primeira vez que alguém usa a nuvem: semeia os valores padrão.
      if (typesRes.data && typesRes.data.length === 0) {
        const { data } = await supabase
          .from("procedure_types")
          .insert(DEFAULT_TYPES.map((name) => ({ name })))
          .select();
        if (data) typeNames = data.map((r) => r.name as string);
      }
      if (chiefsRes.data && chiefsRes.data.length === 0) {
        const { data } = await supabase
          .from("chiefs")
          .insert(DEFAULT_CHIEFS.map((name) => ({ name })))
          .select();
        if (data) chiefNames = data.map((r) => r.name as string);
      }
      if (comboRes.data && comboRes.data.length === 0) {
        const { data } = await supabase
          .from("combo_cards")
          .insert(DEFAULT_COMBO_CARDS.map((c) => ({ types: c.types })))
          .select();
        if (data) combos = data.map(rowToCombo);
      }

      if (cancelled) return;
      setRecords(((recRes.data as ProcedureRow[] | null) ?? []).map(rowToRecord));
      setTypesState(typeNames);
      setChiefsState(chiefNames);
      setHistoricalCounts((histRes.data ?? []).map(rowToHistorical));
      setComboCards(combos);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [viewUserId]);

  const addRecord = useCallback(async (r: Omit<ProcedureRecord, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("procedures")
      .insert(recordToInsertRow(r))
      .select()
      .single();
    if (error || !data) {
      toast.error("Não foi possível salvar o registro na nuvem.");
      return;
    }
    setRecords((prev) => [rowToRecord(data as ProcedureRow), ...prev]);
  }, []);

  const updateRecord = useCallback(async (id: string, patch: Partial<ProcedureRecord>) => {
    const { error } = await supabase
      .from("procedures")
      .update(recordToUpdateRow(patch))
      .eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar o registro na nuvem.");
      return;
    }
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRecord = useCallback(async (id: string) => {
    const { error } = await supabase.from("procedures").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir o registro na nuvem.");
      return;
    }
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const removeMany = useCallback(async (ids: string[]) => {
    const { error } = await supabase.from("procedures").delete().in("id", ids);
    if (error) {
      toast.error("Não foi possível excluir os registros na nuvem.");
      return;
    }
    const set = new Set(ids);
    setRecords((prev) => prev.filter((r) => !set.has(r.id)));
  }, []);

  /** Re-insert previously removed records (undo), preservando id e data original. */
  const restoreRecords = useCallback(async (rows: ProcedureRecord[]) => {
    if (rows.length === 0) return;
    const { data, error } = await supabase
      .from("procedures")
      .insert(rows.map((r) => recordToInsertRow(r)))
      .select();
    if (error) {
      toast.error("Não foi possível restaurar os registros na nuvem.");
      return;
    }
    setRecords((prev) => {
      const existing = new Set(prev.map((r) => r.id));
      const restored = ((data as ProcedureRow[] | null) ?? [])
        .map(rowToRecord)
        .filter((r) => !existing.has(r.id));
      return [...restored, ...prev];
    });
  }, []);

  const setTypes = useCallback(
    async (next: string[]) => {
      const added = next.filter((x) => !types.includes(x));
      const removed = types.filter((x) => !next.includes(x));
      setTypesState(next);
      if (added.length) {
        const { error } = await supabase
          .from("procedure_types")
          .insert(added.map((name) => ({ name })));
        if (error) toast.error("Não foi possível adicionar o tipo na nuvem.");
      }
      if (removed.length) {
        const { error } = await supabase.from("procedure_types").delete().in("name", removed);
        if (error) toast.error("Não foi possível remover o tipo na nuvem.");
      }
    },
    [types],
  );

  const setChiefs = useCallback(
    async (next: string[]) => {
      const added = next.filter((x) => !chiefs.includes(x));
      const removed = chiefs.filter((x) => !next.includes(x));
      setChiefsState(next);
      if (added.length) {
        const { error } = await supabase.from("chiefs").insert(added.map((name) => ({ name })));
        if (error) toast.error("Não foi possível adicionar o chefe na nuvem.");
      }
      if (removed.length) {
        const { error } = await supabase.from("chiefs").delete().in("name", removed);
        if (error) toast.error("Não foi possível remover o chefe na nuvem.");
      }
    },
    [chiefs],
  );

  const addHistoricalCount = useCallback(async (type: string, value: number) => {
    const { data, error } = await supabase
      .from("historical_counts")
      .insert({ type, value: Math.max(0, value) })
      .select()
      .single();
    if (error || !data) {
      toast.error("Não foi possível adicionar o histórico na nuvem.");
      return;
    }
    setHistoricalCounts((prev) => [...prev, rowToHistorical(data)]);
  }, []);

  const updateHistoricalCount = useCallback(async (id: string, value: number) => {
    const v = Math.max(0, value);
    const { error } = await supabase.from("historical_counts").update({ value: v }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar o histórico na nuvem.");
      return;
    }
    setHistoricalCounts((prev) => prev.map((h) => (h.id === id ? { ...h, value: v } : h)));
  }, []);

  const removeHistoricalCount = useCallback(async (id: string) => {
    const { error } = await supabase.from("historical_counts").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover o histórico na nuvem.");
      return;
    }
    setHistoricalCounts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const addComboCard = useCallback(async (comboTypes: string[]) => {
    const { data, error } = await supabase
      .from("combo_cards")
      .insert({ types: comboTypes })
      .select()
      .single();
    if (error || !data) {
      toast.error("Não foi possível criar a combinação na nuvem.");
      return;
    }
    setComboCards((prev) => [...prev, rowToCombo(data)]);
  }, []);

  const removeComboCard = useCallback(async (id: string) => {
    const { error } = await supabase.from("combo_cards").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover a combinação na nuvem.");
      return;
    }
    setComboCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    loading,
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

/**
 * `viewUserId` só se aplica com a nuvem configurada, e só tem efeito de
 * verdade se quem está logado for admin — o RLS do banco garante isso
 * mesmo que o parâmetro seja adulterado no cliente.
 */
export function useProceduresData(viewUserId?: string) {
  // isSupabaseConfigured vem de variáveis de ambiente fixadas no build:
  // nunca muda durante a vida do app, então alternar de hook aqui é seguro
  // (mesmo sem o linter conseguir provar isso estaticamente).
  // oxlint-disable-next-line react-hooks/rules-of-hooks
  if (isSupabaseConfigured) return useCloudProceduresData(viewUserId);
  // oxlint-disable-next-line react-hooks/rules-of-hooks
  return useLocalProceduresData();
}

/** Existem dados salvos só neste navegador, de antes da nuvem, ainda não importados? */
export function hasLocalLegacyData(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(KEYS.migrated)) return false;
    const raw = window.localStorage.getItem(KEYS.records);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

/** Importa os dados salvos neste navegador para a nuvem (uso único). */
export async function migrateLocalDataToCloud(): Promise<{ ok: boolean; count: number }> {
  const localRecords = read<ProcedureRecord[]>(KEYS.records, []);
  const localTypes = read<string[]>(KEYS.types, []);
  const localChiefs = read<string[]>(KEYS.chiefs, []);
  const localHistorical = read<HistoricalCount[]>(KEYS.historicalCounts, []);
  const localCombos = read<ComboCard[]>(KEYS.comboCards, []);

  try {
    if (localRecords.length) {
      const { error } = await supabase
        .from("procedures")
        .insert(localRecords.map((r) => recordToInsertRow(r)));
      if (error) throw error;
    }
    if (localTypes.length) {
      await supabase
        .from("procedure_types")
        .upsert(
          localTypes.map((name) => ({ name })),
          { onConflict: "name", ignoreDuplicates: true },
        );
    }
    if (localChiefs.length) {
      await supabase
        .from("chiefs")
        .upsert(
          localChiefs.map((name) => ({ name })),
          { onConflict: "name", ignoreDuplicates: true },
        );
    }
    if (localHistorical.length) {
      await supabase
        .from("historical_counts")
        .insert(localHistorical.map((h) => ({ type: h.type, value: h.value })));
    }
    if (localCombos.length) {
      await supabase.from("combo_cards").insert(localCombos.map((c) => ({ types: c.types })));
    }
    // Depois de importado com sucesso, não deixamos dado de paciente
    // guardado no navegador — só a nuvem passa a ser a fonte dos dados.
    window.localStorage.removeItem(KEYS.records);
    window.localStorage.removeItem(KEYS.types);
    window.localStorage.removeItem(KEYS.chiefs);
    window.localStorage.removeItem(KEYS.historicalCounts);
    window.localStorage.removeItem(KEYS.comboCards);
    window.localStorage.setItem(KEYS.migrated, "1");
    return { ok: true, count: localRecords.length };
  } catch {
    return { ok: false, count: 0 };
  }
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

/**
 * Converte um timestamp UTC (ex.: created_at do Supabase, tipo
 * "2026-08-20T23:47:00+00:00") para a data local do Brasil (AAAA-MM-DD).
 * Sem isso, um cadastro feito após ~21h no Brasil cai no dia seguinte em
 * UTC e mostra a data errada.
 */
export function brazilDateFromTimestamp(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(isoTimestamp),
  );
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
    "Atendimento",
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
      r.encounterNumber || "-",
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
