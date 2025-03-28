// falha_conexao.js

async function carregarChamadosComFallback() {
    try {
      const resposta = await fetch('/chamados');
      if (!resposta.ok) throw new Error('Erro ao buscar chamados');
  
      const dados = await resposta.json();
      localStorage.setItem('cache_chamados', JSON.stringify(dados)); // salva no cache
      atualizarTabela(dados); // usa função já existente no gerar_relatorio.js
      document.getElementById('erro-container')?.remove();
    } catch (erro) {
      console.warn('Erro ao buscar chamados. Tentando usar cache...', erro);
  
      const cache = localStorage.getItem('cache_chamados');
      if (cache) {
        const dadosCache = JSON.parse(cache);
        atualizarTabela(dadosCache);
      }
  
      exibirErroConexao();
    }
  }
  
  function exibirErroConexao() {
    if (document.getElementById('erro-container')) return;
  
    const erroDiv = document.createElement('div');
    erroDiv.id = 'erro-container';
    erroDiv.style.backgroundColor = '#ffeeee';
    erroDiv.style.border = '1px solid #ff0000';
    erroDiv.style.padding = '10px';
    erroDiv.style.margin = '10px';
    erroDiv.style.color = '#aa0000';
    erroDiv.style.textAlign = 'center';
  
    erroDiv.innerHTML = `
      <p>❌ Não foi possível conectar ao servidor do GLPI.</p>
      <button id="tentar-novamente" style="padding: 6px 12px; margin-top: 8px;">Tentar novamente</button>
    `;
  
    document.body.prepend(erroDiv);
  
    document.getElementById('tentar-novamente').addEventListener('click', () => {
      erroDiv.remove();
      carregarChamadosComFallback();
    });
  }
  
  // executa quando a página carregar
  window.addEventListener('DOMContentLoaded', () => {
    carregarChamadosComFallback();
  });
  