-- ================================================================================
-- SEED DATA SCRIPT - DATOS DE PRUEBA PARA SIGNATURE ROUTER
-- ================================================================================
-- 
-- Propósito: Poblar la base de datos con datos de prueba realistas para testing
--            del frontend y validación de funcionalidad completa
--
-- IMPORTANTE: Este script está adaptado al esquema generado por Hibernate
--             (ddl-auto: update) en desarrollo local
--
-- Uso:
--   psql -U siguser -d signature_router -f scripts/seed-test-data.sql
--
--   O desde Docker:
--   docker exec -i signature-router-postgres psql -U siguser -d signature_router < scripts/seed-test-data.sql
--
-- ADVERTENCIA: Este script ELIMINA todos los datos existentes
-- ================================================================================

-- Habilitar extensión pgcrypto para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpiar datos existentes (en orden inverso por FKs)
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE outbox_event CASCADE;
TRUNCATE TABLE signature_challenge CASCADE;
TRUNCATE TABLE signature_request CASCADE;
TRUNCATE TABLE routing_rule CASCADE;
TRUNCATE TABLE provider_config CASCADE;
TRUNCATE TABLE idempotency_record CASCADE;

-- ================================================================================
-- 1. PROVIDER_CONFIG - Configuración de proveedores
-- ================================================================================

INSERT INTO provider_config (
    id, provider_type, provider_name, provider_code, enabled, priority,
    timeout_seconds, retry_max_attempts, config_json, vault_path,
    created_at, created_by, updated_at, updated_by
) VALUES
-- SMS Providers
(
    gen_random_uuid(),
    'SMS',
    'Twilio SMS',
    'SMS',
    true,
    1,
    5,
    3,
    '{"accountSid":"AC_test_123","fromNumber":"+34900123456","apiUrl":"https://api.twilio.com/2010-04-01"}'::jsonb,
    'secret/providers/twilio',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com'
),
(
    gen_random_uuid(),
    'SMS',
    'AWS SNS',
    'AWS_SNS',
    true,
    2,
    5,
    3,
    '{"region":"eu-west-1","senderId":"SINGULAR","apiUrl":"https://sns.eu-west-1.amazonaws.com"}'::jsonb,
    'secret/providers/aws-sns',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com'
),
-- PUSH Providers
(
    gen_random_uuid(),
    'PUSH',
    'Firebase Cloud Messaging',
    'PUSH',
    true,
    1,
    10,
    3,
    '{"projectId":"singular-prod","apiUrl":"https://fcm.googleapis.com/v1","priority":"high"}'::jsonb,
    'secret/providers/fcm',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com'
),
-- VOICE Providers
(
    gen_random_uuid(),
    'VOICE',
    'Twilio Voice',
    'VOICE',
    true,
    1,
    15,
    2,
    '{"accountSid":"AC_voice_789","fromNumber":"+34900654321","voice":"Polly.Conchita"}'::jsonb,
    'secret/providers/twilio-voice',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com'
),
-- BIOMETRIC Providers
(
    gen_random_uuid(),
    'BIOMETRIC',
    'FaceTech',
    'FACETECH',
    true,
    1,
    20,
    1,
    '{"apiUrl":"https://api.facetech.io/v2","minConfidence":0.95,"livenessCheck":true}'::jsonb,
    'secret/providers/facetech',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com'
),
(
    gen_random_uuid(),
    'BIOMETRIC',
    'Veridas',
    'VERIDAS',
    true,
    2,
    20,
    1,
    '{"apiUrl":"https://api.veridas.com/v1","threshold":0.90,"antiSpoofing":true}'::jsonb,
    'secret/providers/veridas',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com'
);

-- ================================================================================
-- 2. ROUTING_RULE - Reglas de enrutamiento
-- ================================================================================

