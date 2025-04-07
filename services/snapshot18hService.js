const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { obterChamadosAbertos } = require("./glpiService");
const { escreverLog } = require("../utils/logger");

async function registrarChamadosAbertos18h() {
  try {
    const chamados = await obterChamadosAbertos();
    const agora = new Date();

    const data = agora.toISOString().split("T")[0];
    const hora = agora.toTimeString().split(" ")[0].substring(0, 5);
    const anoMes = data.substring(0, 7); // yyyy-MM
    const arquivo = path.join(__dirname, "..", "relatorios", `relatorio-18h-${anoMes}.xlsx`);

    let workbook;
    if (fs.existsSync(arquivo)) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(arquivo);
    } else {
      workbook = new ExcelJS.Workbook();
    }

    const sheet = workbook.getWorksheet("18h") || workbook.addWorksheet("18h");

    // Remover linha "Média" existente
    sheet.eachRow((row, idx) => {
      if (row.getCell(1).value === "Média") {
        sheet.spliceRows(idx, 1);
      }
    });

    // Adicionar linha do dia
    sheet.addRow({
      data,
      hora,
      total: chamados.length
    });

    // Recalcular média após adicionar o novo dia
    const dados = [];
    sheet.eachRow((row, idx) => {
      const val = row.getCell(1).value;
      if (val !== "Data" && val !== "Média" && val instanceof Date === false) {
        dados.push({
          data: row.getCell(1).value,
          hora: row.getCell(2).value,
          total: parseInt(row.getCell(3).value || 0)
        });
      }
    });

    if (dados.length > 0) {
      const media = Math.round(
        dados.reduce((acc, item) => acc + (item.total || 0), 0) / dados.length
      );
      sheet.addRow({ data: "Média", hora: "", total: media });
    }

    await workbook.xlsx.writeFile(arquivo);

    escreverLog(`Snapshot das 18h salvo com ${chamados.length} chamados`);
    console.log(`📸 Snapshot diário salvo: ${data} - ${chamados.length} chamados`);
  } catch (err) {
    console.error("Erro ao registrar snapshot das 18h:", err);
    escreverLog("❌ Erro ao salvar snapshot das 18h: " + err.message);
  }
}

module.exports = { registrarChamadosAbertos18h };
