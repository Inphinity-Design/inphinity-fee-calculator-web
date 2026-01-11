# Inphinity Fee Calculator - Development Server Launcher
# This script starts the development server and opens the calculator in your browser

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Inphinity Fee Calculator Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where the script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Project Directory: $ScriptDir" -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Green
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Dependencies not found. Installing..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "The calculator will open in your browser automatically." -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server when you're done." -ForegroundColor Yellow
Write-Host ""

# Wait a moment to let the user see the messages
Start-Sleep -Seconds 2

# Start the dev server in the background and capture the process
$devServerJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $ScriptDir

# Wait for the server to start (check for port 8080)
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverStarted = $false

while ($attempt -lt $maxAttempts -and -not $serverStarted) {
    Start-Sleep -Seconds 1
    $attempt++

    try {
        $connection = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            $serverStarted = $true
        }
    } catch {
        # Port not ready yet, continue waiting
    }

    Write-Host "." -NoNewline -ForegroundColor Yellow
}

Write-Host ""

if ($serverStarted) {
    Write-Host ""
    Write-Host "Server started successfully!" -ForegroundColor Green
    Write-Host "Opening browser..." -ForegroundColor Green
    Start-Sleep -Seconds 1

    # Open the browser
    Start-Process "http://localhost:8080"

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Calculator is running!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "URL: http://localhost:8080" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""

    # Receive job output and display it
    Receive-Job -Job $devServerJob -Wait
} else {
    Write-Host ""
    Write-Host "ERROR: Server failed to start within 30 seconds!" -ForegroundColor Red
    Write-Host "Please check the output above for errors." -ForegroundColor Red
    Stop-Job -Job $devServerJob
    Remove-Job -Job $devServerJob
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
