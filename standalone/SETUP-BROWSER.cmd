@echo off
setlocal
cd /d "%~dp0"
call "%~dp0FIND-NODE.cmd"
if errorlevel 1 goto done
for %%N in ("%RADAR_NODE%") do set "PATH=%%~dpN;%PATH%"
"%RADAR_NODE%" "%~dp0setup-browser.mjs"
:done
pause
