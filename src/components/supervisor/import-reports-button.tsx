import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseAseWorkbook, type ParsedAse } from "@/lib/ase-excel";
import { supervisorStore, normalizeNetwork } from "@/lib/supervisor-store";

export function ImportReportsButton({
  size = "lg",
  variant = "default",
  network,
}: {
  size?: "sm" | "lg";
  variant?: "default" | "outline";
  /** Rede selecionada pelo supervisor. Só arquivos dessa rede são aceitos. */
  network: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: File[]) {
    setBusy(true);
    const parsedFiles: { file: File; parsed: ParsedAse }[] = [];
    const invalid: string[] = [];

    for (const file of files) {
      try {
        parsedFiles.push({ file, parsed: await parseAseWorkbook(file) });
      } catch {
        invalid.push(file.name);
      }
    }

    const reset = () => {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    };

    if (invalid.length > 0) {
      reset();
      toast.error("Alguns arquivos não são do padrão ASE", {
        description: `${invalid.join(", ")} — nenhum arquivo foi importado.`,
      });
      return;
    }

    // Validação 1: todos os arquivos devem ser da mesma rede.
    const networks = Array.from(
      new Set(parsedFiles.map((p) => normalizeNetwork(p.parsed.network))),
    );
    if (networks.length > 1) {
      reset();
      toast.error("Os arquivos são de redes diferentes", {
        description:
          "Importe apenas arquivos de uma mesma rede. Nenhum arquivo foi importado.",
      });
      return;
    }

    // Validação 2: a rede dos arquivos deve ser a rede do supervisor.
    const target = normalizeNetwork(network);
    const offenders = parsedFiles.filter(
      (p) => normalizeNetwork(p.parsed.network) !== target,
    );
    if (offenders.length > 0) {
      reset();
      toast.error(`Arquivos fora da rede "${network}"`, {
        description: `Rede encontrada: ${
          parsedFiles[0].parsed.network?.trim() || "não informada"
        }. Nenhum arquivo foi importado.`,
      });
      return;
    }

    for (const { file, parsed } of parsedFiles) {
      supervisorStore.import(parsed, file.name);
    }
    reset();
    toast.success(`${parsedFiles.length} arquivo(s) importado(s)`, {
      description: "A análise da rede foi atualizada.",
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) void onFiles(files);
        }}
      />
      <Button
        size={size}
        variant={variant}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />{" "}
        {busy ? "Importando…" : "Importar arquivos ASE"}
      </Button>
    </>
  );
}
