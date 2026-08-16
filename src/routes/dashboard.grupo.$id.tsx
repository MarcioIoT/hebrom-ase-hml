import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ase/theme-toggle";
import { useAssessment } from "@/lib/ase-store";
import { GroupDashboardView } from "@/components/dashboard/group-dashboard-view";
import { ShareDialog } from "@/components/dashboard/share-dialog";

export const Route = createFileRoute("/dashboard/grupo/$id")({
  component: GroupDashboardPage,
});

function GroupDashboardPage() {
  const { id } = useParams({ from: "/dashboard/grupo/$id" });
  const a = useAssessment(id);

  if (!a) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Avaliação não encontrada.</p>
        <Button asChild variant="outline">
          <Link to="/dashboard">
            <ArrowLeft className="size-4" /> Voltar
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
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <Link to="/dashboard">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-base font-bold">
                {a.name}
              </div>
              <div className="text-xs text-muted-foreground">
                Dashboard do Pequeno Grupo
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ShareDialog a={a} />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link to="/avaliacao/$id" params={{ id: a.id }}>
                <Grid3x3 className="size-4" /> Matriz
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <GroupDashboardView a={a} />
      </main>
    </div>
  );
}
