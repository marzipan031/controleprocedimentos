import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-context";

function CenteredMessage({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

/**
 * Sem Supabase configurado, o app roda como sempre rodou: sem tela de login.
 * Isso evita travar o app enquanto o backend ainda não existe.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, session, profile, signOut } = useAuth();

  if (!configured) return <>{children}</>;

  if (loading || (session && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (profile?.status === "pending") {
    return (
      <CenteredMessage
        title="Cadastro aguardando aprovação"
        description="Um administrador ainda precisa aprovar o seu acesso. Tente novamente mais tarde."
      >
        <Button variant="outline" onClick={() => void signOut()}>
          Sair
        </Button>
      </CenteredMessage>
    );
  }

  if (profile?.status === "rejected") {
    return (
      <CenteredMessage
        title="Cadastro não aprovado"
        description="Seu cadastro foi rejeitado pelo administrador. Entre em contato se acha que isso é um engano."
      >
        <Button variant="outline" onClick={() => void signOut()}>
          Sair
        </Button>
      </CenteredMessage>
    );
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { configured, loading, profile } = useAuth();

  if (!configured) {
    return (
      <CenteredMessage
        title="Supabase não configurado"
        description="Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar a página de cadastros."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profile?.role !== "admin") return <Navigate to="/painel" replace />;

  return <>{children}</>;
}
