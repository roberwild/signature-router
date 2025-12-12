-- ============================================================================
-- UUIDv7 Generator Function for PostgreSQL
-- ============================================================================
-- 
-- UUIDv7 combines timestamp + randomness for time-ordered, globally unique IDs.
-- Format: [timestamp (48 bits)][version (4 bits)][random (12 bits)][variant (2 bits)][random (62 bits)]
--
-- Benefits over UUIDv4:
-- - Time-ordered (better for B-tree indexes)
-- - Sortable chronologically
-- - Same uniqueness guarantees as UUIDv4
--
-- Source: https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html
-- ============================================================================

CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS UUID
AS $$
DECLARE
    unix_ts_ms BIGINT;
    uuid_bytes BYTEA;
BEGIN
    -- Get current Unix timestamp in milliseconds
    unix_ts_ms := (EXTRACT(EPOCH FROM CLOCK_TIMESTAMP()) * 1000)::BIGINT;
    
    -- Generate UUID bytes:
    -- Bytes 0-5: timestamp (48 bits, big-endian)
    -- Byte 6: version (0x70) + random (4 bits)
    -- Byte 7: random (8 bits)
    -- Byte 8: variant (0x80-0xBF) + random (6 bits)
    -- Bytes 9-15: random (56 bits)
    
    uuid_bytes := 
        -- Timestamp (48 bits = 6 bytes)
        SET_BYTE('\x00000000'::BYTEA, 0, (unix_ts_ms >> 40)::BIT(8)::INT) ||
        SET_BYTE('\x00000000'::BYTEA, 0, (unix_ts_ms >> 32)::BIT(8)::INT) ||
        SET_BYTE('\x00000000'::BYTEA, 0, (unix_ts_ms >> 24)::BIT(8)::INT) ||
        SET_BYTE('\x00000000'::BYTEA, 0, (unix_ts_ms >> 16)::BIT(8)::INT) ||
        SET_BYTE('\x00000000'::BYTEA, 0, (unix_ts_ms >> 8)::BIT(8)::INT) ||
        SET_BYTE('\x00000000'::BYTEA, 0, (unix_ts_ms)::BIT(8)::INT) ||
        -- Version 7 (0x70) + random 4 bits
        SET_BYTE('\x00000000'::BYTEA, 0, (x'70'::INT | (RANDOM() * 15)::INT)) ||
        -- Random byte
        SET_BYTE('\x00000000'::BYTEA, 0, (RANDOM() * 255)::INT) ||
        -- Variant (10xxxxxx) + random 6 bits
        SET_BYTE('\x00000000'::BYTEA, 0, (x'80'::INT | (RANDOM() * 63)::INT)) ||
        -- Random 7 bytes (56 bits)
        GEN_RANDOM_BYTES(7);
    
    -- Encode as UUID
    RETURN ENCODE(uuid_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Test (uncomment to verify installation)
-- SELECT uuid_generate_v7();
-- SELECT uuid_generate_v7() < uuid_generate_v7(); -- Should be true (time-ordered)

COMMENT ON FUNCTION uuid_generate_v7() IS 'Generate time-ordered UUIDv7 (RFC Draft). Combines timestamp + randomness for sortable, unique identifiers.';

