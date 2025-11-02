@echo off
REM Build script for MCP Hello Java

echo Building MCP Hello Java...
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Maven found, building with Maven...
    call mvn clean package -DskipTests
) else (
    echo Maven not found in PATH.
    echo.
    echo Please build this project using one of these methods:
    echo.
    echo 1. IntelliJ IDEA:
    echo    - Open this project in IntelliJ IDEA
    echo    - Wait for Maven to sync dependencies
    echo    - Run: Build -^> Build Project
    echo    - Or use the Maven tool window and run: clean package
    echo.
    echo 2. Install Maven:
    echo    - Download from: https://maven.apache.org/download.cgi
    echo    - Add to PATH and run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo Build complete!
echo JAR location: target\mcp-hello-java-1.0.0.jar
echo.
pause
