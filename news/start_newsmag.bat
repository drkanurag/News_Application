@echo off
title NewsMag — India-First + Macro Global Real-Time Engine
cd /d "%~dp0"
echo Starting NewsMag Ultra-Low Latency Server on http://localhost:5173 ...
start "" "http://localhost:5173/"
python fast_server.py || py -3 fast_server.py
