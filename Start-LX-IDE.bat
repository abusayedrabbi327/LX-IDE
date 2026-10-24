@echo off
title LX-IDE - Offline LaTeX Studio
cd /d "%~dp0"
echo ======================================================
echo   LX-IDE - Offline LaTeX Studio
echo ======================================================
echo.
echo Choose how you would like to run LX-IDE:
echo   [1] Desktop Window (Native App - Recommended)
echo   [2] Web Browser Studio (Chrome / Edge / Default Browser)
echo.
set /p choice="Enter choice [1 or 2, default is 1]: "
if "%choice%"=="2" (
    echo.
    echo Starting Web Browser Studio...
    npm run dev
) else (
    echo.
    echo Starting Desktop Window...
    npm start
)
