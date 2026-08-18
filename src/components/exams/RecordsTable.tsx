import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateBR, recordTypes, type ExamRecord } from "@/lib/exams-store";

const TYPE_STYLES: Record<string, string> = {
  Endoscopia: "bg-chart-1/12 text-chart-1 border-chart-1/30",
  Colonoscopia: "bg-chart-2/12 text-chart-2 border-chart-2/30",
  "EDA + Colono": "bg-chart-3/12 text-chart-3 border-chart-3/30",
  Gastrostomia: "bg-chart-4/12 text-chart-4 border-chart-4/30",
  Ecoendoscopia: "bg-chart-5/12 text-chart-5 border-chart-5/30",
};

export function RecordsTable({
  rows,
  selectedIds,
  onEdit,
  onDelete,
  onToggle,
  onSelect,
  onSelectAll,
  onDeleteSelected,
}: {
  rows: ExamRecord[];
  selectedIds: Set<string>;
  onEdit: (r: ExamRecord) => void;
  onDelete: (r: ExamRecord) => void;
  onToggle: (r: ExamRecord, field: "biopsy" | "interesting", value: boolean) => void;
  onSelect: (id: string, value: boolean) => void;
  onSelectAll: (value: boolean) => void;
  onDeleteSelected: () => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id)) && !allSelected;

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">
          Registros{" "}
          <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
        </CardTitle>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selecionado(s)</span>
            <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="size-4" /> Excluir selecionados
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">
                <Checkbox
                  aria-label="Selecionar todos visíveis"
                  checked={rows.length === 0 ? false : allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => onSelectAll(v === true)}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo de exame</TableHead>
              <TableHead>Chefe responsável</TableHead>
              <TableHead>Achados endoscópicos</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="text-center">Checar biópsia</TableHead>
              <TableHead className="text-center">Interessante</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                  Nenhum exame encontrado.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-center">
                  <Checkbox
                    aria-label={`Selecionar exame de ${r.patient}`}
                    checked={selectedIds.has(r.id)}
                    onCheckedChange={(v) => onSelect(r.id, v === true)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDateBR(r.date)}</TableCell>
                <TableCell className="font-medium">{r.patient}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {recordTypes(r).map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className={TYPE_STYLES[t] ?? "bg-muted text-muted-foreground"}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell>{r.chief}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground" title={r.findings || undefined}>
                  {r.findings || "-"}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground" title={r.observation || undefined}>
                  {r.observation || "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    aria-label="Checar biópsia"
                    checked={!!r.biopsy}
                    onCheckedChange={(v) => onToggle(r, "biopsy", v === true)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    aria-label="Interessante"
                    checked={!!r.interesting}
                    onCheckedChange={(v) => onToggle(r, "interesting", v === true)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => onEdit(r)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir"
                    onClick={() => onDelete(r)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
