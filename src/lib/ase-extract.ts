import { PURPOSES, QUESTIONS_BY_PURPOSE } from "./ase-content";
import { scoreComment } from "./dashboard-scoring";
import type { DashAssessment, DashPurpose } from "./dashboard-types";
import { overallFromPurposes } from "./dashboard-scoring";
import type { ExtractedAssessment } from "./ase-extract.functions";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(normalize(s).split(" ").filter((w) => w.length > 2));
}

/** Jaccard similarity between two questions' token sets. */
function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

/**
 * Map AI-extracted answers to the canonical 35 questions, grouped by purpose.
 * Matching is by fuzzy text similarity so it's resilient to small OCR/wording
 * differences and to the PDF's purpose ordering.
 */
export function extractedToDashboard(
  ex: ExtractedAssessment,
): Omit<DashAssessment, "id" | "createdAt" | "updatedAt"> {
  const used = new Set<number>();

  const purposes: DashPurpose[] = PURPOSES.map((p) => {
    const questions = QUESTIONS_BY_PURPOSE[p.id].map((q) => {
      // Find the best-matching extracted answer not already claimed.
      let bestIdx = -1;
      let bestScore = 0.2; // minimum threshold
      ex.answers.forEach((a, i) => {
        if (used.has(i)) return;
        const s = similarity(q.text, a.question);
        if (s > bestScore) {
          bestScore = s;
          bestIdx = i;
        }
      });
      let answer = 0;
      if (bestIdx >= 0) {
        used.add(bestIdx);
        answer = ex.answers[bestIdx].answer;
      }
      return {
        question: q.text,
        answer,
        observation: answer ? scoreComment(answer) : undefined,
      };
    });
    const score = questions.reduce((s, q) => s + q.answer, 0);
    return { id: p.id, name: p.name, score, questions };
  });

  let date = new Date().toISOString();
  const parsed = ex.date ? new Date(ex.date) : null;
  if (parsed && !isNaN(parsed.getTime())) date = parsed.toISOString();

  return {
    memberName: ex.memberName || "Membro",
    conductorName: ex.conductorName || "—",
    network: ex.network || "",
    date,
    duration: ex.duration || "",
    overallScore: overallFromPurposes(purposes),
    purposes,
    history: [],
    source: "pdf",
  };
}

/** How many of the 35 questions were successfully matched. */
export function matchedCount(
  d: Omit<DashAssessment, "id" | "createdAt" | "updatedAt">,
): number {
  return d.purposes.reduce(
    (s, p) => s + p.questions.filter((q) => q.answer > 0).length,
    0,
  );
}
