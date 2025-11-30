#!/bin/bash
# Story 5.4: Check registered Avro schemas in Schema Registry
# Usage: ./check-schemas.sh [subject-name]

SCHEMA_REGISTRY_URL="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"
SUBJECT="${1:-signature.events-value}"

echo "🔍 Checking Avro Schemas in Schema Registry..."
echo "Schema Registry URL: $SCHEMA_REGISTRY_URL"
echo ""

# 1. List all subjects
echo "📋 All Registered Subjects:"
curl -s "$SCHEMA_REGISTRY_URL/subjects" | jq -r '.[]'
echo ""

# 2. Get versions for specific subject
echo "📊 Versions for subject '$SUBJECT':"
curl -s "$SCHEMA_REGISTRY_URL/subjects/$SUBJECT/versions" | jq '.'
echo ""

# 3. Get latest schema for subject
echo "📄 Latest Schema for '$SUBJECT':"
curl -s "$SCHEMA_REGISTRY_URL/subjects/$SUBJECT/versions/latest" | jq '{
  subject: .subject,
  version: .version,
  id: .id,
  schemaType: .schemaType,
  schema: (.schema | fromjson)
}'
echo ""

# 4. Check compatibility mode
echo "🔧 Compatibility Mode for '$SUBJECT':"
curl -s "$SCHEMA_REGISTRY_URL/config/$SUBJECT" | jq '.'
echo ""

# 5. Global compatibility mode
echo "🌍 Global Compatibility Mode:"
curl -s "$SCHEMA_REGISTRY_URL/config" | jq '.'
echo ""

echo "✅ Schema check complete!"

