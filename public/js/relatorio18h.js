// js/relatorio18h.js
function init18h() {
    const mesInput = document.getElementById("mes18h");
    mesInput.value = new Date().toISOString().slice(0, 7); // mês atual
  
    async function carregar() {
      const mes = mesInput.value;
      if (!mes) return;
  
      const res   = await fetch(`/glpi-chamados/relatorio-18h-json?mes=${mes}`);
      const dados = await res.json();
  
      const tbody = document.getElementById("tabela18h");
      tbody.innerHTML = "";
  
      let soma = 0;
      dados.forEach(l => {
        tbody.insertAdjacentHTML(
          "beforeend",
          `<tr><td>${l.data}</td><td>${l.total}</td></tr>`
        );
        soma += l.total;
      });
  
      const media = dados.length ? Math.round(soma / dados.length) : 0;
      document.getElementById("media18h").textContent =
        dados.length
          ? `📊 Média de chamados às 18h: ${media}`
          : "📊 Nenhum registro encontrado para o mês selecionado";
    }
  
    // registra os eventos
    document.getElementById("buscar18h").addEventListener("click", carregar);
  
    document.getElementById("baixar18h").addEventListener("click", () => {
      const mes = mesInput.value;
      if (mes) window.location.href = `/glpi-chamados/exportar-18h?mes=${mes}`;
    });
  
    // NÃO carrega automaticamente
    document.getElementById("media18h").textContent =
      "📊 Clique em Buscar para carregar o relatório";
  }
  
  if (document.readyState !== "loading") init18h();
  else document.addEventListener("DOMContentLoaded", init18h);
  