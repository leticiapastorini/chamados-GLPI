// teste-notify.js
const { enviarMensagem } = require("./services/notifyService");

(async () => {
  const resultado = await enviarMensagem("🚀 Teste de múltiplos destinos!");
  console.log("Resultado:", resultado);
})();
