import {
  Activity,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Layers,
  Microscope,
  Pill,
  ScanLine,
  Stethoscope,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  countByType,
  countCombo,
  countTotalProcedimentos,
  historicalForType,
  type ComboCard,
  type HistoricalCount,
  type ProcedureRecord,
} from "@/lib/procedures-store";

const TYPE_ICONS = [Stethoscope, Activity, Microscope, ScanLine, Pill, HeartPulse, FlaskConical];

function Metric({
  label,
  value,
  icon: Icon,
  onRemove,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  onRemove?: () => void;
}) {
  return (
    <Card className="relative border-transparent bg-[image:var(--gradient-header)] text-primary-foreground shadow-[var(--shadow-card)]">
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Remover card"
          className="absolute top-1 right-1 size-6 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      )}
      <CardContent className="flex items-center justify-between gap-3 py-5">
        <div>
          <p className="text-xs opacity-90">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <Icon className="size-8 opacity-80" />
      </CardContent>
    </Card>
  );
}

export function TypeCards({
  rows,
  types,
  comboCards,
  historicalCounts,
  onRemoveCombo,
}: {
  rows: ProcedureRecord[];
  types: string[];
  comboCards: ComboCard[];
  historicalCounts: HistoricalCount[];
  onRemoveCombo: (id: string) => void;
}) {
  const total = countTotalProcedimentos(rows) + historicalCounts.reduce((a, h) => a + h.value, 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {types.map((t, i) => (
        <Metric
          key={t}
          label={t}
          value={countByType(rows, t) + historicalForType(historicalCounts, t)}
          icon={TYPE_ICONS[i % TYPE_ICONS.length]!}
        />
      ))}
      {comboCards.map((c) => (
        <Metric
          key={c.id}
          label={c.types.join(" + ")}
          value={countCombo(rows, c.types)}
          icon={Layers}
          onRemove={() => onRemoveCombo(c.id)}
        />
      ))}
      <Metric label="Total de procedimentos" value={total} icon={ClipboardList} />
    </div>
  );
}
