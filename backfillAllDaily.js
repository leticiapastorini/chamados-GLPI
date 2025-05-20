// backfillAllDaily.js
require("dotenv").config();
const fs            = require("fs");
const path          = require("path");
const ExcelJS       = require("exceljs");
const { saveDailySummary } = require("./services/dbService");

const REL_DIR = path.join(__dirname, "relatorios");

async function backfillFile(arquivo) {
  console.log(`📂 Processando ${arquivo}...`);
  const wb    = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(REL_DIR, arquivo));
  const sheet = wb.getWorksheet("Dias");

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row    = sheet.getRow(rowIndex);
    const val    = row.getCell(1).value;
    const dateStr = val instanceof Date
      ? val.toISOString().slice(0,10)
      : (typeof val === "string" ? val.trim() : "");

    // Se não for uma data válida YYYY-MM-DD, pula
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    const total = Number(row.getCell(2).value) || 0;
    const above = String(row.getCell(3).value).toUpperCase() === "SIM";

    await saveDailySummary(dateStr, total, above);
    console.log(`   ✔️  ${dateStr}: ${total} chamados (above_meta=${above})`);
  }
}

(async () => {
  try {
    const arquivos = fs.readdirSync(REL_DIR)
      .filter(f => /^dias-salvos-\d{4}-\d{2}\.xlsx$/.test(f))
      .sort();
    for (const arquivo of arquivos) {
      await backfillFile(arquivo);
    }
    console.log("🏁 Backfill completo de todos os dias.");
  } catch (err) {
    console.error("❌ Erro no backfill:", err);
  }
})();
