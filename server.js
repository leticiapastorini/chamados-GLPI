// server.js

require("dotenv").config();
console.log("API URL de Desenvolvimento:", process.env.API_URL_DEV);

const express = require("express");
const path    = require("path");
const cors    = require("cors");
const cron    = require("node-cron");

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT     = process.env.PORT     || 3001;

console.log("Ambiente de execução:", NODE_ENV);

// serviços / rotas
const { registrarChamadosAbertos18h } = require("./services/snapshot18hService");
const { registrarDiaChamados }        = require("./services/diasService");
const { verificarMetaDiaria }         = require("./services/thresholdService");
const { logToFile }                   = require("./utils/logger");
const { enviarMensagem }              = require("./services/notifyService");

const chamadosRoutes  = require("./routes/chamadosRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");

// ────────────────────────────────────────────────────────────
// Express / SPA
// ────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// API
app.use("/glpi-chamados", chamadosRoutes);
app.use("/glpi-chamados", relatorioRoutes);

// arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/views", express.static(path.join(__dirname, "views")));

// SPA fallback
const sendIndex = (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"));

app.get("/",     sendIndex);
app.get("/dias", sendIndex);

// ────────────────────────────────────────────────────────────
// CRON JOBS
// ────────────────────────────────────────────────────────────

// ① Threshold: verifica a cada 15 min se total > 50 (1 alerta/dia)
cron.schedule("*/15 * * * *", verificarMetaDiaria, {
  timezone: "America/Sao_Paulo"
});

// ② Resumo das 18 h: executa 18:00 em ponto (1 alerta/dia)
cron.schedule("0 18 * * *", async () => {
  try {
    await registrarChamadosAbertos18h(); // grava planilha + envia msg
    await registrarDiaChamados();        // atualiza dias‑salvos
    console.log("✅ Snapshot & Dia registrados às 18 h");
  } catch (e) {
    console.error("❌ Erro no job 18 h:", e.message);
    logToFile("❌ Erro no job 18 h: " + e.message);
  }
}, { timezone: "America/Sao_Paulo" });

// ────────────────────────────────────────────────────────────
// ROTAS AUXILIARES
// ────────────────────────────────────────────────────────────

// rota de teste
app.get("/teste-msg", (req, res) => {
  enviarMensagem("✅ Teste manual de mensagem via API");
  res.send("Mensagem de teste enviada!");
});

/* ----------------------------------------------------------------
   DEBUG – Forçar alerta de threshold (>50 chamados)
   GET /debug/forcar-threshold
---------------------------------------------------------------- */
app.get("/debug/forcar-threshold", async (req, res) => {
  try {
    await enviarMensagem("🚨 *Meta ULTRAPASSADA!* Teste de 51 chamados abertos (simulação).");
    res.send("Alerta de threshold testado com sucesso!");
  } catch (e) {
    res.status(500).send("Erro ao enviar mensagem: " + e.message);
  }
});
/* ----------------------------------------------------------------
   DEBUG – Forçar resumo das 18 h
   GET /debug/forcar-18h
---------------------------------------------------------------- */
app.get("/debug/forcar-18h", async (req, res) => {
  try {
    await registrarChamadosAbertos18h();          // grava + envia msg
    res.send("Resumo 18 h forçado (veja WhatsApp).");
  } catch (e) {
    res.status(500).send("Erro: " + e.message);
  }
});


// rota de status
const fs = require("fs");
app.get("/glpi-chamados/status", async (req, res) => {
  const agora = new Date();
  const [ano, mes] = agora.toISOString().split("T")[0].split("-");
  const caminho = path.join(__dirname, "relatorios", `relatorio-18h-${ano}-${mes}.xlsx`);

  try {
    if (!fs.existsSync(caminho)) {
      return res.json({
        ultimaExecucao: null,
        totalChamados:  0,
        atingiuMeta:    false,
        whatsappOnline: false,
      });
    }

    const ExcelJS = require("exceljs");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(caminho);
    const sheet = wb.getWorksheet("Chamados18h");

    let ultimaData = null;
    let ultimoTotal = 0;
    sheet.eachRow((row, i) => {
      const valor = row.getCell(1).value;
      if (valor && valor !== "Média" && i !== 1) {
        ultimaData  = row.getCell(1).text;
        ultimoTotal = parseInt(row.getCell(3).value);
      }
    });

    // verifica WhatsApp
    let whatsappOnline = false;
    try {
      const axios = require("axios");
      await axios.post(process.env.MSG_ENDPOINT, {
        group_name: "Leticia Pastorini",
        message:    "✅ [STATUS] Teste silencioso de status."
      }, { timeout: 3000 });
      whatsappOnline = true;
    } catch (_) {
      whatsappOnline = false;
    }

    res.json({
      ultimaExecucao: ultimaData,
      totalChamados:  ultimoTotal,
      atingiuMeta:    ultimoTotal >= 50,
      whatsappOnline
    });

  } catch (err) {
    console.error("❌ Erro no status:", err.message);
    res.status(500).json({ erro: "Erro ao gerar status" });
  }
});

// ────────────────────────────────────────────────────────────
// INICIA SERVIDOR
// ────────────────────────────────────────────────────────────
if (!module.parent) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT} (${NODE_ENV})`);
  });
}
