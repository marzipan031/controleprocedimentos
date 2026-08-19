import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, Circle, HeartPulse, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/password";
import { cn } from "@/lib/utils";

function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="space-y-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5",
              ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {ok ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export default function Login() {
  useEffect(() => {
    document.title = "Entrar | Gestão de Procedimentos Médicos";
  }, []);

  const { configured, session, profile, loading, signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [submitting, setSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Supabase não configurado</CardTitle>
            <CardDescription>
              Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> em um
              arquivo <code>.env.local</code> (veja <code>.env.example</code>) e rode as
              migrações em <code>supabase/schema.sql</code> no seu projeto Supabase.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!loading && session && profile?.status === "approved") {
    return <Navigate to="/" replace />;
  }

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setSubmitting(false);
    if (error) toast.error(error);
  };

  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(signupPassword)) {
      toast.error("A senha não atende aos requisitos mínimos.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(
      "Cadastro enviado! Confirme seu email pelo link que enviamos e aguarde a aprovação do administrador para entrar.",
    );
    setMode("login");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirm("");
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await requestPasswordReset(forgotEmail);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    setForgotSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-[image:var(--gradient-header)] text-primary-foreground">
            <HeartPulse className="size-6" />
          </div>
          <CardTitle>Gestão de Procedimentos Médicos</CardTitle>
          <CardDescription>
            {mode === "forgot" ? "Recuperar senha" : "Entre ou cadastre-se para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "forgot" ? (
            forgotSent ? (
              <div className="space-y-4 text-center text-sm text-muted-foreground">
                <p>Se esse email estiver cadastrado, enviamos um link para redefinir a senha.</p>
                <Button variant="ghost" onClick={() => { setMode("login"); setForgotSent(false); }}>
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <form onSubmit={submitForgot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Enviar link de recuperação
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
                  Voltar para o login
                </Button>
              </form>
            )
          ) : (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={submitLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Entrar
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => setMode("forgot")}
                  >
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={submitSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                    <PasswordChecklist password={signupPassword} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar senha</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      required
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seu cadastro ficará pendente até ser aprovado por um administrador.
                  </p>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Cadastrar
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
