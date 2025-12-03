Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Script to build frontend, start vite preview, run Cypress pointing to backend API and zip artifacts.
# Run from repository root via: `powershell -File ./frontend/scripts/run-e2e.ps1` or via npm script `npm run e2e:orchestrate` from repo root.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$frontendRoot = Resolve-Path (Join-Path $scriptDir '..')

Write-Output "Frontend root: $frontendRoot"

Push-Location $frontendRoot
try {
    Write-Output "Installing dependencies (skipped if already installed)..."
    # npm ci can be uncommented if you want a clean install
    # npm ci

    Write-Output "Building frontend..."
    npm run build

    Write-Output "Starting vite preview on port 3000..."
    $previewArgs = @('run','preview','--','--port','3000')
    $proc = Start-Process -FilePath npm -ArgumentList $previewArgs -PassThru

    # Wait for preview to respond
    $maxAttempts = 60
    $attempt = 0
    $uri = 'http://localhost:3000'
    while ($attempt -lt $maxAttempts) {
        try {
            $resp = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
                Write-Output "Preview is responding at $uri"
                break
            }
        } catch {
            # ignore
        }
        Start-Sleep -Seconds 1
        $attempt++
    }
    if ($attempt -ge $maxAttempts) {
        throw "Timed out waiting for preview at $uri"
    }

    Write-Output "Running Cypress (pointing API_BASE to http://localhost:5000/api)..."
    npx cypress run --env API_BASE=http://localhost:5000/api

    Write-Output "Compressing Cypress artifacts..."
    $screens = Join-Path $frontendRoot 'cypress\screenshots'
    $videos = Join-Path $frontendRoot 'cypress\videos'
    $zipDest = Join-Path $frontendRoot 'cypress-artifacts.zip'
    if (Test-Path $zipDest) { Remove-Item $zipDest -Force }
    $paths = @()
    if (Test-Path $screens) { $paths += $screens }
    if (Test-Path $videos) { $paths += $videos }
    if ($paths.Count -gt 0) {
        Compress-Archive -Path $paths -DestinationPath $zipDest -Force
        Write-Output "Created: $zipDest"
    } else {
        Write-Output "No Cypress artifacts to compress."
    }
}
finally {
    Pop-Location
    if ($proc -and -not $proc.HasExited) {
        Write-Output "Stopping preview (PID $($proc.Id))"
        try { Stop-Process -Id $proc.Id -Force } catch { }
    }
}

Write-Output "Run complete."
