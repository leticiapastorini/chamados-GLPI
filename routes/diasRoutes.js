const express = require("express");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

const router = express.Router();

// Rota: buscar dias registrados por mês com média final
router.get("/", async (req, res) => {
  try {
    const { mes, quantidade } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório.");

    const [ano, mesNum] = mes.split("-");
    const nomeArquivo = `relatorio-18h-${ano}-${mesNum}.xlsx`;
    const caminho = path.join(__dirname, "..", "relatorios", nomeArquivo);

    if (!fs.existsSync(caminho)) return res.json({ dias: [], media: 0 });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(caminho);
    const sheet = workbook.getWorksheet("Chamados18h");

    const dias = [];
    sheet.eachRow((row, i) => {
      const label = row.getCell(1).value;
      const total = row.getCell(3).value;

      if (label === "Média" || i === 1) return;

      const mostrar =
        quantidade === "todos" ||
        (quantidade === "ate50" && total <= 50) ||
        (quantidade === "mais50" && total > 50);

      if (mostrar) {
        dias.push({ data: label, total });
      }
    });

    const mediaRow = sheet.findRow(sheet.rowCount);
    const media = mediaRow.getCell(1).value === "Média"
      ? mediaRow.getCell(3).value
      : 0;

    res.json({ dias, media });
  } catch (err) {
    console.error("Erro ao buscar dias do relatório:", err.message);
    res.status(500).send("Erro ao buscar dias");
  }
});

module.exports = router;
