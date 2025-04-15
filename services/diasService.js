const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { obterTodosChamados } = require("./glpiService");
const { logToFile } = require("../utils/logger");
const { enviarMensagem } = require("./notifyService");

const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");

if (!fs.existsSync(PASTA_RELATORIOS)) {
  fs.mkdirSync(PASTA_RELATORIOS);
  console.log("📂 Pasta 'relatorios/' criada automaticamente.");
}

async function registrarDiaChamados() {
  try {
    const agora = new Date();
    const hora = agora.getHours();
    const minutos = agora.getMinutes();

    if (hora < 18) {
      console.log(`⏳ Ainda não são 18h (agora são ${hora}:${minutos}). Não vou registrar o dia.`);
      return;
    }

    const chamados = await obterTodosChamados();
    const abertos = chamados.filter(c => [1, 2, 4].includes(Number(c.status)));

    const hoje = new Date().toISOString().split("T")[0];
    const [ano, mes] = hoje.split("-");
    const nomeArquivo = `dias-salvos-${ano}-${mes}.xlsx`;
    const caminho = path.join(PASTA_RELATORIOS, nomeArquivo);
    const caminhoJson = path.join(PASTA_RELATORIOS, `dias-salvos-${ano}-${mes}.json`);

    const workbook = new ExcelJS.Workbook();
    let sheet;

    if (fs.existsSync(caminho)) {
      await workbook.xlsx.readFile(caminho);
      sheet = workbook.getWorksheet("Dias") || workbook.addWorksheet("Dias");
    } else {
      sheet = workbook.addWorksheet("Dias");
    }

    sheet.columns = [
      { header: "Data", key: "data", width: 15 },
      { header: "Total de Chamados", key: "total", width: 25 },
      { header: "Acima da Meta", key: "acimaMeta", width: 20 },
    ];
    

    // ✅ Corrigida: ignora "Média" e células vazias
    let jaExiste = false;
    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
    
      const celulaData = row.getCell(1).value;
      if (!celulaData || celulaData === "Média") return;
    
      const valorData = celulaData instanceof Date
        ? celulaData.toISOString().split("T")[0]
        : String(celulaData).split("T")[0].split(" ")[0];
    
      console.log(`[DEBUG] Linha ${idx}:`, valorData); // ← LOG PRA VER O QUE ELE TÁ LENDO
    
      if (valorData === hoje) {
        console.log(`[DEBUG] Encontrado dia duplicado: ${valorData}`);
        jaExiste = true;
      }
    });
    

    if (!jaExiste) {
      sheet.addRow({
        data: hoje,
        total: abertos.length,
        acimaMeta: abertos.length > 50 ? "SIM" : "-"
      });
      console.log(`🗓️ Dia ${hoje} registrado com ${abertos.length} chamados.`);

      if (abertos.length > 50) {
        enviarMensagem(`⚠️ ALERTA: Meta diária ultrapassada!\n${abertos.length} chamados registrados hoje.`);
      }
    } else {
      console.log(`⚠️ Já existe registro para o dia ${hoje}.`);
    }

    // Remove linha "Média" antiga
    for (let i = sheet.rowCount; i > 1; i--) {
      const row = sheet.getRow(i);
      if (row.getCell(1).value === "Média") {
        sheet.spliceRows(i, 1);
      }
    }

    const totais = [];
    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
      const data = row.getCell(1).value;
      const total = Number(row.getCell(2).value);
      if (data && typeof total === "number" && !isNaN(total)) {
        totais.push({ data, total });
      }
    });

    const media = totais.length > 0
      ? Math.round(totais.reduce((acc, curr) => acc + curr.total, 0) / totais.length)
      : 0;

    sheet.addRow({ data: "Média", total: media });
    // 🔍 Log do conteúdo antes de salvar
    console.log("📄 Salvando em:", caminho);
    console.log("📂 Caminho absoluto:", path.resolve(caminho));
    console.log("📈 Dias na memória antes de salvar:");
    sheet.eachRow((row, idx) => {
      const linha = row.values.slice(1).join(" | ");
      console.log(`  Linha ${idx}: ${linha}`);
    });

    await workbook.xlsx.writeFile(caminho);
    fs.writeFileSync(caminhoJson, JSON.stringify({ media, dias: totais }));

    logToFile(`✅ Registro diário concluído: ${abertos.length} chamados (${hoje})`);
  } catch (err) {
    logToFile(`❌ Erro ao registrar dia: ${err.stack || err.message}`);
    console.error("❌ Erro ao registrar dia:", err);
    enviarMensagem(`❌ Erro ao registrar dia: ${err.message}`);
  }
}

module.exports = { registrarDiaChamados };
