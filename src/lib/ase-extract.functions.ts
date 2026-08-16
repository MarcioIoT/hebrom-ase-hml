import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const ExtractInput = z.object({
  fileData: z.string(), // data:application/pdf;base64,....
  filename: z.string().default("avaliacao.pdf"),
});

export interface ExtractedAnswer {
  question: string;
  answer: number;
}
export interface ExtractedAssessment {
  memberName: string;
  conductorName: string;
  network: string;
  date: string;
  duration: string;
  answers: ExtractedAnswer[];
}

const SYSTEM_PROMPT = `Você extrai dados de um PDF da "Avaliação de Saúde Espiritual (ASE)" gerado por um portal Moodle.
O documento tem metadados e 35 perguntas de propósitos bíblicos, cada uma respondida com uma escala de 1 a 5, onde a opção marcada (com x, bolinha preenchida ou destaque) é a resposta.
Retorne SOMENTE um objeto JSON válido, sem texto extra e sem cercas de código, com este formato exato:
{
  "memberName": string,        // "Nome do Membro"
  "conductorName": string,     // "Nome do Condutor"
  "network": string,           // "Qual sua Rede" (opção marcada)
  "date": string,              // data da avaliação (ISO 8601 se possível)
  "duration": string,          // "Tempo gasto"
  "answers": [ { "question": string, "answer": number } ]  // as 35 perguntas de escala 1-5, na ordem do PDF
}
Inclua apenas perguntas cuja resposta seja de 1 a 5 (ignore as perguntas de metadados de texto/rede). O campo answer deve ser o número inteiro (1-5) da opção marcada.`;

function parseJson(text: string): ExtractedAssessment {
  let t = text.trim();
  // Strip code fences if present.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  // Fallback: grab the first {...} block.
  if (!t.startsWith("{")) {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) t = t.slice(start, end + 1);
  }
  const obj = JSON.parse(t);
  return {
    memberName: String(obj.memberName ?? ""),
    conductorName: String(obj.conductorName ?? ""),
    network: String(obj.network ?? ""),
    date: String(obj.date ?? ""),
    duration: String(obj.duration ?? ""),
    answers: Array.isArray(obj.answers)
      ? obj.answers
          .map((a: { question?: unknown; answer?: unknown }) => ({
            question: String(a.question ?? ""),
            answer: Math.round(Number(a.answer)) || 0,
          }))
          .filter((a: ExtractedAnswer) => a.question && a.answer >= 1 && a.answer <= 5)
      : [],
  };
}

export const extractAsePdf = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ExtractInput.parse(data))
  .handler(async ({ data }): Promise<ExtractedAssessment> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Serviço de IA indisponível (chave ausente).");

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia os dados desta avaliação ASE e responda apenas com o JSON.",
              },
              {
                type: "file",
                file: { filename: data.filename, file_data: data.fileData },
              },
            ],
          },
        ],
      }),
    });

    if (res.status === 429)
      throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
    if (res.status === 402)
      throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Falha na extração (${res.status}). ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("A IA não retornou conteúdo.");
    return parseJson(content);
  });
