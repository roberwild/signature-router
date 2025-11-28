# Script de configuracion rapida de VS Code para Signature Router
# Ejecutar con: .\setup-vscode.ps1

Write-Host "Configurando VS Code para Signature Router..." -ForegroundColor Cyan

# Verificar si VS Code esta instalado
$vscodePath = Get-Command code -ErrorAction SilentlyContinue

if (-not $vscodePath) {
    Write-Host "VS Code no encontrado en PATH" -ForegroundColor Red
    Write-Host "   Instala VS Code desde: https://code.visualstudio.com/" -ForegroundColor Yellow
    Write-Host "   O Cursor desde: https://cursor.sh/" -ForegroundColor Yellow
    exit 1
}

Write-Host "VS Code encontrado: $($vscodePath.Source)" -ForegroundColor Green

# Lista de extensiones esenciales
$extensions = @(
    "vscjava.vscode-java-pack",
    "vmware.vscode-spring-boot",
    "redhat.vscode-yaml",
    "redhat.vscode-xml",
    "gabrielbb.vscode-lombok",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "humao.rest-client",
    "editorconfig.editorconfig"
)

Write-Host "`nInstalando extensiones esenciales..." -ForegroundColor Cyan

$installed = 0
$failed = 0

foreach ($ext in $extensions) {
    Write-Host "   Instalando: $ext" -ForegroundColor Gray
    try {
        code --install-extension $ext --force 2>&1 | Out-Null
        $installed++
        Write-Host "   OK: $ext" -ForegroundColor Green
    } catch {
        $failed++
        Write-Host "   ERROR al instalar $ext" -ForegroundColor Red
    }
}

Write-Host "`nResumen de instalacion:" -ForegroundColor Cyan
Write-Host "   Instaladas: $installed" -ForegroundColor Green
Write-Host "   Fallidas: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })

# Verificar archivos de configuracion
Write-Host "`nVerificando archivos de configuracion..." -ForegroundColor Cyan

$configFiles = @(
    ".vscode\settings.json",
    ".vscode\extensions.json",
    ".vscode\launch.json",
    ".vscode\tasks.json",
    ".editorconfig"
)

$allPresent = $true
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   OK: $file" -ForegroundColor Green
    } else {
        Write-Host "   FALTA: $file" -ForegroundColor Red
        $allPresent = $false
    }
}

if ($allPresent) {
    Write-Host "`nTodos los archivos de configuracion estan presentes" -ForegroundColor Green
} else {
    Write-Host "`nAlgunos archivos de configuracion faltan" -ForegroundColor Yellow
    Write-Host "   Revisa el archivo: vscode-profile-export.md" -ForegroundColor Yellow
}

# Verificar Java y Maven
Write-Host "`nVerificando dependencias..." -ForegroundColor Cyan

try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    if ($javaVersion -match "21") {
        Write-Host "   OK Java 21: $javaVersion" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: Java instalado pero NO es version 21: $javaVersion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR: Java no encontrado. Instala Java 21 desde: https://adoptium.net/" -ForegroundColor Red
}

try {
    $mavenVersion = mvn -version 2>&1 | Select-Object -First 1
    Write-Host "   OK Maven: $mavenVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Maven no encontrado. Instala Maven desde: https://maven.apache.org/" -ForegroundColor Red
}

try {
    $dockerVersion = docker --version
    Write-Host "   OK Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ADVERTENCIA: Docker no encontrado (necesario para infraestructura)" -ForegroundColor Yellow
    Write-Host "      Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
}

Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Reinicia VS Code/Cursor" -ForegroundColor White
Write-Host "   2. Ejecuta: .\setenv.ps1 (configurar variables de entorno)" -ForegroundColor White
Write-Host "   3. Ejecuta: mvn clean install -DskipTests (compilar proyecto)" -ForegroundColor White
Write-Host "   4. Ejecuta: docker-compose up -d (levantar infraestructura)" -ForegroundColor White
Write-Host "   5. Presiona F5 en VS Code para ejecutar la aplicacion" -ForegroundColor White

Write-Host "`nConfiguracion completada!" -ForegroundColor Green
Write-Host "   Consulta vscode-profile-export.md para mas detalles" -ForegroundColor Cyan
