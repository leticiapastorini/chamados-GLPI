const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { obterTodosChamados } = require("./glpiService");
const { logToFile } = require("../utils/logger");

const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

if (!fs.existsSync(PASTA_RELATORIOS)) {
  fs.mkdirSync(PASTA_RELATORIOS);
  console.log("📂 Pasta 'relatorios/' criada automaticamente.");
}

async function registrarDiaChamados() {
  try {
    const chamados = await obterTodosChamados();
    const abertos = chamados.filter(c => [1, 2, 4].includes(Number(c.status)));

    const hoje = new Date().toISOString().split("T")[0];
    const [ano, mes] = hoje.split("-");
    const nomeArquivo = `dias-salvos-${ano}-${mes}.xlsx`;
    const caminho = path.join(PASTA_RELATORIOS, nomeArquivo);
    const caminhoJson = path.join(PASTA_RELATORIOS, `dias-salvos-${ano}-${mes}.json`);

    const workbook = new ExcelJS.Workbook();
    let sheet;

    if (fs.existsSync(caminho)) {
      await workbook.xlsx.readFile(caminho);
      sheet = workbook.getWorksheet("Dias");

      if (!sheet) {
        sheet = workbook.addWorksheet("Dias");
        sheet.columns = [
          { header: "Data", key: "data", width: 15 },
          { header: "Total de Chamados", key: "total", width: 25 },
          { header: "Acima da Meta", key: "acimaMeta", width: 20 },
        ];
      }
    } else {
      sheet = workbook.addWorksheet("Dias");
      sheet.columns = [
        { header: "Data", key: "data", width: 15 },
        { header: "Total de Chamados", key: "total", width: 25 },
        { header: "Acima da Meta", key: "acimaMeta", width: 20 },
      ];
    }

    // Verifica se o dia já está registrado
    let jaExiste = false;
    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
      const valor = row.getCell(1).text;
      if (valor === hoje) jaExiste = true;
    });

    if (!jaExiste) {
      sheet.addRow({
        data: hoje,
        total: abertos.length,
        acimaMeta: abertos.length > 50 ? "SIM" : "-"
      });
      console.log(`🗓️ Dia ${hoje} registrado com ${abertos.length} chamados.`);
    }

    // Remove linha de média antiga
    sheet.eachRow((row, idx) => {
      if (row.getCell(1).value === "Média") {
        sheet.spliceRows(idx, 1);
      }
    });

    // Reconstroi totais com Acima da Meta
    const totais = [];
    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
      const data = row.getCell(1).value;
      const total = Number(row.getCell(2).value);
      const acimaMeta = row.getCell(3).value;
      if (data && typeof total === "number") {
        totais.push({ data, total, acimaMeta: total > 50 ? "SIM" : "-" });
      }
    });

    const media = Math.round(totais.reduce((acc, curr) => acc + curr.total, 0) / totais.length || 0);

    sheet.addRow({ data: "Média", total: media });

    await workbook.xlsx.writeFile(caminho);
    fs.writeFileSync(caminhoJson, JSON.stringify({ media, dias: totais }));

    console.log(`✅ Registro das 18h atualizado: ${hoje}`);
    logToFile(`✅ Registro de dia concluído com ${abertos.length} chamados em ${hoje}`);
  } catch (err) {
    logToFile(`❌ Erro ao registrar dia: ${err.stack || err.message}`);
    console.error("❌ Erro ao registrar dia:", err);
  }
}

module.exports = { registrarDiaChamados };
