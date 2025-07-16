@echo off
echo ============================================
echo Kafka MCP Server Cleanup and Restart Script
echo ============================================

echo.
echo [1/8] Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✅ Node.js processes stopped
) else (
    echo ℹ️  No Node.js processes were running
)

echo.
echo [2/8] Stopping Docker containers...
cd ..\docker
docker-compose down 2>nul
if %errorlevel% == 0 (
    echo ✅ Docker containers stopped
) else (
    echo ℹ️  Docker containers were not running
)

echo.
echo [3/8] Cleaning up Docker volumes and networks...
docker system prune -f --volumes 2>nul
echo ✅ Docker cleanup completed

echo.
echo [4/8] Cleaning up temporary files...

REM Clean MCP Server build artifacts
if exist "..\mcp-server\dist" (
    rmdir /s /q "..\mcp-server\dist"
    echo ✅ Cleaned mcp-server dist directory
)

if exist "..\mcp-server\node_modules\.cache" (
    rmdir /s /q "..\mcp-server\node_modules\.cache"
    echo ✅ Cleaned mcp-server node_modules cache
)

REM Clean MCP Client build artifacts
if exist "..\mcp-client\dist" (
    rmdir /s /q "..\mcp-client\dist"
    echo ✅ Cleaned mcp-client dist directory
)

if exist "..\mcp-client\node_modules\.cache" (
    rmdir /s /q "..\mcp-client\node_modules\.cache"
    echo ✅ Cleaned mcp-client node_modules cache
)

REM Clean log files
if exist "..\*.log" (
    del /q "..\*.log"
    echo ✅ Cleaned root log files
)

if exist "..\mcp-server\*.log" (
    del /q "..\mcp-server\*.log"
    echo ✅ Cleaned mcp-server log files
)

if exist "..\mcp-client\*.log" (
    del /q "..\mcp-client\*.log"
    echo ✅ Cleaned mcp-client log files
)

echo.
echo [5/8] Cleaning up Kafka data directories...
if exist "..\docker\kafka-data" (
    rmdir /s /q "..\docker\kafka-data"
    echo ✅ Cleaned Kafka data directory
)

if exist "..\docker\zookeeper-data" (
    rmdir /s /q "..\docker\zookeeper-data"
    echo ✅ Cleaned Zookeeper data directory
)

echo.
echo [6/8] Recompiling TypeScript projects...

REM Compile MCP Server
echo Compiling MCP Server...
cd ..\mcp-server
npm run build 2>nul
if %errorlevel% == 0 (
    echo ✅ MCP Server TypeScript compilation successful
) else (
    echo ❌ MCP Server npm build failed, trying direct tsc...
    npx tsc
    if %errorlevel% == 0 (
        echo ✅ MCP Server direct TypeScript compilation successful
    ) else (
        echo ❌ MCP Server TypeScript compilation failed
        pause
        exit /b 1
    )
)

REM Compile MCP Client
echo Compiling MCP Client...
cd ..\mcp-client
npm run build 2>nul
if %errorlevel% == 0 (
    echo ✅ MCP Client TypeScript compilation successful
) else (
    echo ❌ MCP Client npm build failed, trying direct tsc...
    npx tsc
    if %errorlevel% == 0 (
        echo ✅ MCP Client direct TypeScript compilation successful
    ) else (
        echo ❌ MCP Client TypeScript compilation failed
        pause
        exit /b 1
    )
)

echo.
echo [7/8] Starting Docker containers...
cd ..\docker
docker-compose up -d
if %errorlevel% == 0 (
    echo ✅ Docker containers started
) else (
    echo ❌ Failed to start Docker containers
    pause
    exit /b 1
)

echo.
echo [8/8] Waiting for Kafka to be ready...
timeout /t 30 /nobreak > nul
echo ✅ Kafka should be ready now

echo.
echo ============================================
echo 🎉 Cleanup and restart completed successfully!
echo ============================================
