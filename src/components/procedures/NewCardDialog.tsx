import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { ComboCard, HistoricalCount } from "@/lib/procedures-store";

export function NewCardDialog({
  types,
  comboCards,
  historicalCounts,
  onAddCombo,
  onAddHistorical,
}: {
  types: string[];
  comboCards: ComboCard[];
  historicalCounts: HistoricalCount[];
  onAddCombo: (types: string[]) => void;
  onAddHistorical: (type: string, value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comboSelected, setComboSelected] = useState<string[]>([]);
  const [histType, setHistType] = useState("");
  const [histValue, setHistValue] = useState("0");

  const typesWithoutHistorical = types.filter(
    (t) => !historicalCounts.some((h) => h.type === t),
  );

  const resetAndClose = () => {
    setComboSelected([]);
    setHistType("");
    setHistValue("0");
    setOpen(false);
  };

  const submitCombo = () => {
    if (comboSelected.length < 2) {
      toast.error("Selecione ao menos 2 tipos para a combinação.");
      return;
    }
    const sortedNew = [...comboSelected].sort();
    const exists = comboCards.some((c) => {
      const sortedExisting = [...c.types].sort();
      return (
        sortedExisting.length === sortedNew.length &&
        sortedExisting.every((t, i) => t === sortedNew[i])
      );
    });
    if (exists) {
      toast.error("Essa combinação já existe.");
      return;
    }
    onAddCombo(comboSelected);
    toast.success(`Card "${comboSelected.join(" + ")}" criado.`);
    resetAndClose();
  };

  const submitHistorical = () => {
    if (!histType) {
      toast.error("Selecione um tipo.");
      return;
    }
    const value = Math.max(0, Number(histValue) || 0);
    onAddHistorical(histType, value);
    toast.success(`Valor histórico de "${histType}" adicionado.`);
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Novo card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo card de estatística</DialogTitle>
          <DialogDescription>
            Crie um card de combinação de tipos ou um valor histórico somado a um tipo existente.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="combo">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="combo">Combinação de tipos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="combo" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Selecione 2 ou mais tipos</Label>
              <div className="flex max-h-48 flex-wrap gap-x-5 gap-y-2 overflow-y-auto rounded-md border border-input p-3">
                {types.length === 0 && (
                  <span className="text-sm text-muted-foreground">Nenhum tipo cadastrado.</span>
                )}
                {types.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <Checkbox
                      id={`combo-${t}`}
                      checked={comboSelected.includes(t)}
                      onCheckedChange={(v) =>
                        setComboSelected((prev) =>
                          v === true ? [...prev, t] : prev.filter((x) => x !== t),
                        )
                      }
                    />
                    <Label htmlFor={`combo-${t}`} className="cursor-pointer font-normal">
                      {t}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={submitCombo}>
              Criar combinação
            </Button>
          </TabsContent>

          <TabsContent value="historico" className="mt-4 space-y-4">
            {typesWithoutHistorical.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos os tipos já têm um valor histórico. Edite o valor existente na lista abaixo
                dos cards.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={histType} onValueChange={setHistType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesWithoutHistorical.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hist-value">Quantidade</Label>
                  <Input
                    id="hist-value"
                    type="number"
                    min={0}
                    value={histValue}
                    onChange={(e) => setHistValue(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={submitHistorical}>
                  Adicionar
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
