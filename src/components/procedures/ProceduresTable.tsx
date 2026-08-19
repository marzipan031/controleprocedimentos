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
import { formatDateBR, procedureTypes, type ProcedureRecord } from "@/lib/procedures-store";
import { typeBadgeClass } from "@/lib/type-colors";

export function ProceduresTable({
  rows,
  allTypes,
  selectedIds,
  onEdit,
  onDelete,
  onToggle,
  onSelect,
  onSelectAll,
  onDeleteSelected,
}: {
  rows: ProcedureRecord[];
  allTypes: string[];
  selectedIds: Set<string>;
  onEdit: (r: ProcedureRecord) => void;
  onDelete: (r: ProcedureRecord) => void;
  onToggle: (r: ProcedureRecord, field: "biopsy" | "interesting", value: boolean) => void;
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
          Procedimentos{" "}
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
              <TableHead>Atendimento</TableHead>
              <TableHead>Tipo de procedimento</TableHead>
              <TableHead>Chefe responsável</TableHead>
              <TableHead>Achados</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="text-center">Checar biópsia</TableHead>
              <TableHead className="text-center">Interessante</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                  Nenhum procedimento encontrado.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-center">
                  <Checkbox
                    aria-label={`Selecionar procedimento de ${r.patient}`}
                    checked={selectedIds.has(r.id)}
                    onCheckedChange={(v) => onSelect(r.id, v === true)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDateBR(r.date)}</TableCell>
                <TableCell className="font-medium">{r.patient}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {r.encounterNumber || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {procedureTypes(r).map((t) => (
                      <Badge key={t} variant="outline" className={typeBadgeClass(t, allTypes)}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell>{r.chief || "-"}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground" title={r.findings || undefined}>
                  {r.findings || "-"}
                </TableCell>
                <TableCell className="max-w-32 truncate text-muted-foreground" title={r.observation || undefined}>
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
