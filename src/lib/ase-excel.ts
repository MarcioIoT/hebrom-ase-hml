import * as XLSX from "xlsx";
import type { Assessment, ScoreValue } from "./ase-types";
import { PURPOSES, QUESTIONS, QUESTIONS_BY_PURPOSE } from "./ase-content";
import { SCORE_LABELS } from "./ase-content";

// ---------------------------------------------------------------------------
// Formato padrão de intercâmbio do ASE (.xlsx).
// O arquivo é ao mesmo tempo relatório e fonte de importação: as abas
// "Info", "Membros", "Respostas" e "Observacoes" contêm tudo o que é
// necessário para reconstruir a avaliação.
// ---------------------------------------------------------------------------

export const ASE_FILE_VERSION = "1";

export interface ExcelExportOptions {
  /** Substitui o nome do participante pelo código único no arquivo exportado. */
  anonymize?: boolean;
  /** Inclui a aba de resumo por propósito (não é necessária na importação). */
  includeSummary?: boolean;
}

export function memberLabel(
  m: { id: string; name: string; code?: string },
  anonymize: boolean,
): string {
  if (!anonymize) return m.name;
  return m.code || `ANON-${m.id.slice(-6).toUpperCase()}`;
}

function sheet(rows: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows as never);
  const widths = (rows[0] as unknown[] | undefined)?.map((_, i) => {
    const len = rows.reduce(
      (max, r) => Math.max(max, String(r[i] ?? "").length),
      10,
    );
    return { wch: Math.min(60, len + 2) };
  });
  if (widths) ws["!cols"] = widths;
  return ws;
}

export function buildAseWorkbook(
  a: Assessment,
  opts: ExcelExportOptions = {},
): XLSX.WorkBook {
  const anonymize = !!opts.anonymize;
  const wb = XLSX.utils.book_new();

  // --- Info -----------------------------------------------------------------
  const groupName = a.groupName || a.name;
  XLSX.utils.book_append_sheet(
    wb,
    sheet([
      ["Campo", "Valor"],
      ["ASE_FORMATO", "ASE_EXCEL"],
      ["Versao", ASE_FILE_VERSION],
      ["ID da avaliacao", a.id],
      ["Grupo", groupName],
      ["Rede", a.network ?? ""],
      ["Supervisor", a.supervisor ?? ""],
      ["Condutor", a.conductor],
      ["Criado em", a.createdAt],
      ["Atualizado em", a.updatedAt],
      ["Finalizado em", a.finishedAt ?? ""],
      ["Anonimizado", anonymize ? "SIM" : "NAO"],
      ["Exportado em", new Date().toISOString()],
    ]),
    "Info",
  );

  // --- Membros --------------------------------------------------------------
  XLSX.utils.book_append_sheet(
    wb,
    sheet([
      ["ID do membro", "Codigo", "Participante"],
      ...a.members.map((m) => [
        m.id,
        m.code ?? "",
        memberLabel(m, anonymize),
      ]),
    ]),
    "Membros",
  );

  // --- Respostas ------------------------------------------------------------
  const answers: unknown[][] = [
    [
      "ID do membro",
      "Participante",
      "Proposito",
      "ID do proposito",
      "Nº",
      "ID da pergunta",
      "Pergunta",
      "Nota",
      "Escala",
    ],
  ];
  for (const m of a.members) {
    const row = a.scores[m.id] ?? {};
    for (const p of PURPOSES) {
      for (const q of QUESTIONS_BY_PURPOSE[p.id]) {
        const v = row[q.id];
        answers.push([
          m.id,
          memberLabel(m, anonymize),
          p.name,
          p.id,
          q.order,
          q.id,
          q.text,
          v ?? "",
          v ? SCORE_LABELS[v] : "",
        ]);
      }
    }
  }
  XLSX.utils.book_append_sheet(wb, sheet(answers), "Respostas");

  // --- Observacoes ----------------------------------------------------------
  const notes: unknown[][] = [
    ["ID do membro", "Participante", "ID do proposito", "Proposito", "Observacao"],
  ];
  for (const m of a.members) {
    const row = a.notes?.[m.id] ?? {};
    for (const p of PURPOSES) {
      const text = row[p.id];
      if (text) notes.push([m.id, memberLabel(m, anonymize), p.id, p.name, text]);
    }
  }
  XLSX.utils.book_append_sheet(wb, sheet(notes), "Observacoes");

  // --- Resumo ---------------------------------------------------------------
  if (opts.includeSummary !== false) {
    const header = [
      "Participante",
      ...PURPOSES.map((p) => `${p.name} (%)`),
      "Geral (%)",
    ];
    const rows: unknown[][] = [header];
    for (const m of a.members) {
      const row = a.scores[m.id] ?? {};
      const pcts = PURPOSES.map((p) => {
        const qs = QUESTIONS_BY_PURPOSE[p.id];
        const answered = qs.filter((q) => row[q.id]);
        if (!answered.length) return "";
        const sum = answered.reduce((s, q) => s + (row[q.id] as number), 0);
        return Math.round((sum / (answered.length * 5)) * 100);
      });
      const all = QUESTIONS.filter((q) => row[q.id]);
      const overall = all.length
        ? Math.round(
            (all.reduce((s, q) => s + (row[q.id] as number), 0) /
              (all.length * 5)) *
              100,
          )
        : "";
      rows.push([memberLabel(m, anonymize), ...pcts, overall]);
    }
    XLSX.utils.book_append_sheet(wb, sheet(rows), "Resumo");
  }

  return wb;
}

