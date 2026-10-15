@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 scripts\play.py %*
) else (
  python scripts\play.py %*
)
pause
