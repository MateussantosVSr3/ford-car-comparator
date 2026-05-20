import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE = "http://163.176.204.45:8080/api/v1";

function authHeader() {
  const user = process.env.FORD_API_USER ?? "";
  const pass = process.env.FORD_API_PASS ?? "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
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

export const compareCars = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => compareSchema.parse(input))
  .handler(
    async ({ data }): Promise<{ result: string; error: string | null }> => {
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
          return { result: "", error: `Erro ${res.status}: ${txt.slice(0, 200)}` };
        }
        const text = await res.text();
        // API returns a JSON string
        let parsed = text;
        try {
          const j = JSON.parse(text);
          if (typeof j === "string") parsed = j;
        } catch {
          /* keep raw */
        }
        return { result: parsed, error: null };
      } catch (e) {
        console.error("compareCars failed", e);
        return { result: "", error: "Não foi possível conectar à API Ford." };
      }
    },
  );
