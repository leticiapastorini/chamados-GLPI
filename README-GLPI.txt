# 📊 Chamados GLPI - Sistema SPA com Relatórios Diários às 18h

Este projeto é um painel SPA (Single Page Application) para monitoramento de chamados abertos no GLPI, com foco em relatórios diários automáticos salvos às 18h.

---

## ✅ Funcionalidades

- Página **Home**: mostra o total de chamados abertos no momento.
- Página **Detalhes**: exibe todos os chamados por status (novo, pendente, atribuído).
- Página **Dias**: mostra a lista de chamados abertos diariamente às 18h, incluindo média automática.
- Exportação de relatórios para Excel (.xlsx)
- Geração automática de snapshot diário às 18h (agendamento)
- SPA com navegação dinâmica e modular

---

## 📁 Estrutura

```
public/
├── css/style.css
├── js/
│   ├── app.js
│   ├── home.js
│   ├── gerar_relatorio.js
│   ├── charts.js
│   └── dias.js
├── views/
│   ├── home.html
│   ├── detalhes.html
│   └── dias.html
├── index.html

routes/
├── chamadosRoutes.js
├── relatorioRoutes.js
└── diasRoutes.js

services/
├── glpiService.js
├── excelService.js
├── snapshotService.js
├── snapshot18hService.js
└── diasService.js

relatorios/
└── relatorio-18h-AAAA-MM.xlsx  ← Arquivo gerado automaticamente

server.js
```

---

## ⚙️ Como Rodar o Projeto

### 1. Instale as dependências
```bash
npm install
```

### 2. Crie um arquivo `.env` com:
```
API_URL_DEV=http://localhost:3001/apirest.php
NODE_ENV=development
PORT=3001
```

### 3. Inicie o servidor
```bash
node server.js
```

---

## ⏰ Como Agendar a Execução Automática às 18h no **Windows**

### Passo 1: Crie um script `.bat` para rodar o servidor
Crie um arquivo chamado `start-glpi.bat` com:

```bat
cd C:\CAMINHO\ATÉ\SEU\PROJETO
node server.js
```

Substitua `CAMINHO\ATÉ\SEU\PROJETO` pelo caminho real (ex: `C:\Users\leticia\Documents\GitHub\chamados-GLPI`)

---

### Passo 2: Agende pelo Agendador de Tarefas do Windows

1. Abra o **Agendador de Tarefas**
2. Clique em **Criar Tarefa**
3. Aba **Geral**:
   - Nome: `Chamados GLPI 18h`
4. Aba **Disparadores**:
   - Novo → Repetir todos os dias → Às 18:00 → OK
5. Aba **Ações**:
   - Novo → Ação: `Iniciar um programa`
   - Programa/script: `cmd.exe`
   - Adicione em "Argumentos":
     ```bat
     /c start "" "C:\CAMINHO\ATÉ\start-glpi.bat"
     ```
6. Aba **Condições** e **Configurações**:
   - Marque “Iniciar somente se estiver conectado à energia”
   - Marque “Executar a tarefa o mais rápido possível após um horário agendado ser perdido”

---

## 📦 Observações

- O snapshot diário salva dados no arquivo `relatorio-18h-AAAA-MM.xlsx`
- A tela **Dias** sempre usa esse arquivo como base
- A média é recalculada automaticamente a cada nova entrada
- O botão "Baixar Excel do mês" baixa o arquivo `.xlsx` completo

---

## 💬 Suporte

Para dúvidas, fale com Leticia via chat interno ou verifique os logs no console ao rodar o servidor (`node server.js`).

---

🚀 Projeto pronto para rodar localmente ou em ambiente corporativo com Node.js + Express.