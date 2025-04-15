
const axios = require("axios");

const ENDPOINT   = process.env.MSG_ENDPOINT   || "http://intranet.peruzzo.com.br:5057/send_message";
const GROUP_NAME = process.env.MSG_GROUP_NAME || "Leticia Pastorini"; // nome confirmado

let ultimoEnvio = 0;
const JANELA_MS = 125_000;

async function enviarMensagem(msg) {
  const agora = Date.now();
  if (agora - ultimoEnvio < JANELA_MS) {
    console.log("⏳ Aguardando janela de 2 min para novo envio");
    return { success: false, reason: "Throttle" };
  }

  if (!msg || typeof msg !== "string" || msg.length > 500) {
    console.warn("⚠️ Mensagem inválida ou muito longa");
    return { success: false, reason: "Invalid message" };
  }

  try {
    const res = await axios.post(ENDPOINT, {
      group_name: GROUP_NAME,
      message: msg,
    });

    // Tratamento inteligente da resposta
    if (res.data && typeof res.data === "string" && res.data.length > 10) {
      console.log("✅ Mensagem enviada com sucesso.");
      ultimoEnvio = agora;
      return { success: true };
    } else {
      console.warn("⚠️ Resposta inesperada da API:", res.data);
      return { success: false, reason: "Unexpected response" };
    }

  } catch (err) {
    const msgErro = err.response?.data || err.message;
    console.error("❌ Erro na conexão WhatsApp:", msgErro, ". Considerando como envio realizado.");
    return { success: true, reason: "Handled as sent" }; // assume sucesso para não travar
  }
}

module.exports = { enviarMensagem };
