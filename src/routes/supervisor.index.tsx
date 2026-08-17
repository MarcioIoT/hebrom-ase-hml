import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Layers, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ase/theme-toggle";
import { ImportReportsButton } from "@/components/supervisor/import-reports-button";
import { NetworkOverview } from "@/components/supervisor/network-overview";
import { useSupervisorReports } from "@/lib/supervisor-store";

export const Route = createFileRoute("/supervisor/")({
  component: SupervisorHome,
});

function SupervisorHome() {
  const reports = useSupervisorReports();

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-safe sticky top-0 z-40 border-b bg-background/85 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
              <Link to="/">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-base font-bold">
                Módulo do Supervisor
              </div>
              <div className="text-xs text-muted-foreground">
                Análise da rede a partir dos ASE dos condutores
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {reports.length > 0 && (
              <ImportReportsButton size="sm" variant="outline" />
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {reports.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Layers className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">
              Analise a saúde espiritual da sua rede
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Importe os arquivos Excel que os condutores exportaram após o ASE.
              O sistema consolida tudo: visão geral da rede, depois cada Pequeno
              Grupo, cada membro e cada pergunta.
            </p>
            <div className="mt-6 flex justify-center">
              <ImportReportsButton />
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Upload className="size-3.5" /> Aceita vários arquivos .xlsx de uma
              só vez
            </p>
          </div>
        ) : (
          <NetworkOverview reports={reports} />
        )}
      </main>
    </div>
  );
}
