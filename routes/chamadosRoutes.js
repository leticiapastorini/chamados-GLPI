const express = require("express");
const { obterChamadosAbertos } = require("../services/glpiService");

const router = express.Router();

// Rota: chamados abertos
router.get("/chamados", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    res.json(chamados);
  } catch (err) {
    console.error("Erro ao buscar chamados:", err.message);
    res.status(500).json({ erro: "Erro ao buscar chamados" });
  }
});

// Rota: chamados abertos hoje
router.get("/chamados-hoje", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const hoje = new Date().toISOString().split("T")[0];
    const chamadosHoje = chamados.filter(c => c.data?.startsWith(hoje));
    res.json(chamadosHoje);
  } catch (err) {
    console.error("Erro ao buscar chamados de hoje:", err.message);
    res.status(500).json({ erro: "Erro ao buscar chamados de hoje" });
  }
});

module.exports = router;