INSERT INTO routing_rule (
    id, name, condition, target_channel, priority, enabled,
    created_at, created_by, modified_at, modified_by,
    deleted, deleted_at, deleted_by
) VALUES
(
    gen_random_uuid(),
    'SMS Premium - Twilio',
    'customer.tier == ''PREMIUM'' && channel == ''SMS''',
    'SMS',
    1,
    true,
    NOW() - INTERVAL '60 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    false,  -- deleted es NOT NULL
    NULL,
    NULL
),
(
    gen_random_uuid(),
    'SMS Standard - AWS SNS',
    'customer.tier == ''STANDARD'' && channel == ''SMS''',
    'SMS',
    2,
    true,
    NOW() - INTERVAL '60 days',
    'admin@singular.com',
    NOW() - INTERVAL '30 days',
    'admin@singular.com',
    false,
    NULL,
    NULL
),
(
    gen_random_uuid(),
    'PUSH - FCM',
    'channel == ''PUSH''',
    'PUSH',
    1,
    true,
    NOW() - INTERVAL '60 days',
    'admin@singular.com',
    NULL,
    NULL,
    false,
    NULL,
    NULL
),
(
    gen_random_uuid(),
    'VOICE - Twilio',
    'channel == ''VOICE''',
    'VOICE',
    1,
    true,
    NOW() - INTERVAL '60 days',
    'admin@singular.com',
    NULL,
    NULL,
    false,
    NULL,
    NULL
);

-- ================================================================================
-- 3. SIGNATURE_REQUEST - Solicitudes de firma
-- ================================================================================

INSERT INTO signature_request (
    id, customer_id, status, transaction_context, routing_timeline,
    created_at, expires_at, signed_at, aborted_at, abort_reason
) VALUES
-- Request 1: COMPLETED (Firmada por SMS)
(
    '01938a23-2a3c-7b9e-9f8e-3a4b5c6d7e8f'::uuid,
    'CUST-001',
    'SIGNED',
    '{"amount":{"amount":"1500.50","currency":"EUR"},"merchantId":"MERCHANT-001","orderId":"ORDER-001","description":"Amazon ES - Purchase","hash":"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}'::jsonb,
    '[{"timestamp":"2025-12-01T10:58:24Z","eventType":"CHALLENGE_SENT","fromChannel":null,"toChannel":"SMS","reason":"Initial routing to SMS"}]'::jsonb,
    NOW() - INTERVAL '25 hours',
    NOW() + INTERVAL '4 days 23 hours',
    NOW() - INTERVAL '24 hours',
    NULL,
    NULL
),
-- Request 2: PENDING (Esperando firma por PUSH)
(
    '01938a23-3b4d-7c8f-a1b2-c3d4e5f6a7b8'::uuid,
    'CUST-002',
    'PENDING',
    '{"amount":{"amount":"250.00","currency":"EUR"},"merchantId":"MERCHANT-002","orderId":"ORDER-002","description":"Zara Online - Purchase","hash":"a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4"}'::jsonb,
    '[{"timestamp":"2025-12-02T09:58:24Z","eventType":"CHALLENGE_SENT","fromChannel":null,"toChannel":"PUSH","reason":"Initial routing to PUSH"}]'::jsonb,
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '4 days 23 hours',
    NULL,
    NULL,
    NULL
),
-- Request 3: COMPLETED (Firmada por PUSH)
(
    '01938a23-4c5e-7d9a-b2c3-d4e5f6a7b8c9'::uuid,
    'CUST-003',
    'SIGNED',
    '{"amount":{"amount":"89.99","currency":"EUR"},"merchantId":"MERCHANT-003","orderId":"ORDER-003","description":"Netflix - Monthly Subscription","hash":"fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"}'::jsonb,
    '[{"timestamp":"2025-12-01T15:58:24Z","eventType":"CHALLENGE_SENT","fromChannel":null,"toChannel":"PUSH","reason":"Initial routing to PUSH"}]'::jsonb,
    NOW() - INTERVAL '17 hours',
    NOW() + INTERVAL '4 days 7 hours',
    NOW() - INTERVAL '16 hours 58 minutes',
    NULL,
    NULL
),
-- Request 4: EXPIRED (Expiró sin firmar)
(
    '01938a23-5d6f-7e8b-c3d4-e5f6a7b8c9d0'::uuid,
    'CUST-004',
    'EXPIRED',
    '{"amount":{"amount":"3200.00","currency":"EUR"},"merchantId":"MERCHANT-004","orderId":"ORDER-004","description":"MediaMarkt - Electronics","hash":"abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"}'::jsonb,
    '[{"timestamp":"2025-11-27T19:58:24Z","eventType":"CHALLENGE_SENT","fromChannel":null,"toChannel":"SMS","reason":"Initial routing to SMS"}]'::jsonb,
    NOW() - INTERVAL '5 days 4 hours',
    NOW() - INTERVAL '4 hours',
    NULL,
    NULL,
    NULL
),
-- Request 5: FAILED (Error en proveedor)
(
    '01938a23-6e7a-7f9c-d4e5-f6a7b8c9d0e1'::uuid,
    'CUST-005',
    'FAILED',
    '{"amount":{"amount":"500.00","currency":"EUR"},"merchantId":"MERCHANT-005","orderId":"ORDER-005","description":"Apple Store - AirPods Pro","hash":"0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba"}'::jsonb,
    '[{"timestamp":"2025-12-01T14:58:24Z","eventType":"PROVIDER_FAILED","fromChannel":null,"toChannel":"SMS","reason":"Provider timeout during challenge send"}]'::jsonb,
    NOW() - INTERVAL '18 hours',
    NOW() + INTERVAL '4 days 6 hours',
    NULL,
    NULL,
    NULL
),
-- Request 6: ABORTED (Usuario canceló)
(
    '01938a23-7f8b-709d-e5f6-a7b8c9d0e1f2'::uuid,
    'CUST-006',
    'ABORTED',
    '{"amount":{"amount":"1200.00","currency":"EUR"},"merchantId":"MERCHANT-006","orderId":"ORDER-006","description":"El Corte Inglés - Fashion","hash":"1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"}'::jsonb,
    '[{"timestamp":"2025-11-30T21:58:24Z","eventType":"CHALLENGE_SENT","fromChannel":null,"toChannel":"VOICE","reason":"Initial routing to VOICE"}]'::jsonb,
    NOW() - INTERVAL '2 days 2 hours',
    NOW() + INTERVAL '2 days 22 hours',
    NULL,
    NOW() - INTERVAL '2 days 1 hour 55 minutes',
    'USER_CANCELLED'
);

