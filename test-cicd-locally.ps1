#!/usr/bin/env pwsh
# Script de test local du workflow CI/CD
# Usage: .\test-cicd-locally.ps1

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🧪 Test Local CI/CD Velo Platform" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Vérifier les prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow
$hasNode = Get-Command node -ErrorAction SilentlyContinue
$hasDocker = Get-Command docker -ErrorAction SilentlyContinue
$hasPsql = Get-Command psql -ErrorAction SilentlyContinue

if (-not $hasNode) {
    Write-Host "❌ Node.js non trouvé" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green

if (-not $hasDocker) {
    Write-Host "⚠️ Docker non trouvé (optionnel pour tests locaux)" -ForegroundColor Yellow
}
else {
    Write-Host "✅ Docker: $(docker --version)" -ForegroundColor Green
}

# Phase 1: Lint
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Phase 1: ESLint Backend + Frontend" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "Backend ESLint..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "node_modules") {
    $lintBackendOutput = & npm run lint 2>&1
    Write-Host $lintBackendOutput -ForegroundColor Gray
    $lintBackend = $LASTEXITCODE
} else {
    Write-Host "⚠️ node_modules manquant, exécutez: npm ci" -ForegroundColor Yellow
    $lintBackend = 1
}

Write-Host ""
Write-Host "Frontend ESLint..." -ForegroundColor Yellow
Set-Location ..\frontend
if (Test-Path "node_modules") {
    $lintFrontendOutput = & npm run lint 2>&1
    Write-Host $lintFrontendOutput -ForegroundColor Gray
    $lintFrontend = $LASTEXITCODE
} else {
    Write-Host "⚠️ node_modules manquant, exécutez: npm ci" -ForegroundColor Yellow
    $lintFrontend = 1
}

Set-Location ..

if ($lintBackend -eq 0 -and $lintFrontend -eq 0) {
    Write-Host "✅ Phase 1: RÉUSSI" -ForegroundColor Green
} else {
    Write-Host "❌ Phase 1: ÉCHOUÉ" -ForegroundColor Red
}

# Phase 2: Tests Backend
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Phase 2: Tests Backend" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

Set-Location backend
if (Test-Path "node_modules") {
    Write-Host "Lancement des tests Jest..." -ForegroundColor Yellow
    $testsBackendOutput = & npm test 2>&1
    Write-Host $testsBackendOutput -ForegroundColor Gray
    $testsBackend = $LASTEXITCODE
} else {
    Write-Host "⚠️ Dépendances manquantes" -ForegroundColor Yellow
    $testsBackend = 1
}

Set-Location ..

if ($testsBackend -eq 0) {
    Write-Host "✅ Phase 2: RÉUSSI" -ForegroundColor Green
} else {
    Write-Host "❌ Phase 2: ÉCHOUÉ" -ForegroundColor Red
}

# Phase 3: Tests Frontend
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Phase 3: Tests Frontend" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

Set-Location frontend
if (Test-Path "node_modules") {
    Write-Host "Lancement des tests Vitest..." -ForegroundColor Yellow
    $testsFrontendOutput = & npm run test:ci 2>&1
    Write-Host $testsFrontendOutput -ForegroundColor Gray
    $testsFrontend = $LASTEXITCODE
} else {
    Write-Host "⚠️ Dépendances manquantes" -ForegroundColor Yellow
    $testsFrontend = 1
}

Set-Location ..

if ($testsFrontend -eq 0) {
    Write-Host "✅ Phase 3: RÉUSSI" -ForegroundColor Green
} else {
    Write-Host "❌ Phase 3: ÉCHOUÉ" -ForegroundColor Red
}

# Phase 4: Docker Build (optionnel)
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Phase 4: Build Docker (optionnel)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

$dockerBuild = 0
if ($hasDocker) {
    Write-Host "Build Backend Image..." -ForegroundColor Yellow
    docker build -t velo-backend:test -f backend/Dockerfile backend/
    $dockerBuild += $LASTEXITCODE
    
    Write-Host "Build Frontend Image..." -ForegroundColor Yellow
    docker build -t velo-frontend:test -f frontend/Dockerfile frontend/
    $dockerBuild += $LASTEXITCODE
    
    if ($dockerBuild -eq 0) {
        Write-Host "✅ Phase 4: RÉUSSI" -ForegroundColor Green
    } else {
        Write-Host "❌ Phase 4: ÉCHOUÉ" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️ Phase 4: IGNORÉ (Docker non disponible)" -ForegroundColor Yellow
}

# Résumé Final
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   📊 RÉSUMÉ CI/CD LOCAL" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

$total = 0
$success = 0

Write-Host "Phase 1 (Lint):" -NoNewline
if ($lintBackend -eq 0 -and $lintFrontend -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
    $success++
} else {
    Write-Host " ❌" -ForegroundColor Red
}
$total++

Write-Host "Phase 2 (Tests Backend):" -NoNewline
if ($testsBackend -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
    $success++
} else {
    Write-Host " ❌" -ForegroundColor Red
}
$total++

Write-Host "Phase 3 (Tests Frontend):" -NoNewline
if ($testsFrontend -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
    $success++
} else {
    Write-Host " ❌" -ForegroundColor Red
}
$total++

if ($hasDocker) {
    Write-Host "Phase 4 (Docker Build):" -NoNewline
    if ($dockerBuild -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
        $success++
    } else {
        Write-Host " ❌" -ForegroundColor Red
    }
    $total++
}

Write-Host ""
Write-Host "Résultat: $success/$total phases réussies" -ForegroundColor $(if ($success -eq $total) { "Green" } else { "Yellow" })

if ($success -eq $total) {
    Write-Host "🎉 Tous les tests passent! Prêt pour git push." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ Certains tests ont échoué. Corrigez avant de commit." -ForegroundColor Yellow
    exit 1
}
