#!/bin/bash
# Story 5.2: Check Debezium connector health and metrics
# Usage: ./check-connector-status.sh

KAFKA_CONNECT_URL="${KAFKA_CONNECT_URL:-http://localhost:8083}"
CONNECTOR_NAME="signature-outbox-connector"

echo "🔍 Checking Debezium Connector Status..."
echo ""

# 1. Connector Status
echo "📊 Connector Status:"
curl -s "$KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME/status" | jq '{
  name: .name,
  connector_state: .connector.state,
  worker_id: .connector.worker_id,
  tasks: .tasks | map({id: .id, state: .state, worker_id: .worker_id})
}'

echo ""

# 2. Connector Config
echo "⚙️  Connector Configuration:"
curl -s "$KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME" | jq '{
  database: .config."database.dbname",
  table: .config."table.include.list",
  topic: .config."transforms.outbox.route.topic.replacement",
  plugin: .config."plugin.name"
}'

echo ""

# 3. Check PostgreSQL Replication Slot
echo "🗄️  PostgreSQL Replication Slot:"
docker exec signature-router-postgres psql -U siguser -d signature_router -c \
    "SELECT slot_name, slot_type, active, confirmed_flush_lsn 
     FROM pg_replication_slots 
     WHERE slot_name = 'debezium_signature_outbox';" \
    2>/dev/null || echo "⚠️  Could not connect to PostgreSQL"

echo ""

# 4. Check Publication
echo "📰 PostgreSQL Publication:"
docker exec signature-router-postgres psql -U siguser -d signature_router -c \
    "SELECT pubname, puballtables 
     FROM pg_publication 
     WHERE pubname = 'signature_outbox_publication';" \
    2>/dev/null || echo "⚠️  Could not connect to PostgreSQL"

echo ""

# 5. Pending Events in Outbox
echo "📬 Pending Events in Outbox:"
docker exec signature-router-postgres psql -U siguser -d signature_router -c \
    "SELECT COUNT(*) as pending_events 
     FROM outbox_event 
     WHERE published_at IS NULL;" \
    2>/dev/null || echo "⚠️  Could not query outbox table"

echo ""

# 6. Recent Kafka Topics
echo "📨 Kafka Topics (signature.*):"
docker exec signature-router-kafka kafka-topics \
    --bootstrap-server localhost:9092 \
    --list 2>/dev/null | grep signature || echo "⚠️  No signature topics found"

echo ""
echo "✅ Status check complete!"

