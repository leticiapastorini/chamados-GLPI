const ExcelJS = require("exceljs");

function gerarPlanilhaChamados(chamados, nomeFolha) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(nomeFolha);

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Título", key: "titulo", width: 50 },
    { header: "Status", key: "status_nome", width: 25 },
    { header: "Data", key: "data", width: 25 }
  ];

  chamados.forEach(c => sheet.addRow(c));
  return workbook;
}

function gerarPlanilhaHistorico(historico, mes) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Histórico ${mes}`);

  sheet.columns = [
    { header: "Data", key: "data", width: 15 },
    { header: "Total", key: "total", width: 15 }
  ];

  historico.forEach(linha => sheet.addRow(linha));
  return workbook;
}

function gerarPlanilhaPorPeriodo(chamados, de, ate) {
  const agrupado = {};

  chamados.forEach(c => {
    const dia = c.date_creation.split(" ")[0];
    agrupado[dia] = (agrupado[dia] || 0) + 1;
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Relatório ${de} a ${ate}`);
  sheet.columns = [
    { header: "Data", key: "data", width: 15 },
    { header: "Total Abertos", key: "total", width: 15 }
  ];

  Object.entries(agrupado).forEach(([data, total]) =>
    sheet.addRow({ data, total })
  );

  return workbook;
}

const fs = require("fs");
const path = require("path");

function carregarHistoricoMensal(mes) {
  const [ano, mesStr] = mes.split("-");
  const arquivo = path.join(__dirname, "..", "relatorios", `relatorio-${ano}-${mesStr}.xlsx`);

  if (!fs.existsSync(arquivo)) return [];

  return new Promise(async (resolve) => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(arquivo);
    const sheet = wb.getWorksheet("Chamados");
    const historico = [];

    sheet.eachRow((row, index) => {
      if (index === 1) return; // pular cabeçalho
      const data = row.getCell(1).text;
      const total = Number(row.getCell(2).value);
      historico.push({ data, total });
    });

    resolve(historico);
  });
}

module.exports = {
  gerarPlanilhaChamados,
  gerarPlanilhaHistorico,
  gerarPlanilhaPorPeriodo,
  carregarHistoricoMensal
};
