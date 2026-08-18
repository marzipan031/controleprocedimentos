import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ClipboardCheck, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { supabase } from "@/lib/supabase";
import { type Profile, type ProfileStatus } from "@/lib/auth-context";
import { formatDateBR } from "@/lib/exams-store";

const STATUS_LABEL: Record<ProfileStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const STATUS_VARIANT: Record<ProfileStatus, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export default function Cadastros() {
  useEffect(() => {
    document.title = "Cadastros | Gestão de Exames Médicos";
  }, []);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [toDelete, setToDelete] = useState<Profile | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Não foi possível carregar os cadastros.");
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (profile: Profile, status: ProfileStatus) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", profile.id);
    if (error) {
      toast.error("Não foi possível atualizar o cadastro.");
      return;
    }
    setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, status } : p)));
    toast.success(
      status === "approved" ? "Cadastro aprovado." : "Cadastro rejeitado.",
    );
  };

  const deleteProfile = async (profile: Profile) => {
    const { error: fnError } = await supabase.functions.invoke("delete-user", {
      body: { userId: profile.id },
    });
    if (fnError) {
      const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
      if (error) {
        toast.error("Não foi possível excluir o cadastro.");
        return;
      }
      toast.success(
        "Cadastro removido. A conta de login continua existindo até a Edge Function \"delete-user\" ser implantada (veja supabase/functions/delete-user).",
      );
    } else {
      toast.success("Cadastro e conta excluídos.");
    }
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  };

  const filtered = profiles.filter((p) => (tab === "all" ? true : p.status === tab));
  const counts = {
    pending: profiles.filter((p) => p.status === "pending").length,
    approved: profiles.filter((p) => p.status === "approved").length,
    rejected: profiles.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[image:var(--gradient-header)] text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-8 sm:px-6">
          <ClipboardCheck className="size-8" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold sm:text-2xl">Cadastros</h1>
            <p className="text-sm opacity-90">Aprovação de novos usuários</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/">
              <ChevronLeft className="mr-1 size-4" /> Voltar ao painel
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList>
                <TabsTrigger value="pending">Pendentes ({counts.pending})</TabsTrigger>
                <TabsTrigger value="approved">Aprovados ({counts.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Rejeitados ({counts.rejected})</TabsTrigger>
                <TabsTrigger value="all">Todos ({profiles.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Carregando...
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                            Nenhum cadastro encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                      {filtered.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.email}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[p.status]}>
                              {STATUS_LABEL[p.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatDateBR(p.created_at.slice(0, 10))}
                          </TableCell>
                          <TableCell className="space-x-2 text-right">
                            {p.status !== "approved" && (
                              <Button size="sm" onClick={() => updateStatus(p, "approved")}>
                                Aprovar
                              </Button>
                            )}
                            {p.status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(p, "rejected")}
                              >
                                Rejeitar
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Excluir"
                              onClick={() => setToDelete(p)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cadastro de {toDelete?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o cadastro permanentemente. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) void deleteProfile(toDelete);
                setToDelete(null);
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
