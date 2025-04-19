// js/relatorio18h.js
function init18h() {
  const mesInput   = document.getElementById("mes18h");
  const filtro     = document.getElementById("filtro18h");
  const tabelaBody = document.getElementById("tabela18h");
  const mediaSpan  = document.getElementById("media18h");

  mesInput.value = new Date().toISOString().slice(0, 7); // mês atual

  async function carregar() {
    const mes = mesInput.value;
    if (!mes) return;

    const res   = await fetch(`/glpi-chamados/relatorio-18h-json?mes=${mes}`);
    const dados = await res.json();

    const tipoFiltro = filtro.value;
    let filtrados = dados;

    if (tipoFiltro === "ate50") {
      filtrados = dados.filter(d => d.total <= 50);
    } else if (tipoFiltro === "mais50") {
      filtrados = dados.filter(d => d.total > 50);
    }

    tabelaBody.innerHTML = "";

    let soma = 0;
    filtrados.forEach(l => {
      tabelaBody.insertAdjacentHTML(
        "beforeend",
        `<tr><td>${l.data}</td><td>${l.total}</td><td>${l.meta ? "✅" : "❌"}</td></tr>`
      );
      soma += l.total;
    });

    const media = filtrados.length ? Math.round(soma / filtrados.length) : 0;

    mediaSpan.textContent =
      filtrados.length
        ? `📊 Média de chamados às 18h: ${media}`
        : "📊 Nenhum registro encontrado para o mês/filtro selecionado";
  }

  // Eventos
  document.getElementById("buscar18h").addEventListener("click", carregar);
  filtro.addEventListener("change", carregar);

  document.getElementById("baixar18h").addEventListener("click", () => {
    const mes = mesInput.value;
    if (mes) window.location.href = `/glpi-chamados/exportar-18h?mes=${mes}`;
  });

  mediaSpan.textContent = "📊 Clique em Buscar para carregar o relatório";
}

if (document.readyState !== "loading") init18h();
else document.addEventListener("DOMContentLoaded", init18h);
