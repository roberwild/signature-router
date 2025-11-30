#!/bin/sh

# Vault Secret Initialization Script
# Run: docker-compose exec vault sh /vault/scripts/vault-init.sh

echo "Initializing Vault secrets for signature-router..."

# Check if Vault is ready
vault status > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Vault is not ready (sealed or not running)"
  exit 1
fi

# Check if secrets already exist (idempotent)
vault kv get secret/signature-router > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Secrets already exist. Skipping initialization."
  echo "To overwrite, run: vault kv delete secret/signature-router"
  exit 0
fi

# Initialize secrets
vault kv put secret/signature-router \
  database.password=sigpass \
  kafka.sasl-jaas-config="" \
  twilio.api-key=test-twilio-key-123 \
  twilio.api-secret=test-twilio-secret-456 \
  push-service.api-key=test-push-key-789 \
  biometric-sdk.license=test-biometric-license

if [ $? -eq 0 ]; then
  echo "✓ Secrets initialized successfully"
  echo ""
  echo "Verify with: vault kv get secret/signature-router"
else
  echo "✗ Failed to initialize secrets"
  exit 1
fi

