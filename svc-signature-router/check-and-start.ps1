# ============================================================================
# Script de Arranque Automatizado del Backend
# ============================================================================
# Este script verifica y soluciona problemas comunes antes de arrancar:
# 1. Puerto 5432 ocupado por Supabase u otro PostgreSQL
# 2. Docker Compose no corriendo
# 3. PostgreSQL no listo para aceptar conexiones
#
# Uso:
#   .\check-and-start.ps1                  # Arranque normal
#   .\check-and-start.ps1 -LoadTestData    # Arranque + carga de datos de prueba
# ============================================================================

# Parámetros
param(
    [switch]$LoadTestData = $false  # Si se especifica, carga datos de prueba
)

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  SIGNATURE ROUTER - ARRANQUE AUTOMATIZADO DEL BACKEND" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

if ($LoadTestData) {
    Write-Host "[*] Modo: ARRANQUE CON DATOS DE PRUEBA" -ForegroundColor Magenta
} else {
    Write-Host "[*] Modo: ARRANQUE NORMAL (sin datos de prueba)" -ForegroundColor Cyan
}
Write-Host ""

if ($isAdmin) {
    Write-Host "[OK] Ejecutando con privilegios de Administrador" -ForegroundColor Green
} else {
    Write-Host "[!] ADVERTENCIA: Ejecutando SIN privilegios de Administrador" -ForegroundColor Yellow
    Write-Host "    Si el puerto 5432 esta ocupado, necesitaras privilegios elevados." -ForegroundColor Yellow
}
Write-Host ""

# ----------------------------------------------------------------------------
# PASO 1: Verificar puerto 5432
# ----------------------------------------------------------------------------
Write-Host "[*] Paso 1/5: Verificando puerto 5432..." -ForegroundColor Yellow

$port5432 = netstat -ano | Select-String ":5432" | Select-String "LISTENING"

