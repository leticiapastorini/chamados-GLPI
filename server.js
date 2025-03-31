const express = require("express");
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");

//const { registrarSnapshotDiario } = require("./services/snapshotService");
const { registrarChamadosAbertos18h } = require("./services/snapshot18hService");
const { registrarDiaChamados } = require("./services/diasService");

const chamadosRoutes = require("./routes/chamadosRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const diasRoutes = require("./routes/diasRoutes");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Rotas
app.use("/", chamadosRoutes);
app.use("/", relatorioRoutes);
app.use("/", diasRoutes);

// ✅ Cron consolidado às 18h
cron.schedule("0 18 * * *", () => {
  console.log("⏰ Executando tarefas automáticas das 18h...");
  registrarSnapshotDiario();
  registrarChamadosAbertos18h();
  registrarDiaChamados();
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
