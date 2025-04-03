// Carregar variáveis de ambiente do arquivo .env
require("dotenv").config();
console.log('API URL de Desenvolvimento:', process.env.API_URL_DEV);

const express = require("express");
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");

const NODE_ENV = process.env.NODE_ENV || "development"; // Detecta o ambiente
// Escolhe a URL da API com base no ambiente
const API_URL = process.env.NODE_ENV === "production" ? process.env.API_URL_PROD : process.env.API_URL_DEV;
const PORT = process.env.PORT || 3001;
console.log("Ambiente de execução:", process.env.NODE_ENV);

const { registrarSnapshotDiario } = require("./services/snapshotService");
const { registrarChamadosAbertos18h } = require("./services/snapshot18hService");
const { registrarDiaChamados } = require("./services/diasService");

const chamadosRoutes = require("./routes/chamadosRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const diasRoutes = require("./routes/diasRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Usar o prefixo /glpi-chamados para todas as rotas
app.use('/glpi-chamados', chamadosRoutes);  // Isso vai fazer suas rotas ficarem com o prefixo "/glpi-chamados"

// Outras rotas (relatórios e dias)
app.use('/glpi-chamados', relatorioRoutes);
app.use('/glpi-chamados', diasRoutes);

// ✅ Cron consolidado às 18h
//cron.schedule("0 18 * * *", () => {
//  console.log("⏰ Executando tarefas automáticas das 18h...");
//  registrarSnapshotDiario();
//  registrarChamadosAbertos18h();
//  registrarDiaChamados();
//});

cron.schedule("46 16 * * *", () => {
  console.log("⏰ Executando tarefa automática das 18h (apenas contagem diária)...");
  registrarDiaChamados();
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em ${API_URL}:${PORT} (${NODE_ENV})`);
});
