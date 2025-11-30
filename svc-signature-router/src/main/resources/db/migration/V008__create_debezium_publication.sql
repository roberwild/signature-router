-- Story 5.2: Create PostgreSQL publication for Debezium CDC
-- This enables Debezium to read from the outbox_event table via logical replication

-- Create publication for outbox table
CREATE PUBLICATION signature_outbox_publication FOR TABLE outbox_event;

-- Verify publication created
-- SELECT * FROM pg_publication WHERE pubname = 'signature_outbox_publication';

-- Grant replication permissions (if needed)
-- ALTER USER siguser WITH REPLICATION;

COMMENT ON PUBLICATION signature_outbox_publication IS 
    'Debezium CDC publication for Outbox pattern - reads outbox_event changes and publishes to Kafka';

