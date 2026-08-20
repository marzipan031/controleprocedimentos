import { useEffect, useState } from "react";
import { ChevronDown, Plus, Save, Stethoscope, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { procedureTypes, todayISO, type ProcedureRecord } from "@/lib/procedures-store";
import { ManageListDialog } from "./ManageListDialog";
import { LabelScanDialog } from "./LabelScanDialog";

type Props = {
  types: string[];
  chiefs: string[];
  setTypes: (v: string[]) => void;
  setChiefs: (v: string[]) => void;
  typeUsage: (t: string) => number;
  chiefUsage: (c: string) => number;
  editing: ProcedureRecord | null;
  onCancelEdit: () => void;
  onSubmit: (data: {
    patient: string;
    date: string;
    type: string;
    types: string[];
    encounterNumber: string;
    chief: string;
    observation: string;
    findings: string;
    biopsy: boolean;
    interesting: boolean;
  }) => void;
};

export function ProcedureForm({
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
  const [encounterNumber, setEncounterNumber] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeDraft, setTypeDraft] = useState("");
  const [chief, setChief] = useState("");
  const [underSupervision, setUnderSupervision] = useState(false);

  const [observation, setObservation] = useState("");
  const [findings, setFindings] = useState("");
  const [biopsy, setBiopsy] = useState(false);
  const [interesting, setInteresting] = useState(false);

  useEffect(() => {
    if (editing) {
      setPatient(editing.patient);
      setDate(editing.date);
      setEncounterNumber(editing.encounterNumber || "");
      setSelectedTypes(procedureTypes(editing));
      setChief(editing.chief);
      setUnderSupervision(!!editing.chief);
      setObservation(editing.observation || "");
      setFindings(editing.findings || "");
      setBiopsy(!!editing.biopsy);
      setInteresting(!!editing.interesting);
    }
  }, [editing]);

  const reset = () => {
    setPatient("");
    setDate(todayISO());
    setEncounterNumber("");
    setSelectedTypes([]);
    setTypeDraft("");
    setChief("");
    setUnderSupervision(false);
    setObservation("");
    setFindings("");
    setBiopsy(false);
    setInteresting(false);
  };

  const addType = () => {
    const value = typeDraft.trim();
    if (!value) return;
    if (types.some((t) => t.toLowerCase() === value.toLowerCase())) {
      toast.error("Esse tipo já existe.");
      return;
    }
    setTypes([...types, value]);
    setSelectedTypes((prev) => [...prev, value]);
    setTypeDraft("");
    toast.success(`"${value}" adicionado.`);
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
      toast.error("Informe a data do procedimento.");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Marque ao menos um tipo de procedimento.");
      return;
    }
    onSubmit({
      patient: name,
      date,
      type: selectedTypes.join(" + "),
      types: selectedTypes,
      encounterNumber: encounterNumber.trim(),
      chief: underSupervision ? chief : "",
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
          {editing ? "Editar procedimento" : "Adicionar procedimento"}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <LabelScanDialog
            onExtracted={(data) => {
              if (data.patient) setPatient(data.patient);
              if (data.date) setDate(data.date);
            }}
          />
          <ManageListDialog
            title="Gerenciar tipos de procedimento"
            description="Adicione ou remova os tipos disponíveis no formulário. Cada tipo novo ganha automaticamente um card de contagem em Estatísticas."
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
            <Label htmlFor="date">Data do procedimento</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="encounter">Atendimento</Label>
            <Input
              id="encounter"
              value={encounterNumber}
              maxLength={60}
              onChange={(e) => setEncounterNumber(e.target.value)}
              placeholder="Nº do atendimento"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Label>Tipos de procedimento</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between font-normal">
                  <span className="truncate">
                    {selectedTypes.length > 0 ? selectedTypes.join(", ") : "Selecione um ou mais"}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] max-h-72 overflow-auto">
                {types.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum tipo cadastrado.</p>
                )}
                {types.map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t}
                    checked={selectedTypes.includes(t)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(v) =>
                      setSelectedTypes((prev) =>
                        v === true ? [...prev, t] : prev.filter((x) => x !== t),
                      )
                    }
                  >
                    {t}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="flex items-center gap-1 p-1.5">
                  <Input
                    value={typeDraft}
                    onChange={(e) => setTypeDraft(e.target.value)}
                    placeholder="Novo tipo"
                    className="h-8"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addType();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label="Adicionar tipo de procedimento"
                    onClick={addType}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 pt-1.5">
              <Label htmlFor="supervision" className="cursor-pointer">
                Sob supervisão
              </Label>
              <Switch
                id="supervision"
                checked={underSupervision}
                onCheckedChange={(v) => {
                  setUnderSupervision(v);
                  if (!v) setChief("");
                }}
              />
            </div>
            {underSupervision && (
              <Select
                value={chief || "__none__"}
                onValueChange={(v) => setChief(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chefe responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {chiefs.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-5">
            <Label htmlFor="observation">Observação</Label>
            <Input
              id="observation"
              value={observation}
              maxLength={500}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Informações adicionais sobre o procedimento (opcional)"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-5">
            <Label htmlFor="findings">Achados</Label>
            <Textarea
              id="findings"
              value={findings}
              maxLength={1000}
              rows={3}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Descreva os achados do procedimento (opcional)"
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
