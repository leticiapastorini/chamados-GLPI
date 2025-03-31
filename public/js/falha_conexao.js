function exibirErroConexao() {
    if (document.getElementById("erro-container")) return;
  
    const erroDiv = document.createElement("div");
    erroDiv.id = "erro-container";
    erroDiv.innerHTML = `
      <p><strong>❌ Erro de conexão com o servidor.</strong></p>
      <button onclick="window.location.reload()">🔄 Tentar novamente</button>
    `;
    erroDiv.style = `
      background: #ffdede;
      color: #a30000;
      padding: 15px;
      margin-top: 20px;
      text-align: center;
      border: 1px solid #ffaaaa;
      border-radius: 8px;
      font-size: 16px;
    `;
  
    document.body.appendChild(erroDiv);
  }
  