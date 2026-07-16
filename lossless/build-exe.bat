@echo off
REM Build the standalone rz.exe (needs Node.js installed once to build; the
REM resulting exe needs nothing). Double-click or run from a terminal.
cd /d "%~dp0"
echo [1/4] bundling modules...
node build-sea.js || exit /b 1
echo [2/4] generating SEA blob...
node --experimental-sea-config sea-config.json || exit /b 1
echo [3/4] copying node runtime -> rz.exe...
node -e "require('fs').copyFileSync(process.execPath,'rz.exe')" || exit /b 1
echo [4/4] injecting blob...
npx --yes postject rz.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 || exit /b 1
echo.
echo Done: rz.exe  (run:  rz.exe pack yourfile)