-- ================================================================================
-- 4. SIGNATURE_CHALLENGE - Desafíos de firma
-- ================================================================================

INSERT INTO signature_challenge (
    id, signature_request_id, channel_type, provider, status, challenge_code,
    created_at, sent_at, completed_at, expires_at, provider_proof, error_code
) VALUES
-- Challenge para Request 1 (COMPLETED)
(
    gen_random_uuid(),
    '01938a23-2a3c-7b9e-9f8e-3a4b5c6d7e8f'::uuid,
    'SMS',
    'SMS',
    'COMPLETED',
    '123456',
    NOW() - INTERVAL '25 hours',
    NOW() - INTERVAL '25 hours',
    NOW() - INTERVAL '24 hours',
    NOW() + INTERVAL '4 days 23 hours',
    NULL,
    NULL
),
-- Challenge para Request 2 (PENDING - aún esperando)
(
    gen_random_uuid(),
    '01938a23-3b4d-7c8f-a1b2-c3d4e5f6a7b8'::uuid,
    'PUSH',
    'PUSH',
    'PENDING',
    '789012',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '59 minutes',
    NULL,
    NOW() + INTERVAL '4 days 23 hours',
    NULL,
    NULL
),
-- Challenge para Request 3 (COMPLETED)
(
    gen_random_uuid(),
    '01938a23-4c5e-7d9a-b2c3-d4e5f6a7b8c9'::uuid,
    'PUSH',
    'PUSH',
    'COMPLETED',
    '345678',
    NOW() - INTERVAL '17 hours',
    NOW() - INTERVAL '17 hours',
    NOW() - INTERVAL '16 hours 58 minutes',
    NOW() + INTERVAL '4 days 7 hours',
    NULL,
    NULL
),
-- Challenge para Request 4 (EXPIRED)
(
    gen_random_uuid(),
    '01938a23-5d6f-7e8b-c3d4-e5f6a7b8c9d0'::uuid,
    'SMS',
    'SMS',
    'EXPIRED',
    '901234',
    NOW() - INTERVAL '5 days 4 hours',
    NOW() - INTERVAL '5 days 4 hours',
    NULL,
    NOW() - INTERVAL '4 hours',
    NULL,
    NULL
),
-- Challenge para Request 5 (FAILED)
(
    gen_random_uuid(),
    '01938a23-6e7a-7f9c-d4e5-f6a7b8c9d0e1'::uuid,
    'SMS',
    'SMS',
    'FAILED',
    '567890',
    NOW() - INTERVAL '18 hours',
    NULL,
    NULL,
    NOW() + INTERVAL '4 days 6 hours',
    NULL,
    'PROVIDER_TIMEOUT'
),
-- Challenge para Request 6 (ABORTED)
(
    gen_random_uuid(),
    '01938a23-7f8b-709d-e5f6-a7b8c9d0e1f2'::uuid,
    'VOICE',
    'VOICE',
    'FAILED',
    '246810',
    NOW() - INTERVAL '2 days 2 hours',
    NOW() - INTERVAL '2 days 2 hours',
    NULL,
    NOW() + INTERVAL '2 days 22 hours',
    NULL,
    NULL
);

