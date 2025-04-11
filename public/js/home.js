(async () => {
  const totalDiv = document.getElementById("totalChamados");
  if (!totalDiv) return;
  try {
    const res = await fetch("/glpi-chamados/chamados");
    const dados = await res.json();

    const total = dados.length;
    const totalDiv = document.getElementById("totalChamados");

    if (totalDiv) {
      totalDiv.textContent = total;
    } else {
      return;
    }
  } catch (error) {
    console.error("Erro ao buscar chamados:", error);
    const totalDiv = document.getElementById("totalChamados");
    if (totalDiv) {
      totalDiv.textContent = "Erro ao carregar";
    }
  }
})();
