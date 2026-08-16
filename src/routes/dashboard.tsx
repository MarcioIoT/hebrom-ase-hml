import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Avaliação de Saúde Espiritual" },
      {
        name: "description",
        content:
          "Visualize os resultados da Avaliação de Saúde Espiritual por membro: gauge geral, radar dos propósitos, insights com IA e plano de ação.",
      },
    ],
  }),
  component: () => <Outlet />,
});
