const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { obterChamadosAbertos } = require("./glpiService");
const { logToFile } = require("../utils/logger");
const { enviarMensagem } = require("./notifyService");

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

    const sheet = workbook.getWorksheet("Chamados18h") || workbook.addWorksheet("Chamados18h");
    
     // Cabeçalho (se planilha nova)
     if (sheet.columnCount === 0) {
      sheet.columns = [
        { header: "Data",           key: "data",        width: 15 },
        { header: "Hora",           key: "hora",        width: 8  },
        { header: "Total",          key: "total",       width: 10 },
        { header: "Acima da Meta",  key: "acimaMeta",   width: 20 }
      ];
    }

    sheet.eachRow((row, idx) => {
      if (row.getCell(1).value === "Média" && idx !== sheet.rowCount) {
        sheet.spliceRows(idx, 1);
        sheet.addRow({ data: "Média", hora: "", total: media });
      }
    });
    

    // Adicionar linha do dia
    sheet.addRow({
      data,
      hora,
      total: chamados.length,
      acimaMeta: chamados.length > 50 ? "SIM" : "-"
    });

    // Atualizar campo "Acima da Meta" para todos os dias
    const totais = [];
    sheet.eachRow((row, idx) => {
      if (idx === 1) return; // ignorar cabeçalho
      const val = row.getCell(1).value;
      if (val !== "Média") {
        const total = parseInt(row.getCell(3).value || 0);
        if (!isNaN(total)) {
          row.getCell(4).value = total > 50 ? "SIM" : "-";
          totais.push(total);
        }
      }
    });

    // Adicionar linha "Média" final
    if (totais.length > 0) {
      const media = Math.round(totais.reduce((a, b) => a + b, 0) / totais.length);
      sheet.addRow({ data: "Média", hora: "", total: media });
    }


    await workbook.xlsx.writeFile(arquivo);


    logToFile(`Snapshot das 18h salvo com ${chamados.length} chamados`);
    console.log(`📸 Snapshot diário salvo: ${data} - ${chamados.length} chamados`);

    // Enviar mensagem no WhatsApp
    enviarMensagem(`Relatorio 18h ${data}: ${chamados.length} chamados abertos`);

    return chamados.length;

  } catch (err) {
    console.error("Erro ao registrar snapshot das 18h:", err);
    logToFile("❌ Erro ao salvar snapshot das 18h: " + err.message);
    
    if (err.response) {
      console.error("🔴 Resposta do servidor:", err.response.status, err.response.data);
    }
  }
  
}


module.exports = { registrarChamadosAbertos18h };
