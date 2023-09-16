@echo off

set FORWARDED_PORT=3128

for /f "tokens=2" %%i in ('netstat -ano ^| findstr :%FORWARDED_PORT%') do (
    taskkill /F /PID %%i
)

echo Disconnected
