// diasRoutes.js FINALIZADO ✅

const express = require("express");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

const router = express.Router();
const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

// Rota: Retorna os dados JSON para a tela Dias
router.get("/dias-json", (req, res) => {
  const { mes } = req.query;
  if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório");

  const [ano, mesNum] = mes.split("-");
  const caminhoJson = path.join(PASTA_RELATORIOS, `dias-salvos-${ano}-${mesNum}.json`);

  if (!fs.existsSync(caminhoJson)) return res.json({ media: 0, dias: [] });

  const dados = JSON.parse(fs.readFileSync(caminhoJson));
  res.json(dados);
});

// Rota: Exporta o arquivo Excel do mês selecionado
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