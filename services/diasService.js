const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { obterTodosChamados } = require("./glpiService");

const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

// Cria pasta relatorios se não existir
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

    let workbook, sheet;

    if (fs.existsSync(caminho)) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(caminho);
      sheet = workbook.getWorksheet("Dias");
    } else {
      workbook = new ExcelJS.Workbook();
      sheet = workbook.addWorksheet("Dias");
      sheet.columns = [
        { header: "Data", key: "data", width: 15 },
        { header: "Total de Chamados", key: "total", width: 25 },
        { header: "Acima da Meta", key: "acimaMeta", width: 20 },
      ];
    }

    const jaExiste = sheet.getRows(2, sheet.rowCount).some(row => row.getCell(1).value === hoje);
    if (!jaExiste) {
      sheet.addRow({
        data: hoje,
        total: abertos.length,
        acimaMeta: abertos.length > 50 ? "SIM" : "-"
      });
      console.log(`🗓️ Dia ${hoje} registrado com ${abertos.length} chamados.`);
    }

    const totais = [];
    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
      const data = row.getCell(1).value;
      const total = row.getCell(2).value;
      if (data !== "Média" && typeof total === "number") {
        totais.push({ data, total });
      }
    });

    const media = Math.round(
      totais.reduce((acc, curr) => acc + curr.total, 0) / totais.length
    );

    const ultimaLinha = sheet.lastRow;
    if (ultimaLinha.getCell(1).value === "Média") {
      ultimaLinha.getCell(2).value = media;
    } else {
      sheet.addRow({ data: "Média", total: media });
    }

    // Salvar Excel e JSON
    await workbook.xlsx.writeFile(caminho);
    fs.writeFileSync(caminhoJson, JSON.stringify({ media, dias: totais }));

    console.log(`✅ Registro das 18h simulado em ${new Date().toISOString()}`);

  } catch (err) {
    console.error("❌ Erro ao registrar dia:", err.message);
  }
}

module.exports = { registrarDiaChamados };
