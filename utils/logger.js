const fs = require("fs");
const path = require("path");

const PASTA_LOGS = path.join(__dirname, "..", "logs");
const ARQUIVO_LOG = path.join(PASTA_LOGS, "snapshot.log");

if (!fs.existsSync(PASTA_LOGS)) {
  fs.mkdirSync(PASTA_LOGS);
}

function logToFile(mensagem) {
  const agora = new Date().toISOString();
  const linha = `[${agora}] ${mensagem}\n`;
  fs.appendFileSync(ARQUIVO_LOG, linha);
  console.log("📌 LOG:", mensagem);
}

module.exports = { logToFile };
