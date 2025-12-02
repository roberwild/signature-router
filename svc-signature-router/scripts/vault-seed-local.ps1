#!/usr/bin/env pwsh
# Vault Seed Script - Local Development
# Pobla el Vault local (Docker) con credenciales de desarrollo

$VAULT_ADDR = "http://localhost:8200"
$VAULT_TOKEN = "dev-token-123"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  Poblando Vault Local con Credenciales de Desarrollo" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Vault está corriendo
Write-Host "[1/4] Verificando conexión con Vault..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "$VAULT_ADDR/v1/sys/health" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "      ✓ Vault está corriendo" -ForegroundColor Green
}
catch {
    Write-Host "      ✗ ERROR: No se puede conectar a Vault" -ForegroundColor Red
    exit 1
}

# Twilio SMS
Write-Host ""
Write-Host "[2/4] Poblando Twilio SMS credentials..." -ForegroundColor Yellow
$twilioSms = '{"data":{"account_sid":"ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx","auth_token":"mock-auth-token-twilio-sms-dev","from_number":"+1234567890"}}'
Invoke-WebRequest `
    -Uri "$VAULT_ADDR/v1/secret/data/signature-router/providers/twilio-sms-dev" `
    -Method POST `
    -Headers @{"X-Vault-Token" = $VAULT_TOKEN} `
    -Body $twilioSms `
    -ContentType "application/json" `
    -UseBasicParsing | Out-Null
Write-Host "      ✓ Guardado" -ForegroundColor Green

# FCM Push
Write-Host ""
Write-Host "[3/4] Poblando FCM Push credentials..." -ForegroundColor Yellow
$fcmPush = '{"data":{"server_key":"mock-fcm-server-key-dev","sender_id":"123456789012"}}'
Invoke-WebRequest `
    -Uri "$VAULT_ADDR/v1/secret/data/signature-router/providers/fcm-push-dev" `
    -Method POST `
    -Headers @{"X-Vault-Token" = $VAULT_TOKEN} `
    -Body $fcmPush `
    -ContentType "application/json" `
    -UseBasicParsing | Out-Null
Write-Host "      ✓ Guardado" -ForegroundColor Green

# Twilio Voice
Write-Host ""
Write-Host "[4/4] Poblando Twilio Voice credentials..." -ForegroundColor Yellow
$twilioVoice = '{"data":{"account_sid":"ACyyyyyyyyyyyyyyyyyyyyyyyyyyyyy","auth_token":"mock-auth-token-twilio-voice-dev","from_number":"+0987654321"}}'
Invoke-WebRequest `
    -Uri "$VAULT_ADDR/v1/secret/data/signature-router/providers/twilio-voice-dev" `
    -Method POST `
    -Headers @{"X-Vault-Token" = $VAULT_TOKEN} `
    -Body $twilioVoice `
    -ContentType "application/json" `
    -UseBasicParsing | Out-Null
Write-Host "      ✓ Guardado" -ForegroundColor Green

# Biometric
Write-Host ""
Write-Host "[BONUS] Poblando Biometric credentials..." -ForegroundColor Yellow
$biometric = '{"data":{"api_key":"mock-biometric-api-key-dev"}}'
Invoke-WebRequest `
    -Uri "$VAULT_ADDR/v1/secret/data/signature-router/providers/biometric-stub-dev" `
    -Method POST `
    -Headers @{"X-Vault-Token" = $VAULT_TOKEN} `
    -Body $biometric `
    -ContentType "application/json" `
    -UseBasicParsing | Out-Null
Write-Host "      ✓ Guardado" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  ✓ Vault poblado con 4 sets de credenciales" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
