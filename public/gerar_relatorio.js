async function carregarChamados() {
  const res = await fetch("/chamados");
  const chamados = await res.json();
  atualizarTabela(chamados);

  const resHoje = await fetch("/chamados-hoje");
  const chamadosHoje = await resHoje.json();
  document.getElementById("total-hoje").textContent = chamadosHoje.length;
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
      <td><span class="status-label ${c.status === 1 ? "status-novo" : c.status === 2 ? "status-atrib" : "status-pend"}">${c.status_nome}</span></td>
      <td>${c.data}</td>
    `;
    tabela.appendChild(linha);
  });

  document.getElementById("qtd-novos").textContent = qtdNovo;
  document.getElementById("qtd-atribuidos").textContent = qtdAtrib;
  document.getElementById("qtd-pendentes").textContent = qtdPend;
  document.getElementById("qtd-total").textContent = chamados.length;
  document.getElementById("total-geral").textContent = chamados.length;
}

function baixarTodos() {
  window.location.href = "/gerar-relatorio";
}

function baixarHoje() {
  window.location.href = "/gerar-relatorio-hoje";
}

carregarChamados();
