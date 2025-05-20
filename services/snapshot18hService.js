const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { obterChamadosAbertos } = require("./glpiService");
const { saveSnapshot }         = require("./dbService");
const { logToFile } = require("../utils/logger");
const { enviarMensagem } = require("./notifyService");

async function registrarChamadosAbertos18h() {
  try {
    const chamados = await obterChamadosAbertos();
    const agora = new Date();

    // → Grava também no banco PostgreSQL
    // mapeia { id, titulo, status, data } → { id, title, status, created_at }

    await saveSnapshot(
      chamados.map(c => {
        // garante título válido
        const title = c.titulo || "Sem título";
        // API costuma retornar algo como "2025-05-13 16:21:32"
        // converte para ISO (`T`) ou usa o valor raw se já estiver em ISO
        let createdAt = c.data;
        if (typeof createdAt === "string" && createdAt.includes(" ")) {
          createdAt = createdAt.replace(" ", "T");
        }
        // fallback para agora caso createdAt não seja string válida
        if (!createdAt || isNaN(new Date(createdAt))) {
          createdAt = new Date().toISOString();
        }
        return {
          id:          c.id,
          title,
          status:      c.status,
          created_at:  createdAt,
        };
      }),
      new Date() // snapshotDate
    );

    
    logToFile()
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

    // Remover linha "Média" antiga, se estiver no meio
    for (let i = sheet.rowCount; i > 1; i--) {
      const row = sheet.getRow(i);
      if (row.getCell(1).value === "Média") {
        sheet.spliceRows(i, 1);
      }
    }

    const totalHoje = chamados.length;

    // Adicionar linha do dia
    sheet.addRow({
      data,
      hora,
      total: totalHoje,
      acimaMeta: totalHoje > 50 ? "SIM" : "-"
    });

    // Atualizar campo "Acima da Meta" para todos os dias e coletar totais
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

    logToFile(`Snapshot das 18h salvo com ${totalHoje} chamados`);
    console.log(`📸 Snapshot diário salvo: ${data} - ${totalHoje} chamados`);

    // ALERTAS automáticos
    if (totalHoje >= 50) {
      enviarMensagem(`🚨 *Meta diária ULTRAPASSADA!*\nRelatório 18h: ${totalHoje} chamados abertos.`);
    } else if (totalHoje >= 40) {
      enviarMensagem(`⚠️ *Atenção!* Já são ${totalHoje} chamados abertos às 18h.\nA meta diária é 50.`);
    } else {
      enviarMensagem(`Relatório 18h ${data}: ${totalHoje} chamados abertos.`);
    }

    return totalHoje;

  } catch (err) {
    console.error("Erro ao registrar snapshot das 18h:", err);
    logToFile("❌ Erro ao salvar snapshot das 18h: " + err.message);

    if (err.response) {
      console.error("🔴 Resposta do servidor:", err.response.status, err.response.data);
    }
  }
}

module.exports = { registrarChamadosAbertos18h };
