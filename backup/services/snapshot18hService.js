const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { obterTodosChamados } = require("./glpiService");

const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

// Cria pasta se não existir
if (!fs.existsSync(PASTA_RELATORIOS)) {
  fs.mkdirSync(PASTA_RELATORIOS);
  console.log("📁 Pasta 'relatorios/' criada automaticamente.");
}

async function registrarChamadosAbertos18h() {
  try {
    const todos = await obterTodosChamados();

    const agora = new Date();
    const hoje = agora.toISOString().split("T")[0];  // YYYY-MM-DD
    const hora = "18:00";

    const abertos = todos.filter(c => [1, 2, 4].includes(Number(c.status)));
    const total18h = abertos.length;

    const [ano, mes] = hoje.split("-");
    const nomeArquivo = `relatorio-18h-${ano}-${mes}.xlsx`;
    const caminho = path.join(PASTA_RELATORIOS, nomeArquivo);

    let workbook, sheet;

    if (fs.existsSync(caminho)) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(caminho);
      sheet = workbook.getWorksheet("Chamados18h");
    } else {
      workbook = new ExcelJS.Workbook();
      sheet = workbook.addWorksheet("Chamados18h");
      sheet.columns = [
        { header: "Data", key: "data", width: 15 },
        { header: "Hora", key: "hora", width: 10 },
        { header: "Total", key: "total", width: 15 }
      ];
    }

    const jaRegistrado = sheet.getRows(2, sheet.rowCount)
      ?.some(row => row.getCell(1).value === hoje);

    if (!jaRegistrado) {
      sheet.addRow({ data: hoje, hora, total: total18h });
      console.log(`🕕 Registro 18h salvo: ${hoje} - ${total18h} chamados abertos`);
    } else {
      console.log(`📌 Já existe registro para ${hoje} às 18h`);
    }

    const totais = [];
    sheet.eachRow((row, idx) => {
      if (idx === 1 || row.getCell(1).value === "Média") return;
      const val = row.getCell(3).value;
      if (typeof val === "number") totais.push(val);
    });

    const media = Math.round(totais.reduce((a, b) => a + b, 0) / totais.length);
    const ultimaLinha = sheet.lastRow;

    if (ultimaLinha.getCell(1).value === "Média") {
      ultimaLinha.getCell(3).value = media;
    } else {
      sheet.addRow({ data: "Média", hora: "", total: media });
    }

    await workbook.xlsx.writeFile(caminho);
    console.log(`✅ Snapshot 18h atualizado com sucesso em ${new Date().toISOString()}`);

  } catch (err) {
    console.error("❌ Erro ao salvar chamados 18h:", err.message);
  }
}

module.exports = { registrarChamadosAbertos18h };
