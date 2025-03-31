function atualizarDatasPeriodo() {
    const mes = document.getElementById("mesRef").value;
    if (!mes) return;
  
    const [ano, mesStr] = mes.split("-");
    const primeiroDia = `${ano}-${mesStr}-01`;
    const ultimoDia = new Date(ano, parseInt(mesStr), 0).toISOString().slice(0, 10);
  
    document.getElementById("dataInicio").value = primeiroDia;
    document.getElementById("dataFim").value = ultimoDia;
  }
  
  function baixarRelatorioPeriodo() {
    const de = document.getElementById("dataInicio").value;
    const ate = document.getElementById("dataFim").value;
  
    if (!de || !ate) {
      alert("Informe o mês de referência para gerar o relatório.");
      return;
    }
  
    window.location.href = `/exportar-relatorio-periodo?de=${de}&ate=${ate}`;
  }
  