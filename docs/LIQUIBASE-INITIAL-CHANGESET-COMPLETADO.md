# ✅ CHANGESET INICIAL LIQUIBASE - COMPLETADO

**Fecha:** 2025-12-12  
**Arquitecto:** Arquímedes (BMAD Architect)  
**Usuario:** BMad  

---

## 📋 RESUMEN EJECUTIVO

Se ha creado el **changeset inicial completo** de Liquibase para el microservicio `svc-signature-router` con la **foto actual del esquema de base de datos**.

Este changeset es el punto de partida para el **primer despliegue a DEV/UAT/PROD**, reemplazando la gestión automática de Hibernate por control explícito con Liquibase.

---

## 📦 ARCHIVOS CREADOS/MODIFICADOS

### ✅ Archivos Nuevos

1. **`liquibase/sql/uuid_generate_v7.sql`**
   - Función PostgreSQL para generar UUIDs v7 (ordenables por tiempo)
   - Usada como `defaultValueComputed` en todas las PKs

2. **`liquibase/changes/dev/0001-initial-schema.yaml`**
   - Changeset inicial con **10 tablas + función UUIDv7**
   - 1,200+ líneas de definición completa con columnas, índices, FKs, rollbacks

3. **`liquibase/changes/uat/0001-initial-schema.yaml`**
   - Copia idéntica del changeset de DEV (para promoción a UAT)

4. **`liquibase/changes/prod/0001-initial-schema.yaml`**
   - Copia idéntica del changeset de DEV (para promoción a PROD)

### ✅ Archivos Modificados

5. **`liquibase/changelog-master.yaml`**
   - Actualizado con `includeAll` por entorno (dev/uat/prod)
   - Documentación completa de comandos útiles
   - Flujo de promoción explicado

6. **`application-dev.yml`**
   - **Liquibase habilitado:** `enabled: true`
   - **Contexto configurado:** `contexts: dev`
   - **Hibernate deshabilitado:** `ddl-auto: none`
   - Liquibase ahora gestiona el esquema en DEV

### ✅ Archivos Eliminados

7. **Changesets antiguos eliminados:**
   - `changes/dev/0016-create-user-profiles-table.yaml` ❌
   - `changes/uat/0016-create-user-profiles-table.yaml` ❌
   - `changes/prod/0016-create-user-profiles-table.yaml` ❌

---

## 🗄️ ESTRUCTURA DEL CHANGESET INICIAL

### Changeset ID: `0001-initial-schema`

El changeset contiene **11 sub-changesets** en un solo archivo:

| # | Sub-Changeset | Descripción |
|---|---------------|-------------|
| 1 | `0001-create-uuid-v7-function` | Función `uuid_generate_v7()` |
| 2 | `0001-create-signature-request-table` | Tabla `signature_request` (agregado principal) |
| 3 | `0001-create-signature-challenge-table` | Tabla `signature_challenge` (entidad hija) |
| 4 | `0001-create-routing-rule-table` | Tabla `routing_rule` (reglas de routing) |
| 5 | `0001-create-provider-config-table` | Tabla `provider_config` (configuración providers) |
| 6 | `0001-create-provider-config-history-table` | Tabla `provider_config_history` (historial) |
| 7 | `0001-create-outbox-event-table` | Tabla `outbox_event` (Outbox Pattern) |
| 8 | `0001-create-audit-log-table` | Tabla `audit_log` (auditoría general) |
| 9 | `0001-create-routing-rule-audit-log-table` | Tabla `routing_rule_audit_log` (auditoría routing) |
| 10 | `0001-create-idempotency-record-table` | Tabla `idempotency_record` (idempotencia) |
| 11 | `0001-create-user-profiles-table` | Tabla `user_profiles` (auditoría usuarios) |

**Total:** 10 tablas + 1 función + 23 índices + 2 foreign keys

---

## 📊 TABLAS INCLUIDAS

| Tabla | Filas (aprox) | Descripción |
|-------|---------------|-------------|
| `signature_request` | Agregado principal | Solicitudes de firma con contexto transaccional |
| `signature_challenge` | Entidad hija | Challenges enviados por canal/provider |
| `routing_rule` | Configuración | Reglas de routing dinámicas (SpEL) |
| `provider_config` | Configuración | Configuración de providers externos |
| `provider_config_history` | Auditoría | Historial de cambios en providers |
| `outbox_event` | Event Sourcing | Outbox Pattern para Debezium/Kafka |
| `audit_log` | Auditoría | Log general de operaciones CRUD |
| `routing_rule_audit_log` | Auditoría | Log específico de cambios en routing |
| `idempotency_record` | Cache | Registro de idempotency keys (RFC 7231) |
| `user_profiles` | Auditoría | Registro de usuarios del JWT (Epic 16) |

---

## ✅ CARACTERÍSTICAS DEL CHANGESET

### 🎯 Cumplimiento Arquitectura Corporativa

