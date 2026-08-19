import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { todayISO, type ProcedureRecord } from "@/lib/procedures-store";

type NewRecord = Omit<ProcedureRecord, "id" | "created_at">;

const norm = (s: string) =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const FIELDS = {
  date: ["data", "data do procedimento", "data do exame", "data exame"],
  patient: ["paciente", "nome", "nome do paciente"],
  encounterNumber: ["atendimento", "numero de atendimento", "no atendimento", "nº atendimento"],
  type: ["tipo", "tipo de procedimento", "tipo de exame", "procedimento", "exame"],
  chief: ["chefe", "chefe responsavel", "responsavel", "medico"],
  observation: ["observacao", "observacoes", "obs", "nota", "notas"],
  findings: ["achados", "achados endoscopicos", "achado"],
  biopsy: ["biopsia", "checar biopsia", "checar biópsia"],
  interesting: ["interessante"],
};

const truthy = (v: unknown) =>
  ["sim", "s", "true", "1", "x", "yes", "verdadeiro"].includes(
    String(v ?? "").trim().toLowerCase(),
  );

/** Divide "Apendicectomia + Endoscopia" / "Endoscopia, Colonoscopia" em tipos separados. */
function parseTypes(raw: string): string[] {
  const parts = raw
    .split(/[+,;/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const k of Object.keys(row)) {
    if (keys.includes(norm(k))) return row[k];
  }
  return undefined;
}

function toISODate(value: unknown): string {
  if (value == null || value === "") return todayISO();
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) {
      const p = (n: number) => String(n).padStart(2, "0");
      return `${d.y}-${p(d.m)}-${p(d.d)}`;
    }
  }
  const s = String(value).trim();
  const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (br) {
    const d = br[1]!;
    const m = br[2]!;
    const y = br[3]!;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${parsed.getFullYear()}-${p(parsed.getMonth() + 1)}-${p(parsed.getDate())}`;
  }
  return todayISO();
}

export function ImportDialog({
  onImport,
}: {
  onImport: (rows: NewRecord[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const first = wb.SheetNames[0];
      const sheet = first ? wb.Sheets[first] : undefined;
      if (!sheet) {
        toast.error("Planilha vazia.");
        return;
      }
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows: NewRecord[] = [];
      for (const row of json) {
        const patient = String(pick(row, FIELDS.patient) ?? "").trim();
        const type = String(pick(row, FIELDS.type) ?? "").trim();
        const chief = String(pick(row, FIELDS.chief) ?? "").trim();
        if (!patient && !type && !chief) continue;
        const parsedTypes = parseTypes(type);
        rows.push({
          patient: patient.slice(0, 120) || "Sem nome",
          date: toISODate(pick(row, FIELDS.date)),
          type: parsedTypes.join(" + "),
          types: parsedTypes,
          encounterNumber: String(pick(row, FIELDS.encounterNumber) ?? "").trim().slice(0, 60),
          chief,

          observation: String(pick(row, FIELDS.observation) ?? "").trim().slice(0, 500),
          findings: String(pick(row, FIELDS.findings) ?? "").trim().slice(0, 1000),
          biopsy: truthy(pick(row, FIELDS.biopsy)),
          interesting: truthy(pick(row, FIELDS.interesting)),
        });
      }
      if (rows.length === 0) {
        toast.error("Nenhuma linha válida encontrada. Verifique os cabeçalhos.");
        return;
      }
      onImport(rows);
      toast.success(`${rows.length} registro(s) importado(s).`);
      setOpen(false);
    } catch {
      toast.error("Não foi possível ler o arquivo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" /> Importar planilha
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Excel ou CSV</DialogTitle>
          <DialogDescription>
            O arquivo deve ter uma linha de cabeçalho com as colunas: Data, Paciente, Tipo de
            Procedimento, Chefe Responsável e Observação (opcional). Tipos e chefes novos são
            cadastrados automaticamente.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,text/csv"
          className="block w-full cursor-pointer rounded-md border border-input bg-background p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-secondary-foreground"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