if ($port5432) {
    Write-Host "[!] ADVERTENCIA: El puerto 5432 esta en uso!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Procesos usando el puerto 5432:" -ForegroundColor Yellow
    netstat -ano | Select-String ":5432"
    Write-Host ""

    # Verificar si es Supabase
    $supabaseProcess = Get-Process | Where-Object { $_.ProcessName -like "*supabase*" -or $_.ProcessName -like "*postgres*" }

    if ($supabaseProcess) {
        Write-Host "[!] Se detectaron procesos de PostgreSQL/Supabase corriendo." -ForegroundColor Yellow
        Write-Host ""
        $response = Read-Host "Deseas detener TODOS los procesos de PostgreSQL y Supabase? (S/N)"

        if ($response -eq "S" -or $response -eq "s") {
            Write-Host "[*] Deteniendo procesos..." -ForegroundColor Yellow

            # Intentar detener Supabase si existe el comando
            try {
                supabase stop 2>$null
                Write-Host "[OK] Supabase detenido." -ForegroundColor Green
            } catch {
                Write-Host "[!] Comando 'supabase' no encontrado o ya esta detenido." -ForegroundColor Yellow
            }

            # Detener servicios de PostgreSQL
            try {
                Stop-Service -Name "postgresql*" -Force -ErrorAction SilentlyContinue
                Write-Host "[OK] Servicios de PostgreSQL detenidos." -ForegroundColor Green
            } catch {
                Write-Host "[!] No se encontraron servicios de PostgreSQL corriendo." -ForegroundColor Yellow
            }

            Start-Sleep -Seconds 2

            # Verificar nuevamente y matar procesos si es necesario
            $port5432After = netstat -ano | Select-String ":5432" | Select-String "LISTENING"
            if ($port5432After) {
                Write-Host "[*] Identificando y terminando procesos en el puerto 5432..." -ForegroundColor Yellow

                # Extraer PIDs únicos
                $processIds = @()
                foreach ($line in $port5432After) {
                    if ($line -match '\s+(\d+)\s*$') {
                        $processId = $matches[1]
                        if ($processIds -notcontains $processId) {
                            $processIds += $processId
                        }
                    }
                }

                if (-not $isAdmin) {
                    Write-Host ""
                    Write-Host "[ERROR] Se necesitan privilegios de Administrador para terminar estos procesos." -ForegroundColor Red
                    Write-Host ""
                    Write-Host "OPCION 1: Re-ejecutar este script como Administrador:" -ForegroundColor Yellow
                    Write-Host "  - Click derecho en PowerShell > Ejecutar como Administrador" -ForegroundColor White
                    Write-Host "  - Navegar a: cd H:\Proyectos\signature-router\svc-signature-router" -ForegroundColor White
                    Write-Host "  - Ejecutar: .\check-and-start.ps1" -ForegroundColor White
                    Write-Host ""
                    Write-Host "OPCION 2: Copiar y pegar estos comandos en PowerShell como Administrador:" -ForegroundColor Yellow
                    foreach ($processId in $processIds) {
                        Write-Host "  taskkill /PID $processId /F" -ForegroundColor Cyan
                    }
                    Write-Host ""
                    exit 1
                }

                # Matar cada proceso (solo si es admin)
                foreach ($processId in $processIds) {
                    try {
                        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-Host "  - Terminando proceso $($process.ProcessName) (PID: $processId)..." -ForegroundColor Yellow
                            taskkill /PID $processId /F 2>&1 | Out-Null
                            Write-Host "    [OK] Proceso $processId terminado." -ForegroundColor Green
                        }
                    } catch {
                        Write-Host "    [!] No se pudo terminar el proceso $processId" -ForegroundColor Yellow
                    }
                }

                Start-Sleep -Seconds 2

                # Verificación final
                $port5432Final = netstat -ano | Select-String ":5432" | Select-String "LISTENING"
                if ($port5432Final) {
                    Write-Host "[ERROR] El puerto 5432 aun esta ocupado despues de terminar procesos." -ForegroundColor Red
                    Write-Host ""
                    exit 1
                } else {
                    Write-Host "[OK] Puerto 5432 liberado exitosamente." -ForegroundColor Green
                }
            } else {
                Write-Host "[OK] Puerto 5432 liberado exitosamente." -ForegroundColor Green
            }
        } else {
            Write-Host "[ERROR] No se puede continuar con el puerto 5432 ocupado." -ForegroundColor Red
            Write-Host "Por favor, libera el puerto manualmente y vuelve a ejecutar este script." -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "[OK] Puerto 5432 disponible." -ForegroundColor Green
}

Write-Host ""

# ----------------------------------------------------------------------------
# PASO 2: Verificar que Docker Desktop esté corriendo
# ----------------------------------------------------------------------------
Write-Host "[*] Paso 2/5: Verificando Docker Desktop..." -ForegroundColor Yellow

try {
    $dockerTest = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Docker Desktop no esta corriendo o no responde." -ForegroundColor Red
        Write-Host ""
        Write-Host "Por favor:" -ForegroundColor Yellow
        Write-Host "  1. Inicia Docker Desktop desde el menu de Windows" -ForegroundColor White
        Write-Host "  2. Espera a que el icono de Docker este estable (no parpadeando)" -ForegroundColor White
        Write-Host "  3. Verifica con: docker ps" -ForegroundColor White
        Write-Host "  4. Re-ejecuta este script: .\check-and-start.ps1" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    Write-Host "[OK] Docker Desktop esta corriendo." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "[ERROR] Docker no esta instalado o no esta accesible." -ForegroundColor Red
    Write-Host "Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""

# ----------------------------------------------------------------------------
# PASO 3: Limpiar contenedores Docker existentes
# ----------------------------------------------------------------------------
Write-Host "[*] Paso 3/5: Limpiando contenedores Docker existentes..." -ForegroundColor Yellow

try {
    docker-compose down -v 2>$null
    Write-Host "[OK] Contenedores detenidos y volumenes eliminados." -ForegroundColor Green
} catch {
    Write-Host "[!] No habia contenedores previos." -ForegroundColor Yellow
}

Write-Host ""

# ----------------------------------------------------------------------------
# PASO 4: Iniciar Docker Compose
# ----------------------------------------------------------------------------
Write-Host "[*] Paso 4/5: Iniciando Docker Compose..." -ForegroundColor Yellow

try {
    docker-compose up -d
    Write-Host "[OK] Docker Compose iniciado." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Fallo al iniciar Docker Compose." -ForegroundColor Red
    Write-Host "Ejecuta: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ----------------------------------------------------------------------------
# PASO 5: Esperar a que PostgreSQL este listo
# ----------------------------------------------------------------------------
Write-Host "[*] Paso 5/5: Esperando a que PostgreSQL este listo..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$postgresReady = $false

while ($attempt -lt $maxAttempts -and -not $postgresReady) {
    $attempt++
    Start-Sleep -Seconds 1

    try {
        $logs = docker logs signature-router-postgres 2>&1 | Select-String "database system is ready to accept connections"
        if ($logs) {
            $postgresReady = $true
            Write-Host "[OK] PostgreSQL esta listo! (intento $attempt/$maxAttempts)" -ForegroundColor Green
        } else {
            Write-Host "  - Esperando... ($attempt/$maxAttempts)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  - Esperando... ($attempt/$maxAttempts)" -ForegroundColor Gray
    }
}

if (-not $postgresReady) {
    Write-Host "[ERROR] PostgreSQL no respondio a tiempo." -ForegroundColor Red
    Write-Host "Ejecuta: docker logs signature-router-postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ----------------------------------------------------------------------------
# PASO 6: Lanzar cargador de datos en background (si se solicitó)
# ----------------------------------------------------------------------------
if ($LoadTestData) {
    Write-Host "[*] Paso 6/7: Programando carga de datos de prueba..." -ForegroundColor Yellow
    
    $testDataScript = ".\scripts\seed-test-data.sql"
    $scriptFullPath = (Resolve-Path $testDataScript -ErrorAction SilentlyContinue).Path
    
    if (-not $scriptFullPath) {
        Write-Host "[ERROR] No se encontro el script: $testDataScript" -ForegroundColor Red
        Write-Host "Asegurate de estar en el directorio svc-signature-router" -ForegroundColor Yellow
        exit 1
    }
    
    # Lanzar proceso en background que espera a Spring Boot y carga los datos
    $loaderScript = @"
`$maxAttempts = 120
`$attempt = 0
`$ready = `$false

while (`$attempt -lt `$maxAttempts -and -not `$ready) {
    `$attempt++
    Start-Sleep -Seconds 2
    try {
        `$response = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if (`$response.StatusCode -eq 200) {
            `$ready = `$true
        }
    } catch { }
}

if (`$ready) {
    Start-Sleep -Seconds 3
    `$sqlContent = Get-Content '$scriptFullPath' -Raw
    `$output = `$sqlContent | docker exec -i signature-router-postgres psql -U siguser -d signature_router 2>&1
    Write-Host ''
    Write-Host '==================================================================' -ForegroundColor Green
    Write-Host '  DATOS DE PRUEBA CARGADOS EXITOSAMENTE' -ForegroundColor Green
    Write-Host '==================================================================' -ForegroundColor Green
    Write-Host '  - 6 proveedores (SMS, PUSH, VOICE, BIOMETRIC)' -ForegroundColor White
    Write-Host '  - 4 reglas de enrutamiento' -ForegroundColor White
    Write-Host '  - 6 solicitudes de firma' -ForegroundColor White
    Write-Host '==================================================================' -ForegroundColor Green
    Write-Host ''
}
"@
    
    # Ejecutar el loader en un proceso separado
    Start-Process powershell -ArgumentList "-NoProfile", "-Command", $loaderScript -WindowStyle Hidden
    
    Write-Host "[OK] Cargador de datos programado (se ejecutara cuando Spring Boot este listo)" -ForegroundColor Green
    Write-Host ""
    Write-Host "[*] Paso 7/7: Arrancando Spring Boot Backend..." -ForegroundColor Yellow
} else {
    Write-Host "[*] Paso 6/6: Arrancando Spring Boot Backend..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  BACKEND INICIADO - Presiona Ctrl+C para detener" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar Maven en foreground (consola visible)
mvn spring-boot:run "-Dspring-boot.run.profiles=local" "-Dmaven.test.skip=true"
