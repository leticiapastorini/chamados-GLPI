// services/notifyService.js
const axios = require("axios");

const ENDPOINT   = process.env.MSG_ENDPOINT   || "http://192.168.51.9:5057/send_message";
const GROUP_NAME = process.env.MSG_GROUP_NAME || "BACKUP NTI";      // grupo/contato que receberá

/* ------------------------------------------------------------------
   THROTTLE – permite 1 envio a cada 125 s (2 min 5 s)
   evita ECONNREFUSED quando o serviço interno ainda está
   dentro do intervalo de “resfriamento” de 120 s
------------------------------------------------------------------ */
let ultimoEnvio = 0;            // timestamp (ms) do último POST bem‑sucedido
const JANELA_MS = 125_000;      // 125 s = 2 min 5 s

async function enviarMensagem(msg) {
  const agora = Date.now();
  if (agora - ultimoEnvio < JANELA_MS) {
    console.log("⏳ Aguardando janela de 2 min para novo envio");
    return;
  }
  if (msg.length > 500) {
    console.warn("⚠️ Mensagem muito longa, será cortada");
    msg = msg.substring(0, 497) + "...";
  }
  
  try {
    const res = await axios.post(
      ENDPOINT,
      { group_name: GROUP_NAME, message: msg },
      { headers: { "Content-Type": "application/json" }, timeout: 8000 }
    );

    if (res.status === 200) {
      ultimoEnvio = agora;              // marca horário só quando deu OK
      console.log("✅ Mensagem enviada ao grupo");
      console.log("📨 Resposta da API:", res.data); // <--- log da resposta

    } else {
      console.error(`⚠️ API respondeu ${res.status}: ${res.data}`);
    }
  } catch (e) {
    console.error("❌ Erro na conexão WhatsApp:", e.message);
  }
}

module.exports = { enviarMensagem };
