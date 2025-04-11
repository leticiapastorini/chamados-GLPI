// server.js – somente relatorio‑18h diário e dias‑salvos de 2h em 2h

require("dotenv").config();
console.log("API URL de Desenvolvimento:", process.env.API_URL_DEV);

const express = require("express");
const path    = require("path");
const cors    = require("cors");
const cron    = require("node-cron");

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT     = process.env.PORT     || 3001;

console.log("Ambiente de execução:", NODE_ENV);

const { registrarChamadosAbertos18h } = require("./services/snapshot18hService");
const { registrarDiaChamados }        = require("./services/diasService");
const { logToFile }                   = require("./utils/logger");
const { enviarMensagem }              = require("./services/notifyService");

const chamadosRoutes  = require("./routes/chamadosRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const diasRoutes      = require("./routes/diasRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// rotas de API
app.use("/glpi-chamados", chamadosRoutes);
app.use("/glpi-chamados", relatorioRoutes);
app.use("/glpi-chamados", diasRoutes);

// arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/views", express.static(path.join(__dirname, "views")));

// ---------- SPA fallback ----------
const sendIndex = (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"));

app.get("/",        sendIndex);
app.get("/detalhes",sendIndex);
app.get("/dias",    sendIndex);
app.get("/18h",    sendIndex);     // 🔧 nova tela
// ----------------------------------

// ────────────────────────────────────────────────────────────────
// server.js  –  trecho do cron 18 h
cron.schedule("0 21 * * *", async () => {
 // cron.schedule("* * * * *", async () => {
  console.log("⏰ 18h – gerando relatorio‑18h...");
  const agora = new Date().toLocaleString();
  try {
    // totalHoje vem do return da função
    const totalHoje = await registrarChamadosAbertos18h();

    enviarMensagem(`📸 Relatório 18h (${agora})\nTotal de chamados abertos: *${totalHoje}*`);
    logToFile(`✅ Relatorio‑18h salvo (${totalHoje} chamados)`);

 
  } catch (e) {
    console.error("❌ erro relatorio‑18h:", e.message);
    logToFile("❌ erro relatorio‑18h: " + e.message);
  }
}, { timezone: "UTC" });

app.get("/teste-msg", (req, res) => {
  enviarMensagem("✅ Teste manual de mensagem via API");
  res.send("Mensagem de teste enviada!");
});


// 2. Dias‑salvos – a cada 2 h em ponto (horário local)
cron.schedule("0 */2 * * *", async () => {
  console.log("⏰ Dias‑salvos – execução de 2h em 2h...");
  try {
    await registrarDiaChamados();
    enviarMensagem("✅ Registro dias‑salvos atualizado com sucesso (execução a cada 2h).");
    logToFile("✅ dias‑salvos atualizado");
  } catch (e) {
    console.error("❌ erro dias‑salvos:", e.message);
    logToFile("❌ erro dias‑salvos: " + e.message);
  }
}, { timezone: "America/Sao_Paulo" });
// ────────────────────────────────────────────────────────────────
app.get("/glpi-chamados/forcar-snapshot-hoje", async (req, res) => {
  try {
    const totalHoje = await registrarChamadosAbertos18h();
    await registrarDiaChamados();

    res.send(`🟢 Snapshot e registro de dia concluídos. Total: ${totalHoje} chamados.`);
  } catch (err) {
    console.error("❌ Erro no forçar-snapshot-hoje:", err.message);
    res.status(500).send("Erro ao forçar snapshot.");
  }
});

// inicia o servidor
if (!module.parent) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT} (${NODE_ENV})`);
  });
}
