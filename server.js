
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

const app = express();
app.use(cors());
app.use(express.json());

// rotas de API
app.use("/glpi-chamados", chamadosRoutes);
app.use("/glpi-chamados", relatorioRoutes);

// arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/views", express.static(path.join(__dirname, "views")));

// ---------- SPA fallback ----------
const sendIndex = (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"));

app.get("/",        sendIndex);
app.get("/detalhes",sendIndex);
app.get("/dias",    sendIndex);
// ----------------------------------

// ────────────────────────────────────────────────────────────────
// server.js  –  tarefa cron 12h e 18h
cron.schedule("0 12 * * *", async () => {
  console.log("⏰ Executando busca de chamados às 12h...");
  try {
    const total12h = await registrarChamadosAbertos12h(); // função para 12h
    enviarMensagem(`📅 Relatório de Chamados às 12h: ${total12h} chamados registrados.`);
    logToFile(`✅ Chamados às 12h: ${total12h} chamados`);
  } catch (e) {
    console.error("❌ Erro na busca de chamados às 12h:", e.message);
    logToFile("❌ Erro na busca de chamados às 12h: " + e.message);
  }
}, { timezone: "America/Sao_Paulo" });

// 18h - Buscar e sobrescrever com os dados de 18h
cron.schedule("0 18 * * *", async () => {
  console.log("⏰ Executando busca de chamados às 18h...");
  try {
    const total18h = await registrarChamadosAbertos18h(); // função para 18h
    enviarMensagem(`📸 Relatório 18h: ${total18h} chamados registrados.`);
    logToFile(`✅ Chamados às 18h: ${total18h} chamados (sobrescrito)`);
  } catch (e) {
    console.error("❌ Erro na busca de chamados às 18h:", e.message);
    logToFile("❌ Erro na busca de chamados às 18h: " + e.message);
  }
}, { timezone: "America/Sao_Paulo" });

app.get("/teste-msg", (req, res) => {
  enviarMensagem("✅ Teste manual de mensagem via API");
  res.send("Mensagem de teste enviada!");
});

// inicia o servidor
if (!module.parent) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT} (${NODE_ENV})`);
  });
}
