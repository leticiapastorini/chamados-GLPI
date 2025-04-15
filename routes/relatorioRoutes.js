const express = require("express");
const path    = require("path");
const fs      = require("fs");
const ExcelJS = require("exceljs");

const {
  obterChamadosAbertos,
  obterTodosChamados,
} = require("../services/glpiService");

const { registrarChamadosAbertos18h } = require("../services/snapshot18hService");
const { registrarDiaChamados }        = require("../services/diasService");
const { enviarMensagem } = require("../services/notifyService");

const {
  gerarPlanilhaChamados,
  gerarPlanilhaHistorico,
  gerarPlanilhaPorPeriodo,
  carregarHistoricoMensal
} = require("../services/excelService");

const { logToFile } = require("../utils/logger");

const router = express.Router();

/* ----------------------------------------------------------------
   RELATÓRIOS DE CHAMADOS (excel / json)
---------------------------------------------------------------- */

// relatório completo
router.get("/gerar-relatorio", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const wb = gerarPlanilhaChamados(chamados, "Chamados Abertos");
    res.setHeader("Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",
      "attachment; filename=chamados_abertos.xlsx");
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    res.status(500).json({ erro: "Erro ao gerar relatório" });
  }
});

// relatório somente de hoje
router.get("/gerar-relatorio-hoje", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const hoje = new Date().toISOString().split("T")[0];
    const hojeLista = chamados.filter(c => c.data?.startsWith(hoje));
    const wb = gerarPlanilhaChamados(hojeLista, "Chamados de Hoje");
    res.setHeader("Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",
      "attachment; filename=chamados_hoje.xlsx");
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro relatório hoje:", err);
    res.status(500).json({ erro: "Erro ao gerar relatório de hoje" });
  }
});

/* ---------- HISTÓRICO MENSAL ---------- */

router.get("/historico-json", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Mês não informado");
    const historico = await carregarHistoricoMensal(mes);
    res.json(historico);
  } catch (err) {
    console.error("Erro carregar histórico:", err.message);
    res.status(500).send("Erro ao carregar histórico");
  }
});

router.get("/exportar-historico", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Mês não informado");
    const historico = await carregarHistoricoMensal(mes);
    const wb = gerarPlanilhaHistorico(historico, mes);
    res.setHeader("Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",
      `attachment; filename=historico_${mes}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro exportar histórico:", err);
    res.status(500).send("Erro ao exportar histórico");
  }
});

/* ---------- RELATÓRIO POR PERÍODO ---------- */

router.get("/exportar-relatorio-periodo", async (req, res) => {
  try {
    const { de, ate } = req.query;
    if (!de || !ate)
      return res.status(400).send("Parâmetros 'de' e 'ate' obrigatórios.");

    const todos = await obterTodosChamados();
    const periodo = todos.filter(c =>
      c.date_creation >= de &&
      c.date_creation <= ate &&
      [1, 2, 4].includes(Number(c.status))
    );

    const wb = gerarPlanilhaPorPeriodo(periodo, de, ate);
    res.setHeader("Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",
      `attachment; filename=chamados_${de}_a_${ate}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro exportar período:", err.message);
    res.status(500).send("Erro ao exportar por período");
  }
});

/* ----------------------------------------------------------------
   FORÇAR REGISTROS (18h + dias‑salvos) – útil para teste manual
---------------------------------------------------------------- */
router.get("/forcar-registros", async (req, res) => {
  let h18 = false, dias = false;

  try {
    //await registrarChamadosAbertos18h();
        const total = await registrarChamadosAbertos18h();
    await enviarMensagem(`📸 Relatório 18 h\nTotal de chamados abertos: *${total}*`);
    h18 = true;
  } catch (e) {
    logToFile("❌ Erro relatorio‑18h: " + e.message);
  }

  try {
    await registrarDiaChamados();
    dias = true;
  } catch (e) {
    logToFile("❌ Erro dias‑salvos: " + e.message);
  }

  res.send(`🟢 18h: ${h18 ? "✅" : "❌"} | Dias: ${dias ? "✅" : "❌"}`);
});

/* ---------- RELATÓRIO 18h JSON / EXCEL ---------- */

router.get("/relatorio-18h-json", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório.");

    const [ano, mesNum] = mes.split("-");
    const arquivo = path.join(
      __dirname, "..", "relatorios", `relatorio-18h-${ano}-${mesNum}.xlsx`
    );

    if (!fs.existsSync(arquivo)) return res.json([]);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(arquivo);
    const sheet = wb.getWorksheet("Chamados18h");

    const dados = [];
    sheet.eachRow((row, i) => {
      const valor = row.getCell(1).value;
      const dataTexto = valor instanceof Date
        ? valor.toISOString().split("T")[0]
        : String(valor).split("T")[0];
    
      if (i === 1 || dataTexto === "Média") return;
    
      dados.push({
        data:  dataTexto,
        total: row.getCell(3).value
      });
    });
    

    res.json(dados);
  } catch (err) {
    console.error("Erro ler 18h:", err.message);
    res.status(500).send("Erro ao buscar relatorio 18h");
  }
});

router.get("/exportar-18h", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório.");

    const [ano, mesNum] = mes.split("-");
    const arquivo = path.join(
      __dirname, "..", "relatorios", `relatorio-18h-${ano}-${mesNum}.xlsx`
    );

    if (!fs.existsSync(arquivo))
      return res.status(404).send("Relatório não encontrado.");

    res.setHeader("Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",
      `attachment; filename=relatorio-18h-${ano}-${mesNum}.xlsx`);
    fs.createReadStream(arquivo).pipe(res);
  } catch (err) {
    console.error("Erro exportar 18h:", err.message);
    res.status(500).send("Erro ao exportar Excel 18h");
  }
});


// ROTAS MOVIDAS DE diasRoutes.js

// JSON de dias
router.get("/dias-json", (req, res) => {
  const { mes } = req.query;
  if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório");

  const [ano, mesNum] = mes.split("-");
  const caminhoJson = path.join(__dirname, "..", "relatorios", `dias-salvos-${ano}-${mesNum}.json`);

  if (!fs.existsSync(caminhoJson)) return res.json({ media: 0, dias: [] });

  const dados = JSON.parse(fs.readFileSync(caminhoJson));
  res.json(dados);
});

// Excel de dias
router.get("/exportar-dias", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório");

    const [ano, mesNum] = mes.split("-");
    const nomeArquivo = `dias-salvos-${ano}-${mesNum}.xlsx`;
    const caminho = path.join(__dirname, "..", "relatorios", nomeArquivo);

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
