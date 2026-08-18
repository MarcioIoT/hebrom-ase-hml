import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Layers, Upload, Network, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REDES } from "@/lib/ase-types";

import { ThemeToggle } from "@/components/ase/theme-toggle";
import { ImportReportsButton } from "@/components/supervisor/import-reports-button";
import { NetworkOverview } from "@/components/supervisor/network-overview";
import {
  useSupervisorReports,
  useSupervisorNetwork,
  supervisorNetwork,
} from "@/lib/supervisor-store";

export const Route = createFileRoute("/supervisor/")({
  component: SupervisorHome,
});

function SupervisorHome() {
  const reports = useSupervisorReports();
  const network = useSupervisorNetwork();
  const [editing, setEditing] = useState(false);

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
              <div className="truncate text-xs text-muted-foreground">
                {network ? `Rede: ${network}` : "Selecione a sua rede"}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {network && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                aria-label="Alterar rede"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {network && reports.length > 0 && (
              <ImportReportsButton size="sm" variant="outline" network={network} />
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {!network || editing ? (
          <NetworkSetup
            current={network}
            hasReports={reports.length > 0}
            onDone={() => setEditing(false)}
            onCancel={network ? () => setEditing(false) : undefined}
          />
        ) : reports.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Layers className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">{network}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Importe os arquivos Excel que os condutores da sua rede exportaram
              após o ASE. O sistema consolida tudo: visão geral da rede, depois
              cada Pequeno Grupo, cada membro e cada pergunta.
            </p>
            <div className="mt-6 flex justify-center">
              <ImportReportsButton network={network} />
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Upload className="size-3.5" /> Só são aceitos arquivos da rede{" "}
              <strong>{network}</strong>
            </p>
          </div>
        ) : (
          <NetworkOverview reports={reports} network={network} />
        )}
      </main>
    </div>
  );
}

function NetworkSetup({
  current,
  hasReports,
  onDone,
  onCancel,
}: {
  current: string;
  hasReports: boolean;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(current);
  const trimmed = value.trim();

  function save() {
    if (!trimmed) return;
    supervisorNetwork.set(trimmed);
    onDone();
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-card px-6 py-10 text-center shadow-soft">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Network className="size-7" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold">
        {current ? "Alterar rede" : "Qual é a sua rede?"}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Informe a rede que você supervisiona. A importação só aceitará arquivos
        ASE dessa rede, garantindo que a análise consolide apenas os seus
        Pequenos Grupos.
      </p>
      <form
        className="mx-auto mt-6 max-w-sm space-y-3 text-left"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="sup-network">Rede</Label>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger id="sup-network">
              <SelectValue placeholder="Selecione a rede" />
            </SelectTrigger>
            <SelectContent>
              {REDES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {current && hasReports && trimmed && trimmed !== current && (
          <p className="text-xs text-muted-foreground">
            Os relatórios já importados da rede {current} continuam na lista —
            remova-os se quiser começar do zero.
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={!trimmed} className="flex-1">
            <Check className="size-4" /> Confirmar rede
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
