#!/bin/sh
# Vault initialization script for signature-router
# Story 8.5: Vault Secret Rotation
# This script:
# - Enables KV secrets engine v2
# - Stores pseudonymization key
# - Enables PostgreSQL database secrets engine
# - Configures automatic credential rotation

set -e

echo "🔐 Starting Vault initialization..."
echo "===================================="

# Wait for Vault to be ready
sleep 5

# Set Vault address and token
export VAULT_ADDR=http://vault:8200
export VAULT_TOKEN=dev-root-token

echo "✅ Vault is ready!"

# ============================================
# 1. Enable KV Secrets Engine v2
# ============================================
echo ""
echo "📁 Enabling KV secrets engine v2..."

vault secrets enable -version=2 -path=secret kv || echo "KV engine already enabled"

# ============================================
# 2. Store Pseudonymization Key
# ============================================
echo ""
echo "🔑 Storing pseudonymization key..."

# Generate a random 256-bit key (64 hex characters)
PSEUDO_KEY=$(openssl rand -hex 32)

vault kv put secret/signature-router/pseudonymization-key \
  key="$PSEUDO_KEY" \
  created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  rotation_period="90d" \
  algorithm="HMAC-SHA256"

echo "✅ Pseudonymization key stored!"

# ============================================
# 3. Enable Database Secrets Engine
# ============================================
echo ""
echo "🗄️  Enabling database secrets engine..."

vault secrets enable -path=database database || echo "Database engine already enabled"

# ============================================
# 4. Configure PostgreSQL Connection
# ============================================
echo ""
echo "🔌 Configuring PostgreSQL connection..."

vault write database/config/signature-router-db \
  plugin_name=postgresql-database-plugin \
  allowed_roles="signature-router-role" \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/signature_router_dev?sslmode=disable" \
  username="vault_admin" \
  password="vault_admin_password_123" \
  password_authentication="scram-sha-256"

echo "✅ PostgreSQL connection configured!"

# ============================================
# 5. Create Dynamic Role for Application
# ============================================
echo ""
echo "👤 Creating dynamic database role..."

vault write database/roles/signature-router-role \
  db_name=signature-router-db \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT ALL PRIVILEGES ON DATABASE signature_router_dev TO \"{{name}}\"; \
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \"{{name}}\"; \
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

echo "✅ Dynamic role created!"

# ============================================
# 6. Test Dynamic Credential Generation
# ============================================
echo ""
echo "🧪 Testing dynamic credential generation..."

CREDS=$(vault read database/creds/signature-router-role -format=json)
echo "✅ Dynamic credentials generated successfully!"
echo "$CREDS" | jq .

# ============================================
# 7. Create Policy for Application
# ============================================
echo ""
echo "📜 Creating Vault policy for application..."

vault policy write signature-router - <<EOF
# Read pseudonymization key
path "secret/data/signature-router/pseudonymization-key" {
  capabilities = ["read"]
}

# Read database credentials
path "database/creds/signature-router-role" {
  capabilities = ["read"]
}

# List secrets
path "secret/metadata/signature-router/*" {
  capabilities = ["list"]
}
EOF

echo "✅ Policy created!"

# ============================================
# 8. Enable AppRole Auth
# ============================================
echo ""
echo "🔐 Enabling AppRole authentication..."

vault auth enable approle || echo "AppRole already enabled"

vault write auth/approle/role/signature-router \
  token_policies="signature-router" \
  token_ttl=1h \
  token_max_ttl=4h

# Get RoleID and SecretID
ROLE_ID=$(vault read -field=role_id auth/approle/role/signature-router/role-id)
SECRET_ID=$(vault write -f -field=secret_id auth/approle/role/signature-router/secret-id)

echo "✅ AppRole configured!"
echo ""
echo "===================================="
echo "🎉 Vault initialization complete!"
echo "===================================="
echo ""
echo "📋 Configuration Summary:"
echo "  - KV Engine: secret/"
echo "  - Database Engine: database/"
echo "  - PostgreSQL: postgres:5432/signature_router_dev"
echo "  - Role: signature-router-role"
echo "  - TTL: 1h (default), 24h (max)"
echo ""
echo "🔑 Credentials for application:"
echo "  VAULT_ADDR=http://localhost:8200"
echo "  VAULT_TOKEN=dev-root-token"
echo "  VAULT_ROLE_ID=$ROLE_ID"
echo "  VAULT_SECRET_ID=$SECRET_ID"
echo ""
echo "🧪 Test Commands:"
echo "  # Read pseudonymization key"
echo "  vault kv get secret/signature-router/pseudonymization-key"
echo ""
echo "  # Generate database credentials"
echo "  vault read database/creds/signature-router-role"
echo ""
echo "===================================="

