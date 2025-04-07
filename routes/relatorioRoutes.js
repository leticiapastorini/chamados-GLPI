const express = require("express");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const {
  obterChamadosAbertos,
  obterTodosChamados,
} = require("../services/glpiService");
const {
  gerarPlanilhaChamados,
  gerarPlanilhaHistorico,
  gerarPlanilhaPorPeriodo,
  carregarHistoricoMensal
} = require("../services/excelService");
const { registrarSnapshotDiario } = require("../services/snapshotService");

const router = express.Router();

// Rota: gerar relatório completo
router.get("/gerar-relatorio", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const workbook = gerarPlanilhaChamados(chamados, "Chamados Abertos");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=chamados_abertos.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    res.status(500).json({ erro: "Erro ao gerar relatório" });
  }
});

// Rota: gerar relatório apenas dos chamados de hoje
router.get("/gerar-relatorio-hoje", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const hoje = new Date().toISOString().split("T")[0];
    const chamadosHoje = chamados.filter(c => c.data?.startsWith(hoje));

    const workbook = gerarPlanilhaChamados(chamadosHoje, "Chamados de Hoje");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=chamados_hoje.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao gerar relatório de hoje:", err);
    res.status(500).json({ erro: "Erro ao gerar relatório de hoje" });
  }
});

// Rota: exportar histórico mensal em JSON
router.get("/historico-json", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Mês não informado");
    const historico = await carregarHistoricoMensal(mes);
    res.json(historico);
  } catch (err) {
    console.error("Erro ao carregar histórico:", err.message);
    res.status(500).send("Erro ao carregar histórico");
  }
});

// Rota: exportar Excel do histórico mensal
router.get("/exportar-historico", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Mês não informado");
    const historico = await carregarHistoricoMensal(mes);
    const workbook = gerarPlanilhaHistorico(historico, mes);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=historico_${mes}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao exportar histórico:", err);
    res.status(500).send("Erro ao exportar histórico");
  }
});

// Rota: exportar relatório por período
router.get("/exportar-relatorio-periodo", async (req, res) => {
  try {
    const { de, ate } = req.query;
    if (!de || !ate) return res.status(400).send("Parâmetros 'de' e 'ate' obrigatórios.");

    const todos = await obterTodosChamados();
    const chamadosPeriodo = todos.filter(c =>
      c.date_creation >= de && c.date_creation <= ate &&
      [1, 2, 4].includes(Number(c.status))
    );

    const workbook = gerarPlanilhaPorPeriodo(chamadosPeriodo, de, ate);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=chamados_periodo_${de}_a_${ate}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao exportar por período:", err.message);
    res.status(500).send("Erro ao exportar por período");
  }
});

// Rota de forçar snapshot manual (teste)
router.get("/forcar-snapshot-hoje", async (req, res) => {
  try {
    await registrarSnapshotDiario();
    res.send("✅ Snapshot forçado com sucesso.");
  } catch (err) {
    console.error("Erro ao forçar snapshot:", err.message);
    res.status(500).send("Erro ao forçar snapshot.");
  }
});

// Rota: retornar dados do Excel de 18h em JSON
router.get("/relatorio-18h-json", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório.");

    const [ano, mesNum] = mes.split("-");
    const nomeArquivo = `relatorio-18h-${ano}-${mesNum}.xlsx`;
    const caminho = path.join(__dirname, "..", "relatorios", nomeArquivo);

    if (!fs.existsSync(caminho)) {
      return res.json([]);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(caminho);
    const sheet = workbook.getWorksheet("Chamados18h");

    const dados = [];
    sheet.eachRow((row, i) => {
      if (i === 1 || row.getCell(1).value === "Média") return;
      dados.push({
        data: row.getCell(1).text,
        total: row.getCell(3).value
      });
    });

    res.json(dados);
  } catch (err) {
    console.error("Erro ao ler relatorio 18h:", err.message);
    res.status(500).send("Erro ao buscar relatorio 18h");
  }
});

// Rota: exportar Excel das 18h
router.get("/exportar-18h", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).send("Parâmetro 'mes' obrigatório.");

    const [ano, mesNum] = mes.split("-");
    const nomeArquivo = `relatorio-18h-${ano}-${mesNum}.xlsx`;
    const caminho = path.join(__dirname, "..", "relatorios", nomeArquivo);

    if (!fs.existsSync(caminho)) {
      return res.status(404).send("Relatório não encontrado.");
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${nomeArquivo}`);
    fs.createReadStream(caminho).pipe(res);
  } catch (err) {
    console.error("Erro ao exportar Excel 18h:", err.message);
    res.status(500).send("Erro ao exportar Excel 18h");
  }
});

module.exports = router;
