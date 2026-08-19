import { useRef, useState } from "react";
import { Camera, ImageUp, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Extracted = { patient?: string; date?: string };

function toISODate(day: string, month: string, year: string): string | undefined {
  const y = year.length === 2 ? `20${year}` : year;
  const iso = `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return Number.isNaN(new Date(iso).getTime()) ? undefined : iso;
}

function extractDate(text: string): string | undefined {
  const m = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  return toISODate(d!, mo!, y!);
}

const LABEL_KEYWORDS = ["NOME", "PACIENTE"];
const NOISE_WORDS = [
  "ETIQUETA",
  "HOSPITAL",
  "LABORATORIO",
  "LABORATÓRIO",
  "CLINICA",
  "CLÍNICA",
  "EXAME",
  "AMOSTRA",
  "CONVENIO",
  "CONVÊNIO",
];

/** Etiquetas de paciente costumam trazer o nome em maiúsculas — usamos isso como heurística. */
function extractName(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const upper = line.toUpperCase();
    for (const kw of LABEL_KEYWORDS) {
      if (upper.startsWith(kw)) {
        const afterColon = line.slice(line.indexOf(":") + 1).trim();
        const rest = afterColon || line.slice(kw.length).trim();
        const cleaned = rest.replace(/[^A-Za-zÀ-ÿ\s]/g, "").trim();
        if (cleaned.length >= 3) return cleaned;
      }
    }
  }

  let best: { line: string; score: number } | null = null;
  for (const line of lines) {
    const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
    if (letters.length < 5) continue;
    const upperLetters = letters.replace(/[^A-ZÀ-Þ]/g, "");
    if (upperLetters.length / letters.length < 0.85) continue;
    if (NOISE_WORDS.some((w) => line.toUpperCase().includes(w))) continue;
    if (/\d{2,}/.test(line)) continue;
    if (!best || letters.length > best.score) best = { line, score: letters.length };
  }
  return best?.line.trim();
}

export function LabelScanDialog({ onExtracted }: { onExtracted: (data: Extracted) => void }) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const [patient, setPatient] = useState("");
  const [date, setDate] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setHasResult(false);
    setProcessing(false);
    setPatient("");
    setDate("");
  };

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setHasResult(false);
    setProcessing(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("por");
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const text = data.text || "";
      const foundName = extractName(text);
      const foundDate = extractDate(text);
      setPatient(foundName ?? "");
      setDate(foundDate ?? "");
      if (!foundName && !foundDate) {
        toast.error("Não foi possível identificar nome ou data na imagem. Preencha manualmente.");
      }
      setHasResult(true);
    } catch {
      toast.error("Não foi possível processar a imagem.");
    } finally {
      setProcessing(false);
    }
  };

  const apply = () => {
    onExtracted({ patient: patient.trim() || undefined, date: date || undefined });
    setOpen(false);
    reset();
  };

  const openPicker = (useCamera: boolean) => {
    const input = inputRef.current;
    if (!input) return;
    if (useCamera) input.setAttribute("capture", "environment");
    else input.removeAttribute("capture");
    input.click();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ScanLine className="size-4" /> Escanear etiqueta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escanear etiqueta do paciente</DialogTitle>
          <DialogDescription>
            Tire uma foto ou escolha uma da galeria. O nome (em maiúsculas) e a data são
            extraídos automaticamente — confira antes de aplicar ao formulário.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />

        {!preview ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => openPicker(true)}>
              <Camera className="size-4" /> Tirar foto
            </Button>
            <Button type="button" variant="outline" onClick={() => openPicker(false)}>
              <ImageUp className="size-4" /> Escolher da galeria
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Etiqueta selecionada"
              className="max-h-56 w-full rounded-md border border-border object-contain"
            />

            {processing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Lendo imagem...
              </div>
            ) : (
              hasResult && (
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="scan-patient">Paciente identificado</Label>
                    <Input
                      id="scan-patient"
                      value={patient}
                      onChange={(e) => setPatient(e.target.value)}
                      placeholder="Não identificado — preencha manualmente"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="scan-date">Data identificada</Label>
                    <Input
                      id="scan-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
              )
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => openPicker(true)}>
                <Camera className="size-4" /> Tirar outra foto
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => openPicker(false)}>
                <ImageUp className="size-4" /> Escolher outra da galeria
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={apply} disabled={processing || !hasResult}>
            Aplicar ao formulário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
