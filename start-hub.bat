@echo off
title V-EngOlympiad Hub - Full-Stack Server (Port 3000)
set "PATH=C:\Users\PC\.gemini\antigravity\scratch\node-runtime\node-v22.14.0-win-x64;%PATH%"
cd /d "%~dp0"
echo ====================================================================
echo   STARTING V-ENGOLYMPIAD HUB (HSGQG, DHBB, HUNG VUONG, OLYMPIC 30/4)
echo   URL: http://localhost:3000
echo ====================================================================
start "" "http://localhost:3000"
node server.js
pause
