import { useEffect, useState } from "react";
import { Save, Stethoscope, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { recordTypes, todayISO, type ExamRecord } from "@/lib/exams-store";
import { ManageListDialog } from "./ManageListDialog";

type Props = {
  types: string[];
  chiefs: string[];
  setTypes: (v: string[]) => void;
  setChiefs: (v: string[]) => void;
  typeUsage: (t: string) => number;
  chiefUsage: (c: string) => number;
  editing: ExamRecord | null;
  onCancelEdit: () => void;
  onSubmit: (data: {
    patient: string;
    date: string;
    type: string;
    types: string[];
    chief: string;
    observation: string;
    findings: string;
    biopsy: boolean;
    interesting: boolean;
  }) => void;
};

export function ExamForm({
  types,
  chiefs,
  setTypes,
  setChiefs,
  typeUsage,
  chiefUsage,
  editing,
  onCancelEdit,
  onSubmit,
}: Props) {
  const [patient, setPatient] = useState("");
  const [date, setDate] = useState(todayISO());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [chief, setChief] = useState("");

  const [observation, setObservation] = useState("");
  const [findings, setFindings] = useState("");
  const [biopsy, setBiopsy] = useState(false);
  const [interesting, setInteresting] = useState(false);

  useEffect(() => {
    if (editing) {
      setPatient(editing.patient);
      setDate(editing.date);
      setSelectedTypes(recordTypes(editing));
      setChief(editing.chief);
      setObservation(editing.observation || "");
      setFindings(editing.findings || "");
      setBiopsy(!!editing.biopsy);
      setInteresting(!!editing.interesting);
    }
  }, [editing]);

  const reset = () => {
    setPatient("");
    setDate(todayISO());
    setSelectedTypes([]);
    setChief("");
    setObservation("");
    setFindings("");
    setBiopsy(false);
    setInteresting(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = patient.trim();
    if (!name) {
      toast.error("Informe o nome do paciente.");
      return;
    }
    if (name.length > 120) {
      toast.error("Nome muito longo.");
      return;
    }
    if (!date) {
      toast.error("Informe a data do exame.");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Marque ao menos um tipo de exame.");
      return;
    }
    if (!chief) {
      toast.error("Selecione o chefe responsável.");
      return;
    }
    onSubmit({
      patient: name,
      date,
      type: selectedTypes.join(" + "),
      types: selectedTypes,
      chief,
      observation: observation.trim(),
      findings: findings.trim(),
      biopsy,
      interesting,
    });
    reset();
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="size-5 text-primary" />
          {editing ? "Editar exame" : "Adicionar exame"}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <ManageListDialog
            title="Gerenciar tipos de exame"
            description="Adicione ou remova os tipos disponíveis no formulário."
            items={types}
            onChange={setTypes}
            usageCount={typeUsage}
            trigger={
              <Button variant="outline" size="sm">
                <Settings2 className="size-4" /> Tipos
              </Button>
            }
          />
          <ManageListDialog
            title="Gerenciar chefes responsáveis"
            description="Cadastre novos chefes ou remova os existentes."
            items={chiefs}
            onChange={setChiefs}
            usageCount={chiefUsage}
            trigger={
              <Button variant="outline" size="sm">
                <Settings2 className="size-4" /> Chefes
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="patient">Nome do paciente</Label>
            <Input
              id="patient"
              value={patient}
              maxLength={120}
              onChange={(e) => setPatient(e.target.value)}
              placeholder="Ex.: Maria Souza"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data do exame</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Label>Tipos de exame (marque um ou mais)</Label>
            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-input p-3">
              {types.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhum tipo cadastrado.</span>
              )}
              {types.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${t}`}
                    checked={selectedTypes.includes(t)}
                    onCheckedChange={(v) =>
                      setSelectedTypes((prev) =>
                        v === true ? [...prev, t] : prev.filter((x) => x !== t),
                      )
                    }
                  />
                  <Label htmlFor={`type-${t}`} className="cursor-pointer font-normal">
                    {t}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chefe responsável</Label>
            <Select value={chief} onValueChange={setChief}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {chiefs.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-5">
            <Label htmlFor="observation">Observação</Label>
            <Input
              id="observation"
              value={observation}
              maxLength={500}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Informações adicionais sobre o exame (opcional)"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-5">
            <Label htmlFor="findings">Achados endoscópicos</Label>
            <Textarea
              id="findings"
              value={findings}
              maxLength={1000}
              rows={3}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Descreva os achados endoscópicos (opcional)"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6 sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="biopsy"
                checked={biopsy}
                onCheckedChange={(v) => setBiopsy(v === true)}
              />
              <Label htmlFor="biopsy" className="cursor-pointer">
                Checar biópsia
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="interesting"
                checked={interesting}
                onCheckedChange={(v) => setInteresting(v === true)}
              />
              <Label htmlFor="interesting" className="cursor-pointer">
                Interessante
              </Label>
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
            <Button type="submit">
              <Save className="size-4" /> {editing ? "Salvar alterações" : "Salvar registro"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onCancelEdit();
                  reset();
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
