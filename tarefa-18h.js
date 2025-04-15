const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const { enviarMensagem } = require("./services/notifyService");

async function registrarChamadosAbertos12h() {
  const chamados = await obterChamadosAbertos();
  const agora = new Date();
  const data = agora.toISOString().split("T")[0]; // yyyy-mm-dd
  const arquivo = path.join(__dirname, "relatorios", `relatorio-18h-${data.substring(0, 7)}.xlsx`);

  let workbook;
  if (fs.existsSync(arquivo)) {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(arquivo);
  } else {
    workbook = new ExcelJS.Workbook();
  }

  const sheet = workbook.getWorksheet("Chamados18h") || workbook.addWorksheet("Chamados18h");

  let jaExiste = false;
  sheet.eachRow((row, idx) => {
    const valorData = row.getCell(1).text;
    if (valorData === data) {
      jaExiste = true;
      // Substitui a linha existente para 12h
      sheet.spliceRows(idx, 1, { data, hora: "12:00", total: chamados.length, acimaMeta: chamados.length > 50 ? "SIM" : "-" });
    }
  });

  if (!jaExiste) {
    sheet.addRow({ data, hora: "12:00", total: chamados.length, acimaMeta: chamados.length > 50 ? "SIM" : "-" });
  }

  const totais = [];
  sheet.eachRow((row, idx) => {
    if (idx === 1) return;
    const total = parseInt(row.getCell(3).value || 0);
    if (!isNaN(total)) totais.push(total);
  });
  const media = Math.round(totais.reduce((a, b) => a + b, 0) / totais.length);
  sheet.addRow({ data: "Média", hora: "", total: media });

  await workbook.xlsx.writeFile(arquivo);
  console.log(`✅ Snapshot diário às 12h salvo: ${data} - ${chamados.length} chamados`);
  enviarMensagem(`Relatorio 12h ${data}: ${chamados.length} chamados abertos`);

  return chamados.length;
}

async function registrarChamadosAbertos18h() {
  const chamados = await obterChamadosAbertos();
  const agora = new Date();
  const data = agora.toISOString().split("T")[0];
  const hora = agora.toTimeString().split(" ")[0].substring(0, 5);
  const anoMes = data.substring(0, 7);
  const arquivo = path.join(__dirname, "relatorios", `relatorio-18h-${anoMes}.xlsx`);

  let workbook;
  if (fs.existsSync(arquivo)) {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(arquivo);
  } else {
    workbook = new ExcelJS.Workbook();
  }

  const sheet = workbook.getWorksheet("Chamados18h") || workbook.addWorksheet("Chamados18h");

  let jaExiste = false;
  sheet.eachRow((row, idx) => {
    const valorData = row.getCell(1).text;
    if (valorData === data) {
      jaExiste = true;
      sheet.spliceRows(idx, 1, { data, hora, total: chamados.length, acimaMeta: chamados.length > 50 ? "SIM" : "-" });
    }
  });

  if (!jaExiste) {
    sheet.addRow({ data, hora, total: chamados.length, acimaMeta: chamados.length > 50 ? "SIM" : "-" });
  }

  const totais = [];
  sheet.eachRow((row, idx) => {
    if (idx === 1) return;
    const total = parseInt(row.getCell(3).value || 0);
    if (!isNaN(total)) totais.push(total);
  });
  const media = Math.round(totais.reduce((a, b) => a + b, 0) / totais.length);
  sheet.addRow({ data: "Média", hora: "", total: media });

  await workbook.xlsx.writeFile(arquivo);
  console.log(`✅ Snapshot diário às 18h salvo: ${data} - ${chamados.length} chamados`);
  enviarMensagem(`Relatorio 18h ${data}: ${chamados.length} chamados abertos`);

  return chamados.length;
}
