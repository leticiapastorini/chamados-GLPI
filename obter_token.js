const axios = require('axios');

axios.post('http://apiperuzzo.corzti.net.br/apirest.php/initSession', {}, {
    headers: {
        'App-Token': 'vEZzuTcI02kgcKl3UQUgfvd2q3zq2riklGdy2R6x',
        'Authorization': 'user_token f1BEzmMm2ZorzxCgpYwlmef5vmdhNM2zu29zdyxv'
    }
}).then(response => {
    console.log('✅ Session Token:', response.data.session_token);
}).catch(error => {
    console.error('❌ Erro ao obter session_token:', error.response ? error.response.data : error);
});
