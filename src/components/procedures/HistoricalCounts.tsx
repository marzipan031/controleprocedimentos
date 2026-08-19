import { useState } from "react";
import { History, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HistoricalCount } from "@/lib/procedures-store";

function EditableHistoricalCard({
  entry,
  onChange,
  onRemove,
}: {
  entry: HistoricalCount;
  onChange: (value: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardContent className="flex items-center justify-between gap-3 py-5">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{entry.type} (histórico)</p>
          {editing ? (
            <Input
              type="number"
              min={0}
              defaultValue={entry.value}
              autoFocus
              className="mt-1 h-10 text-2xl font-semibold tabular-nums"
              onBlur={(e) => {
                onChange(Math.max(0, Number(e.target.value) || 0));
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onChange(Math.max(0, Number((e.target as HTMLInputElement).value) || 0));
                  setEditing(false);
                }
                if (e.key === "Escape") setEditing(false);
              }}
            />
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-semibold tabular-nums">{entry.value}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditing(true)}
                aria-label={`Editar ${entry.type} histórico`}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <History className="size-8 text-primary/70" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remover histórico de ${entry.type}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function HistoricalCounts({
  entries,
  onChange,
  onRemove,
}: {
  entries: HistoricalCount[];
  onChange: (id: string, value: number) => void;
  onRemove: (id: string) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Valores históricos</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {entries.map((entry) => (
          <EditableHistoricalCard
            key={entry.id}
            entry={entry}
            onChange={(value) => onChange(entry.id, value)}
            onRemove={() => onRemove(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}
