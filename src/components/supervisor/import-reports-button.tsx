import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseAseWorkbook } from "@/lib/ase-excel";
import { supervisorStore } from "@/lib/supervisor-store";

export function ImportReportsButton({
  size = "lg",
  variant = "default",
}: {
  size?: "sm" | "lg";
  variant?: "default" | "outline";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: File[]) {
    setBusy(true);
    let ok = 0;
    const failed: string[] = [];
    for (const file of files) {
      try {
        const parsed = await parseAseWorkbook(file);
        supervisorStore.import(parsed, file.name);
        ok++;
      } catch {
        failed.push(file.name);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (ok > 0)
      toast.success(`${ok} arquivo(s) importado(s)`, {
        description: "A análise da rede foi atualizada.",
      });
    if (failed.length > 0)
      toast.error("Alguns arquivos não são do padrão ASE", {
        description: failed.join(", "),
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
