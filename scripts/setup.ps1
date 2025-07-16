# Complete Setup Script for Kafka MCP Integration
Write-Host "🚀 Setting up Kafka MCP Integration..." -ForegroundColor Green

# Get the script's directory and navigate to project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

Write-Host "📍 Project root: $projectRoot" -ForegroundColor Cyan

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install npm." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check completed" -ForegroundColor Green

# Install MCP Server dependencies
Write-Host "📦 Installing MCP Server dependencies..." -ForegroundColor Yellow
Push-Location "mcp-server"
npm install
npm run build
Pop-Location

# Install MCP Client dependencies  
Write-Host "📦 Installing MCP Client dependencies..." -ForegroundColor Yellow
Push-Location "mcp-client"
npm install
npm run build
Pop-Location

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green