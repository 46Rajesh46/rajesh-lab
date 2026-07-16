@echo off
REM rz launcher for Windows — runs the CLI with Node. Put this folder on PATH,
REM or double-click is not useful (it's a command-line tool); use from a terminal:
REM   rz pack myfile
node "%~dp0rz.js" %*
