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

    const media = count ? Math.round(total / count) : 0;
    document.getElementById("mediaDias").textContent =
      count
        ? `📊 Média de chamados filtrados: ${media}`
        : "📊 Nenhum registro encontrado para o filtro selecionado";
  } catch (error) {
    console.error("❌ Erro ao carregar dados dos dias:", error);
    alert("Erro ao carregar dados dos dias.");
  }
}

// ------------------------------------------------------------------
function inicializarDias() {
  const botaoBuscar = document.getElementById("buscarBtn");
  if (botaoBuscar && !botaoBuscar.dataset.listener) {
    botaoBuscar.addEventListener("click", carregarDias);
    botaoBuscar.dataset.listener = "on";
  }

  const mesInput = document.getElementById("mesFiltro");
  if (mesInput && !mesInput.value) {
    mesInput.value = new Date().toISOString().slice(0, 7);
  }
}

document.addEventListener("DOMContentLoaded", inicializarDias);
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