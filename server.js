require("dotenv").config(); // Carrega .env
const express = require("express");
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");

// Verifica NODE_ENV e URLs
const NODE_ENV = process.env.NODE_ENV || "development";
const API_URL = NODE_ENV === "production" 
  ? process.env.API_URL_PROD 
  : process.env.API_URL_DEV;

const PORT = process.env.PORT || 3001;

console.log("Ambiente de execução:", NODE_ENV);
console.log("API URL:", API_URL);
console.log("Porta:", PORT);

// Services
const { registrarSnapshotDiario } = require("./services/snapshotService");
const { registrarChamadosAbertos18h } = require("./services/snapshot18hService");
const { registrarDiaChamados } = require("./services/diasService");

// Rotas
const chamadosRoutes = require("./routes/chamadosRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const diasRoutes = require("./routes/diasRoutes");

// Inicializa App
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Se precisar servir arquivos estáticos

// Prefixo para as rotas principais
app.use("/glpi-chamados", chamadosRoutes);
app.use("/glpi-chamados", relatorioRoutes);
app.use("/glpi-chamados", diasRoutes);

// ─────────────────────────────────────────────────────────
// Rota manual para testar a função 18h
app.get("/testar-18h-manual", async (req, res) => {
  try {
    console.log("⏰ Executando teste manual da função 18h...");
    await registrarChamadosAbertos18h();
    res.send("Função 18h executada manualmente com sucesso!");
  } catch (err) {
    console.error("Erro ao executar função 18h manual:", err);
    res.status(500).send("Ocorreu um erro ao executar a função 18h manual.");
  }
});
// ─────────────────────────────────────────────────────────

// (REMOVER OU COMENTAR O CRON A CADA MINUTO)
// cron.schedule("* * * * *", () => {
//   console.log("▶ Rodando a cada minuto:", new Date().toLocaleTimeString());
// });

// Cron para rodar às 18h todos os dias
cron.schedule("0 18 * * *", () => {
  console.log("⏰ Executando tarefas automáticas das 18h...");
  registrarSnapshotDiario();
  registrarChamadosAbertos18h();
  registrarDiaChamados();
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT} - (${NODE_ENV} mode)`);
});
