import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/supervisor")({
  head: () => ({
    meta: [
      { title: "Supervisor · Análise da Rede | ASE" },
      {
        name: "description",
        content:
          "Importe os arquivos ASE enviados pelos condutores e analise a saúde espiritual da rede: visão geral, por Pequeno Grupo e por membro.",
      },
      { property: "og:title", content: "Supervisor · Análise da Rede | ASE" },
      {
        property: "og:description",
        content:
          "Consolide as avaliações dos Pequenos Grupos e acompanhe a saúde espiritual da rede em todos os níveis.",
      },
    ],
  }),
  component: () => <Outlet />,
});
