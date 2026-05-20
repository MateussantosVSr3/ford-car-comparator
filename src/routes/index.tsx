import { createFileRoute } from "@tanstack/react-router";
import { CarCompare } from "@/components/CarCompare";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Ford Intelligence — Comparativo de Veículos" },
      {
        name: "description",
        content:
          "Compare modelos Ford com concorrentes usando IA. Gere gráficos, relatórios em PDF e Excel para análise pericial e inteligência competitiva.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen">
      <CarCompare />
      <Toaster theme="dark" position="top-right" richColors />
    </main>
  );
}
