const axios = require('axios');

const sessionToken = 'u52hnp77bu8f469ilnvraqmj1u'; // Insira o token gerado em obter_token.js

axios.get('http://apiperuzzo.corzti.net.br/apirest.php/Ticket?is_deleted=0&range=0-50', {
    headers: {
        'App-Token': 'vEZzuTcI02kgcKl3UQUgfvd2q3zq2riklGdy2R6x',
        'Authorization': 'user_token f1BEzmMm2ZorzxCgpYwlmef5vmdhNM2zu29zdyxv',
        'Session-Token': sessionToken
    }
}).then(response => {
    const chamados = response.data;

    // Mostrar os status encontrados na API
    const statusUnicos = [...new Set(chamados.map(c => c.status))];
    console.log("🔍 Status encontrados na API:", statusUnicos);

    // Filtrar chamados com status 1 (aberto), 5 (resolvido) e 6 (fechado)
    const chamadosFiltrados = chamados.filter(chamado => 
        [1, 5, 6].includes(Number(chamado.status))
    );

    console.log(`✅ Chamados FILTRADOS: ${chamadosFiltrados.length}`, chamadosFiltrados);
}).catch(error => {
    console.error('❌ Erro ao obter chamados:', error.response ? error.response.data : error);
});
