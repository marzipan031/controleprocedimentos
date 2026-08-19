import { Link } from "react-router-dom";
import { ClipboardCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

/** Nada é renderizado enquanto o Supabase não estiver configurado. */
export function AccountMenu() {
  const { configured, session, profile, signOut } = useAuth();

  if (!configured || !session) return null;

  return (
    <>
      {profile?.role === "admin" && (
        <Button asChild variant="secondary" size="sm">
          <Link to="/cadastros">
            <ClipboardCheck className="mr-1 size-4" /> Cadastros
          </Link>
        </Button>
      )}
      <Button variant="secondary" size="sm" onClick={() => void signOut()}>
        <LogOut className="mr-1 size-4" /> Sair
      </Button>
    </>
  );
}