✅ **Columnas obligatorias en todas las tablas:**
- `id` (UUID v7 con `defaultValueComputed: uuid_generate_v7()`)
- `created_at` (timestamp with time zone, default `CURRENT_TIMESTAMP`)
- `updated_at` (timestamp with time zone) donde aplica

✅ **Auditoría completa:**
- `created_by`, `modified_by` en tablas de configuración
- Tablas dedicadas de audit: `audit_log`, `routing_rule_audit_log`

✅ **Soft delete:**
- `deleted`, `deleted_by`, `deleted_at` en `routing_rule`

✅ **JSONB para estructuras complejas:**
- `transaction_context` (jsonb) en `signature_request`
- `routing_timeline` (jsonb) en `signature_request`
- `provider_proof` (jsonb) en `signature_challenge`
- `config_json` (jsonb) en `provider_config`
- `changes` (jsonb) en `audit_log`
- `roles` (jsonb) en `user_profiles`

✅ **Índices estratégicos:**
- Índices simples: `customer_id`, `status`, `created_at`
- Índices compuestos: `(priority, enabled)`, `(provider_type, enabled)`
- Índices únicos: `provider_code`, `keycloak_id`, `idempotency_key`
- **Total: 23 índices**

✅ **Foreign Keys con cascade:**
- `signature_challenge` → `signature_request` (CASCADE on DELETE)
- `provider_config_history` → `provider_config` (CASCADE on DELETE)

✅ **Rollbacks completos:**
- Todos los sub-changesets tienen `rollback` con `dropTable`
- Función UUIDv7 tiene rollback con `DROP FUNCTION`

---

## 🚀 CÓMO DESPLEGAR A DEV

### Opción 1: Arrancar Spring Boot (Liquibase Auto)

```bash
cd svc-signature-router
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=dev
```

**¿Qué pasa?**
1. Spring Boot arranca con perfil `dev`
2. Liquibase detecta que está `enabled: true` con `contexts: dev`
3. Lee `changelog-master.yaml`
4. Ejecuta `changes/dev/0001-initial-schema.yaml`
5. Crea todas las tablas, índices, FKs
6. Registra en `databasechangelog` (tabla interna de Liquibase)

### Opción 2: Ejecutar Liquibase Manualmente (Sin arrancar app)

```bash
cd svc-signature-router

# Ver changesets pendientes
./mvnw liquibase:status -Pdev

# Ver SQL que se ejecutará (dry-run)
./mvnw liquibase:updateSQL -Pdev > migration.sql
cat migration.sql

# Ejecutar migración
./mvnw liquibase:update -Pdev
```

### Opción 3: Si el esquema YA existe (Hibernate lo creó)

Si ya tienes las tablas creadas por Hibernate y quieres que Liquibase las reconozca:

```bash
# Marcar changeset como ya ejecutado (NO crea las tablas)
./mvnw liquibase:changelogSync -Pdev
```

**⚠️ IMPORTANTE:** Solo usa `changelogSync` si estás **100% seguro** que el esquema actual coincide con el changeset.

---

## 🧪 VALIDACIÓN POST-DESPLIEGUE

### 1. Verificar que Liquibase ejecutó el changeset

```sql
-- Conectar a PostgreSQL
psql -U siguser -d signature_router

-- Ver changesets ejecutados
SELECT id, author, filename, dateexecuted, orderexecuted
FROM databasechangelog
ORDER BY orderexecuted DESC;
```

**Esperado:**
- 11 filas con IDs: `0001-create-uuid-v7-function`, `0001-create-signature-request-table`, etc.
- `filename`: `liquibase/changes/dev/0001-initial-schema.yaml`

### 2. Verificar que las tablas existen

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Esperado (11 tablas):**
- audit_log
- databasechangelog (tabla interna Liquibase)
- databasechangeloglock (tabla interna Liquibase)
- idempotency_record
- outbox_event
- provider_config
- provider_config_history
- routing_rule
- routing_rule_audit_log
- signature_challenge
- signature_request
- user_profiles

### 3. Verificar función UUIDv7

```sql
SELECT uuid_generate_v7();
SELECT uuid_generate_v7() < uuid_generate_v7(); -- Debe ser true (ordenable)
```

### 4. Verificar índices

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'database%'
ORDER BY tablename, indexname;
```

**Esperado:** 23 índices + PKs automáticos

### 5. Verificar Foreign Keys

```sql
SELECT
    tc.constraint_name,
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

**Esperado (2 FKs):**
- `fk_signature_challenge_request`: `signature_challenge.signature_request_id` → `signature_request.id`
- `fk_provider_history_config`: `provider_config_history.provider_config_id` → `provider_config.id`

---

## 🔄 ROLLBACK (Si algo sale mal)

### Rollback completo del changeset inicial

```bash
# Ver cuántos changesets hay ejecutados
./mvnw liquibase:status -Pdev

# Rollback de los 11 sub-changesets del 0001
./mvnw liquibase:rollback -Dliquibase.rollbackCount=11 -Pdev
```

