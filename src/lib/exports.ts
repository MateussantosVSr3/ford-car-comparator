import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EspecificacaoFord } from "./ford.functions";

export type ComparisonRecord = {
  id: string;
  date: string;
  versaoFord: string;
  concorrente: string;
  resultado: string;
};

export function exportToExcel(
  specs: EspecificacaoFord[],
  comparison: ComparisonRecord,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumo Executivo
  const resumo = [
    ["RELATÓRIO PERICIAL DE COMPARAÇÃO DE VEÍCULOS"],
    [],
    ["Data", new Date(comparison.date).toLocaleString("pt-BR")],
    ["Versão Ford", comparison.versaoFord],
    ["Concorrente", comparison.concorrente],
    ["ID", comparison.id],
    [],
    ["ANÁLISE COMPARATIVA (IA)"],
    [comparison.resultado],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(resumo);
  ws1["!cols"] = [{ wch: 25 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

  // Sheet 2: Especificações Técnicas
  const headers = [
    "ID",
    "Categoria",
    "Equipamento",
    "Versão XLT",
    "Versão Limited",
    "Versão Limited Plus",
  ];
  const rows = specs.map((s) => [
    s.id,
    s.categoria,
    s.equipamento,
    s.versaoXlt,
    s.versaoLimited,
    s.versaoLimitedPlus,
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws2["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 40 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Especificações Ford");

  // Sheet 3: Análise numérica para perito
  const numericRows = specs
    .map((s) => {
      const xlt = parseFloat(String(s.versaoXlt).replace(",", "."));
      const lim = parseFloat(String(s.versaoLimited).replace(",", "."));
      const limp = parseFloat(String(s.versaoLimitedPlus).replace(",", "."));
      if (isNaN(xlt) && isNaN(lim) && isNaN(limp)) return null;
      return [s.categoria, s.equipamento, xlt || 0, lim || 0, limp || 0];
    })
    .filter(Boolean) as (string | number)[][];
  const ws3 = XLSX.utils.aoa_to_sheet([
    ["Categoria", "Equipamento", "XLT", "Limited", "Limited Plus"],
    ...numericRows,
  ]);
  ws3["!cols"] = [{ wch: 18 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Análise Numérica");

  XLSX.writeFile(
    wb,
    `comparativo-${comparison.versaoFord}-vs-${comparison.concorrente}.xlsx`,
  );
}

export function exportToPDF(
  specs: EspecificacaoFord[],
  comparison: ComparisonRecord,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(10, 22, 60);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FORD INTELLIGENCE", 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Relatório Executivo de Inteligência Competitiva", 40, 64);
  doc.setFontSize(9);
  doc.text(new Date(comparison.date).toLocaleString("pt-BR"), pageW - 40, 64, {
    align: "right",
  });

  doc.setTextColor(20, 20, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Veículos Comparados", 40, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Ford: ${comparison.versaoFord}`, 40, 150);
  doc.text(`Concorrente: ${comparison.concorrente}`, 40, 168);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Análise Comparativa (IA)", 40, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(comparison.resultado, pageW - 80);
  doc.text(lines, 40, 220);

  // Specs table on new page
  doc.addPage();
  doc.setFillColor(10, 22, 60);
  doc.rect(0, 0, pageW, 50, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Especificações Técnicas — Ford", 40, 32);

  autoTable(doc, {
    startY: 70,
    head: [["Categoria", "Equipamento", "XLT", "Limited", "Limited+"]],
    body: specs.map((s) => [
      s.categoria,
      s.equipamento,
      s.versaoXlt,
      s.versaoLimited,
      s.versaoLimitedPlus,
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 30, 90], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    columnStyles: { 1: { cellWidth: 180 } },
  });

  doc.save(
    `comparativo-${comparison.versaoFord}-vs-${comparison.concorrente}.pdf`,
  );
}
