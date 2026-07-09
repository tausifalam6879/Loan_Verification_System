@echo off
cd /d "%~dp0"
set "JAVA_EXE=java"
where java >nul 2>nul
if errorlevel 1 if exist "%USERPROFILE%\.jdks\openjdk-25.0.2\bin\java.exe" set "JAVA_EXE=%USERPROFILE%\.jdks\openjdk-25.0.2\bin\java.exe"
"%JAVA_EXE%" -jar "target\VerificationSystem-0.0.1-SNAPSHOT.jar" %* > "target\backend-run.log" 2>&1
