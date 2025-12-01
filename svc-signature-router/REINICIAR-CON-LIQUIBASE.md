# Reiniciar Backend con Liquibase Habilitado

## Cambios Realizados

✅ **`application-local.yml` actualizado:**

```yaml
liquibase:
  enabled: true  # ← HABILITADO
  change-log: classpath:liquibase/changelog-master.yaml
  contexts: local,dev

jpa:
  hibernate:
    ddl-auto: validate  # ← Cambiado de 'update' a 'validate'
```

## Pasos para Reiniciar

### 1. Detener el Backend Actual

Si está corriendo en una terminal:
```powershell
# Presiona Ctrl+C en la terminal donde corre el backend
```

### 2. Reiniciar el Backend

```powershell
cd svc-signature-router
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 3. Verificar que Liquibase se Ejecutó

Busca en los logs estas líneas:
```
[main] liquibase.changelog: Reading from signature_router.databasechangelog
[main] liquibase.changelog: Running Changeset: changes/dev/0015-provider-config-tables.yaml::13.1-seed-providers::system
[main] liquibase.changelog: Successfully acquired change log lock
```

### 4. Verificar Providers en DB

```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT provider_code, provider_name, enabled FROM provider_config;"
```

**Esperado (4 providers):**
```
 provider_code  |      provider_name        | enabled
----------------+---------------------------+---------
 twilio-sms     | Twilio SMS                | t
 fcm-push       | Firebase Cloud Messaging  | t
 twilio-voice   | Twilio Voice              | f
 biometric-auth | Biometric Authentication  | f
(4 rows)
```

### 5. Probar Create Signature

En Postman:
1. `0. Authentication > Get Admin Token`
2. `2. Signature Requests > Create Signature Request - SMS (Admin)`

Deberías recibir HTTP 201 con response:
```json
{
  "id": "019adc...",
  "status": "PENDING",
  "expiresAt": "2025-12-01T23:51:00Z",
  "activeChallenge": {
    "id": "019adc...",
    "channelType": "SMS",
    "status": "PENDING"
  }
}
```

### 6. Verificar en DB

```powershell
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "SELECT id, status, created_at FROM signature_request ORDER BY created_at DESC LIMIT 1;"
```

## Troubleshooting

### Problema: "Validation failed: schema does not match"

**Causa:** Las tablas ya existen (creadas por Hibernate) y Liquibase intenta crearlas de nuevo.

**Solución 1 - Limpiar y recrear DB (RECOMENDADO):**
```powershell
# Detener backend (Ctrl+C)

# Eliminar y recrear base de datos
docker exec -it signature-router-postgres psql -U postgres -c "DROP DATABASE signature_router;"
docker exec -it signature-router-postgres psql -U postgres -c "CREATE DATABASE signature_router OWNER siguser;"

# Reiniciar backend (Liquibase creará todo desde cero)
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**Solución 2 - Marcar changesets como ejecutados:**
```powershell
# Marcar todos los changesets como ya ejecutados (sin ejecutarlos)
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "
CREATE TABLE IF NOT EXISTS databasechangelog (
  id VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  dateexecuted TIMESTAMP NOT NULL,
  orderexecuted INT NOT NULL,
  exectype VARCHAR(10) NOT NULL,
  md5sum VARCHAR(35),
  description VARCHAR(255),
  comments VARCHAR(255),
  tag VARCHAR(255),
  liquibase VARCHAR(20),
  contexts VARCHAR(255),
  labels VARCHAR(255),
  deployment_id VARCHAR(10)
);
"
```

Luego reiniciar el backend. Liquibase detectará que las tablas ya existen y solo ejecutará los INSERTs faltantes.

### Problema: Liquibase se ejecuta pero providers siguen en 0

Verifica el contexto en los logs:
```
[main] liquibase.changelog: Contexts: local,dev
```

Si no aparece, verifica que `application-local.yml` tenga:
```yaml
liquibase:
  contexts: local,dev
```

## Notas Importantes

1. **Hibernate `ddl-auto: validate`** - Ahora Hibernate solo valida el schema, NO lo modifica
2. **Liquibase gestiona migraciones** - Todos los cambios de schema deben hacerse vía Liquibase
3. **Seed data automático** - Los 4 providers se cargan automáticamente al arrancar
4. **Changelog tracking** - Liquibase registra en `databasechangelog` qué changesets se ejecutaron

## Verificación Completa del Sistema

```powershell
# 1. Verificar tablas creadas
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "\dt"

# 2. Contar registros en cada tabla
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "
SELECT 'provider_config' as tabla, COUNT(*) as registros FROM provider_config
UNION ALL
SELECT 'signature_request', COUNT(*) FROM signature_request
UNION ALL
SELECT 'routing_rule', COUNT(*) FROM routing_rule
ORDER BY tabla;
"

# 3. Ver changesets ejecutados por Liquibase
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "
SELECT id, author, filename, dateexecuted 
FROM databasechangelog 
WHERE filename LIKE '%0015-provider-config%'
ORDER BY dateexecuted DESC;
"
```

---

**¡Listo!** Una vez reiniciado, tendrás:
- ✅ Liquibase habilitado y ejecutándose
- ✅ 4 providers de seed data cargados
- ✅ Schema gestionado profesionalmente (igual que en UAT/PROD)
- ✅ Create signature funcionando con datos reales

