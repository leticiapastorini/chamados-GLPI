// app.js  –  SPA com History API e detecção de rota inicial

const rotas = {
  home: "/views/home.html",
  detalhes: "/views/detalhes.html",
  dias: "/views/dias.html",
  rel18h:  "/views/18h.html"
};

// ↔  ligação entre página e URL “bonita”
const pathPorPagina = { home: "/", detalhes: "/detalhes", dias: "/dias", rel18h: "/18h"};
const paginaPorPath = { "/": "home", "/detalhes": "detalhes", "/dias": "dias" , "/18h": "18h"};

async function navegar(pagina, push = true) {
  const caminho = rotas[pagina];
  const conteudo = document.getElementById("conteudo");

  try {
    const res = await fetch(caminho);
    if (!res.ok) throw new Error("Erro ao carregar página");

    const html = await res.text();
    conteudo.innerHTML = html;
    carregarScripts(pagina);

    // Atualiza URL sem recarregar
    if (push) history.pushState({ pagina }, "", pathPorPagina[pagina]);
  } catch (err) {
    conteudo.innerHTML = `<p>Erro ao carregar a página: ${pagina}</p>`;
    console.error(err);
  }
}

function carregarScripts(pagina) {
  const scripts = {
        home: ["/js/home.js"],
        detalhes: [
          "https://cdn.jsdelivr.net/npm/chart.js",   // 1º – biblioteca
          "/js/charts.js",                           // 2º – helpers
          "/js/gerar_relatorio.js"                   // 3º – busca & monta gráfico
        ],
        dias: ["/js/dias.js"],
        rel18h:  ["/js/relatorio18h.js"]
      };

  (scripts[pagina] || []).forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.body.appendChild(s);
  });
}

// ---------- inicialização ----------
window.addEventListener("DOMContentLoaded", () => {
  // Abre a página correspondente à URL atual
  const paginaInicial = paginaPorPath[window.location.pathname] || "home";
  navegar(paginaInicial, false);
});

// Voltar/avançar do navegador
window.addEventListener("popstate", e => {
  const pagina = e.state?.pagina || paginaPorPath[window.location.pathname] || "home";
  navegar(pagina, false);
});
