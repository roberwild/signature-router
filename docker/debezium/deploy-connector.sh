#!/bin/bash
# Story 5.2: Deploy Debezium connector to Kafka Connect cluster
# Usage: ./deploy-connector.sh

set -e

KAFKA_CONNECT_URL="${KAFKA_CONNECT_URL:-http://localhost:8083}"
CONNECTOR_NAME="signature-outbox-connector"
CONFIG_FILE="../src/main/resources/debezium/connector-config.json"

echo "🚀 Deploying Debezium Outbox Connector..."
echo "Kafka Connect URL: $KAFKA_CONNECT_URL"

# Check Kafka Connect is running
echo "Checking Kafka Connect health..."
if ! curl -s -f "$KAFKA_CONNECT_URL" > /dev/null; then
    echo "❌ ERROR: Kafka Connect is not running at $KAFKA_CONNECT_URL"
    exit 1
fi
echo "✅ Kafka Connect is healthy"

# Check if connector already exists
if curl -s "$KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME" | grep -q "error_code"; then
    echo "📝 Connector does not exist, creating new..."
else
    echo "⚠️  Connector already exists, deleting old version..."
    curl -X DELETE "$KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME"
    sleep 2
fi

# Deploy connector
echo "📤 Deploying connector configuration..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    --data @"$CONFIG_FILE" \
    "$KAFKA_CONNECT_URL/connectors")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Connector deployed successfully!"
    echo "$BODY" | jq '.'
else
    echo "❌ ERROR: Failed to deploy connector (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.'
    exit 1
fi

# Wait for connector to be ready
echo "⏳ Waiting for connector to start..."
sleep 3

# Check connector status
echo "📊 Connector status:"
curl -s "$KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME/status" | jq '.'

# Check tasks status
TASK_STATE=$(curl -s "$KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME/status" | jq -r '.tasks[0].state')

if [ "$TASK_STATE" = "RUNNING" ]; then
    echo "✅ Connector is RUNNING!"
else
    echo "⚠️  Connector state: $TASK_STATE"
    echo "Check logs: docker logs -f kafka-connect"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "  - Check status: curl $KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME/status | jq '.'"
echo "  - Restart:      curl -X POST $KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME/restart"
echo "  - Delete:       curl -X DELETE $KAFKA_CONNECT_URL/connectors/$CONNECTOR_NAME"
echo "  - List all:     curl $KAFKA_CONNECT_URL/connectors | jq '.'"

