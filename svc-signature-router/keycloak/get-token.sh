#!/bin/bash
# Helper script to get JWT token from Keycloak for testing
# Usage: ./get-token.sh [username] [password]
# Example: ./get-token.sh admin@bank.com admin123

set -e

KEYCLOAK_URL=${KEYCLOAK_URL:-http://localhost:8080}
REALM=${REALM:-signature-router}
CLIENT_ID=${CLIENT_ID:-signature-router-backend}
CLIENT_SECRET=${CLIENT_SECRET:-YOUR_CLIENT_SECRET}
USERNAME=${1:-admin@bank.com}
PASSWORD=${2:-admin123}

echo "Getting JWT token from Keycloak..."
echo "Realm: $REALM"
echo "Username: $USERNAME"

RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=$USERNAME" \
  -d "password=$PASSWORD")

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')
EXPIRES_IN=$(echo $RESPONSE | jq -r '.expires_in')

if [ "$ACCESS_TOKEN" != "null" ]; then
    echo ""
    echo "✅ JWT Token obtained successfully!"
    echo ""
    echo "Access Token (valid for $EXPIRES_IN seconds):"
    echo "$ACCESS_TOKEN"
    echo ""
    echo "Export to environment:"
    echo "export TOKEN='$ACCESS_TOKEN'"
    echo ""
    echo "Use in curl:"
    echo "curl -H 'Authorization: Bearer $ACCESS_TOKEN' http://localhost:8080/api/v1/signatures"
    echo ""
    echo "Decode token at: https://jwt.io"
else
    echo "❌ Failed to get token"
    echo "Response: $RESPONSE"
    exit 1
fi
