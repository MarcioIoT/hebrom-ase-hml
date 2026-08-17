import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ase/theme-toggle";
import { GroupDashboardView } from "@/components/dashboard/group-dashboard-view";
import { useSupervisorReport } from "@/lib/supervisor-store";

export const Route = createFileRoute("/supervisor/grupo/$id")({
  component: SupervisorGroupPage,
});

function SupervisorGroupPage() {
  const { id } = useParams({ from: "/supervisor/grupo/$id" });
  const r = useSupervisorReport(id);

  if (!r) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
        <Button asChild variant="outline">
          <Link to="/supervisor">
            <ArrowLeft className="size-4" /> Voltar à rede
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-safe sticky top-0 z-40 border-b bg-background/85 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
              <Link to="/supervisor">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-base font-bold">
                {r.name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {r.network ?? "Sem rede"} · Condutor {r.conductor}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
              <FileSpreadsheet className="size-3.5" /> {r.fileName}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <GroupDashboardView a={r} />
      </main>
    </div>
  );
}
