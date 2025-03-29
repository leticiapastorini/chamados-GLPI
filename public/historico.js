async function fetchHistorico() {
  const mes = document.getElementById("filtroData").value;
  if (!mes) return;

  const res = await fetch(`/historico-json?mes=${mes}`);
  const data = await res.json();

  const tabela = document.querySelector("#tabelaHistorico tbody");
  tabela.innerHTML = "";

  let total = 0;
  let dias = 0;

  data.forEach(linha => {
    if (linha.data === "Média") return; // ignora para média ser recalculada

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linha.data}</td>
      <td>${linha.total}</td>
    `;
    if (linha.total > 50) tr.classList.add("excedeu");
    tabela.appendChild(tr);

    total += linha.total;
    dias++;
  });

  const media = (total / dias).toFixed(2);
  const divMedia = document.getElementById("mediaMensal");
  divMedia.innerHTML = `📊 Média de chamados abertos por dia: <strong>${media}</strong>`;
  if (media > 50) divMedia.style.color = "#d80000";
  else divMedia.style.color = "black";
}

  
  
  function exportarExcel() {
    const filtro = document.getElementById("filtroData").value;
    window.location.href = `/exportar-historico?mes=${filtro}`;
  }
  
  document.getElementById("filtroData").addEventListener("change", carregarHistorico);
  
  // Inicializa com o mês atual
  document.getElementById("filtroData").value = new Date().toISOString().slice(0, 7);
  carregarHistorico();
  