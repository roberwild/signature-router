# Solución: Base de Datos Aparentemente "Vacía"

## Problema Reportado

**Síntoma:** Al ejecutar `create-signature` desde Postman, la operación retorna HTTP 201 (éxito) pero las tablas parecen estar vacías.

## Diagnóstico

### ✅ La Base de Datos SÍ está Funcionando

**Evidencia:**
```sql
-- Tablas existentes (9 tablas creadas correctamente)
signature_request, signature_challenge, provider_config, etc.

-- Datos en signature_request: 1 registro
id: 019adc3e-5543-750b-b1ef-e04bc6247360
customer_id: 35fa49205f3cd3e0f5dc49cb7625801ea80f839f1e23c46ef434390814e2e4a0 (pseudonymized)
status: EXPIRED
created_at: 2025-12-01 23:27:43

-- Datos en signature_challenge: 1 registro (asociado al request anterior)
```

**Conclusión:** ✅ **Tu `create-signature` SÍ se guardó correctamente en la base de datos**

---

## Problema Real Identificado

### 🔴 Tabla `provider_config` Vacía (0 registros)

**Causa Raíz:**

En `application-local.yml` (línea 17):
```yaml
liquibase:
  enabled: false  # Temporalmente deshabilitado para desarrollo
```

**Implicaciones:**

1. **Hibernate DDL Auto (`ddl-auto: update`)** crea las tablas automáticamente
2. **PERO NO ejecuta los INSERTs de datos iniciales** de Liquibase
3. Los scripts Liquibase en `0015-provider-config-tables.yaml` insertan 4 providers iniciales:
   - Twilio SMS (enabled: true)
   - Firebase Cloud Messaging (enabled: true)
   - Twilio Voice (enabled: false)
   - Biometric Auth (enabled: false)

**Resultado:** Tablas creadas pero sin datos de seed ❌

---

## ¿Por Qué el Create Signature Funciona Entonces?

El backend usa **StubSmsProvider** (mock) cuando no hay providers reales configurados:

```yaml
# application-local.yml (línea 93)
providers:
  sms:
    stub: true  # true = usar StubSmsProvider (sin Twilio real)
```

**Flujo actual:**
1. POST /api/v1/signatures → ✅ Crea SignatureRequest
2. Routing Engine selecciona canal SMS → ✅ Funciona
3. ChallengeService crea challenge → ✅ Funciona
4. StubSmsProvider "envía" SMS → ✅ Funciona (mock, no envía nada real)
5. Datos persisten en DB → ✅ Funciona

**Por qué no ves el registro:**
- El signature request se creó hace tiempo (2025-12-01 23:27:43)
- Ya expiró (status: EXPIRED) - TTL de 3 minutos
- Si consultas la tabla ahora, solo verás ese 1 registro expirado

---

## Soluciones

### Opción 1: Habilitar Liquibase (RECOMENDADO)

**Ventaja:** Carga datos de seed automáticamente, sincroniza con producción

**Pasos:**

1. Editar `svc-signature-router/src/main/resources/application-local.yml`:
```yaml
liquibase:
  enabled: true  # Cambiar de false a true
```

2. Reiniciar el backend:
```powershell
# Si está corriendo en terminal, Ctrl+C y luego:
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

3. Verificar que se insertaron los providers:
```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT provider_code, provider_name, enabled FROM provider_config;"
```

**Esperado:**
```
 provider_code  |      provider_name        | enabled
----------------+---------------------------+---------
 twilio-sms     | Twilio SMS                | true
 fcm-push       | Firebase Cloud Messaging  | true
 twilio-voice   | Twilio Voice              | false
 biometric-auth | Biometric Authentication  | false
