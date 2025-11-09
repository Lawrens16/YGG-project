# Sui Contract Publishing Script
# This script uses a custom config path to avoid Windows file locking issues

$customConfigPath = "$PSScriptRoot\.sui-config"
$env:SUI_CONFIG_PATH = $customConfigPath

Write-Host "Using custom config path: $customConfigPath" -ForegroundColor Green

# Create config directory if it doesn't exist
if (-not (Test-Path $customConfigPath)) {
    New-Item -ItemType Directory -Path $customConfigPath -Force | Out-Null
    Write-Host "Created config directory" -ForegroundColor Yellow
}

# Navigate to sui directory
Set-Location $PSScriptRoot

# Build the contract
Write-Host "`nBuilding contract..." -ForegroundColor Cyan
sui move build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Publish the contract
Write-Host "`nPublishing contract..." -ForegroundColor Cyan
sui client publish --gas-budget 10000000

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Contract published successfully!" -ForegroundColor Green
    Write-Host "`nCopy the 'Published object ID' from above and add it to your .env file as:" -ForegroundColor Yellow
    Write-Host "VITE_SUI_PACKAGE_ID=0x..." -ForegroundColor Yellow
} else {
    Write-Host "`n✗ Publishing failed!" -ForegroundColor Red
    exit 1
}

