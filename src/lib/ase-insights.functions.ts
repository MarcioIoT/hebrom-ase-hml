import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { DashInsights } from "./dashboard-types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const InsightsInput = z.object({
  memberName: z.string(),
  overallScore: z.number(),
  purposes: z.array(
    z.object({ name: z.string(), pct: z.number() }),
  ),
  lowestQuestions: z.array(
    z.object({ purpose: z.string(), question: z.string(), answer: z.number() }),
  ),
});

const SYSTEM = `Você é um mentor cristão experiente que ajuda condutores de Pequenos Grupos a discipular membros com acolhimento e clareza.
Com base nos dados da Avaliação de Saúde Espiritual, gere insights curtos, práticos e encorajadores (nunca julgadores).
Retorne SOMENTE JSON válido, sem cercas de código, no formato:
{
  "summary": [ { "kind": "positive" | "warning" | "tip", "text": string } ],
  "actions": [ string ]
}
Regras: 3 a 4 itens em summary (ao menos 1 positive, 1 warning e 1 tip); 4 a 5 ações práticas e específicas para a próxima reunião. Texto em português do Brasil, frases curtas e calorosas.`;

function parse(text: string): DashInsights {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  if (!t.startsWith("{")) {
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s >= 0 && e > s) t = t.slice(s, e + 1);
  }
  const obj = JSON.parse(t);
  const summary = Array.isArray(obj.summary)
    ? obj.summary
        .map((i: { kind?: unknown; text?: unknown }) => ({
          kind: ["positive", "warning", "tip"].includes(String(i.kind))
            ? (String(i.kind) as "positive" | "warning" | "tip")
            : "tip",
          text: String(i.text ?? ""),
        }))
        .filter((i: { text: string }) => i.text)
    : [];
  const actions = Array.isArray(obj.actions)
    ? obj.actions.map((a: unknown) => String(a)).filter(Boolean)
    : [];
  return { summary, actions, generatedBy: "ai" };
}

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InsightsInput.parse(data))
  .handler(async ({ data }): Promise<DashInsights> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Serviço de IA indisponível (chave ausente).");

    const userMsg = `Membro: ${data.memberName}
Saúde espiritual geral: ${data.overallScore}%
Pontuação por propósito: ${data.purposes.map((p) => `${p.name} ${p.pct}%`).join(", ")}
Perguntas com menor nota: ${data.lowestQuestions.map((q) => `[${q.purpose}] "${q.question}" = ${q.answer}/5`).join("; ")}`;

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (res.status === 429)
      throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
    if (res.status === 402)
      throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
    if (!res.ok) throw new Error(`Falha ao gerar insights (${res.status}).`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("A IA não retornou conteúdo.");
    return parse(content);
  });
