const { logToFile }     = require("./logger");
const { enviarMensagem } = require("../services/notifyService");

function reportarErro(tag, err) {
  const msg = `🚨 ${tag}: ${err.message || err}`;
  logToFile(msg);
  enviarMensagem(msg);
}

module.exports = { reportarErro };
