function desenharGraficoChamados(dados) {
    const ctx = document.getElementById("graficoHistorico").getContext("2d");
  
    const labels = dados.map(d => d.data);
    const valores = dados.map(d => d.total);
  
    // Apagar gráfico anterior se já existir
    if (window.graficoChamados) {
      window.graficoChamados.destroy();
    }
  
    window.graficoChamados = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Chamados Abertos",
            data: valores,
            backgroundColor: valores.map(v => v > 50 ? "#dc3545" : "#007bff")
          },
          {
            label: "Meta (50 chamados)",
            data: new Array(valores.length).fill(50),
            type: "line",
            borderColor: "#28a745",
            borderWidth: 2,
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Total de Chamados"
            }
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }
  