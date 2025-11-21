<#
Script de démonstration (PowerShell)
Fonctions :
- Démarre les services en mode dev avec docker-compose
- Attend la disponibilité du backend (`/health`) et du frontend (Vite)
- Ouvre le navigateur sur `http://localhost:3000`

Usage :
  .\scripts\demo.ps1        # démarre et ouvre le navigateur
  .\scripts\demo.ps1 -NoOpen # démarre et n'ouvre pas le navigateur
#>

param(
  [switch]$NoOpen
)

Write-Host "Démarrage des services (dev) avec docker-compose..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

$start = Get-Date
$timeoutSeconds = 180

function Wait-Http {
  param($url, $description)
  Write-Host "Attente de disponibilité : $description -> $url"
  $end = $start.AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $end) {
    try {
      $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
      # Consider 200 or 404 acceptable for frontend (SPA may return 404 at root)
      if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 404) {
        Write-Host "OK : $description répond (status $($r.StatusCode))"
        return $true
      } else {
        Write-Host "Reçu status $($r.StatusCode) pour $description, attente..."
      }
    } catch {
      Write-Host -NoNewline "."
      Start-Sleep -Seconds 2
    }
  }
  Write-Host "`nTimeout après $timeoutSeconds s en attendant $description"
  return $false
}

# Backend health (port 3010)
$backendOk = Wait-Http -url http://localhost:3010/health -description "backend /health"

# Frontend (Vite) - peut renvoyer 200 ou 404 selon la route SPA, on teste juste la connexion
$frontendOk = Wait-Http -url http://localhost:3000/ -description "frontend Vite"

if (-not $backendOk) { Write-Host "Erreur : backend indisponible après timeout." }
if (-not $frontendOk) { Write-Host "Attention : frontend indisponible après timeout." }

if (-not $NoOpen) {
  Write-Host "Ouverture du navigateur sur http://localhost:3000"
  Start-Process "http://localhost:3000"
}

Write-Host "Logs (frontend) : pour suivre, exécutez : docker logs -f --tail 200 velo_platform_frontend_dev"
Write-Host "Pour arrêter et supprimer les volumes: docker-compose down -v"
