import { useState } from "react";
import { Activity, ClipboardList, History, Microscope, Pencil, Pill, ScanLine, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  countBoth,
  countColonoscopias,
  countEndoscopias,
  countTotal,
  hasType,
  type ExamRecord,
} from "@/lib/exams-store";

function Metric({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight
          ? "border-transparent bg-[image:var(--gradient-header)] text-primary-foreground shadow-[var(--shadow-card)]"
          : "shadow-[var(--shadow-card)]"
      }
    >
      <CardContent className="flex items-center justify-between gap-3 py-5">
        <div>
          <p className={highlight ? "text-xs opacity-90" : "text-xs text-muted-foreground"}>{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <Icon className={highlight ? "size-8 opacity-80" : "size-8 text-primary/70"} />
      </CardContent>
    </Card>
  );
}

function EditableMetric({
  label,
  value,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  onChange: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardContent className="flex items-center justify-between gap-3 py-5">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {editing ? (
            <Input
              type="number"
              min={0}
              defaultValue={value}
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
              <span className="text-3xl font-semibold tabular-nums">{value}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditing(true)}
                aria-label={`Editar ${label}`}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          )}
        </div>
        <Icon className="size-8 text-primary/70" />
      </CardContent>
    </Card>
  );
}

export function MetricsPanel({
  rows,
  previousEndoscopias,
  previousGastrostomias,
  onPreviousEndoscopiasChange,
  onPreviousGastrostomiasChange,
}: {
  rows: ExamRecord[];
  previousEndoscopias: number;
  previousGastrostomias: number;
  onPreviousEndoscopiasChange: (value: number) => void;
  onPreviousGastrostomiasChange: (value: number) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Endoscopia" value={countEndoscopias(rows)} icon={Microscope} highlight />
        <Metric label="Colonoscopia" value={countColonoscopias(rows)} icon={Activity} highlight />
        <Metric label="Endoscopia + Colonoscopia" value={countBoth(rows)} icon={Stethoscope} highlight />
        <Metric label="Gastrostomia" value={rows.filter((r) => hasType(r, "Gastrostomia")).length} icon={Pill} highlight />
        <Metric label="Ecoendoscopia" value={rows.filter((r) => hasType(r, "Ecoendoscopia")).length} icon={ScanLine} highlight />
        <Metric label="Exames totais" value={countTotal(rows)} icon={ClipboardList} highlight />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <EditableMetric
          label="Endoscopias anteriores"
          value={previousEndoscopias}
          icon={History}
          onChange={onPreviousEndoscopiasChange}
        />
        <EditableMetric
          label="Gastrostomias anteriores"
          value={previousGastrostomias}
          icon={History}
          onChange={onPreviousGastrostomiasChange}
        />
      </div>
    </section>
  );
}
