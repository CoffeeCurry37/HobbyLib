@echo off
set "RADAR_NODE="
for %%N in ("%~dp0runtime\node.exe" "%ProgramFiles%\nodejs\node.exe" "%LOCALAPPDATA%\Programs\nodejs\node.exe") do if exist "%%~N" call :check "%%~N"
if defined RADAR_NODE exit /b 0
for /f "delims=" %%N in ('where node 2^>nul') do call :check "%%N"
if defined RADAR_NODE exit /b 0
echo.
echo Collector Radar needs Node.js 24 or newer.
echo 1. Open https://nodejs.org/en/download
echo 2. Select Node.js 24 LTS, Windows Installer (.msi).
echo 3. Complete installation, close this window, then run START-WINDOWS.cmd again.
echo See WINDOWS-QUICKSTART.html for instructions in Chinese.
exit /b 1
:check
if defined RADAR_NODE exit /b 0
"%~1" -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)" >nul 2>nul
if not errorlevel 1 set "RADAR_NODE=%~1"
exit /b 0
