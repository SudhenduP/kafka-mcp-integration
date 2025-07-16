# Demo Script for Kafka MCP Integration
Write-Host "🎯 Running Kafka MCP Integration Demo..." -ForegroundColor Green

# Check prerequisites
$kafkaRunning = docker ps --filter "name=kafka" --filter "status=running" --quiet
if (-not $kafkaRunning) {
    Write-Host "❌ Kafka is not running. Please start Kafka first with './scripts/start-kafka.ps1'" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "mcp-client/dist/demo.js")) {
    Write-Host "❌ MCP Client not built. Running build..." -ForegroundColor Yellow
    Set-Location mcp-client
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build MCP Client" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

Write-Host "🎬 Starting demo..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Run the demo
Set-Location mcp-client
node dist/demo.js

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Demo completed!" -ForegroundColor Green