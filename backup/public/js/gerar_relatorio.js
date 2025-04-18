async function carregarChamados() {
  try {
    const res = await fetch("http://localhost:3001/glpi-chamados/chamados");

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

  document.getElementById("qtd-novos").textContent = qtdNovo;
  document.getElementById("qtd-atribuidos").textContent = qtdAtrib;
  document.getElementById("qtd-pendentes").textContent = qtdPend;
  document.getElementById("qtd-total").textContent = chamados.length;
}

function baixarTodos() {
  window.location.href = "http://localhost:3001/glpi-chamados/gerar-relatorio";
}

function baixarHoje() {
  window.location.href = "http://localhost:3001/glpi-chamados/gerar-relatorio-hoje";
}

// Inicializa carregamento ao abrir a página
carregarChamados();
