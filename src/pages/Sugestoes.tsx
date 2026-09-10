import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Lightbulb, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AccountMenu } from "@/components/procedures/AccountMenu";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { brazilDateFromTimestamp, formatDateBR } from "@/lib/procedures-store";

type Suggestion = {
  id: string;
  user_id: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function Sugestoes() {
  useEffect(() => {
    document.title = "Sugestões | Gestão de Procedimentos Médicos";
  }, []);

  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<Suggestion[]>([]);
  const [all, setAll] = useState<Suggestion[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Não foi possível carregar as sugestões.");
    const rows = (data as Suggestion[]) ?? [];
    if (isAdmin) {
      setAll(rows);
      setMine(rows.filter((s) => s.user_id === profile?.id));
    } else {
      setMine(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      toast.error("Escreva sua sugestão antes de enviar.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("suggestions")
      .insert({ email: profile?.email ?? "", message: text });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar sua sugestão.");
      return;
    }
    toast.success("Sugestão enviada. Obrigado!");
    setMessage("");
    void load();
  };

  const toggleRead = async (s: Suggestion) => {
    const { error } = await supabase
      .from("suggestions")
      .update({ read: !s.read })
      .eq("id", s.id);
    if (error) {
      toast.error("Não foi possível atualizar.");
      return;
    }
    setAll((prev) => prev.map((x) => (x.id === s.id ? { ...x, read: !x.read } : x)));
  };

  const removeSuggestion = async (s: Suggestion) => {
    const { error } = await supabase.from("suggestions").delete().eq("id", s.id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    setAll((prev) => prev.filter((x) => x.id !== s.id));
    setMine((prev) => prev.filter((x) => x.id !== s.id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[image:var(--gradient-header)] text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-8 sm:px-6">
          <Lightbulb className="size-8" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold sm:text-2xl">Sugestões</h1>
            <p className="text-sm opacity-90">Envie ideias e melhorias para o app</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/painel">
              <ChevronLeft className="mr-1 size-4" /> Voltar ao painel
            </Link>
          </Button>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Enviar uma sugestão</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="O que você gostaria de ver no app?"
              />
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                <Send className="size-4" /> Enviar sugestão
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Minhas sugestões</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : mine.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Você ainda não enviou nenhuma sugestão.
              </p>
            ) : (
              <ul className="space-y-3">
                {mine.map((s) => (
                  <li key={s.id} className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(brazilDateFromTimestamp(s.created_at))}
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{s.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">
                Todas as sugestões{" "}
                <span className="text-sm font-normal text-muted-foreground">({all.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : all.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma sugestão enviada ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Sugestão</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {all.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {formatDateBR(brazilDateFromTimestamp(s.created_at))}
                        </TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell className="max-w-md whitespace-pre-wrap">{s.message}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={s.read ? "secondary" : "default"}
                            className="cursor-pointer"
                            onClick={() => void toggleRead(s)}
                          >
                            {s.read ? "Lida" : "Nova"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir"
                            onClick={() => void removeSuggestion(s)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
