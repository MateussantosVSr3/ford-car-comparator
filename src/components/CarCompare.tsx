import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Car,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  Sparkles,
  Swords,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { compareCars } from "@/lib/ford.functions";
import {
  exportToExcel,
  exportToPDF,
  type ComparisonRecord,
} from "@/lib/exports";
import { ComparisonTable, CompareCharts } from "./CompareView";

const DEFAULT_FORD = "ranger raptor";
const HISTORY_KEY = "ford-intel-history-v2";

function loadHistory(): ComparisonRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(items: ComparisonRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 30)));
}

export function CarCompare() {
  const runCompare = useServerFn(compareCars);

  const [versaoFord, setVersaoFord] = useState(DEFAULT_FORD);
  const [concorrente, setConcorrente] = useState("");
  const [current, setCurrent] = useState<ComparisonRecord | null>(null);
  const [history, setHistory] = useState<ComparisonRecord[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const compareMutation = useMutation({
    mutationFn: () =>
      runCompare({
        data: { versaoFord: versaoFord.trim(), concorrente: concorrente.trim() },
      }),
    onSuccess: (res) => {
      if (res.error) {
        setApiError(res.error);
        toast.error("Falha na API Ford", { description: res.error.slice(0, 120) });
        return;
      }
      setApiError(null);
      const record: ComparisonRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        versaoFord: versaoFord.trim(),
        concorrente: concorrente.trim(),
        resultado: res.result,
        parsed: res.parsed,
      };
      setCurrent(record);
      const next = [record, ...history];
      setHistory(next);
      saveHistory(next);
      if (!res.parsed) {
        toast.warning("Resposta recebida, mas sem tabela estruturada");
      } else {
        toast.success("Comparativo gerado");
      }
    },
    onError: () => {
      setApiError("Falha de rede ao chamar a API Ford.");
      toast.error("Falha ao comparar");
    },
  });

  const canCompare =
    versaoFord.trim().length >= 2 &&
    concorrente.trim().length >= 2 &&
    !compareMutation.isPending;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <Badge
          variant="outline"
          className="mb-4 border-primary/40 bg-primary/10 text-primary"
        >
          <Sparkles className="mr-1.5 h-3 w-3" /> Inteligência Competitiva Ford
        </Badge>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          <span className="text-gradient">Ford Intelligence</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Compare veículos Ford com a concorrência em segundos. Análise por IA,
          gráficos e relatórios periciais em PDF e Excel.
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass relative overflow-hidden rounded-3xl p-8 shadow-elegant"
      >
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative grid gap-6 md:grid-cols-[1fr_auto_1fr_auto]">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Car className="h-3.5 w-3.5 text-primary" /> Modelo Ford
            </Label>
            <Input
              value={versaoFord}
              onChange={(e) => setVersaoFord(e.target.value)}
              maxLength={50}
              className="h-12 border-primary/30 bg-background/40 text-base"
              placeholder="Ex: ranger raptor"
            />
          </div>

          <div className="hidden items-end justify-center pb-3 md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Swords className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Car className="h-3.5 w-3.5 text-[color:var(--rival)]" />{" "}
              Concorrente
            </Label>
            <Input
              value={concorrente}
              onChange={(e) => setConcorrente(e.target.value)}
              maxLength={50}
              className="h-12 border-[color:var(--rival)]/30 bg-background/40 text-base"
              placeholder="Ex: Toyota Hilux GR Sport"
            />
          </div>

          <div className="flex items-end">
            <Button
              size="lg"
              disabled={!canCompare}
              onClick={() => compareMutation.mutate()}
              className="h-12 w-full bg-gradient-primary px-6 font-semibold shadow-glow transition hover:opacity-90 md:w-auto"
            >
              {compareMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando…
                </>
              ) : (
                <>
                  Comparar <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {current && (
          <motion.section
            key={current.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10"
          >
            <Tabs defaultValue="table" className="w-full">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <TabsList className="bg-card/60">
                  <TabsTrigger value="table">
                    <TableIcon className="mr-2 h-4 w-4" /> Tabela
                  </TabsTrigger>
                  <TabsTrigger value="charts">
                    <BarChart3 className="mr-2 h-4 w-4" /> Gráficos
                  </TabsTrigger>
                  <TabsTrigger value="raw">
                    <FileText className="mr-2 h-4 w-4" /> Resposta bruta
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(current)}
                    className="border-primary/40"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel pericial
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToPDF(current)}
                    className="border-primary/40"
                  >
                    <Download className="mr-2 h-4 w-4" /> PDF executivo
                  </Button>
                </div>
              </div>

              <TabsContent value="table">
                {current.parsed ? (
                  <ComparisonTable data={current.parsed} />
                ) : (
                  <EmptyParse raw={current.resultado} />
                )}
              </TabsContent>

              <TabsContent value="charts">
                {current.parsed ? (
                  <CompareCharts data={current.parsed} />
                ) : (
                  <EmptyParse raw={current.resultado} />
                )}
              </TabsContent>

              <TabsContent value="raw">
                <div className="glass rounded-2xl p-6 shadow-elegant">
                  <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap break-words text-xs text-foreground/70">
                    {current.resultado}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </motion.section>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <History className="h-5 w-5 text-primary" /> Histórico
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setHistory([]);
                saveHistory([]);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Limpar
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {history.slice(0, 6).map((h) => (
              <button
                key={h.id}
                onClick={() => setCurrent(h)}
                className="glass group rounded-xl p-4 text-left transition hover:border-primary/40 hover:shadow-glow"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-primary">
                    {h.parsed?.fordName ?? h.versaoFord}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-[color:var(--rival)]">
                    {h.parsed?.rivalName ?? h.concorrente}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {h.parsed
                    ? `${h.parsed.attributes.length} atributos comparados`
                    : h.resultado.slice(0, 120)}
                </p>
                <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {new Date(h.date).toLocaleString("pt-BR")}
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      <footer className="mt-20 border-t pt-8 text-center text-xs text-muted-foreground">
        Ford Intelligence · Built for competitive analysis ·{" "}
        {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function EmptyParse({ raw }: { raw: string }) {
  return (
    <div className="glass rounded-2xl p-6 text-sm text-muted-foreground shadow-elegant">
      <p className="mb-3 font-semibold text-foreground">
        Não foi possível extrair uma tabela comparativa estruturada da resposta.
      </p>
      <Separator className="mb-4" />
      <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap text-xs">
        {raw.slice(0, 1500)}
      </pre>
    </div>
  );
}
