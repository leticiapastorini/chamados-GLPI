// routes/chamadosRoutes.js
// -------------------------------------------------------------
// Retorna chamados abertos (status 1, 2, 4) com cache de 1 min
// ‑ GET /glpi‑chamados/chamados
//   • ?status=1,4  → filtra pelos status informados
// ‑ GET /glpi‑chamados/chamados‑hoje
// -------------------------------------------------------------
const express = require("express");
const { obterChamadosAbertos } = require("../services/glpiService");

const router = express.Router();

/* ------------ cache in‑memory (1 minuto) ------------ */
const CACHE_MS = 60_000;          // 1 min
let cache = { ts: 0, dados: [] };

async function obterChamadosCache() {
  const agora = Date.now();
  if (agora - cache.ts < CACHE_MS) return cache.dados;
  cache.dados = await obterChamadosAbertos();
  cache.ts    = agora;
  return cache.dados;
}

/* ------------ /chamados ------------ */
router.get("/chamados", async (req, res) => {
  try {
    const { status } = req.query;            // ex.: "1,4"
    const filtro = status
      ? status.split(",").map(Number).filter(n => !isNaN(n))
      : [1, 2, 4];

    const chamados = (await obterChamadosCache())
      .filter(c => filtro.includes(c.status));

    res.json(chamados);
  } catch (err) {
    console.error("❌ Erro ao buscar chamados:", err);
    res.status(500).json({ erro: "Erro ao buscar chamados", detalhes: err.message });
  }
});

/* ------------ /chamados‑hoje ------------ */
router.get("/chamados-hoje", async (req, res) => {
  try {
    const hoje = new Date().toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo"
    }); // dd/mm/aaaa

    const chamadosHoje = (await obterChamadosCache())
      .filter(c => {
        const dataCriacao = new Date(c.data || c.date_creation);
        const dataBR = dataCriacao.toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo"
        });
        return dataBR === hoje;
      });

    res.json(chamadosHoje);
  } catch (err) {
    console.error("❌ Erro ao buscar chamados de hoje:", err);
    res.status(500).json({ erro: "Erro ao buscar chamados de hoje" });
  }
});

module.exports = router;
