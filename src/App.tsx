import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { RequireAdmin, RequireAuth } from "@/lib/route-guards";
import Landing from "@/pages/Landing";
import Painel from "@/pages/Painel";
import Estatisticas from "@/pages/Estatisticas";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Cadastros from "@/pages/Cadastros";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route
            path="/painel"
            element={
              <RequireAuth>
                <Painel />
              </RequireAuth>
            }
          />
          <Route
            path="/estatisticas"
            element={
              <RequireAuth>
                <Estatisticas />
              </RequireAuth>
            }
          />
          <Route
            path="/cadastros"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <Cadastros />
                </RequireAdmin>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
