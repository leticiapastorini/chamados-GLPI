// forcar-dias-manualmente.js
const { registrarDiaChamados } = require("./services/diasService");
const { obterChamadosAbertos } = require("./services/glpiService");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

async function forcarRegistroPara(dataAlvo) {
  const [ano, mes, dia] = dataAlvo.split("-");
  const nomeArquivo = `dias-salvos-${ano}-${mes}.xlsx`;
  const caminho = path.join(__dirname, "relatorios", nomeArquivo);

  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(caminho)) {
    await workbook.xlsx.readFile(caminho);
  }

  const sheet = workbook.getWorksheet("Dias") || workbook.addWorksheet("Dias");
  sheet.columns = [
    { header: "Data", key: "data", width: 15 },
    { header: "Total de Chamados", key: "total", width: 25 },
    { header: "Acima da Meta", key: "acimaMeta", width: 20 }
  ];

  const chamados = await obterChamadosAbertos();
  const total = chamados.length;

  let jaExiste = false;
  sheet.eachRow((row, idx) => {
    if (idx === 1) return;
    const valor = String(row.getCell(1).value).split("T")[0];
    if (valor === dataAlvo) jaExiste = true;
  });

  if (jaExiste) {
    console.log(`⚠️ Já existe entrada para ${dataAlvo}. Ignorando.`);
    return;
  }

  sheet.addRow({
    data: dataAlvo,
    total,
    acimaMeta: total > 50 ? "SIM" : "-"
  });

  // Remover "Média" antiga
  sheet.eachRow((row, idx) => {
    if (row.getCell(1).value === "Média") sheet.spliceRows(idx, 1);
  });

  // Recalcular média
  const totais = [];
  sheet.eachRow((row, idx) => {
    if (idx === 1) return;
    const val = Number(row.getCell(2).value);
    if (!isNaN(val)) totais.push(val);
  });
  const media = Math.round(totais.reduce((a, b) => a + b, 0) / totais.length);
  sheet.addRow({ data: "Média", total: media });

  await workbook.xlsx.writeFile(caminho);
  console.log(`✅ Registro de ${dataAlvo} salvo com ${total} chamados.`);
}

// 🔁 EXECUÇÃO
(async () => {
  await forcarRegistroPara("2025-04-12");
  await forcarRegistroPara("2025-04-13");
})();
