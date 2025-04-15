
const { registrarChamadosAbertos12h } = require("./services/snapshot18hService");
const { registrarChamadosAbertos18h } = require("./services/snapshot18hService");

// Cron para rodar a cada 2 minutos (teste)
cron.schedule("*/2 * * * *", async () => {
  console.log("⏰ Executando teste de sobrescrita...");
  try {
    const total12h = await registrarChamadosAbertos12h(); // função para 12h
    enviarMensagem(`📅 Relatório de Chamados às 12h: ${total12h} chamados registrados.`);
    logToFile(`✅ Chamados às 12h: ${total12h} chamados`);
  } catch (e) {
    console.error("❌ Erro na busca de chamados:", e.message);
    logToFile("❌ Erro na busca de chamados: " + e.message);
  }
}, { timezone: "America/Sao_Paulo" });
