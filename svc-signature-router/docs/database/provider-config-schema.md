# Provider Config Database Schema

**Epic:** Epic 13 - Providers CRUD Management  
**Story:** 13.1 - Database Schema & Migration  
**Fecha:** 30 de noviembre de 2025

---

## 📋 Overview

Este documento describe el esquema de base de datos para la gestión dinámica de providers, reemplazando la configuración estática en `application.yml`.

---

## 🗄️ Tablas

### 1. `provider_config`

**Propósito:** Almacenar configuración de providers de firma (SMS, PUSH, VOICE, BIOMETRIC)

**Schema:**

```sql
CREATE TABLE provider_config (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    
    -- Provider Identification
    provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('SMS', 'PUSH', 'VOICE', 'BIOMETRIC')),
    provider_name VARCHAR(100) NOT NULL,
    provider_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Configuration
    enabled BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL CHECK (priority > 0),
    timeout_seconds INTEGER NOT NULL CHECK (timeout_seconds > 0),
    retry_max_attempts INTEGER NOT NULL CHECK (retry_max_attempts >= 0),
    
    -- Provider-specific config (flexible JSONB)
    config_json JSONB NOT NULL,
    
    -- Vault Integration
    vault_path VARCHAR(500) NOT NULL,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
```

**Indexes:**

```sql
-- Single column indexes
CREATE INDEX idx_provider_config_type ON provider_config(provider_type);
CREATE INDEX idx_provider_config_enabled ON provider_config(enabled);
CREATE INDEX idx_provider_config_priority ON provider_config(priority);

-- Composite index for common query pattern
CREATE INDEX idx_provider_config_type_enabled_priority 
    ON provider_config(provider_type, enabled, priority);

-- GIN index for JSONB queries
CREATE INDEX idx_provider_config_json ON provider_config USING GIN (config_json);
```

**Example Data:**

```sql
INSERT INTO provider_config (
    id, provider_type, provider_name, provider_code,
    enabled, priority, timeout_seconds, retry_max_attempts,
    config_json, vault_path, created_by
) VALUES (
    uuidv7(), 
    'SMS', 
    'Twilio SMS', 
    'twilio-sms',
    true, 
    1, 
    5, 
    3,
    '{"api_url": "https://api.twilio.com/2010-04-01", "from_number": "+1234567890"}',
    'secret/signature-router/providers/twilio-sms',
    'admin@singularbank.com'
);
```

**Columnas Clave:**

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | UUID | Primary key (UUIDv7 time-sortable) | `01894d1a-7b2e-7890-abcd-ef1234567890` |
| `provider_type` | VARCHAR(20) | Tipo de provider | `SMS`, `PUSH`, `VOICE`, `BIOMETRIC` |
| `provider_name` | VARCHAR(100) | Nombre legible | `Twilio SMS Production` |
| `provider_code` | VARCHAR(50) | Código único programático | `twilio-sms-prod` |
| `enabled` | BOOLEAN | Habilitado/deshabilitado | `true` |
| `priority` | INTEGER | Prioridad para fallback (1 = mayor) | `1` |
| `timeout_seconds` | INTEGER | Timeout de API | `5` |
| `retry_max_attempts` | INTEGER | Intentos de retry | `3` |
| `config_json` | JSONB | Configuración específica | `{"api_url": "...", "from_number": "..."}` |
| `vault_path` | VARCHAR(500) | Path a credenciales en Vault | `secret/signature-router/providers/twilio-sms` |

---

### 2. `provider_config_history`

**Propósito:** Auditoría de cambios en configuración de providers

**Schema:**

```sql
CREATE TABLE provider_config_history (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    
    -- Foreign Key
    provider_config_id UUID NOT NULL,
    
    -- Action
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE', 'TEST')),
    
    -- Change Details
    changes_json JSONB,
    reason TEXT,
    
    -- Audit
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Context
    ip_address VARCHAR(50),
    user_agent VARCHAR(500)
);
```

**Indexes:**

```sql
CREATE INDEX idx_provider_history_config_id ON provider_config_history(provider_config_id);
CREATE INDEX idx_provider_history_action ON provider_config_history(action);
CREATE INDEX idx_provider_history_changed_at ON provider_config_history(changed_at DESC);
CREATE INDEX idx_provider_history_changed_by ON provider_config_history(changed_by);
CREATE INDEX idx_provider_history_changes_json ON provider_config_history USING GIN (changes_json);
```

**Example Data:**

```sql
INSERT INTO provider_config_history (
    id, provider_config_id, action, changes_json, 
    changed_by, changed_at, reason
) VALUES (
    uuidv7(),
    '01894d1a-7b2e-7890-abcd-ef1234567890',
    'UPDATE',
    '{"timeout_seconds": {"old": 5, "new": 10}, "retry_max_attempts": {"old": 3, "new": 5}}',
    'admin@singularbank.com',
    CURRENT_TIMESTAMP,
    'Increase timeout due to high latency observed in production'
);
```

---

## 🔄 Migración desde YAML

### Estado Actual (application.yml)

