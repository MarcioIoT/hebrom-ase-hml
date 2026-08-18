import { useState } from "react";
import { FileSpreadsheet, Trash2, ChevronDown, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supervisorStore, type SupervisorReport } from "@/lib/supervisor-store";

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ImportsList({ reports }: { reports: SupervisorReport[] }) {
  const [open, setOpen] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const sorted = [...reports].sort((a, b) =>
    b.importedAt.localeCompare(a.importedAt),
  );

  return (
    <section className="rounded-2xl border bg-card shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="min-w-0">
          <h3 className="inline-flex items-center gap-1.5 font-display text-lg font-semibold">
            <FileSpreadsheet className="size-5 text-primary" /> Importações
            realizadas
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {sorted.length} arquivo(s) importado(s) — veja e remova o que
            precisar.
          </p>
        </div>
        <ChevronDown
          className={`size-5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t px-5 pb-5">
          <ul className="divide-y">
            {sorted.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileSpreadsheet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {r.groupName || r.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.conductor} · {r.members.length} membro(s) ·{" "}
                    {fmt(r.importedAt)}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1 truncate">
                      <span className="truncate">{r.fileName}</span>
                    </span>
                    {r.anonymized && (
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                        <EyeOff className="size-3" /> anonimizado
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remover importação ${r.fileName}`}
                  onClick={() => supervisorStore.remove(r.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {confirmAll ? (
              <>
                <span className="text-xs text-muted-foreground">
                  Remover todas as importações?
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    supervisorStore.clear();
                    setConfirmAll(false);
                  }}
                >
                  Sim, remover todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmAll(false)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmAll(true)}
              >
                <Trash2 className="size-4" /> Remover todas
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
