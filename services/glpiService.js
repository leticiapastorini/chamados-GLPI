require("dotenv").config();

const axios = require("axios");

const APP_TOKEN = "vEZzuTcI02kgcKl3UQUgfvd2q3zq2riklGdy2R6x";
const API_TOKEN = "f1BEzmMm2ZorzxCgpYwlmef5vmdhNM2zu29zdyxv";

const API_URL = process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? process.env.API_URL_PROD
    : process.env.API_URL_DEV);
    
    console.log("→ GLPI API URL =", API_URL);

const STATUS_MAP = {
  1: "Novo",
  2: "Atribuído",
  3: "Em andamento",
  4: "Pendente",
  5: "Resolvido",
  6: "Fechado"
};

// Autenticação
async function obterSessionToken() {
  const res = await axios.post(`${API_URL}/initSession`, {}, {
    headers: {
      "Authorization": `user_token ${API_TOKEN}`,
      "App-Token": APP_TOKEN
    }
  });
  return res.data.session_token;
}

// Paginação para todos os chamados
async function obterTodosChamados(sessionTokenParam = null) {
  const sessionToken = sessionTokenParam || await obterSessionToken();
  let todos = [];
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
    todos.push(...data);
    start += limit;
    if (data.length < limit) break;
  }

  return todos;
}

// Apenas chamados com status abertos
async function obterChamadosAbertos() {
  try {
    const sessionToken = await obterSessionToken();
    console.log("✅ Token obtido:", sessionToken);

    const chamados = await obterTodosChamados(sessionToken);
    console.log("✅ Total de chamados recebidos:", chamados.length);

    return chamados
      .filter(c => [1, 2, 4].includes(Number(c.status)))
      .map(c => ({
        id: c.id,
        titulo: c.name || "Sem título",
        status: Number(c.status),
        status_nome: STATUS_MAP[c.status] || "Desconhecido",
        data: c.date_creation
      }));
  } catch (err) {
    console.error("❌ Erro dentro de obterChamadosAbertos:", err);
    throw err;
  }
}

module.exports = {
  obterSessionToken,
  obterTodosChamados,
  obterChamadosAbertos,
  STATUS_MAP
};
