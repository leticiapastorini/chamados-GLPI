// envia-aviso.js
require("dotenv").config();
const axios            = require("axios");
const { enviarMensagem } = require("./services/notifyService");

(async () => {
  try {
    // use sua porta / base da API (pode vir de .env)
    const BASE = process.env.API_BASE_URL || "http://localhost:3001";
    const res  = await axios.get(`${BASE}/glpi-chamados/chamados`);
    const total = Array.isArray(res.data) ? res.data.length : 0;

    if (total >= 50) {
      await enviarMensagem(`🔴 CRÍTICO: ${total} chamados registrados agora.`);
    } else if (total >= 40) {
      await enviarMensagem(`⚠️ AVISO: ${total} chamados registrados agora.`);
    } else {
      console.log(`ℹ️ ${total} chamados — abaixo de 40. Nada enviado.`);
    }
  } catch (err) {
    console.error("❌ Falha ao buscar chamados no backend:", err.message);
  }
})();
