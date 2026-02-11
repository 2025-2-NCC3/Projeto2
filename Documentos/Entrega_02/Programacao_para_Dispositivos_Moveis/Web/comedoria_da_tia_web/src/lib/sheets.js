// src/lib/sheets.js
import * as XLSX from "xlsx";
import Papa from "papaparse";

/** Gera e baixa um arquivo a partir de um Blob */
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Exporta JSON => CSV */
export function downloadCSV(rows = [], filename = "dados.csv") {
  const csv = Papa.unparse(rows || []);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveBlob(blob, filename);
}

/** Exporta JSON => XLSX */
export function downloadXLSX(rows = [], filename = "dados.xlsx", sheetName = "Planilha") {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows || []);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveBlob(blob, filename);
}

/** Lê arquivo CSV ou XLSX e devolve array de objetos */
export async function parseFileToRows(file) {
  if (!file) return [];

  const ext = file.name.toLowerCase().split(".").pop();

  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data || []),
        error: reject,
      });
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });
    const first = wb.SheetNames[0];
    const ws = wb.Sheets[first];
    return XLSX.utils.sheet_to_json(ws, { defval: null });
  }

  throw new Error("Formato não suportado. Use .csv ou .xlsx");
}
