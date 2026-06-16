import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE =
  process.env.FORD_API_BASE ?? "http://163.176.204.45:8080/api/v1";

function authHeader() {
  const user = process.env.FORD_API_USER ?? "admin.ti";
  const pass = process.env.FORD_API_PASS ?? "admin123";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

function friendlyError(status: number, body: string): string {
  if (body.includes("error code: 1003") || body.includes("1003")) {
    return "A API está hospedada em um IP bruto (163.176.204.45) e o servidor publicado (Cloudflare) bloqueia chamadas para IP sem domínio. Configure um hostname público (ex.: api.seudominio.com com HTTPS) e adicione o secret FORD_API_BASE.";
  }
  if (status === 401 || status === 403) {
    return `Erro ${status}: credenciais Ford API inválidas ou bloqueadas.`;
  }
  return `Erro ${status}: ${body.slice(0, 200)}`;
}

export type EspecificacaoFord = {
  id: number;
  categoria: string;
  equipamento: string;
  versaoXlt: string;
  versaoLimited: string;
  versaoLimitedPlus: string;
};

export const getFordSpecs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ data: EspecificacaoFord[]; error: string | null }> => {
    try {
      const res = await fetch(`${API_BASE}/veiculos/ford-specs`, {
        headers: { Authorization: authHeader(), Accept: "application/json" },
      });
      if (!res.ok) return { data: [], error: `Erro ${res.status}` };
      const data = (await res.json()) as EspecificacaoFord[];
      return { data, error: null };
    } catch (e) {
      console.error("getFordSpecs failed", e);
      return { data: [], error: "Não foi possível conectar à API Ford." };
    }
  },
);

const comparePattern = /^[a-zA-Z0-9À-ÿ\s\-+.,]+$/;
const compareSchema = z.object({
  versaoFord: z.string().min(2).max(50).regex(comparePattern),
  concorrente: z.string().min(2).max(50).regex(comparePattern),
});

export type ComparisonData = {
  fordName: string;
  rivalName: string;
  fordSpecs: Record<string, string>;
  rivalSpecs: Record<string, string>;
  attributes: string[];
  raw: string;
};

function parseComparison(raw: string): ComparisonData | null {
  let text = raw;
  // unwrap gemini-style envelope
  try {
    const j = JSON.parse(raw);
    const inner = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof inner === "string") text = inner;
    else if (typeof j === "string") text = j;
  } catch {
    /* not JSON, keep raw */
  }
  // strip ```json fences
  text = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  // extract first JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as Record<
      string,
      Record<string, unknown>
    >;
    const keys = Object.keys(obj);
    if (keys.length < 2) return null;
    const [fordName, rivalName] = keys;
    const fordSpecs: Record<string, string> = {};
    const rivalSpecs: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj[fordName] ?? {}))
      fordSpecs[k] = String(v);
    for (const [k, v] of Object.entries(obj[rivalName] ?? {}))
      rivalSpecs[k] = String(v);
    const attributes = Array.from(
      new Set([...Object.keys(fordSpecs), ...Object.keys(rivalSpecs)]),
    );
    return { fordName, rivalName, fordSpecs, rivalSpecs, attributes, raw };
  } catch {
    return null;
  }
}

export const compareCars = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => compareSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: string;
      parsed: ComparisonData | null;
      error: string | null;
    }> => {
      try {
        const res = await fetch(`${API_BASE}/veiculos/comparar`, {
          method: "POST",
          headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const txt = await res.text();
          return {
            result: "",
            parsed: null,
            error: `Erro ${res.status}: ${txt.slice(0, 200)}`,
          };
        }
        const text = await res.text();
        let inner = text;
        try {
          const j = JSON.parse(text);
          if (typeof j === "string") inner = j;
        } catch {
          /* keep raw */
        }
        const parsed = parseComparison(inner);
        return { result: inner, parsed, error: null };
      } catch (e) {
        console.error("compareCars failed", e);
        return {
          result: "",
          parsed: null,
          error: "Não foi possível conectar à API Ford.",
        };
      }
    },
  );
