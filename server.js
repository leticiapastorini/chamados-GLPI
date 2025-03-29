const express = require("express");
const axios = require("axios");
const ExcelJS = require("exceljs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;



app.use(cors());

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

app.use(cors());

// ROTAS PERSONALIZADAS
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/detalhes", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "detalhes.html"));
});

// ⬇️ Somente depois disso o static
app.use(express.static(path.join(__dirname, "public")));



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


// ... (seu código anterior permanece igual acima)

// Adições abaixo:

const fs = require("fs");
const cron = require("node-cron");

const pastaRelatorios = path.join(__dirname, "relatorios");
if (!fs.existsSync(pastaRelatorios)) {
  fs.mkdirSync(pastaRelatorios);
  console.log("📂 Pasta 'relatorios/' criada automaticamente.");
}

// Gera snapshot diário às 18h
async function registrarSnapshotDiario() {
  try {
    const sessionToken = await obterSessionToken();
    const todos = await obterTodosChamados(sessionToken);
    const hoje = new Date().toISOString().split("T")[0];
    const doDia = todos.filter(c => c.date_creation?.startsWith(hoje));
    const total = doDia.length;

    const [ano, mes] = hoje.split("-");
    const arquivo = path.join(pastaRelatorios, `relatorio-${ano}-${mes}.xlsx`);

    const workbook = fs.existsSync(arquivo)
      ? await new ExcelJS.Workbook().xlsx.readFile(arquivo)
      : new ExcelJS.Workbook();

    const sheet = workbook.getWorksheet("Chamados") || workbook.addWorksheet("Chamados");
    sheet.columns = [
      { header: "Data", key: "data", width: 15 },
      { header: "Total", key: "total", width: 15 },
    ];

    const jaExiste = sheet.getRows(2, sheet.rowCount)
      ?.some(r => r.getCell(1).value === hoje);

    if (!jaExiste) {
      sheet.addRow({ data: hoje, total });
      console.log(`📊 Snapshot salvo: ${hoje} - ${total} chamados`);
    } else {
      console.log(`ℹ️ Snapshot para ${hoje} já existe`);
    }

    // ✅ Se for o último dia do mês, calcula a média e adiciona
    const hojeDate = new Date();
    const ultimoDia = new Date(hojeDate.getFullYear(), hojeDate.getMonth() + 1, 0).getDate();
    if (hojeDate.getDate() === ultimoDia) {
      const totais = [];
      sheet.eachRow((row, i) => {
        if (i === 1) return;
        const valor = row.getCell(2).value;
        if (typeof valor === "number") totais.push(valor);
      });

      const media = (totais.reduce((a, b) => a + b, 0) / totais.length).toFixed(2);
      sheet.addRow({ data: "Média", total: Number(media) });
      console.log(`📈 Média do mês registrada: ${media}`);
    }

    await workbook.xlsx.writeFile(arquivo);
  } catch (err) {
    console.error("❌ Erro ao registrar snapshot:", err.message);
  }
}


// Rota: JSON para historico.js
app.get("/historico-json", async (req, res) => {
  const mes = req.query.mes;
  if (!mes) return res.status(400).json({ erro: "Informe o mês (YYYY-MM)" });

  const caminho = path.join(pastaRelatorios, `relatorio-${mes}.xlsx`);
  if (!fs.existsSync(caminho)) return res.json([]);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(caminho);
  const sheet = wb.getWorksheet("Chamados");

  const dados = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    dados.push({
      data: row.getCell(1).value,
      total: row.getCell(2).value,
    });
  });

  res.json(dados);
});

// Rota: baixar Excel do mês
app.get("/exportar-historico", (req, res) => {
  const mes = req.query.mes;
  if (!mes) return res.status(400).send("Informe o mês (YYYY-MM)");

  const arquivo = path.join(pastaRelatorios, `relatorio-${mes}.xlsx`);
  if (!fs.existsSync(arquivo)) return res.status(404).send("Arquivo não encontrado");

  res.download(arquivo);
});
