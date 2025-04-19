// services/diasService.js
const path = require("path");
const fs   = require("fs");
const ExcelJS = require("exceljs");
const { obterTodosChamados } = require("./glpiService");
const { logToFile }          = require("../utils/logger");

const PASTA_RELATORIOS = path.join(__dirname, "..", "relatorios");
if (!fs.existsSync(PASTA_RELATORIOS)) {
  fs.mkdirSync(PASTA_RELATORIOS);
  console.log("📂 Pasta 'relatorios/' criada automaticamente.");
}

async function registrarDiaChamados() {
  try {
    const agora    = new Date();
    const hora     = agora.getHours();
    const minutos  = agora.getMinutes();

    /* só executa depois de 18 h */
    if (hora < 18) {
      console.log(`⏳ Ainda não são 18 h (agora ${hora}:${minutos}).`);
      return;
    }

    /* --------------------- coleta chamados --------------------- */
    const chamados   = await obterTodosChamados();
    const abertos    = chamados.filter(c => [1, 2, 4].includes(Number(c.status)));
    const totalHoje  = abertos.length;

    /* --------------------- prepara arquivos -------------------- */
    const hoje       = agora.toISOString().split("T")[0];
    const [ano, mes] = hoje.split("-");
    const xlsxNome   = `dias-salvos-${ano}-${mes}.xlsx`;
    const caminhoXLSX = path.join(PASTA_RELATORIOS, xlsxNome);
    const caminhoJSON = path.join(PASTA_RELATORIOS, `dias-salvos-${ano}-${mes}.json`);

    const wb = new ExcelJS.Workbook();
    let sheet;
    if (fs.existsSync(caminhoXLSX)) {
      await wb.xlsx.readFile(caminhoXLSX);
      sheet = wb.getWorksheet("Dias") || wb.addWorksheet("Dias");
    } else {
      sheet = wb.addWorksheet("Dias");
    }

    sheet.columns = [
      { header: "Data",             key: "data",       width: 15 },
      { header: "Total de Chamados", key: "total",      width: 25 },
      { header: "Acima da Meta",     key: "acimaMeta",  width: 20 }
    ];

    /* remove linha do dia e linha “Média” se existirem */
    for (let i = sheet.rowCount; i > 1; i--) {
      const valor = sheet.getRow(i).getCell(1).value;
      const dataTxt = valor instanceof Date
        ? valor.toISOString().split("T")[0]
        : String(valor).split("T")[0];
      if (dataTxt === hoje || valor === "Média") sheet.spliceRows(i, 1);
    }

    /* adiciona registro do dia */
    sheet.addRow({
      data: hoje,
      total: totalHoje,
      acimaMeta: totalHoje > 50 ? "SIM" : "-"
    });
    console.log(`🗓️ Dia ${hoje} registrado com ${totalHoje} chamados.`);

    /* --------------------- calcula média ----------------------- */
    const totais = [];
    sheet.eachRow((row, idx) => {
      if (idx === 1) return; // cabeçalho
      const total = Number(row.getCell(2).value);
      if (!isNaN(total)) totais.push(total);
    });

    const media = totais.length
      ? Math.round(totais.reduce((s, n) => s + n, 0) / totais.length)
      : 0;

    sheet.addRow({ data: "Média", total: media });

    /* --------------------- salva arquivos ---------------------- */
    await wb.xlsx.writeFile(caminhoXLSX);
    fs.writeFileSync(caminhoJSON, JSON.stringify({
      media,
      dias: sheet.getRows(2, sheet.rowCount - 2).map(r => ({
        data:  r.getCell(1).text,
        total: Number(r.getCell(2).value)
      }))
    }));

    logToFile(`✅ Registro diário concluído: ${totalHoje} chamados (${hoje})`);
  } catch (err) {
    logToFile("❌ Erro ao registrar dia: " + err.message);
    console.error("❌ Erro ao registrar dia:", err);
  }
}

module.exports = { registrarDiaChamados };
