async function carregarHistorico() {
    const mes = document.getElementById("filtroMes").value;
    if (!mes) return;
  
    try {
      const res = await fetch(`/historico-json?mes=${mes}`);
      const dados = await res.json();
  
      const tbody = document.getElementById("tabelaHistorico");
      tbody.innerHTML = "";
  
      let ultrapassouMeta = false;
  
      dados.forEach(item => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
          <td>${item.data}</td>
          <td style="color: ${item.total > 50 ? 'red' : 'inherit'}">${item.total}</td>
        `;
        tbody.appendChild(linha);
        if (item.total > 50) ultrapassouMeta = true;
      });
  
      document.getElementById("alertaMeta").style.display = ultrapassouMeta ? "block" : "none";
  
      desenharGraficoChamados(dados);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      alert("Erro ao buscar histórico.");
    }
  }
  
  function exportarExcel() {
    const mes = document.getElementById("filtroMes").value;
    if (!mes) {
      alert("Selecione um mês para exportar.");
      return;
    }
    window.location.href = `/exportar-historico?mes=${mes}`;
  }
  
  window.addEventListener("DOMContentLoaded", () => {
    const hoje = new Date().toISOString().slice(0, 7);
    document.getElementById("filtroMes").value = hoje;
  });
  