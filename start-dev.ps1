# Enhanced start script with dependency check
Write-Host "Starting Inphinity Fee Calculator..." -ForegroundColor Cyan

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Dependencies not found. Installing..." -ForegroundColor Yellow
    npm install
}

# Start the dev server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
