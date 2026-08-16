import { useEffect, useState } from "react";
import { Plus, X, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REDES } from "@/lib/ase-types";
import { groupStore, type Group } from "@/lib/group-store";
import { toast } from "sonner";

type Row = { id?: string; name: string; code?: string };

export function GroupDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group?: Group | null;
}) {
  const [name, setName] = useState("");
  const [network, setNetwork] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [conductor, setConductor] = useState("");
  const [members, setMembers] = useState<Row[]>([{ name: "" }]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(group?.name ?? "");
    setNetwork(group?.network ?? "");
    setSupervisor(group?.supervisor ?? "");
    setConductor(group?.conductor ?? "");
    setMembers(
      group && group.members.length
        ? group.members.map((m) => ({ id: m.id, name: m.name, code: m.code }))
        : [{ name: "" }],
    );
  }, [open, group]);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }
    const payload = { name, network, supervisor, conductor, members };
    if (group) {
      groupStore.update(group.id, payload);
      toast.success("Grupo atualizado.");
    } else {
      groupStore.create(payload);
      toast.success("Grupo cadastrado.");
    }
    onOpenChange(false);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {group ? "Editar grupo" : "Cadastrar grupo"}
          </DialogTitle>
          <DialogDescription>
            Salve o grupo uma vez e reutilize em todas as avaliações. Cada
            membro recebe um código único para anonimização.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="grp-name">Nome do grupo</Label>
            <Input
              id="grp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PG Hebrom Centro"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="grp-rede">Rede</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger id="grp-rede">
                <SelectValue placeholder="Selecione a rede" />
              </SelectTrigger>
              <SelectContent>
                {REDES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="grp-sup">Supervisor</Label>
              <Input
                id="grp-sup"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                placeholder="Nome do supervisor"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grp-cond">Condutor</Label>
              <Input
                id="grp-cond"
                value={conductor}
                onChange={(e) => setConductor(e.target.value)}
                placeholder="Nome do condutor"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Membros</Label>
            <div className="grid gap-2">
              {members.map((m, i) => (
                <div key={m.id ?? i} className="flex items-center gap-2">
                  <Input
                    value={m.name}
                    onChange={(e) =>
                      setMembers((prev) =>
                        prev.map((x, xi) =>
                          xi === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setMembers((prev) => [...prev, { name: "" }]);
                      }
                    }}
                    placeholder={`Membro ${i + 1}`}
                  />
                  {m.code ? (
                    <button
                      type="button"
                      onClick={() => copyCode(m.code!)}
                      title="Copiar código"
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-muted px-2 py-1.5 font-mono text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {copied === m.code ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      {m.code}
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-md border border-dashed px-2 py-1.5 text-xs italic text-muted-foreground">
                      código ao salvar
                    </span>
                  )}
                  {members.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground"
                      onClick={() =>
                        setMembers((prev) => prev.filter((_, xi) => xi !== i))
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setMembers((prev) => [...prev, { name: "" }])}
            >
              <Plus className="size-4" /> Adicionar membro
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>
            {group ? "Salvar alterações" : "Cadastrar grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
