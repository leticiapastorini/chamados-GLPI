// services/notifyService.js

const axios = require("axios");

const ENDPOINT =
  process.env.MSG_ENDPOINT ||
  "http://intranet.peruzzo.com.br:5057/send_message";

// ⏱️ Throttle: 1 envio a cada 2 min 05 s
let ultimoEnvio = 0;
const JANELA_MS = 125_000;

// 📨 Lista de grupos/contatos que vão receber a mensagem
const DESTINOS = [
  "Leticia Pastorini",
  "Naiana Sum"
];

async function enviarMensagem(msg) {
  const agora = Date.now();

  // throttle
  if (agora - ultimoEnvio < JANELA_MS) {
    console.log("⏳ Aguardando janela de 2 min para novo envio");
    return { success: false, reason: "Throttle" };
  }

  // validação
  if (!msg || typeof msg !== "string" || msg.length > 500) {
    console.warn("⚠️ Mensagem inválida ou muito longa");
    return { success: false, reason: "Invalid message" };
  }

  let sucesso = false;

  for (const destino of DESTINOS) {
    try {
      const payload = { group_name: destino, message: msg };
      console.log("🔎 Enviando JSON para", destino, payload);

      const res = await axios.post(ENDPOINT, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 8000
      });

      console.log(`✅ ${destino}:`, res.status, res.data);
      sucesso = true;

    } catch (err) {
      if (err.response) {
        console.error(
          `❌ ${destino}: status=${err.response.status}`,
          "body=", err.response.data
        );
      } else {
        console.error(`❌ ${destino}:`, err.message);
      }
    }
  }

  if (sucesso) ultimoEnvio = agora;
  return { success: sucesso };
}

module.exports = { enviarMensagem };
