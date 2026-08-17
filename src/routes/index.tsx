import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Grid3x3,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Keyboard,
  Users,
  Radar,
  Zap,
  Layers,
  Upload,
} from "lucide-react";
import { PURPOSES } from "@/lib/ase-content";
import { FloatingResourcesButton } from "@/components/ase/floating-resources-button";
import { ThemeToggle } from "@/components/ase/theme-toggle";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="pt-safe sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/icons/icon-192.png"
              alt="ASE"
              width={36}
              height={36}
              className="size-9 rounded-xl shadow-soft"
            />
            <div className="leading-tight">
              <div className="font-display text-base font-bold">ASE</div>
              <div className="text-xs text-muted-foreground">
                Avaliação de Saúde Espiritual
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" /> Para condutores de Pequenos Grupos
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">
            Avalie e acompanhe a saúde espiritual do seu grupo.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Escolha um módulo para começar: registre avaliações em minutos ou
            visualize resultados de forma clara e orientada ao discipulado.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {PURPOSES.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center rounded-full border bg-card px-2.5 py-1 text-xs"
              >
                {p.name}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <ModuleCard
            to="/matrix"
            icon={<Grid3x3 className="size-6" />}
            title="Matriz"
            subtitle="Registrar avaliações"
            description="Avalie vários membros na mesma tela, uma pergunta por vez. Navegação por teclado como no Excel e salvamento automático."
            features={[
              { icon: <Keyboard className="size-3.5" />, label: "Teclado rápido" },
              { icon: <Users className="size-3.5" />, label: "Vários membros" },
              { icon: <Zap className="size-3.5" />, label: "Autosave" },
            ]}
            accent="var(--color-primary)"
            cta="Abrir Matriz"
          />
          <ModuleCard
            to="/dashboard"
            icon={<LayoutDashboard className="size-6" />}
            title="Dashboard"
            subtitle="Visualizar resultados"
            description="Dashboard moderno por membro: gauge geral, radar dos propósitos, insights com IA e plano de ação. Gere automaticamente a partir da Matriz."
            features={[
              { icon: <Grid3x3 className="size-3.5" />, label: "Da Matriz" },
              { icon: <Radar className="size-3.5" />, label: "Radar visual" },
              { icon: <Sparkles className="size-3.5" />, label: "Insights IA" },
            ]}
            accent="var(--color-p-discipulado)"
            cta="Abrir Dashboard"
          />
          <ModuleCard
            to="/supervisor"
            icon={<Layers className="size-6" />}
            title="Supervisor"
            subtitle="Analisar a rede"
            description="Importe os arquivos ASE enviados pelos condutores e acompanhe a rede em camadas: visão geral, grupo a grupo, membro a membro."
            features={[
              { icon: <Upload className="size-3.5" />, label: "Importa Excel" },
              { icon: <Layers className="size-3.5" />, label: "Rede → Grupo" },
              { icon: <Radar className="size-3.5" />, label: "Consolidado" },
            ]}
            accent="var(--color-p-ministerio)"
            cta="Abrir Supervisor"
          />
        </section>

      </main>
      <FloatingResourcesButton />
    </div>
  );
}

function ModuleCard({
  to,
  icon,
  title,
  subtitle,
  description,
  features,
  accent,
  cta,
}: {
  to: "/matrix" | "/dashboard" | "/supervisor";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; label: string }[];
  accent: string;
  cta: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link
        to={to}
        className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition hover:shadow-pop"
      >
        <span
          className="grid size-12 place-items-center rounded-2xl"
          style={{
            color: accent,
            backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
          }}
        >
          {icon}
        </span>
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {subtitle}
          </div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
        </div>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {features.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground"
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>
        <div
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: accent }}
        >
          {cta}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </motion.div>
  );
}