export function exportAseExcel(a: Assessment, opts: ExcelExportOptions = {}) {
  const wb = buildAseWorkbook(a, opts);
  const groupName = a.groupName || a.name;
  const slug = groupName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const name = `ase-${slug || "grupo"}${opts.anonymize ? "-anonimo" : ""}-${date}.xlsx`;
  XLSX.writeFile(wb, name);
  return name;
}

// ---------------------------------------------------------------------------
// Importação
// ---------------------------------------------------------------------------

export interface ParsedAse {
  name: string;
  groupName?: string;
  network?: string;
  supervisor?: string;
  conductor: string;
  anonymized: boolean;
  members: { id: string; name: string; code?: string }[];
  /** scores[originalMemberId][questionId] */
  scores: Record<string, Record<string, ScoreValue>>;
  notes: Record<string, Record<string, string>>;
}

function rowsOf(wb: XLSX.WorkBook, name: string): Record<string, string>[] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils
    .sheet_to_json<Record<string, unknown>>(ws, { defval: "" })
    .map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [String(k).trim(), String(v ?? "").trim()]),
      ),
    );
}

export async function parseAseWorkbook(file: File): Promise<ParsedAse> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const info = new Map<string, string>();
  for (const r of rowsOf(wb, "Info")) {
    const key = r["Campo"];
    if (key) info.set(key, r["Valor"] ?? "");
  }
  if (info.get("ASE_FORMATO") !== "ASE_EXCEL") {
    throw new Error(
      "Arquivo inválido: use um Excel exportado pelo ASE (aba Info com ASE_FORMATO).",
    );
  }

  const members = rowsOf(wb, "Membros")
    .map((r) => ({
      id: r["ID do membro"],
      name: r["Participante"] || r["Codigo"] || r["ID do membro"],
      code: r["Codigo"] || undefined,
    }))
    .filter((m) => m.id || m.name);

  const validQuestionIds = new Set(QUESTIONS.map((q) => q.id));
  const scores: Record<string, Record<string, ScoreValue>> = {};
  for (const r of rowsOf(wb, "Respostas")) {
    const mid = r["ID do membro"];
    const qid = r["ID da pergunta"];
    const n = Number(r["Nota"]);
    if (!mid || !validQuestionIds.has(qid)) continue;
    if (!Number.isInteger(n) || n < 1 || n > 5) continue;
    (scores[mid] ??= {})[qid] = n as ScoreValue;
  }

  const validPurposes = new Set(PURPOSES.map((p) => p.id));
  const notes: Record<string, Record<string, string>> = {};
  for (const r of rowsOf(wb, "Observacoes")) {
    const mid = r["ID do membro"];
    const pid = r["ID do proposito"];
    const text = r["Observacao"];
    if (!mid || !validPurposes.has(pid as never) || !text) continue;
    (notes[mid] ??= {})[pid] = text;
  }

  return {
    name: info.get("Grupo") || "Avaliação importada",
    network: info.get("Rede") || undefined,
    supervisor: info.get("Supervisor") || undefined,
    conductor: info.get("Condutor") || "",
    anonymized: (info.get("Anonimizado") || "").toUpperCase() === "SIM",
    members,
    scores,
    notes,
  };
}