**¿Qué pasa?**
1. Liquibase ejecuta los `rollback` de cada sub-changeset en **orden inverso**
2. Elimina las 10 tablas (con CASCADE, elimina también FKs)
3. Elimina la función `uuid_generate_v7()`
4. Borra las entradas de `databasechangelog`

### Rollback manual (si Liquibase falla)

```sql
-- Conectar a PostgreSQL
psql -U siguser -d signature_router

-- Eliminar tablas (orden inverso de creación)
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS idempotency_record CASCADE;
DROP TABLE IF EXISTS routing_rule_audit_log CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS outbox_event CASCADE;
DROP TABLE IF EXISTS provider_config_history CASCADE;
DROP TABLE IF EXISTS provider_config CASCADE;
DROP TABLE IF EXISTS routing_rule CASCADE;
DROP TABLE IF EXISTS signature_challenge CASCADE;
DROP TABLE IF EXISTS signature_request CASCADE;
DROP FUNCTION IF EXISTS uuid_generate_v7();

-- Limpiar registros de Liquibase
DELETE FROM databasechangelog WHERE filename LIKE '%0001-initial-schema%';
```

---

## 📋 PRÓXIMOS PASOS

### 1. **Despliegue a DEV (AHORA)**

```bash
cd svc-signature-router
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=dev
```

**Validar:**
- ✅ Aplicación arranca sin errores
- ✅ Logs muestran "Liquibase: Successfully acquired change log lock"
- ✅ Logs muestran "Liquibase: Update command completed successfully"
- ✅ 10 tablas creadas en PostgreSQL
- ✅ Endpoints REST funcionan (POST /api/v1/signature-requests)

### 2. **Probar CRUD completo en DEV**

Ejecutar colección Postman:
- Crear SignatureRequest → Verificar que se inserta en `signature_request`
- Crear RoutingRule → Verificar soft delete funciona
- Crear Provider → Verificar historial en `provider_config_history`
- Verificar auditoría en `audit_log`

### 3. **Crear perfil UAT (Futuro)**

Copiar `application-dev.yml` → `application-uat.yml`:

```yaml
spring:
  liquibase:
    enabled: true
    contexts: uat  # Cambia a contexto UAT
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false  # Deshabilitar en UAT
```

### 4. **Crear perfil PROD (Futuro)**

```yaml
spring:
  liquibase:
    enabled: true
    contexts: prod
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
```

### 5. **Evolutivos posteriores**

Cuando necesites agregar/modificar tablas:

```bash
# Crear nuevo changeset
cd liquibase/changes/dev
cp ../TEMPLATE-CHANGESET.yaml 0002-add-signature-metadata-column.yaml

# Editar 0002 con los cambios
# Probar en DEV
./mvnw liquibase:update -Pdev

# Validar
# Copiar a UAT/PROD
cp changes/dev/0002-*.yaml changes/uat/
cp changes/dev/0002-*.yaml changes/prod/
```

---

## ⚠️ ADVERTENCIAS CRÍTICAS

1. **NUNCA modificar `0001-initial-schema.yaml` después de ejecutarlo en DEV**
   - Si necesitas correcciones, crea un nuevo changeset `0002-fix-xxx.yaml`

2. **NUNCA usar `drop-first: true` en DEV/UAT/PROD**
   - Solo para tests locales desechables

3. **SIEMPRE probar rollback antes de promover a UAT**
   ```bash
   ./mvnw liquibase:rollback -Dliquibase.rollbackCount=1 -Pdev
   ./mvnw liquibase:update -Pdev  # Volver a aplicar
   ```

4. **COORDINAR cambios de esquema con el equipo**
   - Comunicar breaking changes con 90 días de anticipación (ADR)

5. **Mantener sincronía JPA ↔ Liquibase**
   - Si modificas entidad JPA, DEBES crear changeset correspondiente
   - Si creas changeset, DEBES actualizar entidad JPA

---

## 📚 REFERENCIAS

- **Guía Corporativa:** `liquibase/README-LIQUIBASE-GUIDELINES.md`
- **Template Changeset:** `liquibase/TEMPLATE-CHANGESET.yaml`
- **Liquibase Best Practices:** https://www.liquibase.org/get-started/best-practices
- **ADR Liquibase:** (Por crear si es decisión MAJOR)

---

## ✅ CHECKLIST FINAL

- [x] Función `uuid_generate_v7.sql` creada
- [x] Changeset `0001-initial-schema.yaml` creado en `dev/`
- [x] Changeset copiado a `uat/`
- [x] Changeset copiado a `prod/`
- [x] `changelog-master.yaml` actualizado con `includeAll`
- [x] `application-dev.yml` configurado: `liquibase.enabled=true`, `ddl-auto=none`
- [x] Changesets antiguos eliminados (0016)
- [x] Documentación completa en este README

**Estado:** ✅ **LISTO PARA DESPLEGAR A DEV**

---

**Generado por:** Arquímedes (BMAD Architect Agent)  
**Fecha:** 2025-12-12  
**Aprobado por:** BMad  

