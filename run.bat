@echo off
echo ========================================
echo    GitHub Simulator - C++ and Web
echo ========================================
echo.
echo Compiling C++ GitHub Simulator...
g++ -o github_simulator main.cpp
if errorlevel 1 (
    echo.
    echo Compilation failed!
    echo Make sure you have g++ installed
    pause
    exit /b 1
)

echo Compilation successful!
echo.
echo Starting GitHub Simulator...
echo.
echo Choose your preferred mode:
echo   1 = Console Mode (Interactive CLI)
echo   2 = Web Mode (Generate data for web interface)
echo.
echo Tip: Choose mode 2, then open index.html in your browser!
echo.
github_simulator.exe
echo.
echo If you chose web mode, now open index.html in your browser
echo to see the modern web interface with your data!
echo.
pause