// forcar-snapshot18h.js
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { obterChamadosAbertos } = require("./services/glpiService");

async function registrarSnapshotDiaEspecifico(dataAlvo) {
  const chamados = await obterChamadosAbertos();

  const [ano, mes, dia] = dataAlvo.split("-");
  const horaFixa = "18:00";
  const arquivo = path.join(__dirname, "relatorios", `relatorio-18h-${ano}-${mes}.xlsx`);

  let workbook = new ExcelJS.Workbook();
  if (fs.existsSync(arquivo)) {
    await workbook.xlsx.readFile(arquivo);
  }

  const sheet = workbook.getWorksheet("Chamados18h") || workbook.addWorksheet("Chamados18h");

  // Cabeçalho (se novo)
  if (sheet.columnCount === 0) {
    sheet.columns = [
      { header: "Data", key: "data", width: 15 },
      { header: "Hora", key: "hora", width: 8 },
      { header: "Total", key: "total", width: 10 },
      { header: "Acima da Meta", key: "acimaMeta", width: 20 }
    ];
  }

  // Evita duplicata
  let jaExiste = false;
  sheet.eachRow((row, idx) => {
    if (idx === 1) return;
    const data = row.getCell(1).text;
    if (data === dataAlvo) jaExiste = true;
  });

  if (jaExiste) {
    console.log(`⚠️ Já existe snapshot para ${dataAlvo}, ignorando...`);
    return;
  }

  const total = chamados.length;

  sheet.addRow({
    data: dataAlvo,
    hora: horaFixa,
    total,
    acimaMeta: total > 50 ? "SIM" : "-"
  });

  // Remove linha “Média” anterior
  sheet.eachRow((row, idx) => {
    if (row.getCell(1).value === "Média") {
      sheet.spliceRows(idx, 1);
    }
  });

  // Recalcula média
  const totais = [];
  sheet.eachRow((row, idx) => {
    if (idx === 1) return;
    const val = Number(row.getCell(3).value);
    if (!isNaN(val)) totais.push(val);
  });
  const media = Math.round(totais.reduce((a, b) => a + b, 0) / totais.length);

  sheet.addRow({ data: "Média", hora: "", total: media });

  await workbook.xlsx.writeFile(arquivo);
  console.log(`✅ Snapshot criado manualmente: ${dataAlvo} com ${total} chamados`);
}

// EXECUÇÃO
(async () => {
  await registrarSnapshotDiaEspecifico("2025-04-12");
  await registrarSnapshotDiaEspecifico("2025-04-13");
})();
