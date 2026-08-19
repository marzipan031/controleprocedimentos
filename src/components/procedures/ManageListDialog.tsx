import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Props = {
  title: string;
  description: string;
  items: string[];
  onChange: (items: string[]) => void;
  trigger: React.ReactNode;
  usageCount?: (item: string) => number;
};

export function ManageListDialog({
  title,
  description,
  items,
  onChange,
  trigger,
  usageCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const sorted = useMemo(() => items, [items]);

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      toast.error("Esse item já existe.");
      return;
    }
    onChange([...items, value]);
    setDraft("");
    toast.success(`"${value}" adicionado.`);
  };

  const remove = (item: string) => {
    const used = usageCount?.(item) ?? 0;
    if (used > 0) {
      toast.error(`Não é possível remover: ${used} registro(s) usam "${item}".`);
      return;
    }
    onChange(items.filter((i) => i !== item));
    toast.success(`"${item}" removido.`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder="Novo item"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button onClick={add} size="icon" aria-label="Adicionar">
            <Plus className="size-4" />
          </Button>
        </div>
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {sorted.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              Nenhum item cadastrado.
            </li>
          )}
          {sorted.map((item) => (
            <li
              key={item}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span>{item}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${item}`}
                onClick={() => remove(item)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
