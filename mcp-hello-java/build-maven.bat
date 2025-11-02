@echo off
REM Set JAVA_HOME to IntelliJ's OpenJDK
set JAVA_HOME=C:\Users\kwonn\.jdks\openjdk-24.0.2+12-54
set PATH=%JAVA_HOME%\bin;%PATH%

REM Use IntelliJ's Maven
set MAVEN_HOME=C:\Program Files\JetBrains\IntelliJ IDEA 2025.2.3\plugins\maven\lib\maven3
set PATH=%MAVEN_HOME%\bin;%PATH%

echo Building MCP Hello Java with Maven...
echo JAVA_HOME: %JAVA_HOME%
echo MAVEN_HOME: %MAVEN_HOME%
echo.

cd /d "%~dp0"
call mvn clean package -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo JAR location: target\mcp-hello-java-1.0.0.jar
) else (
    echo.
    echo Build failed with error code %ERRORLEVEL%
)

echo.
pause
