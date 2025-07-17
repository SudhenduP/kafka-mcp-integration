# Stop MCP Server Script
Write-Host "Stopping Kafka MCP Server..." -ForegroundColor Yellow

# Stop all Node.js processes related to MCP server
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow

# Get all node processes and filter for MCP server
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainModule.FileName -like "*mcp-server*" -or
    $_.CommandLine -like "*mcp-server*" -or
    $_.CommandLine -like "*dist/index.js*"
}

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "Stopping process ID: $($process.Id)" -ForegroundColor Cyan
        try {
            Stop-Process -Id $process.Id -Force
            Write-Host "Process $($process.Id) stopped successfully" -ForegroundColor Green
        } catch {
            Write-Host "Failed to stop process $($process.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No MCP server processes found running" -ForegroundColor Yellow
}

# Alternative method: Kill all node processes if the above doesn't work
Write-Host "Checking for any remaining Node.js processes..." -ForegroundColor Yellow
$remainingNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($remainingNodeProcesses) {
    Write-Host "Found $($remainingNodeProcesses.Count) remaining Node.js processes" -ForegroundColor Yellow
    $choice = Read-Host "Do you want to stop ALL Node.js processes? (y/N)"
    
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        try {
            Stop-Process -Name "node" -Force
            Write-Host "All Node.js processes stopped" -ForegroundColor Green
        } catch {
            Write-Host "Failed to stop Node.js processes: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Clean up any lock files or temporary files
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow

if (Test-Path "mcp-server/dist") {
    Write-Host "MCP Server dist directory exists - server files are available" -ForegroundColor Green
} else {
    Write-Host "MCP Server dist directory not found - you may need to rebuild" -ForegroundColor Yellow
}

# Check if Kafka is still running
Write-Host "Checking Kafka status..." -ForegroundColor Yellow
try {
    $kafkaRunning = docker ps --filter "name=kafka" --filter "status=running" --quiet
    if ($kafkaRunning) {
        Write-Host "Kafka is still running" -ForegroundColor Green
    } else {
        Write-Host "Kafka is not running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check Kafka status" -ForegroundColor Yellow
}

Write-Host "MCP Server stop procedure completed!" -ForegroundColor Green
Write-Host "To restart the server, run: ./scripts/start-mcp-server.ps1" -ForegroundColor Cyan