@echo off
REM Double-click to launch the rz GUI: starts the local server and opens your browser.
cd /d "%~dp0"
start "" http://localhost:8737
node ui.js
