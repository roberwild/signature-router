# ================================================================================
# Script de carga de datos de prueba
# ================================================================================
#
# Propósito: Cargar datos de prueba en la base de datos PostgreSQL
#            para testing del frontend y validación de funcionalidad
#
# Uso:
#   .\scripts\load-test-data.ps1              # Modo interactivo (pide confirmación)
#   .\scripts\load-test-data.ps1 -Force       # Modo automático (sin confirmación)
#
# ================================================================================

# Parámetros
param(
    [switch]$Force = $false  # Si se especifica, no pide confirmación
)

Write-Host ""
Write-Host "=================================================================="  -ForegroundColor Cyan
Write-Host "  CARGA DE DATOS DE PRUEBA - SIGNATURE ROUTER" -ForegroundColor Cyan
Write-Host "=================================================================="  -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker está corriendo
Write-Host "[*] Verificando Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1 | Select-String "Server Version"
if (-not $dockerRunning) {
    Write-Host "[ERROR] Docker Desktop no está corriendo." -ForegroundColor Red
    Write-Host "Por favor, inicia Docker Desktop y vuelve a ejecutar este script." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker Desktop está corriendo." -ForegroundColor Green
Write-Host ""

# Verificar que el contenedor de PostgreSQL existe
Write-Host "[*] Verificando contenedor PostgreSQL..." -ForegroundColor Yellow
$containerRunning = docker ps --filter "name=signature-router-postgres" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "[ERROR] Contenedor 'signature-router-postgres' no está corriendo." -ForegroundColor Red
    Write-Host "Por favor, inicia los contenedores con docker-compose up -d" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Contenedor PostgreSQL está corriendo." -ForegroundColor Green
Write-Host ""

# Confirmar antes de borrar datos (solo si no es modo Force)
if (-not $Force) {
    Write-Host "=================================================================="  -ForegroundColor Yellow
    Write-Host "  ADVERTENCIA: Este script ELIMINARÁ todos los datos existentes" -ForegroundColor Yellow
    Write-Host "=================================================================="  -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "¿Continuar? (S/N)"
    if ($confirm -ne "S" -and $confirm -ne "s") {
        Write-Host "[*] Operación cancelada por el usuario." -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
} else {
    Write-Host "[*] Modo automático (-Force): cargando datos sin confirmación..." -ForegroundColor Cyan
    Write-Host ""
}

# Ejecutar el script SQL
Write-Host "[*] Cargando datos de prueba..." -ForegroundColor Yellow
Write-Host ""

$scriptPath = "scripts/seed-test-data.sql"
if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERROR] No se encontró el archivo: $scriptPath" -ForegroundColor Red
    exit 1
}

try {
    # Leer el contenido del script
    $sqlContent = Get-Content $scriptPath -Raw
    
    # Ejecutar el script en el contenedor
    $sqlContent | docker exec -i signature-router-postgres psql -U siguser -d signature_router
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=================================================================="  -ForegroundColor Green
        Write-Host "  DATOS DE PRUEBA CARGADOS EXITOSAMENTE" -ForegroundColor Green
        Write-Host "=================================================================="  -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos pasos:" -ForegroundColor Cyan
        Write-Host "  1. El backend ya tiene datos para probar" -ForegroundColor White
        Write-Host "  2. Inicia el frontend: cd app-signature-router-admin && npm run dev" -ForegroundColor White
        Write-Host "  3. Accede a: http://localhost:3000/admin/signatures" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "[ERROR] Hubo un problema al cargar los datos." -ForegroundColor Red
        Write-Host "Verifica los logs arriba para más detalles." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "[ERROR] Error al ejecutar el script: $_" -ForegroundColor Red
    exit 1
}

