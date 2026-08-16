import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ase/theme-toggle";
import { useDashboard } from "@/lib/dashboard-store";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const Route = createFileRoute("/dashboard/$id")({
  validateSearch: (search: Record<string, unknown>): { grupo?: string } => ({
    grupo: typeof search.grupo === "string" ? search.grupo : undefined,
  }),
  component: DashboardDetail,
});

function DashboardDetail() {
  const { id } = useParams({ from: "/dashboard/$id" });
  const { grupo } = useSearch({ from: "/dashboard/$id" });
  const d = useDashboard(id);

  if (!d) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Dashboard não encontrado.</p>
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
      <header className="pt-safe sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
              {grupo ? (
                <Link to="/dashboard/grupo/$id" params={{ id: grupo }}>
                  <ArrowLeft className="size-5" />
                </Link>
              ) : (
                <Link to="/dashboard">
                  <ArrowLeft className="size-5" />
                </Link>
              )}
            </Button>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-base font-bold">
                {d.memberName}
              </div>
              <div className="text-xs text-muted-foreground">
                Saúde Espiritual
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {grupo && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link to="/dashboard/grupo/$id" params={{ id: grupo }}>
                  <Users className="size-4" /> Voltar ao grupo
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <DashboardView d={d} />
      </main>
    </div>
  );
}
