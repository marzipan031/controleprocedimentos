import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  Download,
  FlaskConical,
  HeartPulse,
  Loader2,
  Search,
  Star,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AccountMenu } from "@/components/procedures/AccountMenu";
import { ProcedureForm } from "@/components/procedures/ProcedureForm";
import { ProceduresTable } from "@/components/procedures/ProceduresTable";
import { ImportDialog } from "@/components/procedures/ImportDialog";
import { MigrateLocalData } from "@/components/procedures/MigrateLocalData";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  procedureTypes,
  toCSV,
  useProceduresData,
  type ProcedureRecord,
} from "@/lib/procedures-store";

export default function Painel() {
  useEffect(() => {
    document.title = "Painel de Procedimentos | Registro";
  }, []);

  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const viewUserId =
    profile?.role === "admin" ? (searchParams.get("as") ?? undefined) : undefined;
  const [viewUserEmail, setViewUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!viewUserId) {
      setViewUserEmail(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("email")
      .eq("id", viewUserId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setViewUserEmail((data?.email as string) ?? viewUserId);
      });
    return () => {
      cancelled = true;
    };
  }, [viewUserId]);

  const {
    loading,
    records,
    types,
    chiefs,
    addRecord,
    updateRecord,
    removeMany,
    restoreRecords,
    setTypes,
    setChiefs,
  } = useProceduresData(viewUserId);

  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [onlyBiopsy, setOnlyBiopsy] = useState(false);
  const [onlyInteresting, setOnlyInteresting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [chiefFilter, setChiefFilter] = useState<string[]>([]);
  const [editing, setEditing] = useState<ProcedureRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastDeleted, setLastDeleted] = useState<ProcedureRecord[]>([]);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) =>
        q
          ? r.patient.toLowerCase().includes(q) ||
            (r.encounterNumber || "").toLowerCase().includes(q) ||
            r.chief.toLowerCase().includes(q) ||
            procedureTypes(r).join(" ").toLowerCase().includes(q) ||
            r.observation.toLowerCase().includes(q) ||
            (r.findings || "").toLowerCase().includes(q)
          : true,
      )
      .filter((r) => (from ? r.date >= from : true))
      .filter((r) => (to ? r.date <= to : true))
      .filter((r) => (onlyBiopsy ? !!r.biopsy : true))
      .filter((r) => (onlyInteresting ? !!r.interesting : true))
      .filter((r) =>
        typeFilter.length ? procedureTypes(r).some((t) => typeFilter.includes(t)) : true,
      )
      .filter((r) => (chiefFilter.length ? chiefFilter.includes(r.chief) : true))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [records, query, from, to, onlyBiopsy, onlyInteresting, typeFilter, chiefFilter]);

  const activeFilters =
    (query ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (onlyBiopsy ? 1 : 0) +
    (onlyInteresting ? 1 : 0) +
    typeFilter.length +
    chiefFilter.length;

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const deleteWithUndo = (rows: ProcedureRecord[], message: string) => {
    removeMany(rows.map((r) => r.id));
    setLastDeleted(rows);
    toast.success(message, {
      action: {
        label: "Desfazer",
        onClick: () => {
          restoreRecords(rows);
          setLastDeleted([]);
          toast.success("Exclusão desfeita.");
        },
      },
    });
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum registro para exportar.");
      return;
    }
    const blob = new Blob([toCSV(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procedimentos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo CSV exportado.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[image:var(--gradient-header)] text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-8 sm:px-6">
          <HeartPulse className="size-8" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold sm:text-2xl">Gestão de Procedimentos Médicos</h1>
            <p className="text-sm opacity-90">Registro e lista de procedimentos</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to={viewUserId ? `/estatisticas?as=${viewUserId}` : "/estatisticas"}>
              <BarChart3 className="mr-1 size-4" /> Estatísticas
            </Link>
          </Button>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
        {viewUserId && (
          <Card className="border-primary/30 bg-primary/5 shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div className="flex items-center gap-2 text-sm">
                <ArrowLeftRight className="size-4 text-primary" />
                Vendo procedimentos de <strong>{viewUserEmail ?? "..."}</strong>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/painel">Voltar aos meus procedimentos</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        {!viewUserId && <MigrateLocalData onDone={() => window.location.reload()} />}
        {!viewUserId && (
        <div ref={formRef}>
          <ProcedureForm
            types={types}
            chiefs={chiefs}
            setTypes={setTypes}
            setChiefs={setChiefs}
            typeUsage={(t) => records.filter((r) => procedureTypes(r).includes(t)).length}
            chiefUsage={(c) => records.filter((r) => r.chief === c).length}
            editing={editing}
            onCancelEdit={() => setEditing(null)}
            onSubmit={(data) => {
              if (editing) {
                updateRecord(editing.id, data);
                setEditing(null);
                toast.success("Registro atualizado.");
              } else {
                addRecord(data);
                toast.success("Registro salvo.");
              }
            }}
          />
        </div>
        )}

        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="q">Buscar</Label>
              <div className="relative">
                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  id="q"
                  className="pl-9"
                  placeholder="Paciente, atendimento, chefe ou tipo de procedimento"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">De</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Até</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={typeFilter.length ? "default" : "outline"}>
                    Tipo de procedimento {typeFilter.length ? `(${typeFilter.length})` : ""}
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                  {types.map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t}
                      checked={typeFilter.includes(t)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => setTypeFilter((prev) => toggleIn(prev, t))}
                    >
                      {t}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={chiefFilter.length ? "default" : "outline"}>
                    Chefe {chiefFilter.length ? `(${chiefFilter.length})` : ""}
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                  {chiefs.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c}
                      checked={chiefFilter.includes(c)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => setChiefFilter((prev) => toggleIn(prev, c))}
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
                <FlaskConical className="size-4" /> Checar biópsia (
                {records.filter((r) => r.biopsy).length})
              </Button>
              <Button
                variant={onlyInteresting ? "default" : "outline"}
                onClick={() => setOnlyInteresting((v) => !v)}
              >
                <Star className="size-4" /> Interessantes (
                {records.filter((r) => r.interesting).length})
              </Button>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="size-4" /> Exportar CSV
              </Button>
              <ImportDialog
                onImport={(rows) => {
                  const newTypes = new Set(types);
                  const newChiefs = new Set(chiefs);
                  rows.forEach((r) => {
                    (r.types ?? []).forEach((t) => t && newTypes.add(t));
                    if (r.chief) newChiefs.add(r.chief);
                    addRecord(r);
                  });

                  setTypes([...newTypes]);
                  setChiefs([...newChiefs]);
                }}
              />
              {lastDeleted.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    restoreRecords(lastDeleted);
                    toast.success(`${lastDeleted.length} registro(s) restaurado(s).`);
                    setLastDeleted([]);
                  }}
                >
                  <Undo2 className="size-4" /> Desfazer última exclusão
                </Button>
              )}
              {activeFilters > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQuery("");
                    setFrom("");
                    setTo("");
                    setOnlyBiopsy(false);
                    setOnlyInteresting(false);
                    setTypeFilter([]);
                    setChiefFilter([]);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            {activeFilters > 0 && (
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
                <Badge variant="secondary">
                  {activeFilters} filtro(s) ativo(s)
                </Badge>
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground tabular-nums">{filtered.length}</strong> de{" "}
                  {records.length} procedimento(s) correspondem à seleção
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <ProceduresTable
          rows={filtered}
          allTypes={types}
          selectedIds={selectedIds}
          onSelect={(id, value) =>
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (value) next.add(id);
              else next.delete(id);
              return next;
            })
          }
          onSelectAll={(value) =>
            setSelectedIds(new Set(value ? filtered.map((r) => r.id) : []))
          }
          onEdit={(r) => {
            setEditing(r);
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onDelete={(r) => deleteWithUndo([r], "Registro excluído.")}
          onDeleteSelected={() => setConfirmBulk(true)}
          onToggle={(r, field, value) => updateRecord(r.id, { [field]: value })}
        />
          </>
        )}
      </main>

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} registro(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove os registros selecionados. Você poderá desfazer logo em seguida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const rows = records.filter((r) => selectedIds.has(r.id));
                deleteWithUndo(rows, `${rows.length} registro(s) excluído(s).`);
                setSelectedIds(new Set());
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