```

---

### Opción 2: Insertar Providers Manualmente (TEMPORAL)

**Ventaja:** Rápido para testing, no requiere reiniciar

**Comando SQL:**
```sql
-- Ejecutar en PostgreSQL
INSERT INTO provider_config (
  id, provider_type, provider_name, provider_code, 
  enabled, priority, timeout_seconds, retry_max_attempts, 
  config_json, vault_path, created_by
) VALUES 
(
  gen_random_uuid(), 
  'SMS', 
  'Twilio SMS', 
  'twilio-sms',
  true, 
  1, 
  5, 
  3, 
  '{"api_url": "https://api.twilio.com/2010-04-01", "from_number": "+1234567890"}',
  'secret/signature-router/providers/twilio-sms',
  'manual-insert'
);
```

**Ejecutar desde PowerShell:**
```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "INSERT INTO provider_config (id, provider_type, provider_name, provider_code, enabled, priority, timeout_seconds, retry_max_attempts, config_json, vault_path, created_by) VALUES (gen_random_uuid(), 'SMS', 'Twilio SMS', 'twilio-sms', true, 1, 5, 3, '{\"api_url\": \"https://api.twilio.com/2010-04-01\", \"from_number\": \"+1234567890\"}', 'secret/signature-router/providers/twilio-sms', 'manual-insert');"
```

---

### Opción 3: Usar Epic 13 API para Crear Providers

**Ventaja:** Prueba los endpoints CRUD de providers (Epic 13)

**Pasos:**

1. En Postman, ejecutar: **0. Authentication > Get Admin Token**
2. Luego ejecutar: **3. Provider Management > Create Provider - SMS (Twilio)**
3. Verificar en DB:
```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT COUNT(*) FROM provider_config;"
```

---

## Verificar que Todo Funciona

### 1. Crear Nueva Signature Request

```bash
# En Postman:
# 0. Authentication > Get Admin Token
# 2. Signature Requests > Create Signature Request - SMS (Admin)
```

### 2. Consultar en DB (debe aparecer PENDING o CHALLENGED)

```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT id, status, created_at, expires_at FROM signature_request ORDER BY created_at DESC LIMIT 5;"
```

**Esperado:**
```
                  id                  | status  |         created_at         |         expires_at
--------------------------------------+---------+----------------------------+----------------------------
 019adc45-xxxx-xxxx-xxxx-xxxxxxxxxxxx | PENDING | 2025-12-01 23:45:00.123... | 2025-12-01 23:48:00.123...
```

### 3. Verificar Challenge Creado

```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT id, channel_type, status, challenge_code FROM signature_challenge ORDER BY created_at DESC LIMIT 1;"
```

**Esperado:**
```
                  id                  | channel_type | status  | challenge_code
--------------------------------------+--------------+---------+----------------
 019adc45-yyyy-yyyy-yyyy-yyyyyyyyyyyy | SMS          | PENDING | 123456
```

---

## Resumen

### ❌ Lo que PENSABAS que estaba mal:
- "La base de datos está vacía"
- "Create signature no funciona"

### ✅ Lo que REALMENTE pasa:
1. **Base de datos funciona perfectamente** - crea y guarda registros
2. **Signature requests SÍ se guardan** - tienes 1 registro (expirado)
3. **El único problema:** Falta seed data de providers (tabla `provider_config` vacía)
4. **No afecta funcionalidad básica** porque usa StubSmsProvider (mock)

### 🎯 Acción Recomendada:

**Habilitar Liquibase** en `application-local.yml`:
```yaml
liquibase:
  enabled: true  # Cambiar aquí
```

Luego reiniciar el backend. Esto cargará los 4 providers de seed data automáticamente.

---

## Comandos Útiles de Diagnóstico

```powershell
# Ver todas las tablas
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "\dt"

# Contar registros en cada tabla
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "
SELECT 'signature_request' as tabla, COUNT(*) FROM signature_request
UNION ALL
SELECT 'signature_challenge', COUNT(*) FROM signature_challenge
UNION ALL
SELECT 'provider_config', COUNT(*) FROM provider_config
UNION ALL
SELECT 'routing_rule', COUNT(*) FROM routing_rule;
"

# Ver últimas signature requests
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "
SELECT id, status, created_at, expires_at 
FROM signature_request 
ORDER BY created_at DESC 
LIMIT 10;
"

# Ver providers configurados
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "
SELECT provider_code, provider_name, provider_type, enabled 
FROM provider_config;
"
```

---

**Conclusión:** Tu sistema está funcionando correctamente. Solo necesitas seed data de providers, que se soluciona habilitando Liquibase.

