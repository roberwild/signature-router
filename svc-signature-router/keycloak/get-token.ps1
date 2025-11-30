# Script PowerShell para obtener tokens JWT de Keycloak

$KEYCLOAK_URL = "http://localhost:8180"
$REALM = "signature-router"
$CLIENT_ID = "signature-router-api"
$CLIENT_SECRET = "signature-router-secret-key-12345"

function Get-KeycloakToken {
    param(
        [string]$Username,
        [string]$Password,
        [string]$Role
    )
    
    Write-Host "`n========================================" -ForegroundColor Blue
    Write-Host "Obteniendo token para: $Username ($Role)" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Blue
    
    $body = @{
        client_id     = $CLIENT_ID
        client_secret = $CLIENT_SECRET
        grant_type    = "password"
        username      = $Username
        password      = $Password
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" `
            -Method Post `
            -ContentType "application/x-www-form-urlencoded" `
            -Body $body
        
        Write-Host "✅ Token obtenido exitosamente`n" -ForegroundColor Green
        
        Write-Host "Access Token ($Username):" -ForegroundColor Blue
        Write-Host $response.access_token
        Write-Host ""
        
        # Decodificar payload del JWT
        $tokenParts = $response.access_token.Split('.')
        if ($tokenParts.Length -ge 2) {
            $payload = $tokenParts[1]
            # Añadir padding si es necesario
            while ($payload.Length % 4 -ne 0) {
                $payload += '='
            }
            $decodedBytes = [System.Convert]::FromBase64String($payload)
            $decodedText = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
            
            Write-Host "Token decodificado:" -ForegroundColor Blue
            $decodedText | ConvertFrom-Json | ConvertTo-Json -Depth 5
        }
        
        Write-Host "`nExpires in: $($response.expires_in) seconds" -ForegroundColor Blue
        Write-Host "Refresh token: $($response.refresh_token.Substring(0, 50))...`n" -ForegroundColor Blue
        
    }
    catch {
        Write-Host "❌ Error al obtener token" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Menu
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "  Keycloak Token Generator" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue

Write-Host "Selecciona el usuario:"
Write-Host "1) admin (ADMIN + USER)"
Write-Host "2) user (USER)"
Write-Host "3) support (SUPPORT + USER)"
Write-Host "4) auditor (AUDITOR)"
Write-Host "5) Todos"
Write-Host ""

$option = Read-Host "Opción"

switch ($option) {
    "1" { Get-KeycloakToken -Username "admin" -Password "admin123" -Role "ADMIN" }
    "2" { Get-KeycloakToken -Username "user" -Password "user123" -Role "USER" }
    "3" { Get-KeycloakToken -Username "support" -Password "support123" -Role "SUPPORT" }
    "4" { Get-KeycloakToken -Username "auditor" -Password "auditor123" -Role "AUDITOR" }
    "5" {
        Get-KeycloakToken -Username "admin" -Password "admin123" -Role "ADMIN"
        Get-KeycloakToken -Username "user" -Password "user123" -Role "USER"
        Get-KeycloakToken -Username "support" -Password "support123" -Role "SUPPORT"
        Get-KeycloakToken -Username "auditor" -Password "auditor123" -Role "AUDITOR"
    }
    default {
        Write-Host "Opción inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "Para usar en Postman:" -ForegroundColor Green
Write-Host "1. Copia el Access Token de arriba" -ForegroundColor Yellow
Write-Host "2. En Postman, ve a Environment: 'Signature Router - Local'" -ForegroundColor Yellow
Write-Host "3. Actualiza la variable 'admin_token' con el token copiado" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Blue

