# Configuracion de entorno para Signature Router
# Ejecutar con: .\setenv.ps1

Write-Host "Configurando entorno para Signature Router..." -ForegroundColor Yellow

# Java (ajustar la ruta segun tu instalacion)
$javaHome = "C:\Program Files\Java\jdk-21"
if (Test-Path $javaHome) {
    $env:JAVA_HOME = $javaHome
    Write-Host "JAVA_HOME configurado: $javaHome" -ForegroundColor Green
} else {
    Write-Host "ADVERTENCIA: Java 21 no encontrado en: $javaHome" -ForegroundColor Yellow
    Write-Host "   Ajusta la ruta en setenv.ps1 o instala Java 21" -ForegroundColor Yellow
}

# Maven (ajustar la ruta segun tu instalacion)
$mavenHome = "C:\apache-maven-3.9.5"
if (Test-Path $mavenHome) {
    $env:M2_HOME = $mavenHome
    Write-Host "M2_HOME configurado: $mavenHome" -ForegroundColor Green
} else {
    Write-Host "ADVERTENCIA: Maven no encontrado en: $mavenHome" -ForegroundColor Yellow
    Write-Host "   Ajusta la ruta en setenv.ps1 o instala Maven 3.9+" -ForegroundColor Yellow
}

# Maven Options
$env:MAVEN_OPTS = "-Xmx2048m -Xms512m"

# Spring Boot
$env:SPRING_PROFILES_ACTIVE = "local"

# Docker Compose
$env:COMPOSE_PROJECT_NAME = "signature-router"

# PATH
if ($env:JAVA_HOME) {
    $env:PATH = $env:JAVA_HOME + "\bin;" + $env:PATH
}
if ($env:M2_HOME) {
    $env:PATH = $env:M2_HOME + "\bin;" + $env:PATH
}

Write-Host "`nVerificando versiones..." -ForegroundColor Cyan

# Verificar Java
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "   Java: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Java no disponible en PATH" -ForegroundColor Red
}

# Verificar Maven
try {
    $mavenVersion = mvn -version 2>&1 | Select-Object -First 1
    Write-Host "   Maven: $mavenVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Maven no disponible en PATH" -ForegroundColor Red
}

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "   Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ADVERTENCIA: Docker no disponible (opcional)" -ForegroundColor Yellow
}

Write-Host "`nEntorno configurado para Signature Router" -ForegroundColor Green
Write-Host "   Profile activo: $env:SPRING_PROFILES_ACTIVE" -ForegroundColor Cyan
