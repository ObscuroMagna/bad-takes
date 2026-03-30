# Sync Git repo documentation to Obsidian vault
# Place this script in the root of your Git repo and run: .\sync-vault.ps1

param(
    [string]$VaultPath = "C:\Users\ethan\ethanOS\ethanOS\Study\Coding"
)

# Get the repo name from the current directory
$repoName = (Get-Item -Path "." | Select-Object -ExpandProperty Name)

# Define paths
$docsSource = Join-Path -Path "." -ChildPath "docs"
$vaultDestination = Join-Path -Path $VaultPath -ChildPath $repoName

# Check if docs folder exists
if (-not (Test-Path $docsSource)) {
    Write-Host "Error: No 'docs' folder found in current repository" -ForegroundColor Red
    Write-Host "Expected path: $(Get-Item -Path '.' | Select-Object -ExpandProperty FullName)\docs" -ForegroundColor Yellow
    exit 1
}

# Create vault destination if it doesn't exist
if (-not (Test-Path $vaultDestination)) {
    New-Item -ItemType Directory -Path $vaultDestination -Force | Out-Null
    Write-Host "Created new folder: $vaultDestination" -ForegroundColor Green
}

# Copy files (overwrite existing)
try {
    Copy-Item -Path "$docsSource\*" -Destination $vaultDestination -Recurse -Force
    Write-Host "Successfully synced '$repoName' documentation to vault" -ForegroundColor Green
    Write-Host "Source: $docsSource" -ForegroundColor Cyan
    Write-Host "Destination: $vaultDestination" -ForegroundColor Cyan
}
catch {
    Write-Host "Error during sync: $_" -ForegroundColor Red
    exit 1
}

# List what was copied
$itemCount = (Get-ChildItem -Path $vaultDestination -Recurse | Measure-Object).Count
Write-Host "Total items: $itemCount" -ForegroundColor Cyan