-- ================================================================================
-- 5. AUDIT_LOG - Registros de auditoría
-- ================================================================================

INSERT INTO audit_log (
    id, event_type, entity_type, entity_id, action, actor, actor_role,
    changes, created_at, trace_id, ip_address, user_agent
) VALUES
-- Firma completada (Request 1)
(
    gen_random_uuid(),
    'SIGNATURE_COMPLETED',
    'SIGNATURE_REQUEST',
    '01938a23-2a3c-7b9e-9f8e-3a4b5c6d7e8f'::uuid,
    'UPDATE',
    'CUST-001',
    'CUSTOMER',
    '{"status":{"from":"PENDING","to":"COMPLETED"},"signedAt":{"to":"2025-12-01T11:58:24Z"}}'::jsonb,
    NOW() - INTERVAL '24 hours',
    'trace-001-abc',
    '192.168.1.100',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
),
-- Firma completada (Request 3)
(
    gen_random_uuid(),
    'SIGNATURE_COMPLETED',
    'SIGNATURE_REQUEST',
    '01938a23-4c5e-7d9a-b2c3-d4e5f6a7b8c9'::uuid,
    'UPDATE',
    'CUST-003',
    'CUSTOMER',
    '{"status":{"from":"PENDING","to":"COMPLETED"},"signedAt":{"to":"2025-12-01T16:00:26Z"}}'::jsonb,
    NOW() - INTERVAL '16 hours 58 minutes',
    'trace-003-xyz',
    '192.168.1.102',
    'Mozilla/5.0 (Android 13; Mobile)'
),
-- Desafío expirado (Request 4)
(
    gen_random_uuid(),
    'SIGNATURE_EXPIRED',
    'SIGNATURE_REQUEST',
    '01938a23-5d6f-7e8b-c3d4-e5f6a7b8c9d0'::uuid,
    'UPDATE',
    'system',
    'SYSTEM',
    '{"status":{"from":"PENDING","to":"EXPIRED"},"expiredAt":{"to":"2025-12-02T19:58:24Z"}}'::jsonb,
    NOW() - INTERVAL '4 hours',
    'trace-system-004',
    NULL,
    'Spring Boot Scheduler'
),
-- Firma abortada (Request 6)
(
    gen_random_uuid(),
    'SIGNATURE_ABORTED',
    'SIGNATURE_REQUEST',
    '01938a23-7f8b-709d-e5f6-a7b8c9d0e1f2'::uuid,
    'UPDATE',
    'CUST-006',
    'CUSTOMER',
    '{"status":{"from":"PENDING","to":"ABORTED"},"abortReason":{"to":"USER_CANCELLED"}}'::jsonb,
    NOW() - INTERVAL '2 days 1 hour 55 minutes',
    'trace-006-def',
    '192.168.1.105',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
);

