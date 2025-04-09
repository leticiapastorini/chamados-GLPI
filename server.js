// Carregar variáveis de ambiente do arquivo .env
require("dotenv").config();
console.log('API URL de Desenvolvimento:', process.env.API_URL_DEV);

const express = require("express");
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");

const NODE_ENV = process.env.NODE_ENV || "development";
const API_URL = NODE_ENV === "production" ? process.env.API_URL_PROD : process.env.API_URL_DEV;
const PORT = process.env.PORT || 3001;

console.log("Ambiente de execução:", NODE_ENV);
console.log("INICIADO PELO AGENDADOR");

const { registrarSnapshotDiario } = require("./services/snapshotService");
const { registrarChamadosAbertos18h } = require("./services/snapshot18hService");
const { registrarDiaChamados } = require("./services/diasService");
const { logToFile } = require("./utils/logger");

const chamadosRoutes = require("./routes/chamadosRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const diasRoutes = require("./routes/diasRoutes");

const now = new Date();
//const hora = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).split(" ")[1].split(":")[0];
//const minutos = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).split(" ")[1].split(":")[1];

const app = express();

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Rotas
app.use('/glpi-chamados', chamadosRoutes);
app.use('/glpi-chamados', relatorioRoutes);
app.use("/glpi-chamados", diasRoutes);

// ⏰ "00 21 * * *" → Executa todos os dias às 21h UTC = 18h BRT
cron.schedule("00 21 * * *", () => {
  console.log("⏰ Executando tarefa automática das 18h (horário Brasília)...");
  logToFile("⏰ Agendamento das 18h iniciado");
  registrarDiaChamados();
});


// 🧪 Simulação manual de 18h para teste (roda 1 min após iniciar)
setTimeout(() => {
  console.log("⏱️ Executando registro manual (simulando 18h)");
  logToFile("⏱️ Execução simulada (manual) iniciada");
  registrarDiaChamados();
}, 60000);

// Iniciar servidor (protegido contra múltiplas execuções)
if (!module.parent) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT} (${NODE_ENV})`);
  });
}


app.use('/views', express.static(path.join(__dirname, 'views')));