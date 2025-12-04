# Script de démarrage du backend et frontend en parallèle avec logs temps réel
# Usage: .\start-dev.ps1

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All
)

# Par défaut, lancer les deux
if (-not $Backend -and -not $Frontend -and -not $All) {
    $All = $true
}

$rootPath = Split-Path -Parent $MyInvocation.MyCommandPath
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Velo Platform - Démarrage du serveur de développement" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⏰ $timestamp" -ForegroundColor Gray
Write-Host ""

$processes = @()

# Fonction pour démarrer un processus avec logs
function Start-DevServer {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "📋 Lancement de $Name..." -ForegroundColor Yellow
    
    try {
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = "powershell.exe"
        $pinfo.Arguments = "-NoExit", "-Command", "cd `"$Path`"; $Command"
        $pinfo.UseShellExecute = $false
        $pinfo.RedirectStandardOutput = $false
        $pinfo.RedirectStandardError = $false
        
        $p = [System.Diagnostics.Process]::Start($pinfo)
        
        Write-Host "✅ $Name lancé (PID: $($p.Id))" -ForegroundColor Green
        
        return @{
            Name = $Name
            Process = $p
            Path = $Path
        }
    }
    catch {
        Write-Host "❌ Erreur au lancement de $Name : $_" -ForegroundColor Red
        return $null
    }
}

# Démarrer le backend
if ($All -or $Backend) {
    $bp = Start-DevServer -Name "Backend" -Path "$rootPath\backend" -Command "npm run dev"
    if ($bp) { $processes += $bp }
}

# Petit délai avant frontend
Start-Sleep -Seconds 2

# Démarrer le frontend
if ($All -or $Frontend) {
    $fp = Start-DevServer -Name "Frontend" -Path "$rootPath\frontend" -Command "npm run dev"
    if ($fp) { $processes += $fp }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($processes.Count -eq 0) {
    Write-Host "⚠️  Aucun serveur n'a pu être lancé" -ForegroundColor Red
    exit 1
}

Write-Host "✨ Serveurs en cours d'exécution :" -ForegroundColor Green
foreach ($p in $processes) {
    Write-Host "  - $($p.Name) (PID: $($p.Process.Id))" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📡 URLs :" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost:5000/health" -ForegroundColor Cyan

Write-Host ""
Write-Host "🛑 Pour arrêter les serveurs :" -ForegroundColor Yellow
Write-Host "  - Fermer les fenêtres des serveurs" -ForegroundColor Gray
Write-Host "  - Ou exécuter: Stop-DevServers (voir plus bas)" -ForegroundColor Gray

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Fonction pour arrêter tous les serveurs
function Stop-DevServers {
    Write-Host "🛑 Arrêt des serveurs..." -ForegroundColor Yellow
    foreach ($p in $processes) {
        try {
            $p.Process | Stop-Process -Force
            Write-Host "✅ $($p.Name) arrêté" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Erreur lors de l'arrêt de $($p.Name)" -ForegroundColor Red
        }
    }
}

# Garder le script actif et surveiller les processus
Write-Host "💡 Astuce: Utilisez 'Stop-DevServers' pour arrêter tous les serveurs" -ForegroundColor Blue
Write-Host ""

# Attendre que tous les processus se terminent
while ($true) {
    $allExited = $true
    foreach ($p in $processes) {
        if (-not $p.Process.HasExited) {
            $allExited = $false
        }
    }
    
    if ($allExited) {
        Write-Host ""
        Write-Host "⚠️  Tous les serveurs se sont arrêtés" -ForegroundColor Yellow
        break
    }
    
    Start-Sleep -Seconds 5
}

Write-Host "👋 Script de développement terminé" -ForegroundColor Cyan
