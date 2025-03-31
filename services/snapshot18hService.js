const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { obterTodosChamados } = require("./glpiService");

// Caminho da pasta onde os relatórios serão salvos
const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

// Verifica se a pasta existe, caso contrário, cria-a
if (!fs.existsSync(PASTA_RELATORIOS)) {
  fs.mkdirSync(PASTA_RELATORIOS);
  console.log("📁 Pasta 'relatorios/' criada automaticamente.");
}

// Função para registrar os chamados abertos às 18h
async function registrarChamadosAbertos18h() {
  try {
    // Obtém todos os chamados
    const todos = await obterTodosChamados();
    
    // Data e hora atuais
    const agora = new Date();
    const hoje = agora.toISOString().split("T")[0];  // Formato YYYY-MM-DD
    const hora = "18:00";  // Hora de registro

    // Filtra chamados com status "Novo", "Atribuído" e "Pendente"
    const abertos = todos.filter(c =>
      [1, 2, 4].includes(Number(c.status))  // Considera apenas chamados abertos
    );

    const total18h = abertos.length;  // Total de chamados abertos

    // Divide a data para criar o nome do arquivo (ano e mês)
    const [ano, mes] = hoje.split("-");
    const nomeArquivo = `relatorio-18h-${ano}-${mes}.xlsx`;  // Nome do arquivo com data
    const caminho = path.join(PASTA_RELATORIOS, nomeArquivo);  // Caminho do arquivo

    let workbook;
    let sheet;

    // Verifica se o arquivo já existe, caso contrário, cria um novo
    if (fs.existsSync(caminho)) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(caminho);  // Lê o arquivo existente
      sheet = workbook.getWorksheet("Chamados18h");  // Seleciona a aba "Chamados18h"
    } else {
      workbook = new ExcelJS.Workbook();
      sheet = workbook.addWorksheet("Chamados18h");  // Cria uma nova aba "Chamados18h"
      sheet.columns = [
        { header: "Data", key: "data", width: 15 },  // Definindo cabeçalhos das colunas
        { header: "Hora", key: "hora", width: 10 },
        { header: "Total", key: "total", width: 15 }
      ];
    }

    // Verifica se já existe um registro para o dia de hoje
    const jaRegistrado = sheet.getRows(2, sheet.rowCount)
      ?.some(row => row.getCell(1).value === hoje);

    // Se não houver registro, adiciona o novo
    if (!jaRegistrado) {
      sheet.addRow({ data: hoje, hora: hora, total: total18h });
      console.log(`🕕 Registro 18h salvo: ${hoje} - ${total18h} chamados abertos`);
    } else {
      console.log(`📌 Já existe registro para ${hoje} às 18h`);
    }

    // Recalcula a média de chamados abertos durante o mês
    const totais = [];
    sheet.eachRow((row, i) => {
      if (i === 1 || row.getCell(1).value === "Média") return;  // Ignora o cabeçalho e linha de "Média"
      const val = row.getCell(3).value;
      if (typeof val === "number") totais.push(val);
    });

    // Calcula a média
    const media = Math.round(totais.reduce((a, b) => a + b, 0) / totais.length);
    const ultima = sheet.lastRow.getCell(1).value;

    // Se não houver linha "Média", cria uma nova; senão, atualiza a existente
    if (ultima !== "Média") {
      sheet.addRow({ data: "Média", hora: "", total: media });
    } else {
      sheet.lastRow.getCell(3).value = media;
    }

    // Salva o arquivo atualizado
    await workbook.xlsx.writeFile(caminho);
  } catch (err) {
    console.error("❌ Erro ao salvar chamados 18h:", err.message);  // Tratamento de erro
  }
}

// Exporta a função para ser utilizada em outros módulos
module.exports = { registrarChamadosAbertos18h };
