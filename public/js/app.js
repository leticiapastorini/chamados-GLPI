const rotas = {
  home: "/views/home.html",
  detalhes: "/views/detalhes.html",
  dias: "/views/dias.html"
};

async function navegar(pagina) {
  const caminho = rotas[pagina];
  const conteudo = document.getElementById("conteudo");

  try {
    const res = await fetch(caminho);
    if (!res.ok) throw new Error("Erro ao carregar página");

    const html = await res.text();
    conteudo.innerHTML = html;
    carregarScripts(pagina);
  } catch (err) {
    conteudo.innerHTML = `<p>Erro ao carregar a página: ${pagina}</p>`;
    console.error(err);
  }
}

function carregarScripts(pagina) {
  const scripts = {
    home: ["/js/home.js"],
    detalhes: ["/js/gerar_relatorio.js", "/js/charts.js"],
    dias: ["/js/dias.js"]
  };

  const lista = scripts[pagina] || [];
  lista.forEach(src => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  navegar("home");
});