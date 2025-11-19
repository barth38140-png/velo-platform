# Script pour appliquer les migrations de base de données
# Utilisation: .\apply-migration.ps1

param(
  [string]$MigrationFile = "sql/patch_add_assigned_repairer_id.sql",
  [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

function Write-Color {
  param([string]$Message, [string]$Color = "White")
  Write-Host $Message -ForegroundColor $Color
}

# Vérifier si .env existe
if (-not (Test-Path $EnvFile)) {
  Write-Color "❌ Fichier $EnvFile non trouvé!" "Red"
  exit 1
}

# Charger les variables d'environnement
Write-Color "📖 Chargement du fichier $EnvFile ..." "Yellow"
$envContent = @{}
Get-Content $EnvFile | Where-Object { $_ -match '^[^#]' } | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') {
    $envContent[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$DB_HOST = $envContent['DB_HOST'] ?? 'localhost'
$DB_PORT = $envContent['DB_PORT'] ?? '5432'
$DB_USER = $envContent['DB_USER'] ?? 'postgres'
$DB_PASSWORD = $envContent['DB_PASSWORD']
$DB_NAME = $envContent['DB_NAME'] ?? 'velo_platform'

if (-not $DB_PASSWORD) {
  Write-Color "❌ DB_PASSWORD non configuré dans $EnvFile" "Red"
  exit 1
}

Write-Color ""
Write-Color "🔄 Exécution de la migration ..." "Yellow"
Write-Color "   Host: $DB_HOST" "Cyan"
Write-Color "   Port: $DB_PORT" "Cyan"
Write-Color "   Database: $DB_NAME" "Cyan"
Write-Color "   Migration: $MigrationFile" "Cyan"
Write-Color ""

# Vérifier que le fichier SQL existe
if (-not (Test-Path $MigrationFile)) {
  Write-Color "❌ Fichier $MigrationFile non trouvé!" "Red"
  exit 1
}

# Exécuter la migration
try {
  $env:PGPASSWORD = $DB_PASSWORD
  & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MigrationFile
  
  if ($LASTEXITCODE -eq 0) {
    Write-Color "✅ Migration appliquée avec succès!" "Green"
    Write-Color ""
    Write-Color "🚀 Prochaines étapes:" "Cyan"
    Write-Color "   1. Redémarrer le serveur: npm run dev" "White"
    Write-Color "   2. Retester Accept Offer dans l'UI" "White"
  } else {
    Write-Color "❌ Erreur lors de l'exécution de la migration" "Red"
    exit 1
  }
} catch {
  Write-Color "❌ Erreur: $_" "Red"
  exit 1
} finally {
  Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}
