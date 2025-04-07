const fs = require("fs");
const path = require("path");

const pastaLogs = path.join(__dirname, "..", "logs");

if (!fs.existsSync(pastaLogs)) {
  fs.mkdirSync(pastaLogs);
}

function escreverLog(msg) {
  const agora = new Date();
  const dataHora = agora.toISOString().replace("T", " ").substring(0, 16);
  const [ano, mes] = agora.toISOString().split("T")[0].split("-");
  const arquivo = path.join(pastaLogs, `log-${ano}-${mes}.txt`);
  const linha = `[${dataHora}] ${msg}\n`;
  fs.appendFileSync(arquivo, linha, "utf8");
}

module.exports = { escreverLog };