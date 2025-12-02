# Datos de Prueba - Signature Router

## Descripción

Este directorio contiene scripts para cargar datos de prueba realistas en la base de datos PostgreSQL, diseñados para validar la funcionalidad completa del frontend y backend.

## Archivos

- **`seed-test-data.sql`** - Script SQL con todos los datos de prueba
- **`load-test-data.ps1`** - Script PowerShell para ejecutar la carga (Windows)

## Contenido de los Datos

### 1. Proveedores (7 registros)

#### SMS Providers
- **Twilio SMS** (habilitado, prioridad 1)
- **AWS SNS** (habilitado, prioridad 2)

#### PUSH Providers
- **Firebase Cloud Messaging** (habilitado, prioridad 1)
- **OneSignal** (deshabilitado, prioridad 2)

#### VOICE Providers
- **Twilio Voice** (habilitado, prioridad 1)

#### BIOMETRIC Providers
- **BioCatch** (deshabilitado, stub)

### 2. Reglas de Enrutamiento (6 reglas)

- SMS Premium - Twilio (habilitada)
- PUSH Alta Disponibilidad (habilitada)
- VOICE Backup AWS (habilitada)
- SMS Horario Nocturno (habilitada)
- Transacciones Alto Valor (habilitada)
- Clientes Corporativos (deshabilitada)

### 3. Solicitudes de Firma (30 requests)

#### Estados Distribuidos:
- **COMPLETED** (6 requests) - Firmas completadas exitosamente
- **PENDING** (5 requests) - Esperando respuesta del usuario
- **EXPIRED** (5 requests) - Tiempo agotado sin respuesta
- **FAILED** (5 requests) - Fallo en proveedores
- **ABORTED** (9 requests) - Canceladas por usuario o sistema

#### Canales Variados:
- SMS (Twilio, AWS SNS)
- PUSH (FCM, OneSignal)
- VOICE (Twilio Voice)

#### Clientes:
- **PREMIUM** (~30%) - Mayor valor de transacciones
- **STANDARD** (~70%) - Transacciones regulares

#### Rangos de Tiempo:
- Datos desde hace 4 días hasta 30 minutos atrás
- Algunos PENDING activos (expiran en ~4 minutos)

### 4. Desafíos de Firma (8+ challenges)

Relacionados con las signature requests:
- Challenges COMPLETED con `provider_proof`
- Challenges SENT pendientes
- Challenges EXPIRED sin completar
- Challenges FAILED con `error_code`
- Challenges ABORTED por usuario

### 5. Logs de Auditoría (11+ registros)

- Eventos de firma completada
- Cambios de configuración de proveedores
- Acciones administrativas

### 6. Eventos Outbox (2 registros)

- Eventos publicados
- Eventos pendientes de publicación

### 7. Registros de Idempotencia (2 registros)

- Keys de idempotencia activas
- TTL configurado

## Uso

### Opción 1: Script PowerShell (Recomendado para Windows)

```powershell
# Desde la raíz del proyecto backend
cd svc-signature-router
.\scripts\load-test-data.ps1
```

El script:
1. ✅ Verifica que Docker esté corriendo
2. ✅ Verifica que PostgreSQL esté activo
3. ⚠️ Solicita confirmación (elimina datos existentes)
4. 📊 Carga todos los datos de prueba
5. 📋 Muestra resumen de datos insertados

### Opción 2: Ejecución Manual con Docker

```bash
# Desde la raíz del proyecto
docker exec -i signature-router-postgres psql -U siguser -d signature_router < svc-signature-router/scripts/seed-test-data.sql
```

### Opción 3: Conexión directa a PostgreSQL

```bash
psql -h localhost -p 5432 -U siguser -d signature_router -f svc-signature-router/scripts/seed-test-data.sql
```

## Validación

Después de cargar los datos, verifica:

