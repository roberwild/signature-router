# Script simple para verificar el estado de Docker
# Author: BMAD Dev Agent
# Date: 2025-11-27

Write-Host "Verificando Docker..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Docker esta instalado?
Write-Host "[1/4] Verificando instalacion de Docker..." -NoNewline
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host " [OK]" -ForegroundColor Green
    docker --version
} else {
    Write-Host " [ERROR]" -ForegroundColor Red
    Write-Host "Docker no esta instalado. Descargalo de: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Docker esta corriendo?
Write-Host "[2/4] Verificando si Docker esta corriendo..." -NoNewline
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [ERROR]" -ForegroundColor Red
        Write-Host ""
        Write-Host "Docker Desktop no esta corriendo." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Para iniciarlo, ejecuta:" -ForegroundColor White
        Write-Host '  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"' -ForegroundColor Cyan
        Write-Host ""
        Write-Host "O ejecuta el script automatico:" -ForegroundColor White
        Write-Host "  .\start-system.ps1" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host " [ERROR]" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Hay contenedores corriendo?
Write-Host "[3/4] Verificando contenedores..." -NoNewline
$containers = docker ps --format "{{.Names}}" 2>$null
$containerCount = ($containers | Measure-Object).Count

if ($containerCount -gt 0) {
    Write-Host " [OK] ($containerCount contenedores)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Contenedores activos:" -ForegroundColor White
    docker ps --format "table {{.Names}}\t{{.Status}}"
} else {
    Write-Host " [WARNING] (0 contenedores)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "No hay contenedores corriendo." -ForegroundColor Yellow
    Write-Host "Para iniciar los servicios, ejecuta:" -ForegroundColor White
    Write-Host "  docker-compose up -d" -ForegroundColor Cyan
}

Write-Host ""

# Test 4: Los servicios de Signature Router estan corriendo?
Write-Host "[4/4] Verificando servicios de Signature Router..." -NoNewline
$signatureContainers = docker ps --filter "name=signature-router" --format "{{.Names}}" 2>$null
$signatureCount = ($signatureContainers | Measure-Object).Count

if ($signatureCount -gt 0) {
    Write-Host " [OK] ($signatureCount servicios)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Servicios activos:" -ForegroundColor White
    $signatureContainers | ForEach-Object {
        $health = docker inspect --format='{{.State.Health.Status}}' $_ 2>$null
        $running = docker inspect --format='{{.State.Running}}' $_ 2>$null
        
        if ($health -eq "healthy") {
            Write-Host "  - $_ [HEALTHY]" -ForegroundColor Green
        } elseif ($health -eq "starting") {
            Write-Host "  - $_ [STARTING...]" -ForegroundColor Yellow
        } elseif ($running -eq "true") {
            Write-Host "  - $_ [RUNNING]" -ForegroundColor Cyan
        } else {
            Write-Host "  - $_ [UNHEALTHY]" -ForegroundColor Red
        }
    }
} else {
    Write-Host " [WARNING] (0 servicios)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Los servicios de Signature Router no estan corriendo." -ForegroundColor Yellow
    Write-Host "Para iniciarlos, ejecuta:" -ForegroundColor White
    Write-Host "  docker-compose up -d" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Resumen
if ($containerCount -gt 0 -and $signatureCount -gt 0) {
    Write-Host "[OK] Estado: LISTO PARA USAR" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximo paso:" -ForegroundColor White
    Write-Host "  mvn spring-boot:run -Dspring-boot.run.profiles=local" -ForegroundColor Cyan
} elseif ($LASTEXITCODE -eq 0) {
    Write-Host "[WARNING] Estado: DOCKER LISTO, SERVICIOS NO INICIADOS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Proximo paso:" -ForegroundColor White
    Write-Host "  docker-compose up -d" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Estado: DOCKER NO ESTA CORRIENDO" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solucion rapida:" -ForegroundColor White
    Write-Host "  .\start-system.ps1" -ForegroundColor Cyan
}

Write-Host ""
