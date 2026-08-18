import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import {
  countColonoscopias,
  countEndoscopias,
  countOutros,
  countTotal,
  type ExamRecord,
} from "@/lib/exams-store";

export function ChiefMetrics({
  rows,
  chiefs,
}: {
  rows: ExamRecord[];
  chiefs: string[];
}) {
  const sortedChiefs = useMemo(
    () => [...chiefs].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [chiefs],
  );

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-5 text-primary" /> Métricas por chefe responsável
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chefe</TableHead>
              <TableHead className="text-right">Endoscopias</TableHead>
              <TableHead className="text-right">Colonoscopias</TableHead>
              <TableHead className="text-right">Outros</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedChiefs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum chefe cadastrado.
                </TableCell>
              </TableRow>
            )}
            {sortedChiefs.map((c) => {
              const sub = rows.filter((r) => r.chief === c);
              return (
                <TableRow key={c}>
                  <TableCell className="font-medium">{c}</TableCell>
                  <TableCell className="text-right tabular-nums">{countEndoscopias(sub)}</TableCell>
                  <TableCell className="text-right tabular-nums">{countColonoscopias(sub)}</TableCell>
                  <TableCell className="text-right tabular-nums">{countOutros(sub)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{countTotal(sub)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
