const express = require("express");
const axios = require("axios");
const ExcelJS = require("exceljs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const APP_TOKEN = "vEZzuTcI02kgcKl3UQUgfvd2q3zq2riklGdy2R6x";
const API_TOKEN = "f1BEzmMm2ZorzxCgpYwlmef5vmdhNM2zu29zdyxv";
const API_URL = "http://apiperuzzo.corzti.net.br/apirest.php";

const STATUS_MAP = {
  1: "Novo",
  2: "Atribuído",
  3: "Em andamento",
  4: "Pendente",
  5: "Resolvido",
  6: "Fechado",
};

async function obterSessionToken() {
  const response = await axios.post(`${API_URL}/initSession`, {}, {
    headers: {
      'Authorization': `user_token ${API_TOKEN}`,
      'App-Token': APP_TOKEN,
    },
  });
  return response.data.session_token;
}

async function obterTodosChamados(sessionToken) {
  let todosChamados = [];
  let start = 0;
  const limit = 100;

  while (true) {
    const { data } = await axios.get(`${API_URL}/Ticket`, {
      params: {
        is_deleted: 0,
        range: `${start}-${start + limit - 1}`,
        expand_dropdowns: true,
        order: "DESC",
        sort: "date_mod"
      },
      headers: {
        "App-Token": APP_TOKEN,
        "Authorization": `user_token ${API_TOKEN}`,
        "Session-Token": sessionToken
      }
    });

    if (!Array.isArray(data) || data.length === 0) break;

    todosChamados.push(...data);
    start += limit;

    // Se retornou menos de 100, significa que acabou
    if (data.length < limit) break;
  }

  return todosChamados;
}


async function obterChamadosAbertos() {
  const sessionToken = await obterSessionToken();
  const chamados = await obterTodosChamados(sessionToken);

  const chamadosFiltrados = chamados
    .filter(c => [1, 2, 4].includes(Number(c.status)))
    .map(c => ({
      id: c.id,
      titulo: c.name || "Sem título",
      status: Number(c.status),
      status_nome: STATUS_MAP[c.status] || "Desconhecido",
      data: c.date_creation,
    }));

  console.log(`✅ Chamados abertos (status 1, 2, 4): ${chamadosFiltrados.length}`);
  return chamadosFiltrados;
}

function gerarPlanilhaExcel(chamados, nomeFolha) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(nomeFolha);

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Título", key: "titulo", width: 50 },
    { header: "Status", key: "status_nome", width: 25 },
    { header: "Data", key: "data", width: 25 },
  ];

  chamados.forEach(c => {
    sheet.addRow(c);
  });

  return workbook;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chamados", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    res.json(chamados);
  } catch (err) {
    console.error("Erro ao buscar chamados:", err);
    res.status(500).json({ error: "Erro ao buscar chamados" });
  }
});

app.get("/chamados-hoje", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const hoje = new Date().toISOString().split("T")[0];
    const chamadosHoje = chamados.filter(c => c.data?.startsWith(hoje));
    res.json(chamadosHoje);
  } catch (err) {
    console.error("Erro ao buscar chamados de hoje:", err);
    res.status(500).json({ error: "Erro ao buscar chamados de hoje" });
  }
});

app.get("/gerar-relatorio", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const workbook = gerarPlanilhaExcel(chamados, "Chamados Abertos");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=chamados_abertos.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

app.get("/gerar-relatorio-hoje", async (req, res) => {
  try {
    const chamados = await obterChamadosAbertos();
    const hoje = new Date().toISOString().split("T")[0];
    const chamadosHoje = chamados.filter(c => c.data?.startsWith(hoje));
    const workbook = gerarPlanilhaExcel(chamadosHoje, "Chamados de Hoje");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=chamados_abertos_hoje.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao gerar relatório de hoje:", err);
    res.status(500).json({ error: "Erro ao gerar relatório de hoje" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
