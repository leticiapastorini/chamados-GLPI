const express = require("express");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

const router = express.Router();

const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

router.get("/dias-json", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório");

    const [ano, mesNum] = mes.split("-");
    const nomeArquivo = `dias-salvos-${ano}-${mesNum}.xlsx`;
    const caminho = path.join(PASTA_RELATORIOS, nomeArquivo);

    if (!fs.existsSync(caminho)) return res.json([]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(caminho);
    const sheet = workbook.getWorksheet("Dias");

    const dados = [];

    sheet.eachRow((row, idx) => {
      if (idx === 1 || row.getCell(1).value === "Média") return;

      dados.push({
        data: row.getCell(1).text,
        total: Number(row.getCell(2).value)
      });
    });

    res.json(dados);
  } catch (err) {
    console.error("❌ Erro ao buscar dias:", err.message);
    res.status(500).send("Erro ao buscar dias");
  }
});

router.get("/exportar-dias", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório");

    const [ano, mesNum] = mes.split("-");
    const nomeArquivo = `dias-salvos-${ano}-${mesNum}.xlsx`;
    const caminho = path.join(PASTA_RELATORIOS, nomeArquivo);

    if (!fs.existsSync(caminho)) return res.status(404).send("Arquivo não encontrado.");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${nomeArquivo}`);

    fs.createReadStream(caminho).pipe(res);
  } catch (err) {
    console.error("❌ Erro ao exportar dias:", err.message);
    res.status(500).send("Erro ao exportar Excel");
  }
});

module.exports = router;