```yaml
providers:
  twilio:
    enabled: true
    timeout-seconds: 5
    retry-max-attempts: 3
    account-sid: ${TWILIO_ACCOUNT_SID}
    auth-token: ${TWILIO_AUTH_TOKEN}
    from-number: ${TWILIO_FROM_NUMBER}
    api-url: https://api.twilio.com/2010-04-01
```

### Estado Futuro (Database)

```sql
-- Provider config en BD
SELECT * FROM provider_config WHERE provider_code = 'twilio-sms';
-- Credenciales en Vault
-- Path: secret/signature-router/providers/twilio-sms
--   - account_sid: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
--   - auth_token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Script de Migración

El changeset `0015-provider-config-tables.yaml` incluye seeding automático en **dev** con 4 providers:

1. **Twilio SMS** - Habilitado
2. **FCM Push** - Habilitado
3. **Twilio Voice** - Deshabilitado (caro)
4. **Biometric** - Deshabilitado (stub)

**Nota:** En **UAT/PROD**, los providers deben crearse manualmente vía API o UI.

---

## 📊 Queries Comunes

### Listar providers habilitados por tipo

```sql
SELECT id, provider_name, provider_code, priority, timeout_seconds
FROM provider_config
WHERE provider_type = 'SMS' 
  AND enabled = true
ORDER BY priority ASC;
```

### Buscar provider por código

```sql
SELECT * FROM provider_config 
WHERE provider_code = 'twilio-sms';
```

### Obtener fallback chain para SMS

```sql
SELECT provider_code, priority, timeout_seconds
FROM provider_config
WHERE provider_type = 'SMS' 
  AND enabled = true
ORDER BY priority ASC;
```

### Historial de cambios de un provider

```sql
SELECT 
    action,
    changes_json,
    reason,
    changed_by,
    changed_at
FROM provider_config_history
WHERE provider_config_id = '01894d1a-7b2e-7890-abcd-ef1234567890'
ORDER BY changed_at DESC
LIMIT 10;
```

### Búsqueda en config_json

```sql
-- Providers con api_url específica
SELECT provider_name, config_json
FROM provider_config
WHERE config_json->>'api_url' = 'https://api.twilio.com/2010-04-01';

-- Providers con from_number
SELECT provider_name, config_json->>'from_number' as from_number
FROM provider_config
WHERE config_json ? 'from_number';
```

---

## 🔒 Seguridad

### Credenciales en Vault

❌ **NO almacenar credenciales en BD:**
```sql
-- MAL - Nunca hacer esto
INSERT INTO provider_config (config_json) 
VALUES ('{"auth_token": "secret123"}');
```

✅ **Sí almacenar en Vault:**
```sql
-- BIEN - Solo referencia a Vault
INSERT INTO provider_config (vault_path) 
VALUES ('secret/signature-router/providers/twilio-sms');
```

### RBAC

Solo usuarios con rol `ADMIN` pueden:
- Crear providers
- Modificar providers
- Eliminar providers (soft delete)
- Ver credenciales en Vault

---

## 📈 Performance

### Índices Optimizados

1. **idx_provider_config_type_enabled_priority**
   - Optimiza query: "Dame providers SMS habilitados ordenados por prioridad"
   - Usado en fallback chain

2. **idx_provider_config_json (GIN)**
   - Optimiza búsquedas en config_json
   - Ejemplo: Buscar providers por api_url

3. **idx_provider_history_changed_at (DESC)**
   - Optimiza audit queries (más reciente primero)

### Tamaño Estimado

| Tabla | Rows (estimado) | Size |
|-------|-----------------|------|
| `provider_config` | ~10-50 | < 100 KB |
| `provider_config_history` | ~1000-10000/año | ~1-10 MB/año |

---

## 🧪 Testing

### Validar Schema

```sql
-- Verificar tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'provider_config';

-- Verificar columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'provider_config'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'provider_config';

-- Verificar indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'provider_config';
```

### Validar Seeding (DEV)

```sql
-- Debe retornar 4 providers
SELECT count(*) FROM provider_config;

-- Verificar tipos
SELECT provider_type, count(*) 
FROM provider_config 
GROUP BY provider_type;

-- Verificar habilitados
SELECT provider_code, enabled 
FROM provider_config;
```

---

## 📝 Rollback

Si necesitas hacer rollback:

```sql
-- Manual rollback
DROP TABLE IF EXISTS provider_config_history CASCADE;
DROP TABLE IF EXISTS provider_config CASCADE;
```

O usando LiquidBase:

```bash
./mvnw liquibase:rollback -Dliquibase.rollbackCount=1
```

---

## 🔗 Related Documentation

- [Epic 13: Providers CRUD Management](../epics/epic-13-providers-crud-management.md)
- [Story 13.1: Database Schema](../epics/epic-13-providers-crud-management.md#story-131)
- [Database Migrations Guide](../development/database-migrations.md)
- [Vault Integration](../security/vault-integration.md)

---

**Documento creado:** 30 de noviembre de 2025  
**Última actualización:** 30 de noviembre de 2025  
**Owner:** Dev Team  
**Status:** ✅ Implementado (Story 13.1)

