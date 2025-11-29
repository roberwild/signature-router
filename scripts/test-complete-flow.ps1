# Test Complete Flow - Signature Router
# Tests the complete signature flow from start to finish

param()

$ErrorActionPreference = "Stop"

# Configuration
$baseUrl = "http://localhost:8080"
$keycloakUrl = "http://localhost:8180"
$realm = "signature-router"

# Colors
function Write-Step {
    param([string]$Message)
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor White
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "`nSignature Router - Test Completo del Flujo de Firma`n" -ForegroundColor Magenta

# Paso 1: Obtener token de admin
Write-Step "Paso 1: Obteniendo token de administrador"

try {
    $tokenBody = @{
        client_id     = "signature-router-api"
        client_secret = "signature-router-secret-key-12345"
        grant_type    = "password"
        username      = "admin"
        password      = "admin123"
    }

    $tokenResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/$realm/protocol/openid-connect/token" `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $tokenBody

    $adminToken = $tokenResponse.access_token
    Write-Success "Token obtenido (expira en $($tokenResponse.expires_in) segundos)"

}
catch {
    Write-Error-Custom "No se pudo obtener el token: $_"
    exit 1
}

# Paso 2: Crear signature request
Write-Step "Paso 2: Creando solicitud de firma"

try {
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $requestBody = @{
        customerId         = "CUST-$timestamp"
        phoneNumber        = "+34612345678"
        transactionContext = @{
            amount      = @{
                value    = 1500.00
                currency = "EUR"
            }
            merchantId  = "MERCHANT-$timestamp"
            orderId     = "ORDER-$timestamp"
            description = "Transferencia a cuenta externa"
        }
    } | ConvertTo-Json

    $headers = @{
        Authorization     = "Bearer $adminToken"
        "Content-Type"    = "application/json"
        "Idempotency-Key" = [guid]::NewGuid().ToString()
    }

    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/signatures" `
        -Method POST `
        -Headers $headers `
        -Body $requestBody

    $signatureRequestId = $createResponse.id
    Write-Success "Signature Request creada: $signatureRequestId"
    Write-Info "   Status: $($createResponse.status)"
    Write-Info "   Expires: $($createResponse.expiresAt)"

}
catch {
    Write-Error-Custom "No se pudo crear la solicitud: $_"
    exit 1
}

# Esperar un momento para que se procese
Start-Sleep -Seconds 2

# Paso 3: Obtener detalles y challenge_id
Write-Step "Paso 3: Obteniendo detalles de la solicitud"

try {
    $detailsResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/signatures/$signatureRequestId" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $adminToken" }

    $challengeId = $detailsResponse.activeChallenge.id
    $channelType = $detailsResponse.activeChallenge.channelType
    $challengeStatus = $detailsResponse.activeChallenge.status

    Write-Success "Challenge activo encontrado"
    Write-Info "   Challenge ID: $challengeId"
    Write-Info "   Channel: $channelType"
    Write-Info "   Status: $challengeStatus"

}
catch {
    Write-Error-Custom "No se pudo obtener los detalles: $_"
    exit 1
}

# Paso 4: Obtener challenge_code desde PostgreSQL
Write-Step "Paso 4: Consultando challenge_code desde la base de datos"

try {
    $query = "SELECT challenge_code FROM signature_challenge WHERE id = '$challengeId';"
    $challengeCode = docker exec signature-router-postgres psql -U siguser -d signature_router -t -A -c $query

    if (-not $challengeCode) {
        throw "No se encontro el codigo del challenge"
    }

    $challengeCode = $challengeCode.Trim()
    Write-Success "Challenge code obtenido: $challengeCode"

}
catch {
    Write-Error-Custom "No se pudo obtener el codigo: $_"
    exit 1
}

# Paso 5: Completar la firma
Write-Step "Paso 5: Completando la firma"

try {
    $completeBody = @{
        challengeId = $challengeId
        code        = $challengeCode
    } | ConvertTo-Json

    $completeResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/signatures/$signatureRequestId/complete" `
        -Method PATCH `
        -Headers @{
        Authorization  = "Bearer $adminToken"
        "Content-Type" = "application/json"
    } `
        -Body $completeBody

    Write-Success "Firma completada exitosamente!"
    Write-Info "   Signature ID: $($completeResponse.id)"
    Write-Info "   Status: $($completeResponse.status)"
    Write-Info "   Completed At: $($completeResponse.completedAt)"
    Write-Info "   Message: $($completeResponse.message)"

}
catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Error-Custom "Error al completar la firma:"
    Write-Info "   Code: $($errorDetails.code)"
    Write-Info "   Message: $($errorDetails.message)"
    exit 1
}

Write-Host "`nFlujo completo ejecutado exitosamente!`n" -ForegroundColor Green

