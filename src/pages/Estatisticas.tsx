import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  FlaskConical,
  Star,
} from "lucide-react";
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
import { AccountMenu } from "@/components/exams/AccountMenu";
import {
  COLONO,
  ENDO,
  formatDateBR,
  recordTypes,
  useExamsData,
} from "@/lib/exams-store";

const PALETTE = [
  "hsl(211 90% 45%)",
  "hsl(174 62% 40%)",
  "hsl(261 62% 55%)",
  "hsl(28 90% 52%)",
  "hsl(340 72% 52%)",
  "hsl(150 55% 40%)",
  "hsl(200 70% 60%)",
  "hsl(45 90% 50%)",
];

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${m}/${y}`;
};

export default function Estatisticas() {
  useEffect(() => {
    document.title = "Estatísticas de Exames | Gráficos e Filtros";
  }, []);

  const { records, types, chiefs } = useExamsData();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [chiefFilter, setChiefFilter] = useState<string[]>([]);
  const [onlyBiopsy, setOnlyBiopsy] = useState(false);
  const [onlyInteresting, setOnlyInteresting] = useState(false);
  const [onlyBoth, setOnlyBoth] = useState(false);

  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const rows = useMemo(
    () =>
      records
        .filter((r) => (from ? r.date >= from : true))
        .filter((r) => (to ? r.date <= to : true))
        .filter((r) => (onlyBiopsy ? !!r.biopsy : true))
        .filter((r) => (onlyInteresting ? !!r.interesting : true))
        .filter((r) =>
          onlyBoth ? recordTypes(r).includes(ENDO) && recordTypes(r).includes(COLONO) : true,
        )
        .filter((r) => (typeFilter.length ? recordTypes(r).some((t) => typeFilter.includes(t)) : true))
        .filter((r) => (chiefFilter.length ? chiefFilter.includes(r.chief) : true)),
    [records, from, to, onlyBiopsy, onlyInteresting, onlyBoth, typeFilter, chiefFilter],
  );

  const allTypes = useMemo(() => {
    const set = new Set<string>(types);
    records.forEach((r) => recordTypes(r).forEach((t) => set.add(t)));
    return [...set];
  }, [types, records]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => recordTypes(r).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const byChief = useMemo(() => {
    const map = new Map<string, { chief: string; endo: number; colono: number; outros: number; total: number }>();
    const ensure = (c: string) =>
      map.get(c) ?? map.set(c, { chief: c, endo: 0, colono: 0, outros: 0, total: 0 }).get(c)!;
    rows.forEach((r) => {
      const e = ensure(r.chief || "Sem chefe");
      recordTypes(r).forEach((t) => {
        if (t === ENDO) e.endo += 1;
        else if (t === COLONO) e.colono += 1;
        else e.outros += 1;
        e.total += 1;
      });
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [rows]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; endo: number; colono: number; outros: number; total: number }>();
    rows.forEach((r) => {
      const ym = (r.date || "").slice(0, 7);
      if (!ym) return;
      const e =
        map.get(ym) ?? map.set(ym, { month: ym, endo: 0, colono: 0, outros: 0, total: 0 }).get(ym)!;
      recordTypes(r).forEach((t) => {
        if (t === ENDO) e.endo += 1;
        else if (t === COLONO) e.colono += 1;
        else e.outros += 1;
        e.total += 1;
      });
    });
    return [...map.values()]
      .sort((a, b) => (a.month < b.month ? -1 : 1))
      .map((d) => ({ ...d, label: monthLabel(d.month) }));
  }, [rows]);

  const byWeekday = useMemo(() => {
    const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const counts = new Array(7).fill(0) as number[];
    rows.forEach((r) => {
      const [y, m, d] = r.date.split("-").map(Number);
      if (!y || !m || !d) return;
      const idx = new Date(y, m - 1, d).getDay();
      counts[idx] = (counts[idx] ?? 0) + recordTypes(r).length;
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

  const totalProc = rows.reduce((a, r) => a + recordTypes(r).length, 0);
  const both = rows.filter((r) => recordTypes(r).includes(ENDO) && recordTypes(r).includes(COLONO)).length;
  const activeFilters =
    (from ? 1 : 0) + (to ? 1 : 0) + (onlyBiopsy ? 1 : 0) + (onlyInteresting ? 1 : 0) +
    (onlyBoth ? 1 : 0) + typeFilter.length + chiefFilter.length;

  const clearAll = () => {
    setFrom(""); setTo(""); setTypeFilter([]); setChiefFilter([]);
    setOnlyBiopsy(false); setOnlyInteresting(false); setOnlyBoth(false);
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
            <p className="text-sm opacity-90">Gráficos e indicadores dos exames registrados</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/">
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
              <Label htmlFor="from">De</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="to">Até</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
            <Button variant={onlyBoth ? "default" : "outline"} onClick={() => setOnlyBoth((v) => !v)}>
              EDA + Colono
            </Button>

            {activeFilters > 0 && (
              <>
                <Badge variant="secondary">
                  {rows.length} registro(s) · {totalProc} procedimento(s)
                </Badge>
                <Button variant="ghost" onClick={clearAll}>
                  Limpar filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Registros" value={rows.length} />
          <StatCard label="Procedimentos" value={totalProc} />
          <StatCard label="EDA + Colono" value={both} />
          <StatCard label="Período" value={period} small />
        </div>

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
                    {byType.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
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
                    {byType.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
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
                  <Bar dataKey="endo" stackId="a" name="Endoscopia" fill={PALETTE[0]} />
                  <Bar dataKey="colono" stackId="a" name="Colonoscopia" fill={PALETTE[1]} />
                  <Bar dataKey="outros" stackId="a" name="Outros" fill={PALETTE[3]} radius={[0, 6, 6, 0]} />
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
                  <Line type="monotone" dataKey="total" name="Procedimentos" stroke={PALETTE[0]} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Evolução mensal por categoria">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="endo" stackId="m" name="Endoscopia" fill={PALETTE[0]} />
                  <Bar dataKey="colono" stackId="m" name="Colonoscopia" fill={PALETTE[1]} />
                  <Bar dataKey="outros" stackId="m" name="Outros" fill={PALETTE[3]} radius={[6, 6, 0, 0]} />
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
                  <Bar dataKey="value" name="Procedimentos" radius={[6, 6, 0, 0]} fill={PALETTE[2]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Marcações (biópsia / interessante)">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={flags} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} label>
                    {flags.map((_, i) => (
                      <Cell key={i} fill={PALETTE[(i + 3) % PALETTE.length]} />
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

function StatCard({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={small ? "mt-1 text-base font-semibold" : "mt-1 text-3xl font-bold text-primary"}>
          {value}
        </p>
      </CardContent>
    </Card>
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
