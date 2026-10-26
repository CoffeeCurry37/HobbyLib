@echo off
setlocal
cd /d "%~dp0"
call "%~dp0FIND-NODE.cmd"
if errorlevel 1 goto done
"%RADAR_NODE%" "%~dp0start.mjs"
:done
pause
