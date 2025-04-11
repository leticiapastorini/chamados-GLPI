// dias.js FINALIZADO ✅

async function carregarDias() {
  const mes = document.getElementById("mesFiltro").value;
  const filtro = document.getElementById("filtroQuantidade").value;

  if (!mes) return alert("Selecione um mês!");

  try {
    const res = await fetch(`/glpi-chamados/dias-json?mes=${mes}`);
    const dados = await res.json();

    console.log("🚀 Dados recebidos:", dados);

    const tabela = document.getElementById("tabelaDias");
    tabela.innerHTML = "";

    let total = 0;
    let count = 0;

    dados.dias
      .filter(d => {
        if (filtro === "ate50") return d.total <= 50;
        if (filtro === "mais50") return d.total > 50;
        return true;
      })
      .forEach(d => {
        const tr = document.createElement("tr");
        const acimaMeta = d.total > 50 ? "SIM" : "-";

        if (d.total > 50) {
          tr.style.backgroundColor = "#ffe0e0";
          tr.style.color = "#8b0000";
        }

        tr.innerHTML = `
          <td>${d.data}</td>
          <td>${d.total}</td>
          <td>${acimaMeta}</td>
        `;
        tabela.appendChild(tr);

        total += Number(d.total);
        count++;
      });

    const media = dados.media || 0;
    document.getElementById("mediaDias").textContent = `📊 Média de chamados abertos por dia: ${media}`;
  } catch (error) {
    console.error("❌ Erro ao carregar dados dos dias:", error);
    alert("Erro ao carregar dados dos dias.");
  }
}

// ------------------------------------------------------------------
// Registra listeners tanto em carregamento direto (HTML estático)
// quanto quando o script é injetado depois que a página já terminou
// de carregar (modo SPA).
// ------------------------------------------------------------------
function inicializarDias() {
  const botaoBuscar = document.getElementById("buscarBtn");
  if (botaoBuscar && !botaoBuscar.dataset.listener) {
    botaoBuscar.addEventListener("click", carregarDias);
    botaoBuscar.dataset.listener = "on";          // evita registrar 2×
  }

  const mesInput = document.getElementById("mesFiltro");
  if (mesInput && !mesInput.value) {
    mesInput.value = new Date().toISOString().slice(0, 7);
  }
}

// ➜ Caso a página seja carregada como arquivo HTML tradicional
document.addEventListener("DOMContentLoaded", inicializarDias);

// ➜ Caso o script seja injetado depois que DOMContentLoaded já passou
if (document.readyState !== "loading") {
  inicializarDias();
}


async function baixarExcel() {
  const mes = document.getElementById("mesFiltro").value;
  if (!mes) return alert("Selecione um mês!");

  const url = `/glpi-chamados/exportar-dias?mes=${mes}`;

  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) throw new Error();

    const link = document.createElement("a");
    link.href = url;
    link.download = `dias-salvos-${mes}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    alert("⚠️ Arquivo ainda não disponível para este mês.");
  }
}
