// services/thresholdService.js
const fs   = require("fs");
const path = require("path");
const { obterChamadosAbertos } = require("./glpiService");
const { enviarMensagem }       = require("./notifyService");
const { logToFile }            = require("../utils/logger");

/* ------------------------------------------------------------------
   Arquivo‑flag para garantir 1 alerta / dia
   (cria a pasta 'relatorios/' caso ainda não exista)
------------------------------------------------------------------ */
const FLAG_DIR = path.join(__dirname, "..", "relatorios");
if (!fs.existsSync(FLAG_DIR)) fs.mkdirSync(FLAG_DIR, { recursive: true });
const FLAG = path.join(FLAG_DIR, "threshold-flag.json");

async function verificarMetaDiaria() {
  try {
    const total = (await obterChamadosAbertos()).length;
    const hoje  = new Date().toISOString().slice(0, 10); // YYYY‑MM‑DD

    /* ---------- já enviou hoje? ---------- */
    let jaDisparou = false;
    if (fs.existsSync(FLAG)) {
      try {
        const { date } = JSON.parse(fs.readFileSync(FLAG, "utf8"));
        jaDisparou = date === hoje;
      } catch {
        jaDisparou = false;               // se corromper, dispara de novo
      }
    }

    /* ---------- dispara se >50 e ainda não enviou ---------- */
    if (total > 50 && !jaDisparou) {
      await enviarMensagem(
        `🚨 *Meta ULTRAPASSADA!* Já temos ${total} chamados abertos (${hoje}).`
      );
      fs.writeFileSync(FLAG, JSON.stringify({ date: hoje }), "utf8");
      logToFile(`⚠️ Threshold >50 disparado em ${hoje} (${total})`);
    }
  } catch (e) {
    logToFile("❌ Erro no threshold: " + e.message);
    console.error("Threshold error:", e.message);
  }
}

module.exports = { verificarMetaDiaria };
