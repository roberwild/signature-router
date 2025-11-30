#!/bin/bash
# Story 5.4: Set compatibility mode for schemas
# Usage: ./set-compatibility.sh [BACKWARD|FORWARD|FULL|NONE]

SCHEMA_REGISTRY_URL="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"
COMPATIBILITY_MODE="${1:-BACKWARD}"

echo "🔧 Setting Schema Compatibility Mode..."
echo "Mode: $COMPATIBILITY_MODE"
echo ""

# Set global compatibility mode
echo "📊 Setting global compatibility to $COMPATIBILITY_MODE..."
response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/vnd.schemaregistry.v1+json" \
    --data "{\"compatibility\": \"$COMPATIBILITY_MODE\"}" \
    "$SCHEMA_REGISTRY_URL/config")

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ Compatibility mode set successfully:"
    echo "$body" | jq '.'
else
    echo "❌ Failed to set compatibility mode (HTTP $http_code)"
    echo "$body" | jq '.'
    exit 1
fi

echo ""
echo "🎉 Compatibility mode updated!"
echo ""
echo "ℹ️  Compatibility Modes:"
echo "  - BACKWARD: New schema can read data written by old schema (ADD fields, REMOVE optional fields)"
echo "  - FORWARD: Old schema can read data written by new schema (REMOVE fields, ADD optional fields)"
echo "  - FULL: Both BACKWARD and FORWARD (ADD/REMOVE optional fields only)"
echo "  - NONE: No compatibility checks"

