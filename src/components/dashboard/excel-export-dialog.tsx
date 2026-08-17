import { useState } from "react";
import { FileSpreadsheet, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Assessment } from "@/lib/ase-types";
import { exportAseExcel, memberLabel } from "@/lib/ase-excel";

export function ExcelExportDialog({ a }: { a: Assessment }) {
  const [open, setOpen] = useState(false);
  const [anonymize, setAnonymize] = useState(false);
  const preview = a.members.slice(0, 3);

  function run() {
    try {
      const file = exportAseExcel(a, { anonymize });
      toast.success("Excel exportado", { description: file });
      setOpen(false);
    } catch {
      toast.error("Não foi possível gerar o arquivo Excel.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="print:hidden">
          <FileSpreadsheet className="size-4" /> Exportar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Exportar Excel</DialogTitle>
          <DialogDescription>
            Gera o arquivo padrão do ASE (.xlsx) com todas as respostas,
            observações e dados do grupo — pronto para ser importado de volta.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition hover:bg-muted/40">
          <Checkbox
            checked={anonymize}
            onCheckedChange={(v) => setAnonymize(v === true)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">
              Anonimizar nomes dos participantes
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              O nome é substituído pelo código único do membro. Afeta apenas o
              arquivo exportado — os nomes reais continuam salvos no ASE.
            </span>
          </span>
        </label>

        {preview.length > 0 && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Prévia da coluna
              &ldquo;Participante&rdquo;
            </div>
            <ul className="space-y-0.5 text-sm tabular-nums">
              {preview.map((m) => (
                <li key={m.id} className="truncate">
                  {memberLabel(m, anonymize)}
                </li>
              ))}
              {a.members.length > preview.length && (
                <li className="text-xs text-muted-foreground">
                  +{a.members.length - preview.length} participante(s)
                </li>
              )}
            </ul>
            {anonymize && a.members.some((m) => !m.code) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Membros sem código de pré-cadastro recebem um identificador
                estável (ANON-…).
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={run}>
            <Download className="size-4" /> Baixar Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
