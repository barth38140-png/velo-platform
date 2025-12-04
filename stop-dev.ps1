# Script pour arrêter tous les serveurs de développement lancés par start-dev.ps1
# Usage: .\stop-dev.ps1

param(
    [string]$Pattern = "npm run dev"
)

Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🛑 Arrêt des serveurs Velo Platform" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Trouver tous les processus PowerShell lancés pour npm run dev
$processes = Get-Process powershell -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*npm run dev*"
}

if ($processes.Count -eq 0) {
    Write-Host "ℹ️  Aucun serveur de développement en cours d'exécution" -ForegroundColor Blue
    exit 0
}

Write-Host "Processus trouvés à arrêter :" -ForegroundColor Yellow
$processes | ForEach-Object {
    Write-Host "  - PID: $($_.Id), Nom: $($_.ProcessName)" -ForegroundColor Gray
}
Write-Host ""

# Arrêter les processus
foreach ($p in $processes) {
    try {
        Stop-Process -Id $p.Id -Force -ErrorAction Stop
        Write-Host "✅ Processus PID $($p.Id) arrêté" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Erreur lors de l'arrêt du PID $($p.Id): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Tous les serveurs ont été arrêtés" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
