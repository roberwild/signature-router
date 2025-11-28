# Script para crear ZIP portable del proyecto Signature Router
# Ejecutar con: .\create-portable-zip.ps1

Write-Host "Creando ZIP portable de Signature Router..." -ForegroundColor Cyan

$projectName = "signature-router"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$zipName = "${projectName}-portable-${timestamp}.zip"

Write-Host "Limpiando archivos temporales..." -ForegroundColor Yellow

# Limpiar target si existe
if (Test-Path "target") {
    Remove-Item -Recurse -Force "target" -ErrorAction SilentlyContinue
    Write-Host "  Eliminado: target/" -ForegroundColor Green
}

# Limpiar logs si existe
if (Test-Path "logs") {
    Remove-Item -Recurse -Force "logs" -ErrorAction SilentlyContinue
    Write-Host "  Eliminado: logs/" -ForegroundColor Green
}

# Limpiar .git para ahorrar espacio (opcional)
$includeGit = Read-Host "Incluir historial Git (.git)? Ocupa mucho espacio. (s/N)"
if ($includeGit -ne "s" -and $includeGit -ne "S") {
    if (Test-Path ".git") {
        Remove-Item -Recurse -Force ".git" -ErrorAction SilentlyContinue
        Write-Host "  Eliminado: .git/ (puedes clonar desde GitHub despues)" -ForegroundColor Yellow
    }
}

Write-Host "`nCreando lista de archivos a incluir..." -ForegroundColor Cyan

# Crear carpeta temporal
$tempDir = New-Item -ItemType Directory -Path ".\temp-portable" -Force

# Copiar todo excepto lo que esta en .gitignore
Write-Host "Copiando archivos esenciales..." -ForegroundColor Cyan

$excludeDirs = @("target", "logs", "node_modules", ".idea", ".mvn", ".cursor", "agent-tools", "temp-portable")

Get-ChildItem -Path . -Exclude "temp-portable", $zipName | ForEach-Object {
    if ($_.Name -notin $excludeDirs) {
        Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Copiado: $($_.Name)" -ForegroundColor Green
    }
}

# Crear README en el ZIP
$readmeContent = @"
SIGNATURE ROUTER - PORTABLE PACKAGE
====================================

Fecha de creacion: $(Get-Date -Format "dd/MM/yyyy HH:mm")
Version: 0.2.0-SNAPSHOT
Progreso: 58% (50/80 stories completadas)

CONTENIDO DEL PACKAGE
======================

Este ZIP contiene el proyecto completo Signature Router listo para usar en cualquier maquina.

INCLUYE:
- Codigo fuente completo (src/)
- Configuracion Maven (pom.xml)
- Configuracion VS Code (.vscode/)
- Scripts de setup (setenv.ps1, setup-vscode.ps1)
- Docker Compose (docker-compose.yml)
- Documentacion completa (docs/)
- Informes ejecutivos
- Infrastructure as Code

NO INCLUYE (para ahorrar espacio):
- Dependencias Maven (target/)
- Logs (logs/)
- Git history (.git/) - Puedes clonar desde GitHub
- IDE metadata (.idea/, *.iml)
- Archivos compilados (*.class, *.jar)

INSTALACION RAPIDA
==================

1. Extraer el ZIP
   - Descomprimir en: C:\Proyectos\signature-router

2. Leer la guia de setup
   - Abrir: SETUP-PERSONAL-MACHINE.md

3. Ejecutar scripts de configuracion
   .\setup-vscode.ps1
   .\setenv.ps1

4. Compilar proyecto
   mvn clean install -DskipTests

5. Levantar infraestructura
   docker-compose up -d

6. Ejecutar aplicacion
   - Abrir VS Code
   - Presionar F5

DOCUMENTOS IMPORTANTES
======================

- SETUP-PERSONAL-MACHINE.md - Guia de instalacion completa
- vscode-profile-export.md - Configuracion detallada de VS Code
- README.md - Documentacion del proyecto
- docs/architecture/ - Arquitectura y ADRs
- INFORME-EJECUTIVO-2025-11-28.md - Estado del proyecto

ESTADISTICAS DEL PROYECTO
==========================

- Stories completadas: 50/80 (58%)
- Test coverage: >85%
- Lines of Code: ~9,500
- Tests: 185+
- Arquitectura: Hexagonal + DDD + Event-Driven
- Stack: Spring Boot 3.2, Java 21, PostgreSQL, Kafka

Repositorio GitHub: https://github.com/roberwild/signature-router
Autor: Roberto Gutierrez (@roberwild)
Fecha: 28 de Noviembre de 2025
"@

Set-Content -Path "$tempDir\README-PACKAGE.txt" -Value $readmeContent
Write-Host "`nREADME del package creado" -ForegroundColor Green

# Crear el ZIP
Write-Host "`nComprimiendo archivos..." -ForegroundColor Cyan
Write-Host "Esto puede tardar unos minutos..." -ForegroundColor Yellow

try {
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -Force
    
    # Obtener tamano del ZIP
    $zipSize = (Get-Item $zipName).Length / 1MB
    
    Write-Host "`nZIP creado exitosamente!" -ForegroundColor Green
    Write-Host "  Archivo: $zipName" -ForegroundColor Cyan
    Write-Host "  Tamano: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "  Ubicacion: $(Get-Location)\$zipName" -ForegroundColor Cyan
    
} catch {
    Write-Host "`nError al crear ZIP: $_" -ForegroundColor Red
    exit 1
}

# Limpiar carpeta temporal
Write-Host "`nLimpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $tempDir

# Mostrar contenido del ZIP
Write-Host "`nVerificando contenido del ZIP..." -ForegroundColor Cyan
Expand-Archive -Path $zipName -DestinationPath ".\temp-verify" -Force
$fileCount = (Get-ChildItem -Path ".\temp-verify" -Recurse -File | Measure-Object).Count
Write-Host "  Total de archivos en el ZIP: $fileCount" -ForegroundColor Green
Remove-Item -Recurse -Force ".\temp-verify"

Write-Host "`nTodo listo para transferir!" -ForegroundColor Green
Write-Host "Ahora puedes copiar el archivo $zipName a tu maquina personal" -ForegroundColor Cyan
Write-Host "Extraelo y sigue las instrucciones en README-PACKAGE.txt" -ForegroundColor Cyan
