import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ChevronDown, ChevronLeft, FlaskConical, Star } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AccountMenu } from "@/components/procedures/AccountMenu";
import { TypeCards } from "@/components/procedures/TypeCards";
import { HistoricalCounts } from "@/components/procedures/HistoricalCounts";
import { NewCardDialog } from "@/components/procedures/NewCardDialog";
import { ChiefTotals } from "@/components/procedures/ChiefTotals";
import { CHART_PALETTE, typeChartColor } from "@/lib/type-colors";
import {
  formatDateBR,
  procedureTypes,
  todayISO,
  useProceduresData,
} from "@/lib/procedures-store";

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${m}/${y}`;
};

const isoOf = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

type PeriodPreset = "hoje" | "7dias" | "30dias" | "mes" | "ano" | "tudo";

const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7dias", label: "7 dias" },
  { id: "30dias", label: "30 dias" },
  { id: "mes", label: "Este mês" },
  { id: "ano", label: "Este ano" },
  { id: "tudo", label: "Tudo" },
];

function presetRange(id: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const today = todayISO();
  switch (id) {
    case "hoje":
      return { from: today, to: today };
    case "7dias": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: isoOf(d), to: today };
    }
    case "30dias": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: isoOf(d), to: today };
    }
    case "mes":
      return { from: isoOf(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case "ano":
      return { from: isoOf(new Date(now.getFullYear(), 0, 1)), to: today };
    case "tudo":
    default:
      return { from: "", to: "" };
  }
}

type ChiefRow = { chief: string; total: number; values: Record<string, number> };
type MonthRow = { month: string; label: string; total: number; values: Record<string, number> };

export default function Estatisticas() {
  useEffect(() => {
    document.title = "Estatísticas de Procedimentos | Gráficos e Filtros";
  }, []);

  const {
    records,
    types,
    chiefs,
    historicalCounts,
    comboCards,
    addHistoricalCount,
    updateHistoricalCount,
    removeHistoricalCount,
    addComboCard,
    removeComboCard,
  } = useProceduresData();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [chiefFilter, setChiefFilter] = useState<string[]>([]);
  const [onlyBiopsy, setOnlyBiopsy] = useState(false);
  const [onlyInteresting, setOnlyInteresting] = useState(false);
  const [patientFilter, setPatientFilter] = useState("");

  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const applyPreset = (id: PeriodPreset) => {
    const range = presetRange(id);
    setFrom(range.from);
    setTo(range.to);
  };

  const activePreset = useMemo<PeriodPreset | null>(() => {
    for (const p of PERIOD_PRESETS) {
      const range = presetRange(p.id);
      if (range.from === from && range.to === to) return p.id;
    }
    return null;
  }, [from, to]);

  const rows = useMemo(() => {
    const nameQuery = patientFilter.trim().toLowerCase();
    return records
      .filter((r) => (from ? r.date >= from : true))
      .filter((r) => (to ? r.date <= to : true))
      .filter((r) => (onlyBiopsy ? !!r.biopsy : true))
      .filter((r) => (onlyInteresting ? !!r.interesting : true))
      .filter((r) => (typeFilter.length ? procedureTypes(r).some((t) => typeFilter.includes(t)) : true))
      .filter((r) => (chiefFilter.length ? chiefFilter.includes(r.chief) : true))
      .filter((r) => (nameQuery ? r.patient.toLowerCase().includes(nameQuery) : true));
  }, [records, from, to, onlyBiopsy, onlyInteresting, typeFilter, chiefFilter, patientFilter]);

  const allTypes = useMemo(() => {
    const set = new Set<string>(types);
    records.forEach((r) => procedureTypes(r).forEach((t) => set.add(t)));
    return [...set];
  }, [types, records]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => procedureTypes(r).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const byChief = useMemo<ChiefRow[]>(() => {
    const map = new Map<string, ChiefRow>();
    const ensure = (c: string) => {
      if (!map.has(c)) map.set(c, { chief: c, total: 0, values: {} });
      return map.get(c)!;
    };
    rows.forEach((r) => {
      const e = ensure(r.chief || "Sem chefe");
      procedureTypes(r).forEach((t) => {
        e.values[t] = (e.values[t] ?? 0) + 1;
        e.total += 1;
      });
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [rows]);

  const byMonth = useMemo<MonthRow[]>(() => {
    const map = new Map<string, MonthRow>();
    rows.forEach((r) => {
      const ym = (r.date || "").slice(0, 7);
      if (!ym) return;
      if (!map.has(ym)) map.set(ym, { month: ym, label: monthLabel(ym), total: 0, values: {} });
      const e = map.get(ym)!;
      procedureTypes(r).forEach((t) => {
        e.values[t] = (e.values[t] ?? 0) + 1;
        e.total += 1;
      });
    });
    return [...map.values()].sort((a, b) => (a.month < b.month ? -1 : 1));
  }, [rows]);

  const byWeekday = useMemo(() => {
    const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const counts = new Array(7).fill(0) as number[];
    rows.forEach((r) => {
      const [y, m, d] = r.date.split("-").map(Number);
      if (!y || !m || !d) return;
      const idx = new Date(y, m - 1, d).getDay();
      counts[idx] = (counts[idx] ?? 0) + procedureTypes(r).length;
    });
    return names.map((name, i) => ({ name, value: counts[i] ?? 0 }));
  }, [rows]);

  const flags = useMemo(() => {
    const biopsy = rows.filter((r) => r.biopsy).length;
    const interesting = rows.filter((r) => r.interesting).length;
    return [
      { name: "Checar biópsia", value: biopsy },
      { name: "Interessantes", value: interesting },
      { name: "Sem marcação", value: Math.max(rows.length - biopsy - interesting, 0) },
    ].filter((d) => d.value > 0);
  }, [rows]);

  const activeFilters =
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (onlyBiopsy ? 1 : 0) +
    (onlyInteresting ? 1 : 0) +
    (patientFilter.trim() ? 1 : 0) +
    typeFilter.length +
    chiefFilter.length;

  const clearAll = () => {
    setFrom("");
    setTo("");
    setTypeFilter([]);
    setChiefFilter([]);
    setOnlyBiopsy(false);
    setOnlyInteresting(false);
    setPatientFilter("");
  };

  const period =
    rows.length === 0
      ? "—"
      : (() => {
          const dates = rows.map((r) => r.date).filter(Boolean).sort();
          return `${formatDateBR(dates[0] ?? "")} – ${formatDateBR(dates[dates.length - 1] ?? "")}`;
        })();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[image:var(--gradient-header)] text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-8 sm:px-6">
          <BarChart3 className="size-8" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold sm:text-2xl">Estatísticas</h1>
            <p className="text-sm opacity-90">Contagens, métricas por chefe e gráficos</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/painel">
              <ChevronLeft className="mr-1 size-4" /> Voltar ao painel
            </Link>
          </Button>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 pt-6">
            <div className="grid gap-1">
              <Label htmlFor="patient-search">Paciente</Label>
              <Input
                id="patient-search"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                placeholder="Buscar por nome"
                className="w-44"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="from">De</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="to">Até</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PERIOD_PRESETS.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={activePreset === p.id ? "default" : "outline"}
                  onClick={() => applyPreset(p.id)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Tipos {typeFilter.length ? `(${typeFilter.length})` : ""}
                  <ChevronDown className="ml-1 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
                {allTypes.map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t}
                    checked={typeFilter.includes(t)}
                    onCheckedChange={() => setTypeFilter((p) => toggleIn(p, t))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {t}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Chefes {chiefFilter.length ? `(${chiefFilter.length})` : ""}
                  <ChevronDown className="ml-1 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
                {chiefs.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={chiefFilter.includes(c)}
                    onCheckedChange={() => setChiefFilter((p) => toggleIn(p, c))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={onlyBiopsy ? "default" : "outline"}
              onClick={() => setOnlyBiopsy((v) => !v)}
            >
              <FlaskConical className="mr-1 size-4" /> Biópsia
            </Button>
            <Button
              variant={onlyInteresting ? "default" : "outline"}
              onClick={() => setOnlyInteresting((v) => !v)}
            >
              <Star className="mr-1 size-4" /> Interessante
            </Button>

            {activeFilters > 0 && (
              <>
                <Badge variant="secondary">{rows.length} registro(s)</Badge>
                <Button variant="ghost" onClick={clearAll}>
                  Limpar filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Registros</p>
              <p className="mt-1 text-3xl font-bold text-primary tabular-nums">{rows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Período</p>
              <p className="mt-1 text-base font-semibold">{period}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Procedimentos</h2>
          <NewCardDialog
            types={types}
            comboCards={comboCards}
            historicalCounts={historicalCounts}
            onAddCombo={addComboCard}
            onAddHistorical={addHistoricalCount}
          />
        </div>

        <TypeCards
          rows={rows}
          types={types}
          comboCards={comboCards}
          historicalCounts={historicalCounts}
          onRemoveCombo={removeComboCard}
        />

        <HistoricalCounts
          entries={historicalCounts}
          onChange={updateHistoricalCount}
          onRemove={removeHistoricalCount}
        />

        <ChiefTotals rows={rows} chiefs={chiefs} />

        <Tabs defaultValue="tipos">
          <TabsList className="flex-wrap">
            <TabsTrigger value="tipos">Por tipo</TabsTrigger>
            <TabsTrigger value="chefes">Por chefe</TabsTrigger>
            <TabsTrigger value="tempo">Evolução</TabsTrigger>
            <TabsTrigger value="outros">Outros</TabsTrigger>
          </TabsList>

          <TabsContent value="tipos" className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Distribuição por tipo">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" outerRadius={110} label>
                    {byType.map((d) => (
                      <Cell key={d.name} fill={typeChartColor(d.name, types)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Quantidade por tipo">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={byType}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Procedimentos" radius={[6, 6, 0, 0]}>
                    {byType.map((d) => (
                      <Cell key={d.name} fill={typeChartColor(d.name, types)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="chefes" className="mt-4">
            <ChartCard title="Produtividade por chefe responsável">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={byChief} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="chief" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {allTypes.map((t) => (
                    <Bar
                      key={t}
                      dataKey={(d: ChiefRow) => d.values[t] ?? 0}
                      stackId="a"
                      name={t}
                      fill={typeChartColor(t, types)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="tempo" className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Evolução mensal (total)">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Procedimentos"
                    stroke={CHART_PALETTE[0]}
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Evolução mensal por tipo">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {allTypes.map((t) => (
                    <Bar
                      key={t}
                      dataKey={(d: MonthRow) => d.values[t] ?? 0}
                      stackId="m"
                      name={t}
                      fill={typeChartColor(t, types)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="outros" className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Procedimentos por dia da semana">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={byWeekday}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Procedimentos" radius={[6, 6, 0, 0]} fill={CHART_PALETTE[2]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Marcações (biópsia / interessante)">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={flags} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} label>
                    {flags.map((d, i) => (
                      <Cell key={d.name} fill={CHART_PALETTE[(i + 3) % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>
        </Tabs>

        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado para os filtros selecionados.
          </p>
        )}
      </main>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
