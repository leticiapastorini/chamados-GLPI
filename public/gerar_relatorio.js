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
  if(!tabela){
    console.warn("Elemento 'tabela-chamados' não encontrado no DOM.");
    return;
  }
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

function obterDataHoje() {
  return new Date().toISOString().split("T")[0];
}

function obterTotalHojeDoStorage() {
  const salvo = JSON.parse(localStorage.getItem("novosHojeData"));
  const hoje = obterDataHoje();

  if (!salvo || salvo.data !== hoje) {
    localStorage.setItem("novosHojeData", JSON.stringify({ data: hoje, ids: [] }));
    return [];
  }

  return salvo.ids || [];
}

function salvarTotalHojeNoStorage(ids) {
  const hoje = obterDataHoje();
  localStorage.setItem("novosHojeData", JSON.stringify({ data: hoje, ids }));
}

let idsChamadosNovosHoje = obterTotalHojeDoStorage();

async function carregarChamados() {
  try {
    const res = await fetch("/chamados");
    const chamados = await res.json();
    atualizarTabela(chamados);
  } catch (err) {
    console.error("Erro ao carregar chamados:", err);
  }
}

async function atualizarChamadosHojeAcumulado() {
  try {
    const res = await fetch("/chamados-hoje");
    const data = await res.json();

    const novosHoje = data.filter(c => c.status === 1);
    const novosIds = novosHoje.map(c => c.id);

    // Adiciona apenas IDs novos ao acumulador
    novosIds.forEach(id => {
      if (!idsChamadosNovosHoje.includes(id)) {
        idsChamadosNovosHoje.push(id);
      }
    });

    salvarTotalHojeNoStorage(idsChamadosNovosHoje);

    const el = document.getElementById("total-hoje");
    if (el) el.textContent = idsChamadosNovosHoje.length;

  } catch (err) {
    console.error("Erro ao buscar chamados de hoje:", err);
  }
}

function atualizarTabela(chamados) {
  const tabela = document.getElementById("tabela-chamados");
  if (!tabela) {
    console.warn("⚠️ Elemento 'tabela-chamados' não encontrado.");
    return;
  }

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

// ✅ Espera o DOM carregar antes de iniciar
window.addEventListener("DOMContentLoaded", () => {
  carregarChamados();
  atualizarChamadosHojeAcumulado();

  const el = document.getElementById("total-hoje");
  if (el) el.textContent = idsChamadosNovosHoje.length;

  setInterval(() => {
    carregarChamados();
    atualizarChamadosHojeAcumulado();
  }, 600000); // 10 minutos
});
