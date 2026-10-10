@echo off
title NewsMag — India-First + Macro Global Real-Time Engine
cd /d "%~dp0"
echo Starting NewsMag Ultra-Low Latency Server on http://localhost:5173 ...
start "" "http://localhost:5173/launch.html"
"C:\Users\anura\anaconda3\python.exe" fast_server.py
