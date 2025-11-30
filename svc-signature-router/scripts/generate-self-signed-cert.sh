#!/bin/bash
# Generate self-signed TLS certificate for local development
# Story 8.6: TLS Certificate Management

set -e

KEYSTORE_PATH="src/main/resources/keystore.p12"
KEYSTORE_PASS="changeit"
ALIAS="signature-router"
VALIDITY_DAYS=365

echo "🔐 Generating self-signed TLS certificate..."
echo "================================================"

# Generate PKCS12 keystore with RSA 2048-bit key
keytool -genkeypair \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -keystore "$KEYSTORE_PATH" \
  -storepass "$KEYSTORE_PASS" \
  -storetype PKCS12 \
  -validity "$VALIDITY_DAYS" \
  -dname "CN=localhost, OU=Development, O=Bank, L=Madrid, ST=Madrid, C=ES" \
  -ext "SAN=dns:localhost,ip:127.0.0.1"

echo ""
echo "✅ Certificate generated successfully!"
echo "================================================"
echo "Keystore Path:    $KEYSTORE_PATH"
echo "Keystore Password: $KEYSTORE_PASS"
echo "Alias:            $ALIAS"
echo "Validity:         $VALIDITY_DAYS days"
echo "================================================"
echo ""
echo "⚠️  WARNING: Self-signed certificate for DEVELOPMENT ONLY"
echo "   NOT trusted by browsers (you will see security warnings)"
echo ""
echo "To run with HTTPS:"
echo "  mvn spring-boot:run -Dspring-boot.run.arguments='--server.ssl.enabled=true'"
echo ""
echo "To access:"
echo "  curl -k https://localhost:8443/actuator/health"
echo ""

