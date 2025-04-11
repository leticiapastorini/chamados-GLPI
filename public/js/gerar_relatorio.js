// gerar_relatorio.js  –  tudo com caminhos relativos

async function carregarChamados() {
  try {
    const res = await fetch("/glpi-chamados/chamados");
    if (!res.ok) throw new Error(`Erro ao buscar chamados: ${res.statusText}`);

    const chamados = await res.json();
    atualizarTabela(chamados);
  } catch (err) {
    console.error("Erro ao carregar chamados:", err);
  }
}

function atualizarTabela(chamados) {
  const tabela = document.getElementById("tabela-chamados");
  tabela.innerHTML = "";

  let qtdNovo = 0, qtdAtrib = 0, qtdPend = 0;

  chamados.forEach(c => {
    if (c.status === 1) qtdNovo++;
    if (c.status === 2) qtdAtrib++;
    if (c.status === 4) qtdPend++;

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${c.id}</td>
      <td>${c.titulo}</td>
      <td><span class="status-label ${
        c.status === 1 ? "status-novo" :
        c.status === 2 ? "status-atrib" : "status-pend"
      }">${c.status_nome}</span></td>
      <td>${c.data}</td>
    `;
    tabela.appendChild(linha);
  });

  document.getElementById("qtd-novos").textContent      = qtdNovo;
  document.getElementById("qtd-atribuidos").textContent = qtdAtrib;
  document.getElementById("qtd-pendentes").textContent  = qtdPend;
  document.getElementById("qtd-total").textContent      = chamados.length;

  // gráfico
  if (typeof desenharGraficoChamados === "function") {
    desenharGraficoChamados([
      { data: "Novos",      total: qtdNovo  },
      { data: "Atribuídos", total: qtdAtrib },
      { data: "Pendentes",  total: qtdPend  }
    ]);
  }
}

function baixarTodos() {
  window.location.href = "/glpi-chamados/gerar-relatorio";
}

function baixarHoje() {
  window.location.href = "/glpi-chamados/gerar-relatorio-hoje";
}

// dispara logo que o script é carregado
carregarChamados();
