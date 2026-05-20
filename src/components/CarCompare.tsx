import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
  compareCars,
  getFordSpecs,
  type EspecificacaoFord,
} from "@/lib/ford.functions";
import {
  exportToExcel,
  exportToPDF,
  type ComparisonRecord,
} from "@/lib/exports";
import { SpecsCharts } from "./SpecsChart";

const DEFAULT_FORD = "ranger raptor";
const HISTORY_KEY = "ford-intel-history-v1";

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
  const fetchSpecs = useServerFn(getFordSpecs);
  const runCompare = useServerFn(compareCars);

  const [versaoFord, setVersaoFord] = useState(DEFAULT_FORD);
  const [concorrente, setConcorrente] = useState("");
  const [current, setCurrent] = useState<ComparisonRecord | null>(null);
  const [history, setHistory] = useState<ComparisonRecord[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const specsQuery = useQuery({
    queryKey: ["ford-specs"],
    queryFn: () => fetchSpecs(),
  });

  const specs: EspecificacaoFord[] = specsQuery.data?.data ?? [];

  const compareMutation = useMutation({
    mutationFn: () =>
      runCompare({
        data: { versaoFord: versaoFord.trim(), concorrente: concorrente.trim() },
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const record: ComparisonRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        versaoFord: versaoFord.trim(),
        concorrente: concorrente.trim(),
        resultado: res.result,
      };
      setCurrent(record);
      const next = [record, ...history];
      setHistory(next);
      saveHistory(next);
      toast.success("Comparativo gerado");
    },
    onError: () => toast.error("Falha ao comparar"),
  });

  const categorias = useMemo(() => {
    const set = new Set<string>();
    specs.forEach((s) => set.add(s.categoria));
    return Array.from(set);
  }, [specs]);

  const canCompare =
    versaoFord.trim().length >= 2 &&
    concorrente.trim().length >= 2 &&
    !compareMutation.isPending;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Hero */}
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
          gráficos comparativos e relatórios periciais em PDF e Excel.
        </p>
      </motion.header>

      {/* Input card */}
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

      {/* Results */}
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
            <Tabs defaultValue="analysis" className="w-full">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <TabsList className="bg-card/60">
                  <TabsTrigger value="analysis">
                    <Sparkles className="mr-2 h-4 w-4" /> Análise IA
                  </TabsTrigger>
                  <TabsTrigger value="charts">
                    <BarChart3 className="mr-2 h-4 w-4" /> Gráficos
                  </TabsTrigger>
                  <TabsTrigger value="specs">
                    <FileText className="mr-2 h-4 w-4" /> Especificações
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(specs, current)}
                    className="border-primary/40"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel pericial
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToPDF(specs, current)}
                    className="border-primary/40"
                  >
                    <Download className="mr-2 h-4 w-4" /> PDF executivo
                  </Button>
                </div>
              </div>

              <TabsContent value="analysis">
                <div className="glass rounded-2xl p-8 shadow-elegant">
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Badge className="bg-primary/20 text-primary">
                      {current.versaoFord}
                    </Badge>
                    <span className="text-muted-foreground">vs</span>
                    <Badge
                      variant="outline"
                      className="border-[color:var(--rival)]/40 text-[color:var(--rival)]"
                    >
                      {current.concorrente}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(current.date).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <Separator className="mb-6" />
                  <article className="prose prose-invert max-w-none whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground/90">
                    {current.resultado}
                  </article>
                </div>
              </TabsContent>

              <TabsContent value="charts">
                {specsQuery.isLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <SpecsCharts specs={specs} />
                )}
              </TabsContent>

              <TabsContent value="specs">
                <div className="glass rounded-2xl p-6 shadow-elegant">
                  {categorias.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {categorias.map((c) => (
                        <Badge key={c} variant="secondary">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipamento</TableHead>
                          <TableHead>XLT</TableHead>
                          <TableHead>Limited</TableHead>
                          <TableHead>Limited+</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {specs.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">
                              <div>{s.equipamento}</div>
                              <div className="text-xs text-muted-foreground">
                                {s.categoria}
                              </div>
                            </TableCell>
                            <TableCell className="text-primary">
                              {s.versaoXlt}
                            </TableCell>
                            <TableCell className="text-accent">
                              {s.versaoLimited}
                            </TableCell>
                            <TableCell className="text-[color:var(--chart-4)]">
                              {s.versaoLimitedPlus}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </motion.section>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <History className="h-5 w-5 text-primary" /> Histórico de
              comparações
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
                  <span className="text-primary">{h.versaoFord}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-[color:var(--rival)]">
                    {h.concorrente}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {h.resultado.slice(0, 120)}…
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
