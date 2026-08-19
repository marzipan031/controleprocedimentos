import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  HeartPulse,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  {
    icon: Layers,
    title: "Tipos dinâmicos",
    description:
      "Crie quantos tipos de procedimento quiser — cada um ganha automaticamente um card de contagem.",
  },
  {
    icon: ClipboardList,
    title: "Combinações e histórico",
    description:
      "Combine tipos (ex.: Endoscopia + Colonoscopia) e some registros anteriores ao seu histórico.",
  },
  {
    icon: BarChart3,
    title: "Estatísticas completas",
    description:
      "Gráficos por chefe, evolução mensal, biópsias e achados interessantes, tudo filtrável por período.",
  },
  {
    icon: Download,
    title: "Exportação em CSV",
    description: "Leve seus dados para Excel ou outra ferramenta a qualquer momento, com um clique.",
  },
  {
    icon: Users,
    title: "Multiusuário com aprovação",
    description: "Cada novo acesso é revisado por um administrador antes de entrar no sistema.",
  },
  {
    icon: ShieldCheck,
    title: "Login seguro",
    description: "Autenticação por email e senha, com confirmação de email e recuperação de senha.",
  },
];

const STEPS = [
  {
    title: "Cadastre-se",
    description: "Crie sua conta com email e senha e aguarde a aprovação do administrador.",
  },
  {
    title: "Registre procedimentos",
    description: "Adicione pacientes, tipos, chefe responsável e observações em poucos segundos.",
  },
  {
    title: "Acompanhe as estatísticas",
    description: "Veja contagens por tipo, por chefe e a evolução da equipe ao longo do tempo.",
  },
];

export default function Landing() {
  useEffect(() => {
    document.title = "Gestão de Procedimentos Médicos";
  }, []);

  const { configured, loading, session, profile } = useAuth();
  const isApproved = configured && !!session && profile?.status === "approved";

  if (!loading && isApproved) {
    return <Navigate to="/painel" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex size-9 items-center justify-center rounded-full bg-[image:var(--gradient-header)] text-primary-foreground">
            <HeartPulse className="size-5" />
          </div>
          <span className="flex-1 font-semibold">Gestão de Procedimentos</span>
          {isApproved ? (
            <Button asChild size="sm">
              <Link to="/painel">Ir para o painel</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/login?mode=signup">Criar conta</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-header)] opacity-[0.06]" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Organize os procedimentos da sua equipe médica em um só lugar
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Registre pacientes, acompanhe contagens por tipo e por chefe, e tenha estatísticas
            completas — sem planilhas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isApproved ? (
              <Button asChild size="lg">
                <Link to="/painel">Ir para o painel</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/login?mode=signup">Criar conta grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Já tenho conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Tudo que sua equipe precisa</h2>
          <p className="mt-2 text-muted-foreground">
            Feito para o dia a dia de quem registra e acompanha procedimentos médicos.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="shadow-[var(--shadow-card)]">
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Como funciona</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-[image:var(--gradient-header)] font-semibold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Card className="overflow-hidden shadow-[var(--shadow-card)]">
          <CardContent className="flex flex-col items-center gap-4 bg-[image:var(--gradient-header)] py-14 text-center text-primary-foreground">
            <CheckCircle2 className="size-8" />
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Pronto para organizar os procedimentos da sua equipe?
            </h2>
            <p className="max-w-md opacity-90">
              Comece agora — o cadastro é rápido e o acesso é liberado após aprovação do
              administrador.
            </p>
            {isApproved ? (
              <Button asChild size="lg" variant="secondary">
                <Link to="/painel">Ir para o painel</Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary">
                <Link to="/login?mode=signup">Criar conta grátis</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 text-center text-sm text-muted-foreground sm:px-6">
          <p>© {new Date().getFullYear()} Gestão de Procedimentos Médicos.</p>
        </div>
      </footer>
    </div>
  );
}
