import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
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
import { store, useAssessments } from "@/lib/ase-store";
import { REDES } from "@/lib/ase-types";
import { useGroups } from "@/lib/group-store";

const monthLabel = () => {
  const d = new Date();
  const m = d.toLocaleDateString("pt-BR", { month: "long" });
  return `ASE ${m.charAt(0).toUpperCase() + m.slice(1)} ${d.getFullYear()}`;
};

export function CreateAssessmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const assessments = useAssessments();
  const groups = useGroups();
  const [name, setName] = useState(monthLabel());
  const [network, setNetwork] = useState<string>("");
  const [supervisor, setSupervisor] = useState("");
  const [conductor, setConductor] = useState("");
  const [reuseId, setReuseId] = useState<string>("none");
  const [groupId, setGroupId] = useState<string>("none");
  const [members, setMembers] = useState<{ name: string; code?: string }[]>([
    { name: "" },
  ]);

  const reset = () => {
    setName(monthLabel());
    setNetwork("");
    setSupervisor("");
    setConductor("");
    setReuseId("none");
    setGroupId("none");
    setMembers([{ name: "" }]);
  };

  const applyGroup = (id: string) => {
    setGroupId(id);
    if (id === "none") return;
    const g = groups.find((x) => x.id === id);
    if (!g) return;
    setReuseId("none");
    setNetwork(g.network ?? "");
    setSupervisor(g.supervisor ?? "");
    setConductor(g.conductor ?? "");
    setMembers(
      g.members.length
        ? g.members.map((m) => ({ name: m.name, code: m.code }))
        : [{ name: "" }],
    );
  };

  const applyReuse = (id: string) => {
    setReuseId(id);
    if (id === "none") return;
    const src = assessments.find((a) => a.id === id);
    if (src)
      setMembers(src.members.map((m) => ({ name: m.name, code: m.code })));
  };

  const submit = () => {
    const clean = members
      .map((m) => ({ ...m, name: m.name.trim() }))
      .filter((m) => m.name);
    const a = store.create({
      name,
      conductor,
      network,
      supervisor,
      members: clean,
    });
    reset();
    onOpenChange(false);
    navigate({ to: "/avaliacao/$id", params: { id: a.id } });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Nova avaliação</DialogTitle>
          <DialogDescription>
            Dê um nome, informe o condutor e adicione os membros do grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="ase-name">Nome da avaliação</Label>
            <Input
              id="ase-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ASE Julho 2026"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ase-rede">Rede</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger id="ase-rede">
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
          <div className="grid gap-2">
            <Label htmlFor="ase-sup">Supervisor</Label>
            <Input
              id="ase-sup"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              placeholder="Nome do supervisor"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ase-cond">Condutor</Label>
            <Input
              id="ase-cond"
              value={conductor}
              onChange={(e) => setConductor(e.target.value)}
              placeholder="Seu nome"
            />
          </div>


          {assessments.length > 0 && (
            <div className="grid gap-2">
              <Label>Reutilizar membros de</Label>
              <Select value={reuseId} onValueChange={applyReuse}>
                <SelectTrigger>
                  <SelectValue placeholder="Avaliação anterior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Começar do zero</SelectItem>
                  {assessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.members.length} membros
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Membros</Label>
            <div className="grid gap-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={m}
                    autoFocus={i === members.length - 1 && members.length > 1}
                    onChange={(e) =>
                      setMembers((prev) =>
                        prev.map((x, xi) => (xi === i ? e.target.value : x)),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setMembers((prev) => [...prev, ""]);
                      }
                    }}
                    placeholder={`Membro ${i + 1}`}
                  />
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
              onClick={() => setMembers((prev) => [...prev, ""])}
            >
              <Plus className="size-4" /> Adicionar membro
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Criar avaliação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
