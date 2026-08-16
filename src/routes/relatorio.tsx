import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ase/theme-toggle";
import { GroupDashboardView } from "@/components/dashboard/group-dashboard-view";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { ShareProvider } from "@/lib/share-context";
import { decodeSharePayload } from "@/lib/share-link";
import { buildDashboardFromMatrix } from "@/lib/dashboard-scoring";
import type { DashAssessment } from "@/lib/dashboard-types";

export const Route = createFileRoute("/relatorio")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { d?: string; membro?: string } => ({
    d: typeof search.d === "string" ? search.d : undefined,
    membro: typeof search.membro === "string" ? search.membro : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Relatório do Pequeno Grupo — Saúde Espiritual" },
      {
        name: "description",
        content:
          "Visualização somente leitura da Avaliação de Saúde Espiritual do Pequeno Grupo.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedReport,
});

function SharedReport() {
  const { d, membro } = useSearch({ from: "/relatorio" });
  const navigate = useNavigate();

  const payload = useMemo(() => (d ? decodeSharePayload(d) : null), [d]);

  const memberDash = useMemo<DashAssessment | null>(() => {
    if (!payload || !membro) return null;
    const draft = buildDashboardFromMatrix(payload.a, membro);
    return {
      ...draft,
      id: `shared-${membro}`,
      createdAt: payload.a.createdAt,
      updatedAt: payload.a.updatedAt,
      insights: payload.insights?.[membro],
    };
  }, [payload, membro]);

  if (!d || !payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">
          Link inválido ou expirado. Peça um novo link ao condutor.
        </p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="size-4" /> Início
          </Link>
        </Button>
      </div>
    );
  }

  const isMemberView = Boolean(membro && memberDash);

  return (
    <ShareProvider
      value={{
        readOnly: true,
        token: d,
        planActions: payload.plan ?? [],
        insightsByMember: payload.insights ?? {},
      }}
    >
      <div className="min-h-screen bg-background">
        <header className="pt-safe sticky top-0 z-40 border-b bg-background/85 backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              {isMemberView ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={() =>
                    navigate({ to: "/relatorio", search: { d } })
                  }
                  aria-label="Voltar ao grupo"
                >
                  <ArrowLeft className="size-5" />
                </Button>
              ) : null}
              <div className="min-w-0 leading-tight">
                <div className="truncate font-display text-base font-bold">
                  {isMemberView ? memberDash!.memberName : payload.a.name}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="size-3" />
                  {isMemberView
                    ? "Dashboard Individual · Somente leitura"
                    : "Relatório do Grupo · Somente leitura"}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {isMemberView && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() =>
                    navigate({ to: "/relatorio", search: { d } })
                  }
                >
                  <Users className="size-4" /> Voltar ao grupo
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {isMemberView ? (
            <DashboardView d={memberDash!} />
          ) : (
            <GroupDashboardView a={payload.a} />
          )}
        </main>
      </div>
    </ShareProvider>
  );
}
