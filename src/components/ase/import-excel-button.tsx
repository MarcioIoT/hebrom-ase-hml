import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/ase-store";
import { parseAseWorkbook } from "@/lib/ase-excel";

export function ImportExcelButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onFile(file: File) {
    setBusy(true);
    try {
      const parsed = await parseAseWorkbook(file);
      const a = store.importAssessment(parsed);
      toast.success("Avaliação importada", {
        description: `${a.name} — ${a.members.length} participante(s)`,
      });
      navigate({ to: "/avaliacao/$id", params: { id: a.id } });
    } catch (err) {
      toast.error("Falha ao importar", {
        description:
          err instanceof Error ? err.message : "Arquivo Excel inválido.",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      <Button
        size="lg"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" /> {busy ? "Importando…" : "Importar Excel"}
      </Button>
    </>
  );
}
