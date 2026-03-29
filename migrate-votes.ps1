# Migrate votes from index-based to hash-based keys
# Run from project root: .\migrate-votes.ps1

# Load your database URL from .env
$envFile = Get-Content .env
$dbUrl = ($envFile | Where-Object { $_ -match "^VITE_FIREBASE_DATABASE_URL=" }) -replace "VITE_FIREBASE_DATABASE_URL=", "" -replace '"', '' -replace "'", ""

if (-not $dbUrl) {
    Write-Error "Could not find VITE_FIREBASE_DATABASE_URL in .env"
    exit 1
}

Write-Host "Using database: $dbUrl" -ForegroundColor Cyan

# Read migration file
$migration = Get-Content "firebase-migration.json" -Raw | ConvertFrom-Json

# Import votes (hash-based)
$votesJson = $migration.votes | ConvertTo-Json -Depth 3 -Compress
Write-Host "`nImporting hash-based votes..." -ForegroundColor Yellow
$result = Invoke-RestMethod -Method Put -Uri "$dbUrl/votes.json" -Body $votesJson -ContentType "application/json"
Write-Host "Votes imported successfully!" -ForegroundColor Green
Write-Host ($result | ConvertTo-Json -Depth 3)

Write-Host "`nDone! Old index-based votes have been replaced with hash-based votes." -ForegroundColor Green
Write-Host "You can verify in the Firebase Console under Realtime Database." -ForegroundColor Gray