```sql
-- Contar registros por tabla
SELECT 'provider_config' as tabla, COUNT(*) as registros FROM provider_config
UNION ALL
SELECT 'routing_rule', COUNT(*) FROM routing_rule
UNION ALL
SELECT 'signature_request', COUNT(*) FROM signature_request
UNION ALL
SELECT 'signature_challenge', COUNT(*) FROM signature_challenge
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log;

-- Ver distribución de estados
SELECT status, COUNT(*) as cantidad
FROM signature_request
GROUP BY status
ORDER BY cantidad DESC;

-- Ver proveedores habilitados
SELECT provider_name, provider_type, enabled, priority
FROM provider_config
ORDER BY priority;
```

## Pantallas del Frontend que Utilizan Estos Datos

### 1. `/admin/signatures` - Gestión de Firmas
- Lista todas las signature requests
- Filtros por estado (COMPLETED, PENDING, EXPIRED, FAILED, ABORTED)
- Filtros por canal (SMS, PUSH, VOICE)
- Filtros por fechas
- Detalle de cada request con timeline de routing
- Exportación a CSV

### 2. `/admin/providers` - Gestión de Proveedores
- Lista de proveedores configurados
- Estado de salud (healthy, degraded, down)
- Métricas: uptime, response time, success rate
- Circuit breaker status
- Costos por request

### 3. `/admin/rules` - Reglas de Enrutamiento
- Lista de reglas configuradas
- Condiciones SpEL
- Prioridades
- Habilitadas/deshabilitadas
- Estadísticas de ejecución

### 4. `/admin/metrics` - Dashboard de Métricas
- Requests por estado
- Distribución por canal
- Success rate por proveedor
- Timeline de actividad

## Notas Importantes

### ⚠️ ADVERTENCIA
Este script **ELIMINA todos los datos existentes** antes de cargar los datos de prueba. Úsalo solo en entornos de desarrollo local.

### 🔄 Recarga de Datos
Puedes ejecutar el script múltiples veces. Cada ejecución:
1. Limpia todas las tablas (TRUNCATE CASCADE)
2. Carga datos frescos
3. Genera IDs únicos (UUID)

### 🎲 Datos Aleatorios
Algunos datos se generan con valores aleatorios para mayor realismo:
- Importes de transacciones
- IPs de auditoría
- Timestamps dentro de rangos definidos
- Customer IDs con tiers variados

### 📊 Datos para Testing del Frontend
Los datos incluyen:
- ✅ Todos los estados posibles de signature request
- ✅ Todos los tipos de canal (SMS, PUSH, VOICE, BIOMETRIC)
- ✅ Proveedores habilitados y deshabilitados
- ✅ Reglas activas e inactivas
- ✅ Challenges con diferentes outcomes
- ✅ Timeline de routing completos
- ✅ Logs de auditoría recientes

### 🔍 Próximos Pasos

Después de cargar los datos:

1. **Backend**: Ya está listo con datos
2. **Frontend**: Arranca el admin portal
   ```bash
   cd app-signature-router-admin
   npm run dev
   ```
3. **Prueba las pantallas**:
   - http://localhost:3000/admin/signatures
   - http://localhost:3000/admin/providers
   - http://localhost:3000/admin/rules
   - http://localhost:3000/admin/metrics

4. **Valida funcionalidad**:
   - Filtros en signatures page
   - Visualización de timeline
   - Exportación de datos
   - Gráficos y métricas
   - CRUD de providers
   - CRUD de rules

## Troubleshooting

### Error: "relation does not exist"
El esquema de BD no está creado. Asegúrate que:
1. Hibernate esté en `ddl-auto: update` (perfil local)
2. El backend haya arrancado al menos una vez

### Error: "Docker no está corriendo"
Inicia Docker Desktop antes de ejecutar el script.

### Error: "Contenedor no encontrado"
Inicia los contenedores:
```bash
cd svc-signature-router
docker-compose up -d
```

### Los datos no aparecen en el frontend
1. Verifica que el backend esté corriendo
2. Revisa la configuración de API en el frontend
3. Comprueba la consola del navegador (F12) para errores

