# Get Challenge Code from PostgreSQL
# Retrieves the challenge code from the database for testing purposes

param(
    [Parameter(Mandatory=$false)]
    [string]$ChallengeId
)

$ErrorActionPreference = "Stop"

# Colors
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "`nConsultando challenge code desde PostgreSQL...`n" "Cyan"

try {
    # Verificar que Docker esta corriendo
    $dockerStatus = docker ps --filter "name=signature-router-postgres" --format "{{.Status}}" 2>$null
    if (-not $dockerStatus) {
        Write-ColorOutput "ERROR: El contenedor signature-router-postgres no esta corriendo" "Red"
        Write-ColorOutput "   Ejecuta primero: docker-compose up -d" "Yellow"
        exit 1
    }

    # Construir la query SQL
    if ($ChallengeId) {
        $query = "SELECT id, challenge_code, status, channel_type, created_at FROM signature_challenge WHERE id = '$ChallengeId';"
    } else {
        $query = "SELECT id, challenge_code, status, channel_type, created_at FROM signature_challenge ORDER BY created_at DESC LIMIT 1;"
    }

    # Ejecutar la query
    $result = docker exec signature-router-postgres psql -U siguser -d signature_router -t -A -F "|" -c $query

    if (-not $result) {
        Write-ColorOutput "ERROR: No se encontro ningun challenge" "Red"
        exit 1
    }

    # Parsear el resultado (formato: id|challenge_code|status|channel_type|created_at)
    $fields = $result -split '\|'
    $id = $fields[0]
    $code = $fields[1]
    $status = $fields[2]
    $channel = $fields[3]
    $createdAt = $fields[4]

    # Mostrar la informacion
    Write-ColorOutput "Challenge encontrado:" "Green"
    Write-ColorOutput "   ID:           $id" "White"
    Write-ColorOutput "   CODE:         $code" "Yellow"
    Write-ColorOutput "   Status:       $status" "White"
    Write-ColorOutput "   Channel:      $channel" "White"
    Write-ColorOutput "   Created At:   $createdAt" "Gray"
    Write-ColorOutput ""

    # Copiar al portapapeles si esta disponible
    try {
        Set-Clipboard -Value $code
        Write-ColorOutput "Codigo copiado al portapapeles!" "Green"
    } catch {
        Write-ColorOutput "No se pudo copiar al portapapeles" "Yellow"
    }

    Write-ColorOutput "`nPara usar en Postman:" "Cyan"
    Write-ColorOutput "   1. Ve a tu Environment" "White"
    Write-ColorOutput "   2. Actualiza la variable: challenge_code = $code" "White"
    Write-ColorOutput "   3. Ejecuta el request 'Verify Challenge'" "White"
    Write-ColorOutput ""

} catch {
    Write-ColorOutput "ERROR: $_" "Red"
    exit 1
}

