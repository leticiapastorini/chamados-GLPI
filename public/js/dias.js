async function carregarDias() {
    const mesInput = document.getElementById("mesFiltro");
    const quantidadeInput = document.getElementById("filtroQuantidade");
    const corpoTabela = document.getElementById("tabelaDias");
    const mediaEl = document.getElementById("mediaDias");
  
    if (!mesInput || !quantidadeInput || !corpoTabela || !mediaEl) {
      console.error("⚠️ Elementos não encontrados no DOM.");
      return;
    }
  
    const mes = (mesInput.value || "").trim(); // ex: "2025-04"
    const quantidade = (quantidadeInput.value || "Todos").trim();
  
    try {
      const res = await fetch(`/glpi-chamados/dias?mes=${mes}&quantidade=${quantidade}`);
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  
      const resultado = await res.json();
      const dados = resultado.dias || [];
      const media = resultado.media || 0;
  
      corpoTabela.innerHTML = "";
  
      if (dados.length === 0) {
        corpoTabela.innerHTML = "<tr><td colspan='2'>Nenhum dado encontrado para este mês.</td></tr>";
        mediaEl.textContent = "Média: 0";
        return;
      }
  
      dados.forEach((dia) => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
          <td>${dia.data}</td>
          <td>${dia.total}</td>
        `;
        if (dia.total > 50) {
          linha.style.backgroundColor = "#ffdddd";
        }
        corpoTabela.appendChild(linha);
      });
  
      // Adiciona linha final de média
      const linhaMedia = document.createElement("tr");
      linhaMedia.innerHTML = `
        <td><strong>Média</strong></td>
        <td><strong>${media}</strong></td>
      `;
      linhaMedia.style.backgroundColor = "#e8f4ff";
      corpoTabela.appendChild(linhaMedia);
  
      mediaEl.textContent = ""; // Esvazia se já mostramos na tabela
    } catch (error) {
      alert("Erro ao buscar dias do relatório.");
      console.error(error);
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const botaoBuscar = document.getElementById("buscarBtn");
    if (botaoBuscar) {
      botaoBuscar.addEventListener("click", carregarDias);
    }
  });
  
  async function baixarExcel() {
    const mes = (document.getElementById("mesFiltro").value || "").trim();
    if (!mes) return alert("Selecione um mês!");
  
    const url = `/glpi-chamados/exportar-18h?mes=${mes}`;
  
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) throw new Error();
  
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-18h-${mes}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("⚠️ Arquivo ainda não disponível para este mês.");
    }
  }
  