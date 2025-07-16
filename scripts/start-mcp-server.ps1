# Start MCP Server Script
Write-Host "Starting Kafka MCP Server..." -ForegroundColor Green

# Check if Kafka is running
$kafkaRunning = docker ps --filter "name=kafka" --filter "status=running" --quiet
if (-not $kafkaRunning) {
    Write-Host "Kafka is not running. Please start Kafka first with './scripts/start-kafka.ps1'" -ForegroundColor Red
    exit 1
}

# Check if MCP Server is built
if (-not (Test-Path "mcp-server/dist/index.js")) {
    Write-Host "MCP Server not built. Running build..." -ForegroundColor Yellow
    Set-Location mcp-server
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build MCP Server" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

Write-Host "Testing Kafka connection..." -ForegroundColor Yellow
# Test Kafka connection
docker exec kafka kafka-topics --list --bootstrap-server localhost:29092 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Cannot connect to Kafka. Please check if Kafka is running properly." -ForegroundColor Red
    exit 1
}

Write-Host "Kafka connection successful" -ForegroundColor Green
Write-Host "Starting MCP Server..." -ForegroundColor Yellow

# Start MCP Server
Set-Location mcp-server
Start-Process -FilePath "node" -ArgumentList "dist/index.js" -NoNewWindow -PassThru

Write-Host "MCP Server started successfully!" -ForegroundColor Green
Write-Host "The server is now ready to accept MCP client connections" -ForegroundColor Cyan