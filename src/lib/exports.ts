import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ComparisonData } from "./ford.functions";

export type ComparisonRecord = {
  id: string;
  date: string;
  versaoFord: string;
  concorrente: string;
  resultado: string;
  parsed: ComparisonData | null;
};

function prettify(k: string) {
  return k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function exportToExcel(comparison: ComparisonRecord) {
  const wb = XLSX.utils.book_new();
  const p = comparison.parsed;

  const resumo: (string | number)[][] = [
    ["RELATÓRIO PERICIAL DE COMPARAÇÃO DE VEÍCULOS"],
    [],
    ["Data", new Date(comparison.date).toLocaleString("pt-BR")],
    ["Versão Ford solicitada", comparison.versaoFord],
    ["Concorrente solicitado", comparison.concorrente],
    ["ID do relatório", comparison.id],
  ];
  if (p) {
    resumo.push([], ["Veículo Ford analisado", p.fordName]);
    resumo.push(["Veículo concorrente analisado", p.rivalName]);
    resumo.push(["Atributos comparados", p.attributes.length]);
  }
  const ws1 = XLSX.utils.aoa_to_sheet(resumo);
  ws1["!cols"] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

  if (p) {
    const head = ["Atributo", p.fordName, p.rivalName];
    const rows = p.attributes.map((a) => [
      prettify(a),
      p.fordSpecs[a] ?? "—",
      p.rivalSpecs[a] ?? "—",
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([head, ...rows]);
    ws2["!cols"] = [{ wch: 28 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Tabela Comparativa");
  }

  const ws3 = XLSX.utils.aoa_to_sheet([
    ["Resposta bruta da IA"],
    [comparison.resultado],
  ]);
  ws3["!cols"] = [{ wch: 120 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Dados brutos");

  XLSX.writeFile(
    wb,
    `comparativo-${comparison.versaoFord}-vs-${comparison.concorrente}.xlsx`,
  );
}

export function exportToPDF(comparison: ComparisonRecord) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const p = comparison.parsed;

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
  doc.text(`Ford: ${p?.fordName ?? comparison.versaoFord}`, 40, 150);
  doc.text(
    `Concorrente: ${p?.rivalName ?? comparison.concorrente}`,
    40,
    168,
  );

  if (p) {
    autoTable(doc, {
      startY: 200,
      head: [["Atributo", p.fordName, p.rivalName]],
      body: p.attributes.map((a) => [
        prettify(a),
        p.fordSpecs[a] ?? "—",
        p.rivalSpecs[a] ?? "—",
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [30, 30, 90], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      columnStyles: {
        0: { cellWidth: 140, fontStyle: "bold" },
        1: { cellWidth: 180 },
        2: { cellWidth: 180 },
      },
    });
  } else {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(comparison.resultado, pageW - 80);
    doc.text(lines, 40, 200);
  }

  doc.save(
    `comparativo-${comparison.versaoFord}-vs-${comparison.concorrente}.pdf`,
  );
}
