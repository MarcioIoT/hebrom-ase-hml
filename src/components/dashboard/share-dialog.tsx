import { useMemo, useState } from "react";
import { Link2, Copy, Check, ExternalLink, ShieldCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Assessment } from "@/lib/ase-types";
import type { DashInsights } from "@/lib/dashboard-types";
import { dashStore } from "@/lib/dashboard-store";
import { useGroupPlan } from "@/lib/group-plan-store";
import { encodeSharePayload } from "@/lib/share-link";

/**
 * "Compartilhar Relatório" — generates a secure read-only link to the Group
 * Dashboard. The whole report travels inside the link (compressed), so the
 * supervisor opens it without logging in and without any backend. Reuses the
 * existing assessment, group plan and per-member AI insights.
 */
export function ShareDialog({ a }: { a: Assessment }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const planActions = useGroupPlan(a.id);

  const url = useMemo(() => {
    // Collect any AI insights the conductor already generated per member.
    const insights: Record<string, DashInsights> = {};
    for (const m of a.members) {
      const d = dashStore
        .list()
        .find(
          (x) => x.matrixAssessmentId === a.id && x.matrixMemberId === m.id,
        );
      if (d?.insights) insights[m.id] = d.insights;
    }

    const token = encodeSharePayload({
      v: 1,
      a,
      plan: planActions,
      insights: Object.keys(insights).length ? insights : undefined,
    });

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/relatorio?d=${token}`;
  }, [a, planActions]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="print:hidden">
          <Link2 className="size-4" /> Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            Compartilhar com Supervisor
          </DialogTitle>
          <DialogDescription>
            Gere um link seguro em modo somente leitura para compartilhar o
            Dashboard do Grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" /> Link somente
              leitura
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Eye className="size-3.5" /> O supervisor visualiza sem precisar
                fazer login.
              </li>
              <li>
                Inclui o dashboard do grupo, os cartões dos membros e o
                dashboard individual de cada um.
              </li>
              <li>
                Não é possível editar respostas, excluir dados ou iniciar novas
                avaliações.
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <Input readOnly value={url} className="h-9 text-xs" />
            <Button size="sm" onClick={copy} className="shrink-0">
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button asChild size="sm" variant="ghost">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Abrir pré-visualização
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
