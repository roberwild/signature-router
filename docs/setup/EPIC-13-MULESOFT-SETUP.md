# Epic 13: MuleSoft Integration - Setup & Configuration Guide

**Fecha:** 5 de diciembre de 2025  
**Audiencia:** DevOps, Backend Developers  
**Prerequisitos:** Epic 13 implementado

---

## 📋 Tabla de Contenidos

1. [Variables de Entorno](#variables-de-entorno)
2. [MuleSoft Configuration](#mulesoft-configuration)
3. [Database Setup](#database-setup)
4. [Scheduled Tasks](#scheduled-tasks)
5. [Health Checks](#health-checks)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Variables de Entorno

### **Obligatorias**

```bash
# MuleSoft Base URL
MULESOFT_BASE_URL=https://api.mulesoft.singular.com

# MuleSoft OAuth2 Credentials
MULESOFT_CLIENT_ID=signature-router-client
MULESOFT_CLIENT_SECRET=<secret-from-vault>

# Database (si no está ya configurado)
DATABASE_URL=jdbc:postgresql://postgres:5432/signature_router
DATABASE_USERNAME=siguser
DATABASE_PASSWORD=<password-from-vault>
```

### **Opcionales (con defaults)**

```bash
# MuleSoft Timeouts
MULESOFT_TIMEOUT_SECONDS=10          # Default: 10
MULESOFT_RETRY_MAX_ATTEMPTS=3        # Default: 3

# Sync Schedule
PROVIDER_SYNC_INTERVAL_MS=300000     # Default: 5 min (300000 ms)
PROVIDER_HEALTH_CHECK_INTERVAL_MS=60000  # Default: 1 min (60000 ms)

# Feature Flags
PROVIDER_SYNC_ENABLED=true           # Default: true
PROVIDER_HEALTH_CHECK_ENABLED=true   # Default: true
```

---

## 🔌 MuleSoft Configuration

### **application.yml**

```yaml
mulesoft:
  # Base URL (desde variable de entorno)
  base-url: ${MULESOFT_BASE_URL}
  
  # OAuth2 Authentication
  auth:
    client-id: ${MULESOFT_CLIENT_ID}
    client-secret: ${MULESOFT_CLIENT_SECRET}
    token-url: ${MULESOFT_BASE_URL}/oauth/token
    grant-type: client_credentials
  
  # HTTP Client Config
  timeout-seconds: ${MULESOFT_TIMEOUT_SECONDS:10}
  retry-max-attempts: ${MULESOFT_RETRY_MAX_ATTEMPTS:3}
  
  # API Endpoints
  endpoints:
    list-providers: /api/v1/signature/providers
    provider-health: /api/v1/signature/providers/{id}/health
    send-challenge: /api/v1/signature/providers/{id}/send

# Scheduled Tasks
provider:
  sync:
    enabled: ${PROVIDER_SYNC_ENABLED:true}
    interval-ms: ${PROVIDER_SYNC_INTERVAL_MS:300000}  # 5 min
  health-check:
    enabled: ${PROVIDER_HEALTH_CHECK_ENABLED:true}
    interval-ms: ${PROVIDER_HEALTH_CHECK_INTERVAL_MS:60000}  # 1 min
```

---

## 🗄️ Database Setup

### **1. Ejecutar Migración LiquidBase**

La migración se ejecuta automáticamente al iniciar la aplicación:

```bash
# Verificar que LiquidBase está habilitado
./mvnw spring-boot:run

# Logs esperados:
# INFO  liquibase.changelog - Reading from signature_router.databasechangelog
# INFO  liquibase.changelog - Running Changeset: db/changelog/0020-provider-catalog-table.yaml
# INFO  liquibase.changelog - Table provider_catalog created
```

### **2. Verificar Tabla Creada**

```sql
-- Conectar a PostgreSQL
psql -h postgres -U siguser -d signature_router

-- Verificar tabla
\d provider_catalog

-- Expected output:
--                   Column            |           Type           
-- ------------------------------------+--------------------------
-- id                                  | uuid                     
-- mulesoft_provider_id                | character varying(100)   
-- provider_name                       | character varying(100)   
-- provider_type                       | character varying(20)    
-- mulesoft_endpoint                   | character varying(500)   
-- mulesoft_status                     | character varying(20)    
-- enabled                             | boolean                  
-- priority                            | integer                  
-- timeout_seconds                     | integer                  
-- retry_max_attempts                  | integer                  
-- health_status                       | character varying(20)    
-- last_health_check_at                | timestamp with time zone 
-- last_sync_at                        | timestamp with time zone 
-- created_at                          | timestamp with time zone 
-- updated_at                          | timestamp with time zone 
-- updated_by                          | character varying(100)   
```

### **3. Verificar Índices**

```sql
-- Listar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'provider_catalog';

-- Expected indexes:
-- idx_provider_catalog_type_enabled
-- idx_provider_catalog_priority
-- idx_provider_catalog_mulesoft_id
```

---

## ⏰ Scheduled Tasks

### **Sync Service**

**Descripción:** Sincroniza catálogo desde MuleSoft cada 5 minutos.

**Cron:** `@Scheduled(fixedRate = 300000)` (5 min)

**Logs:**

```log
2025-12-05 10:00:00 INFO  ProviderSyncService - Starting MuleSoft provider sync...
2025-12-05 10:00:01 INFO  MuleSoftProviderClient - Fetching available providers from MuleSoft
2025-12-05 10:00:02 INFO  ProviderSyncService - Found 4 providers in MuleSoft
2025-12-05 10:00:02 INFO  ProviderSyncService - New provider synced: Twilio SMS España
2025-12-05 10:00:02 INFO  ProviderSyncService - Provider updated: AWS SNS España
2025-12-05 10:00:02 INFO  ProviderSyncService - Sync completed: 4 providers
```

**Metrics:**

```java
// Prometheus metrics disponibles:
provider_sync_total{status="success"} 120
provider_sync_total{status="failure"} 2
provider_sync_duration_seconds{quantile="0.95"} 1.2
provider_sync_last_success_timestamp 1733397602
```

---

### **Health Check Service**

**Descripción:** Verifica salud de providers habilitados cada 1 minuto.

**Cron:** `@Scheduled(fixedRate = 60000)` (1 min)

**Logs:**

```log
2025-12-05 10:01:00 DEBUG ProviderSyncService - Starting health check for enabled providers...
2025-12-05 10:01:00 DEBUG MuleSoftProviderClient - Checking health for provider: mule-twilio-sms-es
2025-12-05 10:01:01 DEBUG ProviderSyncService - Provider Twilio SMS España: healthy (latency: 45ms)
2025-12-05 10:01:01 DEBUG MuleSoftProviderClient - Checking health for provider: mule-aws-sns-es
2025-12-05 10:01:02 WARN  ProviderSyncService - Health check failed: AWS SNS España - Connection timeout
```

**Metrics:**

```java
provider_health_check_total{provider="twilio-sms",status="healthy"} 58
provider_health_check_total{provider="twilio-sms",status="unhealthy"} 2
provider_health_check_duration_seconds{provider="twilio-sms",quantile="0.95"} 0.05
```

---

## 💚 Health Checks

### **Actuator Endpoints**

```bash
# Health general
curl http://localhost:8080/actuator/health

# Response:
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP"
    },
    "mulesoft": {
      "status": "UP",
      "details": {
        "base_url": "https://api.mulesoft.singular.com",
        "last_check": "2025-12-05T10:05:00Z",
        "providers_synced": 4
      }
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

### **Provider Catalog Health**

```bash
# Obtener estado de todos los providers
curl http://localhost:8080/api/v1/admin/providers \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Response:
[
  {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "muleSoftProviderId": "mule-twilio-sms-es",
    "providerName": "Twilio SMS España",
    "providerType": "SMS",
    "muleSoftStatus": "available",
    "healthStatus": "healthy",
    "enabled": true,
    "priority": 1,
    "lastHealthCheckAt": "2025-12-05T10:05:00Z",
    "lastSyncAt": "2025-12-05T10:00:00Z"
  }
]
```

---

## 🐛 Troubleshooting

### **Problema: Sync no se ejecuta**

**Síntoma:**

```log
# No logs de sync
# Tabla provider_catalog vacía
```

**Diagnóstico:**

```bash
# 1. Verificar que scheduled tasks están habilitadas
curl http://localhost:8080/actuator/scheduledtasks

# 2. Verificar configuración
curl http://localhost:8080/actuator/configprops | grep provider.sync

# 3. Verificar logs
docker logs signature-router | grep ProviderSyncService
```

**Solución:**

```yaml
# application.yml - Asegurar que está habilitado
spring:
  task:
    scheduling:
      enabled: true  # ← Debe estar en true

provider:
  sync:
    enabled: true  # ← Debe estar en true
```

---

### **Problema: MuleSoft connection timeout**

**Síntoma:**

```log
ERROR MuleSoftProviderClient - Failed to fetch providers from MuleSoft
java.net.SocketTimeoutException: Read timed out
```

**Diagnóstico:**

```bash
# 1. Verificar conectividad
curl -v https://api.mulesoft.singular.com/api/v1/signature/providers

# 2. Verificar timeout configurado
echo $MULESOFT_TIMEOUT_SECONDS

# 3. Verificar certificados SSL (si aplica)
openssl s_client -connect api.mulesoft.singular.com:443
```

**Solución:**

```yaml
# Aumentar timeout si MuleSoft es lento
mulesoft:
  timeout-seconds: 30  # De 10 a 30 segundos
```

---

### **Problema: Providers no aparecen en Admin UI**

**Síntoma:**

- Sync exitoso en logs
- Tabla `provider_catalog` tiene datos
- Admin UI muestra lista vacía

**Diagnóstico:**

```sql
-- 1. Verificar datos en BD
SELECT * FROM provider_catalog;

-- 2. Verificar API endpoint
curl http://localhost:8080/api/v1/admin/providers \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Solución:**

```bash
# 1. Verificar CORS si Admin UI está en otro dominio
# 2. Verificar autenticación/autorización (rol ADMIN requerido)
# 3. Verificar logs del browser (F12 → Console)
```

---

### **Problema: Health check marca todos como unhealthy**

**Síntoma:**

```log
WARN ProviderSyncService - Health check failed: Twilio SMS - Connection timeout
WARN ProviderSyncService - Health check failed: AWS SNS - Connection timeout
```

**Diagnóstico:**

```bash
# 1. Verificar endpoint de health
curl https://api.mulesoft.singular.com/api/v1/signature/providers/mule-twilio-sms-es/health

# 2. Verificar credenciales OAuth2
curl -X POST https://api.mulesoft.singular.com/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=$MULESOFT_CLIENT_ID" \
  -d "client_secret=$MULESOFT_CLIENT_SECRET"
```

**Solución:**

```yaml
# 1. Verificar credenciales correctas
# 2. Deshabilitar health checks temporalmente si MuleSoft no los soporta
provider:
  health-check:
    enabled: false
```

---

### **Problema: Fallback no funciona**

**Síntoma:**

```log
ERROR ProviderSelectionService - All providers failed for type: SMS
com.bank.signature.exception.AllProvidersFailedException
```

**Diagnóstico:**

```sql
-- Verificar providers habilitados
SELECT provider_name, enabled, priority, health_status 
FROM provider_catalog 
WHERE provider_type = 'SMS' 
ORDER BY priority;

-- Expected:
-- provider_name       | enabled | priority | health_status
-- --------------------+---------+----------+--------------
-- Twilio SMS España   | true    | 1        | healthy
-- AWS SNS España      | true    | 2        | healthy
```

**Solución:**

```bash
# Habilitar al menos 2 providers para fallback
curl -X PUT http://localhost:8080/api/v1/admin/providers/{provider-2-id}/enable \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📊 Monitoring

### **Grafana Dashboards**

Importar dashboard: `grafana/dashboards/provider-catalog-monitoring.json`

**Panels:**

1. **Provider Sync Success Rate** (últimas 24h)
2. **Provider Health Status** (by type)
3. **Fallback Usage** (count by provider)
4. **MuleSoft Latency** (p50, p95, p99)

### **Prometheus Alerts**

```yaml
# alerts/provider-catalog.yml
groups:
  - name: provider_catalog
    rules:
      - alert: ProviderSyncFailing
        expr: rate(provider_sync_total{status="failure"}[5m]) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Provider sync failing repeatedly"
          description: "Sync from MuleSoft failing > 50% in last 5min"
      
      - alert: AllProvidersUnhealthy
        expr: count(provider_health_status{status="healthy"}) == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "All providers are unhealthy"
          description: "No providers available for signature sending"
```

---

## 🧪 Testing Setup

### **Local Development**

```bash
# 1. Mock MuleSoft con WireMock
docker run -d -p 8089:8080 wiremock/wiremock

# 2. Configurar stub
curl -X POST http://localhost:8089/__admin/mappings \
  -d '{
    "request": {
      "method": "GET",
      "url": "/api/v1/signature/providers"
    },
    "response": {
      "status": 200,
      "jsonBody": {
        "providers": [
          {
            "id": "mock-twilio-sms",
            "name": "Twilio SMS Mock",
            "type": "SMS",
            "endpoint": "/api/v1/signature/sms/twilio",
            "status": "available"
          }
        ]
      }
    }
  }'

# 3. Configurar variable de entorno
export MULESOFT_BASE_URL=http://localhost:8089
```

### **Integration Tests**

```java
@SpringBootTest
@TestPropertySource(properties = {
    "provider.sync.enabled=false",  // Disable automatic sync
    "provider.health-check.enabled=false"
})
class ProviderSyncServiceIT {
    
    @Autowired
    private ProviderSyncService syncService;
    
    @MockBean
    private MuleSoftProviderClient muleSoftClient;
    
    @Test
    void shouldSyncProvidersFromMuleSoft() {
        // Given: MuleSoft returns 2 providers
        when(muleSoftClient.listAvailableProviders())
            .thenReturn(List.of(
                mockProvider("twilio-sms", "Twilio SMS"),
                mockProvider("aws-sns", "AWS SNS")
            ));
        
        // When: Manual sync
        syncService.syncProvidersFromMuleSoft();
        
        // Then: Providers saved to database
        List<ProviderCatalog> providers = repository.findAll();
        assertThat(providers).hasSize(2);
        assertThat(providers.get(0).isEnabled()).isFalse();
    }
}
```

---

## 📝 Checklist de Deployment

### **Pre-Deployment**

- [ ] Variables de entorno configuradas
- [ ] MuleSoft credentials obtenidas (OAuth2)
- [ ] MuleSoft APIs accesibles desde cluster K8S
- [ ] Database migration ejecutada
- [ ] Índices creados
- [ ] Health checks funcionando

### **Post-Deployment**

- [ ] Sync ejecutado exitosamente (verificar logs)
- [ ] Providers aparecem en tabla `provider_catalog`
- [ ] Admin UI muestra providers
- [ ] Health checks activos
- [ ] Metrics en Prometheus
- [ ] Dashboards en Grafana
- [ ] Alerts configuradas

---

## 🔗 Referencias

- [Epic 13 Documentation](../epics/epic-13-providers-mulesoft-integration.md)
- [Architecture Diagrams](../diagrams/epic-13-mulesoft-architecture.md)
- [MuleSoft API Documentation](https://mulesoft.singular.com/api-docs)
- [Prometheus Metrics](../monitoring/prometheus-metrics.md)

---

**Documento creado:** 5 de diciembre de 2025  
**Mantenido por:** DevOps Team  
**Próxima revisión:** Post-deployment Epic 13
