# BRISEE BAKE - Configuración del entorno de desarrollo

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BRISEE BAKE - Configuración entorno" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Versiones requeridas
$requiredNode = "24.14.1"
$requiredNpm = "11.11.0"

# ========================================
# Verificar Node.js
# ========================================

Write-Host "Verificando Node.js..." -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js no está instalado." -ForegroundColor Red
    Write-Host "Instala Node.js $requiredNode y vuelve a ejecutar este script."
    exit 1
}

$nodeVersion = (node --version).TrimStart("v")

if ($nodeVersion -ne $requiredNode) {
    Write-Host "ERROR: Se requiere Node.js $requiredNode." -ForegroundColor Red
    Write-Host "Versión encontrada: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js $nodeVersion OK" -ForegroundColor Green

# ========================================
# Verificar npm
# ========================================

Write-Host ""
Write-Host "Verificando npm..." -ForegroundColor Yellow

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm no está instalado." -ForegroundColor Red
    exit 1
}

$npmVersion = (npm --version).Trim()

if ($npmVersion -ne $requiredNpm) {
    Write-Host "ERROR: Se requiere npm $requiredNpm." -ForegroundColor Red
    Write-Host "Versión encontrada: $npmVersion" -ForegroundColor Red
    exit 1
}

Write-Host "npm $npmVersion OK" -ForegroundColor Green

# ========================================
# Verificar estructura del proyecto
# ========================================

Write-Host ""
Write-Host "Verificando estructura del proyecto..." -ForegroundColor Yellow

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: No se encontró package.json en la raíz." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend/package.json")) {
    Write-Host "ERROR: No se encontró frontend/package.json." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend/package.json")) {
    Write-Host "ERROR: No se encontró backend/package.json." -ForegroundColor Red
    exit 1
}

Write-Host "Estructura del proyecto OK" -ForegroundColor Green

# ========================================
# Instalar dependencias
# ========================================

Write-Host ""
Write-Host "Instalando dependencias del proyecto..." -ForegroundColor Yellow

npm ci

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudieron instalar las dependencias." -ForegroundColor Red
    exit 1
}

Write-Host "Dependencias instaladas correctamente." -ForegroundColor Green

# ========================================
# Verificación final
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Entorno configurado correctamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Node.js : $nodeVersion"
Write-Host "npm     : $npmVersion"
Write-Host ""
Write-Host "Frontend y backend listos."
Write-Host ""