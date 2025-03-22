const express = require("express");
const axios = require("axios");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.static("public"));

// 📌 **Gerar o session_token antes de fazer qualquer requisição**
async function obterSessionToken() {
    try {
        const response = await axios.post("http://apiperuzzo.corzti.net.br/apirest.php/initSession", {}, {
            headers: {
                "App-Token": "vEZzuTcI02kgcKl3UQUgfvd2q3zq2riklGdy2R6x",
                "Authorization": "user_token f1BEzmMm2ZorzxCgpYwlmef5vmdhNM2zu29zdyxv"
            }
        });

        if (response.data.session_token) {
            console.log("✅ Novo session_token gerado:", response.data.session_token);
            return response.data.session_token;
        } else {
            throw new Error("Resposta inválida ao obter session_token");
        }
    } catch (error) {
        console.error("❌ Erro ao obter session_token:", error);
        throw error;
    }
}

// 📌 **Rota para obter chamados**
app.get('/chamados', async (req, res) => {
    try {
      const sessionToken = await obterSessionToken(); // Obtendo o token
      const response = await axios.get('URL_DA_API', {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });
  
      const chamadosAbertos = response.data.filter(c => c.status === 1); // Filtrando chamados abertos
      console.log(`✅ Chamados ABERTOS encontrados: ${chamadosAbertos.length}`);
      res.json(chamadosAbertos);
    } catch (error) {
      console.error('❌ Erro ao obter chamados:', error.message);
      res.status(500).json({ error: 'Erro ao obter chamados' });
    }
  });
  

// 📌 **Rota para gerar Excel**
app.get("/gerar-relatorio", async (req, res) => {
    try {
        console.log("🔄 Gerando novo session_token...");
        const session_token = await obterSessionToken();
        console.log("✅ session_token gerado:", session_token);

        console.log("🔄 Buscando chamados...");
        const response = await axios.get("http://apiperuzzo.corzti.net.br/apirest.php/Ticket?is_deleted=0&range=0-50", {
            headers: {
                "App-Token": "vEZzuTcI02kgcKl3UQUgfvd2q3zq2riklGdy2R6x",
                "Authorization": "user_token f1BEzmMm2ZorzxCgpYwlmef5vmdhNM2zu29zdyxv",
                "Session-Token": session_token
            }
        });

        console.log("✅ Resposta da API recebida:", response.data);

        const chamados = response.data.filter(chamado => chamado.status === "1");

        if (chamados.length === 0) {
            console.log("⚠️ Nenhum chamado aberto encontrado.");
            return res.status(400).json({ success: false, message: "Nenhum chamado aberto encontrado." });
        }

        console.log(`✅ ${chamados.length} chamados encontrados. Criando planilha...`);

        res.json({ success: true, message: "Planilha gerada!" });
    } catch (error) {
        console.error("❌ Erro ao gerar relatório:", error.response ? error.response.data : error);
        res.status(500).json({ success: false, message: "Erro ao gerar relatório." });
    }
});


// 📌 **Iniciar o servidor**
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