-- ================================================================================
-- 6. OUTBOX_EVENT - Eventos pendientes de publicación
-- ================================================================================

INSERT INTO outbox_event (
    id, aggregate_id, aggregate_type, event_type, payload,
    payload_hash, created_at, published_at
) VALUES
-- Evento: Signature completed
(
    gen_random_uuid(),
    '01938a23-2a3c-7b9e-9f8e-3a4b5c6d7e8f'::uuid,
    'SIGNATURE_REQUEST',
    'SignatureCompleted',
    '{"customerId":"CUST-001","transactionId":"TXN-2024-001","completedAt":"2025-12-01T11:58:24Z","channel":"SMS"}'::jsonb,
    'hash_001',
    NOW() - INTERVAL '24 hours',
    NOW() - INTERVAL '23 hours 59 minutes'
),
-- Evento pendiente: Signature pending (no publicado aún)
(
    gen_random_uuid(),
    '01938a23-3b4d-7c8f-a1b2-c3d4e5f6a7b8'::uuid,
    'SIGNATURE_REQUEST',
    'SignaturePending',
    '{"customerId":"CUST-002","transactionId":"TXN-2024-002","createdAt":"2025-12-02T09:58:24Z","channel":"PUSH"}'::jsonb,
    'hash_002',
    NOW() - INTERVAL '1 hour',
    NULL  -- Aún no publicado
);

-- ================================================================================
-- 7. IDEMPOTENCY_RECORD - Registros de idempotencia
-- ================================================================================

INSERT INTO idempotency_record (
    idempotency_key, request_hash, response_body, status_code,
    created_at, expires_at
) VALUES
(
    'idem-key-001-TXN-2024-001',
    'sha256-abc123def456',
    '{"signatureRequestId":"01938a23-2a3c-7b9e-9f8e-3a4b5c6d7e8f","status":"COMPLETED"}',
    200,
    NOW() - INTERVAL '24 hours',
    NOW() + INTERVAL '23 hours'
),
(
    'idem-key-002-TXN-2024-002',
    'sha256-xyz789ghi012',
    '{"signatureRequestId":"01938a23-3b4d-7c8f-a1b2-c3d4e5f6a7b8","status":"PENDING"}',
    200,
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '47 hours'
);

-- ================================================================================
-- 8. USER_PROFILE - Perfiles de usuarios (simulando logins previos)
-- ================================================================================

