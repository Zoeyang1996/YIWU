@echo off
setlocal
cd /d "%~dp0"
set "YIWU_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "YIWU_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%YIWU_NODE%" --version >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12+ is required. See README.md.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Run npm ci in this folder first. See README.md.
  pause
  exit /b 1
)
echo YIWU market preview: http://127.0.0.1:5173/
echo Keep this window open. Press Ctrl+C to stop.
"%YIWU_NODE%" node_modules\vite\bin\vite.js --host 127.0.0.1
pause
