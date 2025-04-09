const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { obterTodosChamados } = require("./glpiService");

const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

if (!fs.existsSync(PASTA_RELATORIOS)) {
  fs.mkdirSync(PASTA_RELATORIOS);
  console.log("📁 Pasta 'relatorios/' criada automaticamente.");
}

async function registrarSnapshotDiario() {
  try {
    const todos = await obterTodosChamados();
    const abertos = todos.filter(c => [1, 2, 4].includes(Number(c.status)));

    const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const [ano, mes] = hoje.split("-");
    const nomeArquivo = `snapshot-${ano}-${mes}.xlsx`;
    const caminho = path.join(PASTA_RELATORIOS, nomeArquivo);

    let workbook, sheet;

    if (fs.existsSync(caminho)) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(caminho);
      sheet = workbook.getWorksheet("Snapshot");
    } else {
      workbook = new ExcelJS.Workbook();
      sheet = workbook.addWorksheet("Snapshot");
      sheet.columns = [
        { header: "Data", key: "data", width: 15 },
        { header: "ID", key: "id", width: 10 },
        { header: "Título", key: "titulo", width: 40 },
        { header: "Status", key: "status_nome", width: 15 }
      ];
    }

    // Evita duplicatas
    const registrosExistentes = new Set();
    sheet.eachRow((row, i) => {
      if (i > 1) registrosExistentes.add(`${row.getCell(1).value}-${row.getCell(2).value}`);
    });

    for (const chamado of abertos) {
      const chave = `${hoje}-${chamado.id}`;
      if (!registrosExistentes.has(chave)) {
        sheet.addRow({
          data: hoje,
          id: chamado.id,
          titulo: chamado.titulo,
          status_nome: chamado.status_name || chamado.status_nome
        });
      }
    }

    await workbook.xlsx.writeFile(caminho);
    console.log(`📸 Snapshot diário salvo com ${abertos.length} chamados em ${hoje}`);

  } catch (err) {
    console.error("❌ Erro ao registrar snapshot:", err.message);
  }
}

module.exports = { registrarSnapshotDiario };