-- Crear tabla si no existe (Hibernate la crea, pero por si acaso)
CREATE TABLE IF NOT EXISTS user_profile (
    id UUID PRIMARY KEY,
    keycloak_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    roles JSONB DEFAULT '[]'::jsonb,
    department VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT true,
    first_login_at TIMESTAMP,
    last_login_at TIMESTAMP,
    login_count INTEGER NOT NULL DEFAULT 0,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Limpiar datos existentes
TRUNCATE TABLE user_profile CASCADE;

INSERT INTO user_profile (
    id, keycloak_id, username, email, full_name, first_name, last_name,
    roles, department, active, first_login_at, last_login_at, login_count,
    last_login_ip, created_at, updated_at
) VALUES
-- Admin user
(
    gen_random_uuid(),
    'kc-admin-001',
    'admin',
    'admin@singular.com',
    'Administrador Sistema',
    'Administrador',
    'Sistema',
    '["admin", "signature-admin"]'::jsonb,
    'IT',
    true,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '1 hour',
    156,
    '192.168.1.100',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '1 hour'
),
-- Operator users
(
    gen_random_uuid(),
    'kc-operator-001',
    'maria.garcia',
    'maria.garcia@singular.com',
    'María García López',
    'María',
    'García López',
    '["operator", "signature-operator"]'::jsonb,
    'Operaciones',
    true,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '2 hours',
    89,
    '192.168.1.101',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '2 hours'
),
(
    gen_random_uuid(),
    'kc-operator-002',
    'carlos.rodriguez',
    'carlos.rodriguez@singular.com',
    'Carlos Rodríguez Martín',
    'Carlos',
    'Rodríguez Martín',
    '["operator", "signature-operator"]'::jsonb,
    'Operaciones',
    true,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '5 hours',
    67,
    '192.168.1.102',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '5 hours'
),
(
    gen_random_uuid(),
    'kc-operator-003',
    'ana.martinez',
    'ana.martinez@singular.com',
    'Ana Martínez Sánchez',
    'Ana',
    'Martínez Sánchez',
    '["operator", "signature-operator"]'::jsonb,
    'Operaciones',
    true,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day',
    45,
    '192.168.1.103',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
),
-- Viewer users
(
    gen_random_uuid(),
    'kc-viewer-001',
    'pedro.sanchez',
    'pedro.sanchez@singular.com',
    'Pedro Sánchez Ruiz',
    'Pedro',
    'Sánchez Ruiz',
    '["viewer", "signature-viewer"]'::jsonb,
    'Auditoría',
    true,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '3 days',
    23,
    '192.168.1.104',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '3 days'
),
(
    gen_random_uuid(),
    'kc-viewer-002',
    'laura.fernandez',
    'laura.fernandez@singular.com',
    'Laura Fernández Gómez',
    'Laura',
    'Fernández Gómez',
    '["viewer", "signature-viewer"]'::jsonb,
    'Compliance',
    true,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '2 days',
    18,
    '192.168.1.105',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '2 days'
),
-- Inactive user (hasn't logged in recently)
(
    gen_random_uuid(),
    'kc-inactive-001',
    'jose.lopez',
    'jose.lopez@singular.com',
    'José López Torres',
    'José',
    'López Torres',
    '["viewer"]'::jsonb,
    'Soporte',
    false,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '90 days',
    5,
    '192.168.1.106',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '90 days'
);

-- ================================================================================
-- VERIFICACIÓN DE DATOS CARGADOS
-- ================================================================================

DO $$
DECLARE
    v_providers INT;
    v_routing_rules INT;
    v_requests INT;
    v_challenges INT;
    v_audit_logs INT;
    v_users INT;
    v_completed INT;
    v_pending INT;
    v_expired INT;
    v_failed INT;
    v_aborted INT;
BEGIN
    SELECT COUNT(*) INTO v_providers FROM provider_config;
    SELECT COUNT(*) INTO v_routing_rules FROM routing_rule WHERE deleted = false;
    SELECT COUNT(*) INTO v_requests FROM signature_request;
    SELECT COUNT(*) INTO v_challenges FROM signature_challenge;
    SELECT COUNT(*) INTO v_audit_logs FROM audit_log;
    SELECT COUNT(*) INTO v_users FROM user_profile;
    
    SELECT COUNT(*) INTO v_completed FROM signature_request WHERE status = 'SIGNED';
    SELECT COUNT(*) INTO v_pending FROM signature_request WHERE status = 'PENDING';
    SELECT COUNT(*) INTO v_expired FROM signature_request WHERE status = 'EXPIRED';
    SELECT COUNT(*) INTO v_failed FROM signature_request WHERE status = 'FAILED';
    SELECT COUNT(*) INTO v_aborted FROM signature_request WHERE status = 'ABORTED';
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'SEED DATA COMPLETADO';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Proveedores configurados:     %', v_providers;
    RAISE NOTICE 'Reglas de enrutamiento:       %', v_routing_rules;
    RAISE NOTICE 'Solicitudes de firma:         %', v_requests;
    RAISE NOTICE 'Desafíos de firma:            %', v_challenges;
    RAISE NOTICE 'Registros de auditoría:       %', v_audit_logs;
    RAISE NOTICE 'Perfiles de usuario:          %', v_users;
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'DISTRIBUCIÓN DE ESTADOS:';
    RAISE NOTICE '  COMPLETED: % requests', v_completed;
    RAISE NOTICE '  PENDING:   % requests', v_pending;
    RAISE NOTICE '  EXPIRED:   % requests', v_expired;
    RAISE NOTICE '  FAILED:    % requests', v_failed;
    RAISE NOTICE '  ABORTED:   % requests', v_aborted;
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
END $$;
