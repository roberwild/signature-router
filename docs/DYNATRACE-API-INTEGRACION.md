# 🔷 Dynatrace API - Guía de Integración Técnica

**Proyecto:** Signature Router Platform  
**Fecha:** 2025-12-05  
**Versión:** 1.0  
**Propósito:** Documentación técnica para desarrollar la integración con Dynatrace API v2

---

## 📋 **Índice**

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Integración](#arquitectura-de-integración)
3. [Endpoints de Dynatrace API](#endpoints-de-dynatrace-api)
4. [Pantallas que Dependen de Dynatrace](#pantallas-que-dependen-de-dynatrace)
5. [Implementación Backend](#implementación-backend)
6. [Implementación Frontend](#implementación-frontend)
7. [Mapeo de Datos](#mapeo-de-datos)
8. [Configuración y Credenciales](#configuración-y-credenciales)
9. [Flujos de Integración](#flujos-de-integración)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)
12. [Extensiones Futuras](#extensiones-futuras)

---

## 🎯 **Resumen Ejecutivo**

### **¿Cómo funciona la integración?**

Dynatrace se integra con el panel de administración siguiendo un patrón de **proxy**:

```
Frontend (Next.js) 
    ↓ HTTP GET /api/v1/admin/alerts
Backend (Spring Boot)
    ↓ HTTP GET /api/v2/problems
Dynatrace API v2
    ↓ JSON Response
Backend (transforma datos)
    ↓ JSON Response
Frontend (renderiza UI)
```

### **Pantallas Integradas**

| Pantalla | URL | Estado | API Dynatrace |
|----------|-----|--------|---------------|
| **Alertas** | `/admin/alerts` | ✅ Documentado | `/api/v2/problems` |
| Dashboard | `/admin` | 🔮 Futuro | `/api/v2/metrics` |
| Métricas | `/admin/metrics` | 🔮 Futuro | `/api/v2/timeseries` |
| Providers | `/admin/providers` | 🔮 Futuro | `/api/v2/entities` |

### **Componentes Clave**

```
Backend:
├── AlertManagerService (interface)
├── AlertManagerServiceDynatraceImpl.java (implementación Dynatrace)
└── AlertsController.java (REST API)

Frontend:
├── lib/api/real-client.ts (cliente HTTP)
├── app/admin/alerts/page.tsx (UI)
└── lib/api/types.ts (TypeScript types)
```

---

## 🏗️ **Arquitectura de Integración**

### **Patrón de Diseño: Backend como Proxy**

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app/admin/alerts/page.tsx                           │  │
│  │  - Renderiza alertas                                 │  │
│  │  - Maneja acciones (reconocer, resolver)            │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      │ GET /api/v1/admin/alerts
                      │ Authorization: Bearer <JWT>
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Spring Boot)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AlertsController                                     │  │
│  │  - Valida JWT                                        │  │
│  │  - Autoriza roles (PRF_ADMIN, PRF_CONSULTIVO)       │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  AlertManagerServiceDynatraceImpl                     │  │
│  │  - Construye request a Dynatrace                     │  │
│  │  - Transforma respuesta                              │  │
│  │  - Mapea severidades y estados                       │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      │ GET /api/v2/problems?from=now-24h
                      │ Authorization: Api-Token <DYNATRACE_TOKEN>
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   DYNATRACE CLOUD                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Problems API v2                                      │  │
│  │  - Valida API Token                                  │  │
│  │  - Retorna problemas (alertas)                       │  │
│  │  - Davis AI: root cause, impact analysis            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Ventajas de Este Patrón**

| Ventaja | Descripción |
|---------|-------------|
| **Seguridad** | El API token de Dynatrace nunca se expone al frontend |
| **Control de Acceso** | Backend valida permisos antes de proxy |
| **Transformación** | Backend adapta datos de Dynatrace a nuestro modelo |
| **Caché** | Backend puede cachear respuestas (futuro) |
| **Abstracción** | Frontend no necesita conocer detalles de Dynatrace |

---

## 🔌 **Endpoints de Dynatrace API**

### **Base URL**

```
https://{environment-id}.live.dynatrace.com/api/v2
```

**Ejemplo:**
```
https://abc12345.live.dynatrace.com/api/v2
```

**Variantes según región:**
- US: `https://{env-id}.live.dynatrace.com`
- Sprint: `https://{env-id}.sprint.dynatracelabs.com`
- Managed: `https://{domain}/e/{env-id}`

---

### **1. GET /api/v2/problems - Listar Problemas**

Obtiene la lista de problemas (alertas) detectados por Dynatrace.

#### **Request**

```http
GET /api/v2/problems?from=now-24h&pageSize=100&problemSelector=status("OPEN") HTTP/1.1
Host: abc12345.live.dynatrace.com
Authorization: Api-Token dt0c01.XA7LQ9XXXXXXXXXXXXXX
Content-Type: application/json
```

#### **Parámetros Query**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `from` | string | Timestamp de inicio | `now-24h`, `2025-12-01T00:00:00Z` |
| `to` | string | Timestamp final (opcional) | `now`, `2025-12-05T23:59:59Z` |
| `pageSize` | int | Número de resultados | `100` (max: 500) |
| `problemSelector` | string | Filtro de problemas | `status("OPEN")` |

#### **Problem Selectors Útiles**

```javascript
// Solo problemas abiertos
problemSelector=status("OPEN")

// Solo problemas críticos
problemSelector=severityLevel("ERROR")

// Problemas de una management zone específica
problemSelector=managementZoneIds("mzId-123")

// Problemas combinados (abiertos Y críticos)
problemSelector=status("OPEN"),severityLevel("ERROR")

// Problemas de un servicio específico
problemSelector=entityId("SERVICE-ABC123")
```

#### **Response**

```json
{
  "totalCount": 3,
  "pageSize": 100,
  "problems": [
    {
      "problemId": "P-123456789",
      "displayId": "P-001234",
      "title": "Response time degradation on signature-router-api",
      "impactLevel": "SERVICE",
      "severityLevel": "PERFORMANCE",
      "status": "OPEN",
      "affectedEntities": [
        {
          "entityId": {
            "id": "SERVICE-ABC123",
            "type": "SERVICE"
          },
          "name": "signature-router-api"
        }
      ],
      "impactedEntities": [
        {
          "entityId": {
            "id": "SERVICE-ABC123",
            "type": "SERVICE"
          },
          "name": "signature-router-api"
        }
      ],
      "rootCauseEntity": {
        "entityId": {
          "id": "SERVICE-ABC123",
          "type": "SERVICE"
        },
        "name": "signature-router-api"
      },
      "managementZones": [
        {
          "id": "mzId-123",
          "name": "signature-router-prod"
        }
      ],
      "entityTags": [
        {
          "context": "ENVIRONMENT",
          "key": "environment",
          "value": "production"
        }
      ],
      "evidenceDetails": {
        "totalCount": 2,
        "details": [
          {
            "displayName": "Response time increase",
            "entity": {
              "entityId": {
                "id": "SERVICE-ABC123",
                "type": "SERVICE"
              },
              "name": "signature-router-api"
            },
            "evidenceType": "METRIC_EVENT",
            "groupingEntity": {
              "entityId": {
                "id": "SERVICE-ABC123",
                "type": "SERVICE"
              },
              "name": "signature-router-api"
            },
            "rootCauseRelevant": true,
            "startTime": 1701432600000
          }
        ]
      },
      "recentComments": {
        "comments": [],
        "nextPageKey": null,
        "pageSize": 10,
        "totalCount": 0
      },
      "startTime": 1701432600000,
      "endTime": -1,
      "relatedEvents": [],
      "relatedImpactedEntities": [],
      "problemFilters": []
    },
    {
      "problemId": "P-987654321",
      "displayId": "P-005678",
      "title": "High error rate on database connection pool",
      "impactLevel": "INFRASTRUCTURE",
      "severityLevel": "ERROR",
      "status": "OPEN",
      "rootCauseEntity": {
        "entityId": {
          "id": "DATABASE-XYZ789",
          "type": "DATABASE"
        },
        "name": "postgres-signature-db"
      },
      "startTime": 1701435000000,
      "endTime": -1
    }
  ]
}
```

#### **Campos Importantes**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `problemId` | string | ID único del problema (ej: `P-123456789`) |
| `displayId` | string | ID legible para humanos (ej: `P-001234`) |
| `title` | string | Título descriptivo del problema |
| `severityLevel` | string | `ERROR`, `PERFORMANCE`, `AVAILABILITY`, `RESOURCE_CONTENTION`, `CUSTOM` |
| `status` | string | `OPEN`, `RESOLVED`, `CLOSED` |
| `impactLevel` | string | `SERVICE`, `INFRASTRUCTURE`, `APPLICATION`, `ENVIRONMENT` |
| `startTime` | long | Timestamp en milisegundos (Unix epoch) |
| `endTime` | long | Timestamp en milisegundos (`-1` si aún abierto) |
| `rootCauseEntity` | object | Entidad raíz del problema |
| `managementZones` | array | Zonas de gestión asociadas |

---

### **2. GET /api/v2/problems/{problemId} - Obtener Problema por ID**

Obtiene los detalles completos de un problema específico.

#### **Request**

```http
GET /api/v2/problems/P-123456789 HTTP/1.1
Host: abc12345.live.dynatrace.com
Authorization: Api-Token dt0c01.XA7LQ9XXXXXXXXXXXXXX
Content-Type: application/json
```

#### **Response**

Mismo formato que un elemento del array `problems` de la respuesta anterior, pero con más detalles.

---

### **3. POST /api/v2/problems/{problemId}/close - Cerrar Problema**

Cierra manualmente un problema. Útil para reconocer o resolver alertas desde el panel admin.

#### **Request**

```http
POST /api/v2/problems/P-123456789/close HTTP/1.1
Host: abc12345.live.dynatrace.com
Authorization: Api-Token dt0c01.XA7LQ9XXXXXXXXXXXXXX
Content-Type: application/json

{
  "message": "Acknowledged by operator via admin panel",
  "comment": "Problem acknowledged and being investigated"
}
```

#### **Request Body**

```json
{
  "message": "string (required) - Mensaje de cierre",
  "comment": "string (optional) - Comentario adicional"
}
```

#### **Response**

```http
HTTP/1.1 204 No Content
```

**Nota:** Si el problema no existe o ya está cerrado, retorna `404 Not Found`.

---

### **4. POST /api/v2/problems/{problemId}/comments - Agregar Comentario**

Agrega un comentario a un problema (útil para colaboración).

#### **Request**

```http
POST /api/v2/problems/P-123456789/comments HTTP/1.1
Host: abc12345.live.dynatrace.com
Authorization: Api-Token dt0c01.XA7LQ9XXXXXXXXXXXXXX
Content-Type: application/json

{
  "message": "Investigating root cause. Database connection pool exhausted.",
  "context": "Database team notified"
}
```

#### **Response**

```json
{
  "commentId": "comment-abc123",
  "message": "Investigating root cause...",
  "authorName": "API Token User",
  "createdAt": 1701436000000
}
```

---

### **5. GET /api/v2/metrics - Listar Métricas Disponibles**

**(Futuro - Para Dashboard y Métricas)**

```http
GET /api/v2/metrics HTTP/1.1
Host: abc12345.live.dynatrace.com
Authorization: Api-Token dt0c01.XA7LQ9XXXXXXXXXXXXXX
```

#### **Response**

```json
{
  "totalCount": 15000,
  "pageSize": 500,
  "metrics": [
    {
      "metricId": "builtin:service.response.time",
      "displayName": "Response time",
      "description": "Average response time of the service",
      "unit": "MicroSecond",
      "aggregationTypes": ["avg", "min", "max", "sum", "count"],
      "dimensionDefinitions": [
        {
          "key": "dt.entity.service",
          "name": "Service",
          "type": "ENTITY"
        }
      ]
    }
  ]
}
```

---

### **6. POST /api/v2/metrics/query - Consultar Series Temporales**

**(Futuro - Para Dashboard y Métricas)**

Consulta valores de métricas en un rango de tiempo.

#### **Request**

```http
POST /api/v2/metrics/query HTTP/1.1
Host: abc12345.live.dynatrace.com
Authorization: Api-Token dt0c01.XA7LQ9XXXXXXXXXXXXXX
Content-Type: application/json

{
  "metricSelector": "builtin:service.response.time:avg",
  "resolution": "5m",
  "from": "now-24h",
  "to": "now",
  "entitySelector": "type(\"SERVICE\"),entityName(\"signature-router-api\")"
}
```

#### **Response**

```json
{
  "totalCount": 1,
  "result": [
    {
      "metricId": "builtin:service.response.time:avg",
      "dataPoints": [
        [1701432600000, 150.5],
        [1701432900000, 145.2],
        [1701433200000, 160.8]
      ],
      "dimensionMap": {
        "dt.entity.service": "SERVICE-ABC123"
      }
    }
  ]
}
```

---

### **7. GET /api/v2/entities - Listar Entidades**

**(Futuro - Para Providers Health)**

```http
GET /api/v2/entities?entitySelector=type("SERVICE"),tag("app:signature-router") HTTP/1.1
Host: abc12345.live.dynatrace.com
Authorization: Api-Token dt0c01.XA7LQ9XXXXXXXXXXXXXX
```

---

## 📱 **Pantallas que Dependen de Dynatrace**

### **1. Pantalla de Alertas** ✅ (Actual)

**URL:** `http://localhost:3001/admin/alerts`

**Componente:** `app-signature-router-admin/app/admin/alerts/page.tsx`

**API Backend:** `GET /api/v1/admin/alerts`

**API Dynatrace:** `GET /api/v2/problems`

#### **Funcionalidades**

| Funcionalidad | Método | Endpoint Backend | Endpoint Dynatrace |
|---------------|--------|------------------|-------------------|
| Listar alertas | GET | `/api/v1/admin/alerts` | `/api/v2/problems` |
| Ver alerta | GET | `/api/v1/admin/alerts/{id}` | `/api/v2/problems/{id}` |
| Reconocer alerta | PUT | `/api/v1/admin/alerts/{id}/acknowledge` | `/api/v2/problems/{id}/close` |
| Resolver alerta | PUT | `/api/v1/admin/alerts/{id}/resolve` | `/api/v2/problems/{id}/close` |

#### **Filtros Disponibles**

```typescript
interface AlertFilters {
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}
```

#### **Ejemplo de Uso**

```typescript
// Obtener alertas críticas activas
const alerts = await apiClient.getAlerts({
  severity: 'CRITICAL',
  status: 'ACTIVE'
});

// Reconocer alerta
await apiClient.acknowledgeAlert('P-123456789');
```

---

### **2. Dashboard Principal** 🔮 (Futuro)

**URL:** `http://localhost:3001/admin`

**Posibles Métricas de Dynatrace:**

```javascript
// Métricas actuales (internas) vs. Métricas de Dynatrace

Actual (Interno)              → Futuro (Dynatrace)
----------------------------------------------------
totalSignatures24h            → Custom metric: signature.count
successRate                   → builtin:service.successRate
avgLatency                    → builtin:service.response.time:avg
activeProviders               → Entities count (type=SERVICE)
circuitBreakersOpen           → Custom metric: resilience4j.circuitbreaker.state
```

**Endpoints Dynatrace:**
- `POST /api/v2/metrics/query` - Series temporales
- `GET /api/v2/entities` - Estado de servicios

---

### **3. Pantalla de Métricas** 🔮 (Futuro)

**URL:** `http://localhost:3001/admin/metrics`

**Métricas a Integrar:**

| Métrica | Dynatrace Metric ID | Aggregation |
|---------|---------------------|-------------|
| Latencia P50 | `builtin:service.response.time` | `percentile(50)` |
| Latencia P95 | `builtin:service.response.time` | `percentile(95)` |
| Latencia P99 | `builtin:service.response.time` | `percentile(99)` |
| Error Rate | `builtin:service.errors.total.rate` | `avg` |
| Throughput | `builtin:service.requestCount.total` | `sum` |

---

### **4. Pantalla de Providers** 🔮 (Futuro)

**URL:** `http://localhost:3001/admin/providers`

**Health Checks con Dynatrace:**

```javascript
// Por cada provider, consultar:
GET /api/v2/entities/{provider-service-id}

Response:
{
  "entityId": "SERVICE-TWILIO-123",
  "displayName": "twilio-sms-provider",
  "healthState": "HEALTHY",  // HEALTHY, DEGRADED, UNHEALTHY
  "properties": {
    "responseTime": 120,
    "errorRate": 0.02
  }
}
```

---

## 💻 **Implementación Backend**

### **Estructura de Archivos**

```
svc-signature-router/src/main/java/com/bank/signature/
├── application/
│   ├── dto/
│   │   ├── request/
│   │   │   └── AlertFilters.java
│   │   └── response/
│   │       └── AlertResponse.java
│   └── service/
│       ├── AlertManagerService.java (interface)
│       ├── AlertManagerServiceMockImpl.java (mock)
│       └── AlertManagerServiceDynatraceImpl.java ← IMPLEMENTAR
└── infrastructure/
    └── adapter/
        └── inbound/
            └── rest/
                └── admin/
                    └── AlertsController.java (ya existe)
```

---

### **AlertManagerServiceDynatraceImpl.java**

```java
package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.application.dto.request.AlertFilters;
import com.singularbank.signature.routing.application.dto.response.AlertResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dynatrace Implementation of AlertManager Service
 * Story 12.7: Dynatrace Integration
 * 
 * Connects to Dynatrace API v2 to fetch Problems (alerts)
 * 
 * Activated when: admin.portal.alerts.mock=false
 * 
 * API Documentation:
 * https://www.dynatrace.com/support/help/dynatrace-api/environment-api/problems-v2
 */
@Service
@ConditionalOnProperty(name = "admin.portal.alerts.mock", havingValue = "false")
@Slf4j
@RequiredArgsConstructor
public class AlertManagerServiceDynatraceImpl implements AlertManagerService {
    
    private final RestTemplate restTemplate;
    
    @Value("${dynatrace.url}")
    private String dynatraceUrl;
    
    @Value("${dynatrace.api-token}")
    private String apiToken;
    
    @Override
    public List<AlertResponse> getAlerts(AlertFilters filters) {
        log.info("[DYNATRACE] Fetching problems from Dynatrace API");
        
        try {
            // 1. Construir URL con parámetros
            String url = buildProblemsUrl(filters);
            
            // 2. Preparar headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Api-Token " + apiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // 3. Llamar a Dynatrace API
            ResponseEntity<DynatraceProblemsResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                DynatraceProblemsResponse.class
            );
            
            // 4. Validar respuesta
            if (response.getBody() == null || response.getBody().problems == null) {
                log.warn("[DYNATRACE] No problems returned from API");
                return Collections.emptyList();
            }
            
            // 5. Transformar a nuestro modelo
            List<AlertResponse> alerts = response.getBody().problems.stream()
                .map(this::transformToAlertResponse)
                .collect(Collectors.toList());
            
            // 6. Aplicar filtros locales si es necesario
            alerts = applyLocalFilters(alerts, filters);
            
            // 7. Ordenar por severidad y tiempo
            alerts.sort((a1, a2) -> {
                int severityCompare = getSeverityOrder(a2.severity()) - getSeverityOrder(a1.severity());
                if (severityCompare != 0) {
                    return severityCompare;
                }
                return a2.startsAt().compareTo(a1.startsAt());
            });
            
            log.info("[DYNATRACE] Retrieved {} alerts", alerts.size());
            return alerts;
            
        } catch (Exception e) {
            log.error("[DYNATRACE] Error fetching problems from Dynatrace", e);
            return Collections.emptyList();
        }
    }
    
    @Override
    public AlertResponse getAlertById(String alertId) {
        log.info("[DYNATRACE] Getting problem by ID: {}", alertId);
        
        try {
            String url = dynatraceUrl + "/api/v2/problems/" + alertId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Api-Token " + apiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<DynatraceProblem> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                DynatraceProblem.class
            );
            
            if (response.getBody() == null) {
                throw new IllegalArgumentException("Problem not found: " + alertId);
            }
            
            return transformToAlertResponse(response.getBody());
            
        } catch (Exception e) {
            log.error("[DYNATRACE] Error getting problem: {}", alertId, e);
            throw new IllegalArgumentException("Problem not found: " + alertId);
        }
    }
    
    @Override
    public void acknowledgeAlert(String alertId) {
        log.info("[DYNATRACE] Acknowledging problem: {}", alertId);
        
        try {
            String url = dynatraceUrl + "/api/v2/problems/" + alertId + "/close";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Api-Token " + apiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, String> body = Map.of(
                "message", "Acknowledged by operator via admin panel",
                "comment", "Problem acknowledged and being investigated"
            );
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            
            restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Void.class
            );
            
            log.info("[DYNATRACE] Problem acknowledged: {}", alertId);
            
        } catch (Exception e) {
            log.error("[DYNATRACE] Error acknowledging problem: {}", alertId, e);
            throw new IllegalArgumentException("Cannot acknowledge problem: " + alertId);
        }
    }
    
    @Override
    public void resolveAlert(String alertId) {
        log.info("[DYNATRACE] Resolving problem: {}", alertId);
        
        try {
            String url = dynatraceUrl + "/api/v2/problems/" + alertId + "/close";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Api-Token " + apiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, String> body = Map.of(
                "message", "Resolved by operator via admin panel",
                "comment", "Problem manually resolved"
            );
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            
            restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Void.class
            );
            
            log.info("[DYNATRACE] Problem resolved: {}", alertId);
            
        } catch (Exception e) {
            log.error("[DYNATRACE] Error resolving problem: {}", alertId, e);
            throw new IllegalArgumentException("Cannot resolve problem: " + alertId);
        }
    }
    
    // ========================================
    // Helper Methods
    // ========================================
    
    /**
     * Construye la URL de Dynatrace con parámetros de filtro
     */
    private String buildProblemsUrl(AlertFilters filters) {
        StringBuilder url = new StringBuilder(dynatraceUrl);
        url.append("/api/v2/problems");
        
        List<String> params = new ArrayList<>();
        
        // Siempre obtener últimas 24 horas
        params.add("from=now-24h");
        params.add("pageSize=100");
        
        // Filtro por status
        if (filters != null && filters.status() != null) {
            String dtStatus = mapStatusToDynatrace(filters.status());
            if (dtStatus != null) {
                params.add("problemSelector=status(\"" + dtStatus + "\")");
            }
        }
        
        if (!params.isEmpty()) {
            url.append("?").append(String.join("&", params));
        }
        
        return url.toString();
    }
    
    /**
     * Transforma un problema de Dynatrace a nuestro modelo AlertResponse
     */
    private AlertResponse transformToAlertResponse(DynatraceProblem problem) {
        return AlertResponse.builder()
            .id(problem.problemId)
            .name(problem.title)
            .description(buildDescription(problem))
            .severity(mapSeverityFromDynatrace(problem.severityLevel))
            .status(mapStatusFromDynatrace(problem.status))
            .startsAt(problem.startTime != null ? Instant.ofEpochMilli(problem.startTime) : Instant.now())
            .endsAt(problem.endTime != null && problem.endTime > 0 ? Instant.ofEpochMilli(problem.endTime) : null)
            .labels(buildLabels(problem))
            .annotations(buildAnnotations(problem))
            .build();
    }
    
    /**
     * Construye descripción detallada del problema
     */
    private String buildDescription(DynatraceProblem problem) {
        StringBuilder desc = new StringBuilder();
        desc.append(problem.displayId).append(": ");
        desc.append(problem.impactLevel);
        
        if (problem.rootCauseEntity != null && problem.rootCauseEntity.name != null) {
            desc.append(" on ").append(problem.rootCauseEntity.name);
        }
        
        return desc.toString();
    }
    
    /**
     * Construye labels del problema
     */
    private Map<String, String> buildLabels(DynatraceProblem problem) {
        Map<String, String> labels = new HashMap<>();
        labels.put("problemId", problem.problemId);
        labels.put("displayId", problem.displayId);
        labels.put("impactLevel", problem.impactLevel);
        
        if (problem.managementZones != null && !problem.managementZones.isEmpty()) {
            labels.put("managementZones", problem.managementZones.stream()
                .map(mz -> mz.name)
                .collect(Collectors.joining(", ")));
        }
        
        return labels;
    }
    
    /**
     * Construye annotations del problema
     */
    private Map<String, String> buildAnnotations(DynatraceProblem problem) {
        Map<String, String> annotations = new HashMap<>();
        annotations.put("summary", problem.title);
        annotations.put("description", problem.impactLevel);
        
        if (problem.rootCauseEntity != null && problem.rootCauseEntity.name != null) {
            annotations.put("rootCause", problem.rootCauseEntity.name);
        } else {
            annotations.put("rootCause", "Unknown");
        }
        
        return annotations;
    }
    
    /**
     * Aplica filtros adicionales localmente
     */
    private List<AlertResponse> applyLocalFilters(List<AlertResponse> alerts, AlertFilters filters) {
        if (filters == null) {
            return alerts;
        }
        
        // Filtro por severidad (ya que Dynatrace no soporta este filtro directo)
        if (filters.severity() != null) {
            alerts = alerts.stream()
                .filter(a -> a.severity().equalsIgnoreCase(filters.severity()))
                .collect(Collectors.toList());
        }
        
        return alerts;
    }
    
    /**
     * Mapea severidad de Dynatrace a nuestro sistema
     */
    private String mapSeverityFromDynatrace(String dtSeverity) {
        if (dtSeverity == null) return "INFO";
        
        return switch (dtSeverity.toUpperCase()) {
            case "AVAILABILITY", "ERROR" -> "CRITICAL";
            case "PERFORMANCE", "RESOURCE_CONTENTION" -> "WARNING";
            case "CUSTOM" -> "INFO";
            default -> "INFO";
        };
    }
    
    /**
     * Mapea estado de Dynatrace a nuestro sistema
     */
    private String mapStatusFromDynatrace(String dtStatus) {
        if (dtStatus == null) return "ACTIVE";
        
        return switch (dtStatus.toUpperCase()) {
            case "OPEN" -> "ACTIVE";
            case "RESOLVED" -> "RESOLVED";
            case "CLOSED" -> "ACKNOWLEDGED";
            default -> "ACTIVE";
        };
    }
    
    /**
     * Mapea nuestro estado a Dynatrace
     */
    private String mapStatusToDynatrace(String ourStatus) {
        if (ourStatus == null) return null;
        
        return switch (ourStatus.toUpperCase()) {
            case "ACTIVE" -> "OPEN";
            case "RESOLVED" -> "RESOLVED";
            case "ACKNOWLEDGED" -> "CLOSED";
            default -> null;
        };
    }
    
    /**
     * Orden de severidad para sorting (mayor = más severo)
     */
    private int getSeverityOrder(String severity) {
        return switch (severity.toUpperCase()) {
            case "CRITICAL" -> 3;
            case "WARNING" -> 2;
            case "INFO" -> 1;
            default -> 0;
        };
    }
    
    // ========================================
    // DTOs for Dynatrace API
    // ========================================
    
    /**
     * Response from GET /api/v2/problems
     */
    public static class DynatraceProblemsResponse {
        public List<DynatraceProblem> problems;
        public int totalCount;
        public int pageSize;
        public String nextPageKey;
    }
    
    /**
     * Single problem from Dynatrace
     */
    public static class DynatraceProblem {
        public String problemId;           // P-123456789
        public String displayId;           // P-001234
        public String title;               // "Response time degradation..."
        public String impactLevel;         // SERVICE, INFRASTRUCTURE, APPLICATION
        public String severityLevel;       // ERROR, PERFORMANCE, AVAILABILITY
        public String status;              // OPEN, RESOLVED, CLOSED
        public Long startTime;             // Unix timestamp (milliseconds)
        public Long endTime;               // Unix timestamp or -1 if open
        public List<ManagementZone> managementZones;
        public RootCauseEntity rootCauseEntity;
        public List<EntityTag> entityTags;
    }
    
    /**
     * Management Zone
     */
    public static class ManagementZone {
        public String id;
        public String name;
    }
    
    /**
     * Root Cause Entity
     */
    public static class RootCauseEntity {
        public EntityId entityId;
        public String name;
    }
    
    /**
     * Entity ID
     */
    public static class EntityId {
        public String id;
        public String type;  // SERVICE, DATABASE, HOST, etc.
    }
    
    /**
     * Entity Tag
     */
    public static class EntityTag {
        public String context;  // ENVIRONMENT, AWS, KUBERNETES, etc.
        public String key;
        public String value;
    }
}
```

---

### **Configuration Bean**

```java
package com.singularbank.signature.routing.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Dynatrace Configuration
 */
@Configuration
public class DynatraceConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

---

### **application.yml**

```yaml
# Dynatrace Configuration
dynatrace:
  url: ${DYNATRACE_URL:https://abc12345.live.dynatrace.com}
  api-token: ${DYNATRACE_API_TOKEN}

# Alert Manager Configuration
admin:
  portal:
    alerts:
      mock: ${ADMIN_PORTAL_ALERTS_MOCK:true}  # false para usar Dynatrace
```

---

## 🌐 **Implementación Frontend**

### **lib/api/real-client.ts**

```typescript
/**
 * Real API Client
 * Conecta con el backend Spring Boot que hace proxy a Dynatrace
 */

export class RealApiClient implements IApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;

  constructor(getAccessToken: () => string | null = () => null) {
    this.baseUrl = config.apiBaseUrl;
    this.getAccessToken = getAccessToken;
  }

  /**
   * Wrapper genérico para fetch con manejo de errores
   */
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    };

    // Inject JWT if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(config.apiTimeout),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada o no autorizada');
      }
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ============================================
  // Alerts
  // ============================================

  /**
   * GET /api/v1/admin/alerts
   * Lista alertas desde Dynatrace
   */
  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    return this.fetch(`/admin/alerts${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * PUT /api/v1/admin/alerts/{id}/acknowledge
   * Reconoce una alerta (cierra el problema en Dynatrace)
   */
  async acknowledgeAlert(id: string): Promise<void> {
    return this.fetch(`/admin/alerts/${id}/acknowledge`, {
      method: 'PUT',
    });
  }

  /**
   * PUT /api/v1/admin/alerts/{id}/resolve
   * Resuelve una alerta (cierra el problema en Dynatrace)
   */
  async resolveAlert(id: string): Promise<void> {
    return this.fetch(`/admin/alerts/${id}/resolve`, {
      method: 'PUT',
    });
  }
}
```

---

### **app/admin/alerts/page.tsx**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import type { Alert, AlertFilters } from '@/lib/api/types';

export default function AlertsPage() {
  const { apiClient, isAuthenticated } = useApiClientWithStatus({ autoRedirect: true });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilters>({});

  // Cargar alertas desde Dynatrace (via backend)
  const loadAlerts = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const data = await apiClient.getAlerts(filter);
      setAlerts(data);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAlerts();
    
    // Auto-refresh cada 60 segundos
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, [filter, isAuthenticated]);

  // Reconocer alerta (llama a Dynatrace close API)
  const handleAcknowledge = async (id: string) => {
    try {
      await apiClient.acknowledgeAlert(id);
      // Actualizar estado local
      setAlerts(alerts.map(a =>
        a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a
      ));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  return (
    <div>
      {/* UI de alertas aquí */}
      {alerts.map(alert => (
        <div key={alert.id}>
          <h3>{alert.title}</h3>
          <button onClick={() => handleAcknowledge(alert.id)}>
            Reconocer
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🗺️ **Mapeo de Datos**

### **Severidad: Dynatrace → Nuestro Sistema**

```java
Dynatrace              → Signature Router
-----------------------------------------
"AVAILABILITY"         → "CRITICAL"
"ERROR"                → "CRITICAL"
"PERFORMANCE"          → "WARNING"
"RESOURCE_CONTENTION"  → "WARNING"
"CUSTOM"               → "INFO"
(otros)                → "INFO"
```

### **Estado: Dynatrace → Nuestro Sistema**

```java
Dynatrace    → Signature Router
-------------------------------
"OPEN"       → "ACTIVE"
"RESOLVED"   → "RESOLVED"
"CLOSED"     → "ACKNOWLEDGED"
```

### **Estado: Nuestro Sistema → Dynatrace**

```java
Signature Router    → Dynatrace (para filtros)
----------------------------------------------
"ACTIVE"            → "OPEN"
"RESOLVED"          → "RESOLVED"
"ACKNOWLEDGED"      → "CLOSED"
```

### **Ejemplo de Transformación**

#### **Dynatrace Problem (input):**

```json
{
  "problemId": "P-123456789",
  "displayId": "P-001234",
  "title": "Response time degradation on signature-router-api",
  "impactLevel": "SERVICE",
  "severityLevel": "PERFORMANCE",
  "status": "OPEN",
  "startTime": 1701432600000,
  "endTime": -1,
  "rootCauseEntity": {
    "entityId": { "id": "SERVICE-ABC123", "type": "SERVICE" },
    "name": "signature-router-api"
  }
}
```

#### **AlertResponse (output):**

```json
{
  "id": "P-123456789",
  "name": "Response time degradation on signature-router-api",
  "description": "P-001234: SERVICE on signature-router-api",
  "severity": "WARNING",
  "status": "ACTIVE",
  "startsAt": "2025-12-01T10:30:00Z",
  "endsAt": null,
  "labels": {
    "problemId": "P-123456789",
    "displayId": "P-001234",
    "impactLevel": "SERVICE"
  },
  "annotations": {
    "summary": "Response time degradation on signature-router-api",
    "description": "SERVICE",
    "rootCause": "signature-router-api"
  }
}
```

---

## 🔐 **Configuración y Credenciales**

### **1. Obtener Credenciales de Dynatrace**

**Solicitar al equipo DevOps:**

```bash
# Environment ID
DYNATRACE_ENV_ID=abc12345

# Tenant URL
DYNATRACE_URL=https://abc12345.live.dynatrace.com

# PaaS Token (para OneAgent - no necesario para API)
DYNATRACE_PAAS_TOKEN=dt0c01.ST2EY72KQIN...

# API Token (REQUERIDO para API)
DYNATRACE_API_TOKEN=dt0c01.XA7LQ9...
```

---

### **2. Generar API Token**

**Pasos en Dynatrace UI:**

1. Ir a: `Settings > Integration > Dynatrace API`
2. Click: `Generate token`
3. Nombre: `signature-router-admin-panel`
4. Permisos necesarios:
   - ✅ `Read problems` (v2)
   - ✅ `Write problems` (v2)
   - ✅ `Read metrics` (v2) - opcional, para futuro
   - ✅ `Read entities` (v2) - opcional, para futuro
5. Click: `Generate`
6. Copiar el token (solo se muestra una vez)

**Formato del token:**
```
dt0c01.XA7LQ9XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### **3. Configurar Variables de Entorno**

#### **Backend - .env.dynatrace**

```bash
# Dynatrace Configuration
DYNATRACE_URL=https://abc12345.live.dynatrace.com
DYNATRACE_API_TOKEN=dt0c01.XA7LQ9XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Disable mock alerts (use Dynatrace)
ADMIN_PORTAL_ALERTS_MOCK=false
```

#### **Cargar en PowerShell:**

```powershell
# Cargar variables de entorno
Get-Content .env.dynatrace | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Verificar
$env:DYNATRACE_URL
$env:DYNATRACE_API_TOKEN
$env:ADMIN_PORTAL_ALERTS_MOCK
```

#### **Cargar en Bash/WSL:**

```bash
source .env.dynatrace
echo $DYNATRACE_URL
```

---

### **4. Actualizar application.yml**

```yaml
# Dynatrace Configuration
dynatrace:
  url: ${DYNATRACE_URL:https://abc12345.live.dynatrace.com}
  api-token: ${DYNATRACE_API_TOKEN}

# Alert Manager Configuration
admin:
  portal:
    alerts:
      mock: ${ADMIN_PORTAL_ALERTS_MOCK:true}  # ← Cambiar a false en producción
```

---

### **5. Verificar Configuración**

```bash
# Verificar que el backend puede conectar a Dynatrace
curl -X GET \
  "https://abc12345.live.dynatrace.com/api/v2/problems?from=now-1h&pageSize=5" \
  -H "Authorization: Api-Token dt0c01.XA7LQ9..." \
  -H "Content-Type: application/json"

# Respuesta esperada: JSON con lista de problemas
```

---

## 🔄 **Flujos de Integración**

### **Flujo 1: Listar Alertas**

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │                    │Dynatrace │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. GET /api/v1/admin/alerts   │                               │
     │   ?severity=CRITICAL          │                               │
     │──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 2. Validar JWT                │
     │                               │    Autorizar (PRF_ADMIN)      │
     │                               │                               │
     │                               │ 3. GET /api/v2/problems       │
     │                               │    ?from=now-24h              │
     │                               │    Authorization: Api-Token   │
     │                               │──────────────────────────────>│
     │                               │                               │
     │                               │ 4. JSON Response              │
     │                               │    { problems: [...] }        │
     │                               │<──────────────────────────────│
     │                               │                               │
     │                               │ 5. Transformar datos:         │
     │                               │    - Mapear severidad         │
     │                               │    - Mapear estado            │
     │                               │    - Filtrar por severidad    │
     │                               │    - Ordenar                  │
     │                               │                               │
     │ 6. JSON Response              │                               │
     │    [ { id, name, ... } ]      │                               │
     │<──────────────────────────────│                               │
     │                               │                               │
     │ 7. Renderizar UI              │                               │
     │    - Mostrar alertas          │                               │
     │    - Aplicar estilos          │                               │
     │                               │                               │
```

---

### **Flujo 2: Reconocer Alerta**

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │                    │Dynatrace │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. Click "Reconocer"          │                               │
     │                               │                               │
     │ 2. PUT /api/v1/admin/alerts/  │                               │
     │    P-123456789/acknowledge    │                               │
     │──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 3. Validar JWT                │
     │                               │    Autorizar (PRF_ADMIN)      │
     │                               │                               │
     │                               │ 4. POST /api/v2/problems/     │
     │                               │    P-123456789/close          │
     │                               │    Body: { message, comment } │
     │                               │    Authorization: Api-Token   │
     │                               │──────────────────────────────>│
     │                               │                               │
     │                               │ 5. Cerrar problema            │
     │                               │    Agregar comentario         │
     │                               │                               │
     │                               │ 6. 204 No Content             │
     │                               │<──────────────────────────────│
     │                               │                               │
     │ 7. 204 No Content             │                               │
     │<──────────────────────────────│                               │
     │                               │                               │
     │ 8. Actualizar estado local    │                               │
     │    status: 'ACKNOWLEDGED'     │                               │
     │    Refresh UI                 │                               │
     │                               │                               │
```

---

### **Flujo 3: Error Handling**

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │                    │Dynatrace │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. GET /api/v1/admin/alerts   │                               │
     │──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 2. GET /api/v2/problems       │
     │                               │──────────────────────────────>│
     │                               │                               │
     │                               │ 3. 401 Unauthorized           │
     │                               │    (API Token inválido)       │
     │                               │<──────────────────────────────│
     │                               │                               │
     │                               │ 4. Log error                  │
     │                               │    Return empty list          │
     │                               │                               │
     │ 5. 200 OK: []                 │                               │
     │<──────────────────────────────│                               │
     │                               │                               │
     │ 6. Mostrar mensaje:           │                               │
     │    "No hay alertas activas"   │                               │
     │                               │                               │
```

---

## ✅ **Testing**

### **1. Test Unitario - Mapeo de Severidad**

```java
package com.singularbank.signature.routing.application.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class AlertManagerServiceDynatraceImplTest {
    
    @Test
    void testMapSeverityFromDynatrace_Availability() {
        AlertManagerServiceDynatraceImpl service = new AlertManagerServiceDynatraceImpl(null);
        String result = service.mapSeverityFromDynatrace("AVAILABILITY");
        assertThat(result).isEqualTo("CRITICAL");
    }
    
    @Test
    void testMapSeverityFromDynatrace_Performance() {
        AlertManagerServiceDynatraceImpl service = new AlertManagerServiceDynatraceImpl(null);
        String result = service.mapSeverityFromDynatrace("PERFORMANCE");
        assertThat(result).isEqualTo("WARNING");
    }
    
    @Test
    void testMapStatusFromDynatrace_Open() {
        AlertManagerServiceDynatraceImpl service = new AlertManagerServiceDynatraceImpl(null);
        String result = service.mapStatusFromDynatrace("OPEN");
        assertThat(result).isEqualTo("ACTIVE");
    }
}
```

---

### **2. Test de Integración - Llamada Real a Dynatrace**

```java
@SpringBootTest
@ActiveProfiles("test")
class AlertManagerServiceDynatraceImplIntegrationTest {
    
    @Autowired
    private AlertManagerService alertManagerService;
    
    @Test
    @Disabled("Requiere Dynatrace real - habilitar para pruebas de integración")
    void testGetAlerts_RealDynatrace() {
        AlertFilters filters = AlertFilters.builder()
            .status("ACTIVE")
            .build();
        
        List<AlertResponse> alerts = alertManagerService.getAlerts(filters);
        
        assertThat(alerts).isNotNull();
        // Verificar que cada alerta tiene los campos requeridos
        alerts.forEach(alert -> {
            assertThat(alert.id()).isNotBlank();
            assertThat(alert.name()).isNotBlank();
            assertThat(alert.severity()).isIn("CRITICAL", "WARNING", "INFO");
            assertThat(alert.status()).isIn("ACTIVE", "ACKNOWLEDGED", "RESOLVED");
        });
    }
}
```

---

### **3. Test Manual con cURL**

#### **Test 1: Listar Problemas**

```bash
curl -X GET \
  "https://abc12345.live.dynatrace.com/api/v2/problems?from=now-24h&pageSize=10" \
  -H "Authorization: Api-Token dt0c01.XA7LQ9..." \
  -H "Content-Type: application/json" \
  | jq
```

**Respuesta esperada:** JSON con lista de problemas

---

#### **Test 2: Obtener Problema por ID**

```bash
curl -X GET \
  "https://abc12345.live.dynatrace.com/api/v2/problems/P-123456789" \
  -H "Authorization: Api-Token dt0c01.XA7LQ9..." \
  -H "Content-Type: application/json" \
  | jq
```

---

#### **Test 3: Cerrar Problema**

```bash
curl -X POST \
  "https://abc12345.live.dynatrace.com/api/v2/problems/P-123456789/close" \
  -H "Authorization: Api-Token dt0c01.XA7LQ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test close from cURL",
    "comment": "Testing API integration"
  }'
```

**Respuesta esperada:** `204 No Content`

---

### **4. Test End-to-End**

```bash
# 1. Iniciar backend
cd svc-signature-router
mvn spring-boot:run

# 2. Iniciar frontend
cd app-signature-router-admin
npm run dev

# 3. Abrir navegador
http://localhost:3001/admin/alerts

# 4. Verificar que se muestran alertas de Dynatrace

# 5. Click "Reconocer" en una alerta

# 6. Verificar en Dynatrace UI que el problema está cerrado
https://abc12345.live.dynatrace.com/ui/problems
```

---

## 🐛 **Troubleshooting**

### **Problema 1: Panel de Alertas Muestra Datos Mock**

**Síntoma:**
```
Siempre muestra las mismas 5 alertas:
- HighErrorRate
- ProviderDown
- SlowResponse
- HighLatency
- DatabaseConnection
```

**Causa:** Mock está habilitado

**Solución:**

```yaml
# application.yml
admin:
  portal:
    alerts:
      mock: false  # ← DEBE estar en false
```

```bash
# O con variable de entorno
ADMIN_PORTAL_ALERTS_MOCK=false
```

**Verificar logs:**

```
# Log correcto (Dynatrace)
[DYNATRACE] Fetching problems from Dynatrace API
[DYNATRACE] Retrieved 3 alerts

# Log incorrecto (Mock)
[MOCK] Using MOCK AlertManager Service
[MOCK] Returning 5 mock alerts
```

---

### **Problema 2: Error 401 Unauthorized**

**Síntoma:**
```
[DYNATRACE] Error fetching problems from Dynatrace
org.springframework.web.client.HttpClientErrorException$Unauthorized: 401 Unauthorized
```

**Causas Posibles:**

1. **API Token inválido o expirado**
   ```bash
   # Verificar que el token es correcto
   echo $DYNATRACE_API_TOKEN
   
   # Verificar que no tiene espacios extras
   DYNATRACE_API_TOKEN="dt0c01.XA7LQ9..."  # ✅ Correcto
   DYNATRACE_API_TOKEN=" dt0c01.XA7LQ9..." # ❌ Espacio al inicio
   ```

2. **Header Authorization incorrecto**
   ```java
   // CORRECTO:
   headers.set("Authorization", "Api-Token " + apiToken);
   
   // INCORRECTO:
   headers.set("Authorization", "Bearer " + apiToken);  // ❌
   headers.set("Api-Token", apiToken);                  // ❌
   ```

3. **API Token sin permisos**
   ```
   Verificar en Dynatrace UI que el token tiene:
   ✅ Read problems (v2)
   ✅ Write problems (v2)
   ```

**Solución:**

```bash
# 1. Regenerar API Token en Dynatrace
# 2. Actualizar variable de entorno
DYNATRACE_API_TOKEN=dt0c01.NUEVO_TOKEN...

# 3. Reiniciar backend
mvn spring-boot:run
```

---

### **Problema 3: Panel de Alertas Vacío (No Muestra Alertas)**

**Síntoma:**
```
Panel muestra: "No hay alertas activas"
Pero en Dynatrace UI hay problemas abiertos
```

**Causas Posibles:**

1. **Filtro de tiempo demasiado restrictivo**
   ```java
   // Backend está buscando solo últimas 24h
   params.put("from", "now-24h");
   
   // Solución: Ampliar rango temporal
   params.put("from", "now-7d");
   ```

2. **Problem Selector muy restrictivo**
   ```java
   // Quitar filtros temporalmente para debug
   // params.put("problemSelector", "status(\"OPEN\")");
   ```

3. **Management Zones**
   ```
   Dynatrace puede estar filtrando problemas por Management Zone.
   Verificar que el API Token tiene acceso a todas las MZ necesarias.
   ```

**Verificación:**

```bash
# Test directo a Dynatrace API
curl -X GET \
  "https://abc12345.live.dynatrace.com/api/v2/problems?from=now-7d&pageSize=100" \
  -H "Authorization: Api-Token dt0c01.XA7LQ9..." \
  | jq '.totalCount'

# Si retorna 0, no hay problemas en el rango
# Si retorna > 0, el problema está en el backend
```

---

### **Problema 4: Error de Timeout**

**Síntoma:**
```
[DYNATRACE] Error fetching problems from Dynatrace
java.net.SocketTimeoutException: Read timed out
```

**Solución:**

```java
// Aumentar timeout en RestTemplate
@Bean
public RestTemplate restTemplate() {
    RestTemplate restTemplate = new RestTemplate();
    
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(10000);  // 10 segundos
    factory.setReadTimeout(30000);     // 30 segundos
    
    restTemplate.setRequestFactory(factory);
    return restTemplate;
}
```

---

### **Problema 5: Frontend no Actualiza Estado de Alerta**

**Síntoma:**
```
Click "Reconocer" → Backend responde 204
Pero la alerta sigue mostrándose como "ACTIVE" en UI
```

**Causa:** Estado local del frontend no se actualiza

**Solución:**

```typescript
// Opción 1: Actualizar estado local (más rápido)
const handleAcknowledge = async (id: string) => {
  await apiClient.acknowledgeAlert(id);
  
  // Actualizar estado inmediatamente
  setAlerts(alerts.map(a =>
    a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a
  ));
};

// Opción 2: Recargar todas las alertas (más seguro)
const handleAcknowledge = async (id: string) => {
  await apiClient.acknowledgeAlert(id);
  await loadAlerts();  // Recargar desde backend
};
```

---

## 🔮 **Extensiones Futuras**

### **1. Integrar Métricas en Dashboard**

**Objetivo:** Mostrar métricas de Dynatrace en `/admin`

**Endpoints a usar:**

```
POST /api/v2/metrics/query
```

**Métricas sugeridas:**

```javascript
// Latencia
builtin:service.response.time:avg
builtin:service.response.time:percentile(50)
builtin:service.response.time:percentile(95)
builtin:service.response.time:percentile(99)

// Error Rate
builtin:service.errors.total.rate:avg

// Throughput
builtin:service.requestCount.total:sum
```

**Implementación:**

```java
@Service
public class MetricsServiceDynatraceImpl implements MetricsService {
    
    public MetricsData getMetrics(String range) {
        // POST /api/v2/metrics/query
        String requestBody = """
            {
              "metricSelector": "builtin:service.response.time:avg",
              "resolution": "5m",
              "from": "now-24h",
              "to": "now",
              "entitySelector": "type(\\"SERVICE\\"),entityName(\\"signature-router-api\\")"
            }
            """;
        
        // ... llamar a Dynatrace
    }
}
```

---

### **2. Health Checks de Providers**

**Objetivo:** Mostrar estado real de cada provider en `/admin/providers`

**Endpoints a usar:**

```
GET /api/v2/entities?entitySelector=type("SERVICE"),tag("provider:twilio")
```

**Implementación:**

```java
@Service
public class ProviderHealthService {
    
    public ProviderHealth getProviderHealth(String providerId) {
        // GET /api/v2/entities/{service-id}
        
        DynatraceEntity entity = dynatraceClient.getEntity(providerId);
        
        return ProviderHealth.builder()
            .status(entity.healthState)  // HEALTHY, DEGRADED, UNHEALTHY
            .responseTime(entity.responseTime)
            .errorRate(entity.errorRate)
            .lastCheck(entity.lastSeen)
            .build();
    }
}
```

---

### **3. Business Events Tracking**

**Objetivo:** Trackear eventos de negocio en Dynatrace

**Endpoint:**

```
POST /api/v2/events/ingest
```

**Eventos a trackear:**

```java
// Ejemplo: Signature Created
{
  "eventType": "CUSTOM_INFO",
  "title": "Signature Created",
  "entitySelector": "type(\"SERVICE\"),entityId(\"SERVICE-ABC123\")",
  "properties": {
    "signatureId": "sig-123",
    "channel": "SMS",
    "provider": "TWILIO",
    "amount": "100.00",
    "currency": "EUR"
  }
}
```

**Implementación:**

```java
@Service
public class DynatraceEventService {
    
    public void trackSignatureCreated(SignatureRequest signature) {
        DynatraceEvent event = DynatraceEvent.builder()
            .eventType("CUSTOM_INFO")
            .title("Signature Created")
            .properties(Map.of(
                "signatureId", signature.getId(),
                "channel", signature.getChannel(),
                "amount", signature.getAmount()
            ))
            .build();
        
        dynatraceClient.sendEvent(event);
    }
}
```

---

### **4. SLO (Service Level Objectives)**

**Objetivo:** Definir y trackear SLOs

**Ejemplo:**

```
Availability SLO:
- Target: 99.9% uptime
- Evaluation: last 30 days
- Burn rate: <0.1%

Performance SLO:
- Target: 95% of requests < 200ms
- Evaluation: last 7 days
```

**API:**

```
GET /api/v2/slo
POST /api/v2/slo
```

---

### **5. Synthetic Monitoring**

**Objetivo:** Health checks sintéticos desde Dynatrace

**Ejemplo:**

```javascript
// Synthetic test: Can create signature
POST /api/v1/signatures
{
  "customerId": "test-customer",
  "channel": "SMS",
  "phoneNumber": "+34600000000"
}

Expected: 201 Created
Run: Every 5 minutes
Alert: If 3 consecutive failures
```

---

## 📚 **Referencias**

### **Documentación Oficial**

- [Dynatrace API v2 - Problems](https://www.dynatrace.com/support/help/dynatrace-api/environment-api/problems-v2)
- [Dynatrace API v2 - Metrics](https://www.dynatrace.com/support/help/dynatrace-api/environment-api/metric-v2)
- [Dynatrace API v2 - Entities](https://www.dynatrace.com/support/help/dynatrace-api/environment-api/entity-v2)
- [Dynatrace API v2 - Events](https://www.dynatrace.com/support/help/dynatrace-api/environment-api/events-v2)

### **Guías Relacionadas**

- [DYNATRACE-QUICKSTART.md](DYNATRACE-QUICKSTART.md) - Configuración rápida
- [DYNATRACE-RESUMEN-EJECUTIVO.md](DYNATRACE-RESUMEN-EJECUTIVO.md) - Overview ejecutivo
- [INTEGRACION-DYNATRACE.md](INTEGRACION-DYNATRACE.md) - Guía completa de integración

---

## 📊 **Resumen de Endpoints**

| Funcionalidad | Método | Endpoint Dynatrace | Permisos Requeridos |
|---------------|--------|-------------------|-------------------|
| Listar problemas | GET | `/api/v2/problems` | Read problems (v2) |
| Ver problema | GET | `/api/v2/problems/{id}` | Read problems (v2) |
| Cerrar problema | POST | `/api/v2/problems/{id}/close` | Write problems (v2) |
| Comentar problema | POST | `/api/v2/problems/{id}/comments` | Write problems (v2) |
| Listar métricas | GET | `/api/v2/metrics` | Read metrics (v2) |
| Consultar series | POST | `/api/v2/metrics/query` | Read metrics (v2) |
| Listar entidades | GET | `/api/v2/entities` | Read entities (v2) |
| Enviar evento | POST | `/api/v2/events/ingest` | Write events (v2) |

---

## ✅ **Checklist de Implementación**

### **Backend**

- [ ] Crear `AlertManagerServiceDynatraceImpl.java`
- [ ] Implementar método `getAlerts()`
- [ ] Implementar método `getAlertById()`
- [ ] Implementar método `acknowledgeAlert()`
- [ ] Implementar método `resolveAlert()`
- [ ] Agregar `RestTemplate` bean
- [ ] Configurar `dynatrace.url` en `application.yml`
- [ ] Configurar `dynatrace.api-token` en `application.yml`
- [ ] Configurar `admin.portal.alerts.mock=false`
- [ ] Tests unitarios para mapeo de datos
- [ ] Tests de integración (con Dynatrace real)

### **Frontend**

- [ ] Verificar `RealApiClient.getAlerts()` funciona
- [ ] Verificar `RealApiClient.acknowledgeAlert()` funciona
- [ ] Verificar `RealApiClient.resolveAlert()` funciona
- [ ] Testing end-to-end en `/admin/alerts`
- [ ] Verificar auto-refresh (60s)
- [ ] Verificar filtros (severity, status)
- [ ] Verificar acciones (reconocer, resolver)

### **Configuración**

- [ ] Obtener credenciales de Dynatrace (Environment ID, API Token)
- [ ] Crear archivo `.env.dynatrace`
- [ ] Configurar variables de entorno
- [ ] Verificar conectividad con cURL
- [ ] Validar permisos del API Token
- [ ] Documentar credenciales en vault/wiki

### **Testing**

- [ ] Test manual con cURL
- [ ] Test unitario backend
- [ ] Test integración backend
- [ ] Test end-to-end frontend
- [ ] Verificar en Dynatrace UI que problemas se cierran
- [ ] Generar problema de prueba y verificar en panel

### **Documentación**

- [ ] Actualizar README con instrucciones
- [ ] Documentar API endpoints en Swagger
- [ ] Training al equipo
- [ ] Runbook para troubleshooting

---

**Última actualización:** 2025-12-05  
**Autor:** BMAD DevOps Team  
**Revisión:** Pendiente

---

**¿Listo para Implementar? 🚀**

Este documento contiene todo lo necesario para desarrollar la integración con Dynatrace API v2. Sigue el checklist paso a paso y contacta al equipo DevOps si necesitas ayuda con credenciales o permisos.
