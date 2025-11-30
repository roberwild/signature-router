#!/bin/bash
# Story 5.4: Register Avro schemas in Confluent Schema Registry
# Usage: ./register-schemas.sh

set -e

SCHEMA_REGISTRY_URL="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"
SCHEMA_DIR="../../src/main/resources/avro"

echo "🚀 Registering Avro Schemas to Schema Registry..."
echo "Schema Registry URL: $SCHEMA_REGISTRY_URL"
echo ""

# Check Schema Registry is running
echo "Checking Schema Registry health..."
if ! curl -s -f "$SCHEMA_REGISTRY_URL/subjects" > /dev/null; then
    echo "❌ ERROR: Schema Registry is not running at $SCHEMA_REGISTRY_URL"
    exit 1
fi
echo "✅ Schema Registry is healthy"
echo ""

# Function to register a schema
register_schema() {
    local schema_file=$1
    local subject_name=$2
    
    echo "📝 Registering schema: $subject_name"
    
    # Read schema file and escape it for JSON
    schema_json=$(cat "$schema_file" | jq -c '.')
    
    # Create payload with schema wrapped in JSON
    payload=$(jq -n --arg schema "$schema_json" '{schema: $schema, schemaType: "AVRO"}')
    
    # Register schema
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/vnd.schemaregistry.v1+json" \
        --data "$payload" \
        "$SCHEMA_REGISTRY_URL/subjects/$subject_name/versions")
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        schema_id=$(echo "$body" | jq -r '.id')
        echo "✅ Registered with ID: $schema_id"
    else
        echo "❌ Failed to register (HTTP $http_code)"
        echo "$body" | jq '.'
        return 1
    fi
    echo ""
}

# Register all event schemas
# Subject naming strategy: <topic>-value (for value schemas)

register_schema "$SCHEMA_DIR/BaseEvent.avsc" "signature.events-base-value"

register_schema "$SCHEMA_DIR/SignatureRequestCreatedEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/ChallengeSentEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/ChallengeFailedEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/ProviderFailedEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/SignatureCompletedEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/SignatureExpiredEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/SignatureAbortedEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/CircuitBreakerOpenedEvent.avsc" "signature.events-value"
register_schema "$SCHEMA_DIR/CircuitBreakerClosedEvent.avsc" "signature.events-value"

echo "🎉 All schemas registered successfully!"
echo ""
echo "📋 List all registered subjects:"
curl -s "$SCHEMA_REGISTRY_URL/subjects" | jq '.'
echo ""
echo "📊 Schema Registry stats:"
curl -s "$SCHEMA_REGISTRY_URL/subjects/signature.events-value/versions" | jq '.'

