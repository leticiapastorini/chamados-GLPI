@echo off
cd /d C:\Users\leticia.pastorini\Documents\GitHub\chamados-GLPI
call nvm use 18
call pm2 start server.js --name chamados