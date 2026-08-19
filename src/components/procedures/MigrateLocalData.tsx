import { useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasLocalLegacyData, migrateLocalDataToCloud } from "@/lib/procedures-store";

/**
 * Aparece só quando existem dados salvos neste navegador (de antes da
 * nuvem) ainda não importados. Some sozinho depois de usado.
 */
export function MigrateLocalData({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(() => hasLocalLegacyData());
  const [importing, setImporting] = useState(false);

  if (!visible) return null;

  const run = async () => {
    setImporting(true);
    const result = await migrateLocalDataToCloud();
    setImporting(false);
    if (result.ok) {
      toast.success(
        result.count > 0
          ? `${result.count} registro(s) deste navegador importado(s) para a nuvem.`
          : "Dados deste navegador importados para a nuvem.",
      );
      setVisible(false);
      onDone();
    } else {
      toast.error("Não foi possível importar os dados deste navegador. Tente de novo.");
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-[var(--shadow-card)]">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <div className="flex items-start gap-3">
          <CloudUpload className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">
              Encontramos dados salvos só neste navegador (de antes da nuvem)
            </p>
            <p className="text-sm text-muted-foreground">
              Importe para a nuvem para acessá-los de qualquer computador.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setVisible(false)} disabled={importing}>
            Ignorar
          </Button>
          <Button size="sm" onClick={() => void run()} disabled={importing}>
            {importing && <Loader2 className="size-4 animate-spin" />}
            Importar agora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
