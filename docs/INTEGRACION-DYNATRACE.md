# 🔷 Integración con Dynatrace - Signature Router

**Autor:** BMAD DevOps  
**Fecha:** 2025-12-04  
**Versión:** 1.0  
**Estado:** 🚧 En Progreso

---

## 📋 **Índice**

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Credenciales Requeridas](#credenciales-requeridas)
4. [Backend - OneAgent](#backend-oneagent)
5. [Frontend - RUM](#frontend-rum)
6. [API Integration - Alertas](#api-integration-alertas)
7. [Dashboards](#dashboards)
8. [Alerting](#alerting)
9. [Testing](#testing)
10. [Migración desde Prometheus](#migración-desde-prometheus)

---

## 🎯 **Introducción**

Dynatrace es la plataforma APM (Application Performance Management) enterprise utilizada en la organización para:

- **Full-Stack Observability**: Métricas, Traces, Logs, RUM
- **AI-Powered Analysis**: Detección automática de anomalías con Davis AI
- **Root Cause Analysis**: Identificación automática de problemas
- **Business Analytics**: Correlación técnica con impacto de negocio

### **Componentes a Integrar**

| Componente | Tecnología | Método de Integración |
|------------|-----------|----------------------|
| Backend API | Spring Boot | OneAgent (auto-instrumentación) |
| Frontend Admin | Next.js | RUM JavaScript |
| Base de Datos | PostgreSQL | OneAgent (auto-discovery) |
| Message Queue | Kafka | OneAgent (auto-discovery) |
| Infraestructura | Docker | OneAgent container |
| Alertas | Panel Admin | Dynatrace API v2 |

---

## 🏗️ **Arquitectura**

### **Antes (Prometheus)**
```
┌─────────────┐
│ Spring Boot │──┐
└─────────────┘  │
                 ├──> Prometheus ──> AlertManager ──> Frontend
┌─────────────┐  │
│  Next.js    │──┘
└─────────────┘
```

### **Después (Dynatrace)**
```
┌─────────────┐
│ Spring Boot │──┐
│ + OneAgent  │  │
└─────────────┘  │
                 ├──> Dynatrace Cloud ──> Frontend (vía API)
┌─────────────┐  │              │
│  Next.js    │──┤              └──> Davis AI
│  + RUM      │  │                    (anomaly detection)
└─────────────┘  │
                 │
┌─────────────┐  │
│ PostgreSQL  │──┤
│ + OneAgent  │  │
└─────────────┘  │
                 │
┌─────────────┐  │
│   Kafka     │──┘
│ + OneAgent  │
└─────────────┘
```

---

## 🔑 **Credenciales Requeridas**

### **1. Información del Tenant**

Solicitar al equipo DevOps:

```bash
# Environment ID
DYNATRACE_ENV_ID=abc12345

# Tenant URL
DYNATRACE_URL=https://abc12345.live.dynatrace.com

# Región (puede ser diferente)
# - live.dynatrace.com (US)
# - sprint.dynatracelabs.com (Sprint)
# - managed.dynatrace.com (Managed)
```

### **2. PaaS Token (para OneAgent)**

Permisos necesarios:
- `InstallerDownload`

```bash
DYNATRACE_PAAS_TOKEN=dt0c01.ST2EY72KQINXXXXXXXXXXXXXX...
```

### **3. API Token (para APIs)**

Permisos necesarios:
- `Read metrics` (v2)
- `Read problems` (v2)
- `Write events` (v2)
- `Read entities` (v2)
- `Read SLO` (v2)

```bash
DYNATRACE_API_TOKEN=dt0c01.XA7LQ9...XXXXXXXXXXXXXX...
```

### **4. Environment Variables**

Crear archivo `.env.dynatrace`:

```bash
# Dynatrace Configuration
DYNATRACE_ENV_ID=abc12345
DYNATRACE_URL=https://abc12345.live.dynatrace.com
DYNATRACE_PAAS_TOKEN=dt0c01.ST2EY72KQIN...
DYNATRACE_API_TOKEN=dt0c01.XA7LQ9...

# OneAgent Configuration
DT_TAGS=environment=dev,application=signature-router,team=backend
DT_CUSTOM_PROP=owner=bmad project=signature-router
```

---

## 🖥️ **Backend - OneAgent**

### **Opción 1: Instalación Local (Windows - Desarrollo)**

#### **Paso 1: Descargar OneAgent**

```powershell
# Ir a Dynatrace UI:
# Deploy Dynatrace > Start installation > Windows
# O usar PowerShell:

$env_id = "abc12345"
$paas_token = "dt0c01.ST2EY72KQIN..."

Invoke-WebRequest `
  -Uri "https://$env_id.live.dynatrace.com/api/v1/deployment/installer/agent/windows/default/latest?Api-Token=$paas_token" `
  -OutFile "Dynatrace-OneAgent-Windows.exe"
```

#### **Paso 2: Instalar**

```powershell
.\Dynatrace-OneAgent-Windows.exe `
  APP_LOG_CONTENT_ACCESS=1 `
  INFRA_ONLY=0 `
  HOST_GROUP=signature-router-dev `
  /quiet
```

**Parámetros importantes:**
- `APP_LOG_CONTENT_ACCESS=1` → Captura logs de aplicación
- `INFRA_ONLY=0` → Habilita full-stack monitoring (no solo infra)
- `HOST_GROUP` → Agrupa hosts lógicamente

#### **Paso 3: Reiniciar Aplicación**

```bash
# Spring Boot detectará OneAgent automáticamente
mvn spring-boot:run
```

**Verificación:**
1. Ir a Dynatrace UI
2. Menú: `Hosts`
3. Buscar tu hostname
4. Verificar que aparece `signature-router` en Process Groups

---

### **Opción 2: Docker (Recomendado)**

#### **Paso 1: Crear Dockerfile con OneAgent**

Crear `svc-signature-router/Dockerfile.dynatrace`:

```dockerfile
# Multi-stage build with Dynatrace OneAgent

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime with OneAgent
FROM eclipse-temurin:21-jre

# Install OneAgent
ARG DT_ENV_ID
ARG DT_PAAS_TOKEN
ARG DT_TAGS="environment=docker,application=signature-router"

# Download and install OneAgent
RUN apt-get update && \
    apt-get install -y wget unzip && \
    wget -O /tmp/oneagent.sh \
      "https://${DT_ENV_ID}.live.dynatrace.com/api/v1/deployment/installer/agent/unix/default/latest?Api-Token=${DT_PAAS_TOKEN}" && \
    /bin/sh /tmp/oneagent.sh APP_LOG_CONTENT_ACCESS=1 && \
    rm /tmp/oneagent.sh

# Copy application
COPY --from=build /app/target/*.jar /app/app.jar

# Environment variables for Dynatrace
ENV DT_TAGS="${DT_TAGS}"
ENV DT_CUSTOM_PROP="owner=bmad project=signature-router"

# Start application (OneAgent will auto-attach)
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

#### **Paso 2: Modificar docker-compose.yml**

Crear `svc-signature-router/docker-compose.dynatrace.yml`:

```yaml
version: '3.8'

services:
  # Signature Router App with Dynatrace
  signature-router-app:
    build:
      context: .
      dockerfile: Dockerfile.dynatrace
      args:
        DT_ENV_ID: ${DYNATRACE_ENV_ID}
        DT_PAAS_TOKEN: ${DYNATRACE_PAAS_TOKEN}
        DT_TAGS: "environment=docker,application=signature-router,team=backend"
    container_name: signature-router-app
    ports:
      - "8080:8080"
    environment:
      # Spring Boot
      SPRING_PROFILES_ACTIVE: local
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/signature_router
      SPRING_DATASOURCE_USERNAME: siguser
      SPRING_DATASOURCE_PASSWORD: sigpass
      
      # Dynatrace
      DT_TAGS: "environment=docker,application=signature-router"
      DT_CUSTOM_PROP: "owner=bmad project=signature-router"
      
      # Dynatrace API (para integración de alertas)
      DYNATRACE_URL: ${DYNATRACE_URL}
      DYNATRACE_API_TOKEN: ${DYNATRACE_API_TOKEN}
      ADMIN_PORTAL_ALERTS_MOCK: "false"  # ← Desactivar mock
      
    depends_on:
      postgres:
        condition: service_healthy
      keycloak:
        condition: service_healthy
    networks:
      - signature-router-network

  # PostgreSQL (sin cambios)
  postgres:
    image: postgres:15-alpine
    container_name: signature-router-postgres
    # ... (resto igual)

  # Keycloak (sin cambios)
  keycloak:
    # ... (resto igual)

networks:
  signature-router-network:
    driver: bridge

volumes:
  postgres-data:
  postgres-keycloak-data:
```

#### **Paso 3: Build y Deploy**

```bash
# Cargar variables de entorno
source .env.dynatrace

# Build con OneAgent
docker-compose -f docker-compose.dynatrace.yml build

# Start
docker-compose -f docker-compose.dynatrace.yml up -d

# Verificar logs
docker logs -f signature-router-app
```

**Buscar en logs:**
```
[OneAgent] OneAgent successfully connected
[OneAgent] Process signature-router-app is being monitored
```

---

### **Configuración Spring Boot para Dynatrace**

#### **application.yml - Configuración adicional**

```yaml
# svc-signature-router/src/main/resources/application.yml

spring:
  application:
    name: signature-router
    
# Dynatrace Integration
dynatrace:
  enabled: true
  metadata:
    service-name: signature-router-api
    service-version: ${project.version:1.0.0}
    environment: ${spring.profiles.active:dev}
    
# Mantener Actuator para health checks
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${spring.profiles.active}
```

---

## 🌐 **Frontend - RUM (Real User Monitoring)**

### **Paso 1: Obtener Script de RUM**

1. Ir a Dynatrace UI
2. Menú: `Frontend` > `Add new web application`
3. Nombre: `Signature Router Admin Panel`
4. Copiar el JavaScript snippet

Ejemplo:
```html
<script type="text/javascript" 
  src="https://js-cdn.dynatrace.com/jstag/abc12345/bf12345/...ruxitagent.js" 
  crossorigin="anonymous">
</script>
```

### **Paso 2: Integrar en Next.js**

Modificar `app-signature-router-admin/app/layout.tsx`:

```typescript
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Dynatrace RUM - Load as early as possible */}
        <Script
          id="dynatrace-rum"
          strategy="beforeInteractive"
          src={`https://js-cdn.dynatrace.com/jstag/${process.env.NEXT_PUBLIC_DYNATRACE_ENV_ID}/${process.env.NEXT_PUBLIC_DYNATRACE_APP_ID}/ruxitagent.js`}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

### **Paso 3: Variables de Entorno**

Agregar a `app-signature-router-admin/.env.local`:

```bash
# Dynatrace RUM
NEXT_PUBLIC_DYNATRACE_ENV_ID=abc12345
NEXT_PUBLIC_DYNATRACE_APP_ID=APPLICATION-1234567890ABCDEF

# Opcional: Custom Properties
NEXT_PUBLIC_DYNATRACE_APP_NAME=signature-router-admin
NEXT_PUBLIC_DYNATRACE_ENVIRONMENT=dev
```

### **Paso 4: Configuración Avanzada (Opcional)**

```typescript
// app-signature-router-admin/lib/dynatrace.ts

export function trackUserAction(actionName: string, metadata?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).dtrum) {
    (window as any).dtrum.enterAction(actionName, undefined, undefined, metadata);
  }
}

export function reportError(error: Error) {
  if (typeof window !== 'undefined' && (window as any).dtrum) {
    (window as any).dtrum.reportError(error);
  }
}

// Uso:
// trackUserAction('signature-created', { signatureId: '123', amount: 100 });
// reportError(new Error('Payment failed'));
```

---

## 🚨 **API Integration - Alertas en Panel Admin**

### **Paso 1: Crear Servicio de Dynatrace**

Crear `svc-signature-router/src/main/java/com/bank/signature/application/service/AlertManagerServiceDynatraceImpl.java`:

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
            String url = dynatraceUrl + "/api/v2/problems";
            
            // Build query parameters
            Map<String, String> params = new HashMap<>();
            params.put("from", "now-24h");  // Last 24 hours
            params.put("pageSize", "100");
            
            if (filters != null && filters.status() != null) {
                // Map our status to Dynatrace status
                String dtStatus = mapStatusToDynatrace(filters.status());
                if (dtStatus != null) {
                    params.put("problemSelector", "status(\"" + dtStatus + "\")");
                }
            }
            
            // Build URL with params
            String fullUrl = url + "?" + params.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));
            
            // Call Dynatrace API
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Api-Token " + apiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<DynatraceProblemsResponse> response = restTemplate.exchange(
                fullUrl,
                HttpMethod.GET,
                entity,
                DynatraceProblemsResponse.class
            );
            
            if (response.getBody() == null || response.getBody().problems == null) {
                log.warn("[DYNATRACE] No problems returned from API");
                return Collections.emptyList();
            }
            
            // Transform to our AlertResponse format
            List<AlertResponse> alerts = response.getBody().problems.stream()
                .map(this::transformToAlertResponse)
                .collect(Collectors.toList());
            
            // Apply severity filter if needed
            if (filters != null && filters.severity() != null) {
                alerts = alerts.stream()
                    .filter(a -> a.severity().equalsIgnoreCase(filters.severity()))
                    .collect(Collectors.toList());
            }
            
            // Sort by severity and time
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
        log.info("[DYNATRACE] Closing problem: {}", alertId);
        
        try {
            String url = dynatraceUrl + "/api/v2/problems/" + alertId + "/close";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Api-Token " + apiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, String> body = Map.of(
                "message", "Acknowledged by operator via admin panel",
                "comment", "Problem acknowledged"
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
        // In Dynatrace, we close the problem
        acknowledgeAlert(alertId);
    }
    
    // ========================================
    // Helper Methods
    // ========================================
    
    private AlertResponse transformToAlertResponse(DynatraceProblem problem) {
        return AlertResponse.builder()
            .id(problem.problemId)
            .name(problem.title)
            .description(problem.displayId + ": " + problem.impactLevel)
            .severity(mapSeverityFromDynatrace(problem.severityLevel))
            .status(mapStatusFromDynatrace(problem.status))
            .startsAt(problem.startTime != null ? Instant.ofEpochMilli(problem.startTime) : Instant.now())
            .endsAt(problem.endTime != null ? Instant.ofEpochMilli(problem.endTime) : null)
            .labels(Map.of(
                "problemId", problem.problemId,
                "displayId", problem.displayId,
                "impactLevel", problem.impactLevel,
                "managementZones", problem.managementZones != null ? String.join(",", problem.managementZones) : ""
            ))
            .annotations(Map.of(
                "summary", problem.title,
                "description", problem.impactLevel,
                "rootCause", problem.rootCauseEntity != null ? problem.rootCauseEntity.name : "Unknown"
            ))
            .build();
    }
    
    private String mapSeverityFromDynatrace(String dtSeverity) {
        if (dtSeverity == null) return "INFO";
        return switch (dtSeverity.toUpperCase()) {
            case "AVAILABILITY", "ERROR" -> "CRITICAL";
            case "PERFORMANCE", "RESOURCE_CONTENTION" -> "WARNING";
            default -> "INFO";
        };
    }
    
    private String mapStatusFromDynatrace(String dtStatus) {
        if (dtStatus == null) return "ACTIVE";
        return switch (dtStatus.toUpperCase()) {
            case "OPEN" -> "ACTIVE";
            case "RESOLVED" -> "RESOLVED";
            case "CLOSED" -> "ACKNOWLEDGED";
            default -> "ACTIVE";
        };
    }
    
    private String mapStatusToDynatrace(String ourStatus) {
        if (ourStatus == null) return null;
        return switch (ourStatus.toUpperCase()) {
            case "ACTIVE" -> "OPEN";
            case "RESOLVED" -> "RESOLVED";
            case "ACKNOWLEDGED" -> "CLOSED";
            default -> null;
        };
    }
    
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
    
    public static class DynatraceProblemsResponse {
        public List<DynatraceProblem> problems;
        public int totalCount;
        public int pageSize;
    }
    
    public static class DynatraceProblem {
        public String problemId;
        public String displayId;
        public String title;
        public String impactLevel;
        public String severityLevel;
        public String status;
        public Long startTime;
        public Long endTime;
        public List<String> managementZones;
        public RootCauseEntity rootCauseEntity;
    }
    
    public static class RootCauseEntity {
        public String entityId;
        public String name;
    }
}
```

### **Paso 2: Configuración**

Agregar a `application.yml`:

```yaml
# Dynatrace Configuration
dynatrace:
  url: ${DYNATRACE_URL:https://abc12345.live.dynatrace.com}
  api-token: ${DYNATRACE_API_TOKEN}

# Alert Manager Configuration
admin:
  portal:
    alerts:
      mock: false  # ← Usar Dynatrace, no mock
```

### **Paso 3: RestTemplate Bean**

Agregar a configuración:

```java
@Configuration
public class DynatraceConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

---

## 📊 **Dashboards en Dynatrace**

### **Dashboard Recomendados**

1. **Executive Overview**
   - Total signature requests
   - Success rate
   - Revenue impact
   - User satisfaction

2. **Performance Metrics**
   - Response time (P50, P95, P99)
   - Throughput (req/s)
   - Error rate
   - Database query performance

3. **Provider Health**
   - Circuit breaker status por provider
   - Fallback rate
   - Provider latency
   - Provider availability

4. **Infrastructure**
   - JVM heap/GC
   - Database connections
   - Kafka lag
   - Pod/Container health

5. **Business Metrics**
   - Signatures by status
   - Signatures by channel
   - Revenue by provider
   - Conversion funnel

---

## 🚨 **Alerting en Dynatrace**

### **Alerting Profiles**

Dynatrace tiene **AI-powered alerting** automático, pero puedes crear reglas personalizadas:

#### **1. Alerta Crítica: Circuit Breaker Open**

```
Problem Detection > Custom Events for Alerting

Metric: resilience4j.circuitbreaker.state
Condition: state == "open"
Duration: 5 minutes
Severity: ERROR
Alert Title: "Provider Circuit Breaker Open"
```

#### **2. Alerta Warning: High Fallback Rate**

```
Metric: routing.fallback.rate
Condition: > 10%
Duration: 10 minutes
Severity: WARNING
Alert Title: "High Routing Fallback Rate"
```

#### **3. Management Zones**

Organizar por:
- Environment (dev, staging, prod)
- Team (backend, frontend, infra)
- Application (signature-router-api, signature-router-admin)

---

## ✅ **Testing**

### **1. Verificar OneAgent**

```bash
# Ver procesos monitorizados
curl -X GET "https://{env-id}.live.dynatrace.com/api/v1/entity/infrastructure/processes" \
  -H "Authorization: Api-Token {api-token}"
```

### **2. Verificar RUM**

```javascript
// En browser console
window.dtrum
// Should return: {initialized: true, ...}
```

### **3. Generar Tráfico de Prueba**

```bash
# Generar requests
for i in {1..100}; do
  curl http://localhost:8080/api/v1/admin/signatures
done

# Generar errores
curl -X POST http://localhost:8080/api/v1/signatures \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

### **4. Verificar Alertas en Panel**

```bash
# Acceder a frontend
http://localhost:3001/admin/alerts

# Debería mostrar problemas de Dynatrace
```

---

## 🔄 **Migración desde Prometheus**

### **Archivos a Deprecar (no eliminar todavía)**

```
svc-signature-router/observability/
├── prometheus.yml                    # Mover a legacy/
├── prometheus/alerts/*.yml           # Mover a legacy/
├── alertmanager/alertmanager.yml     # Mover a legacy/
└── grafana/                          # Mantener temporalmente
```

### **Archivos a Mantener**

```
svc-signature-router/
├── application.yml                   # Actualizar con Dynatrace config
└── docker-compose.yml                # Actualizar para usar OneAgent
```

### **Plan de Migración**

**Fase 1 (Semana 1): Coexistencia**
- ✅ Instalar Dynatrace OneAgent
- ✅ Mantener Prometheus activo
- ✅ Validar que ambos funcionen

**Fase 2 (Semana 2): Migración de Alertas**
- ✅ Configurar alertas en Dynatrace
- ✅ Validar que funcionan correctamente
- ⚠️ Deshabilitar alertas de Prometheus (no eliminar)

**Fase 3 (Semana 3): Deprecación**
- ✅ Apagar Prometheus
- ✅ Apagar AlertManager
- ✅ Apagar Grafana
- ✅ Mover archivos a `legacy/`

**Fase 4 (Mes 2): Cleanup**
- ✅ Eliminar servicios de Docker Compose
- ✅ Eliminar dependencias no usadas
- ✅ Actualizar documentación

---

## 📚 **Recursos**

### **Documentación Oficial**

- [Dynatrace API v2](https://www.dynatrace.com/support/help/dynatrace-api/basics)
- [OneAgent Installation](https://www.dynatrace.com/support/help/setup-and-configuration/dynatrace-oneagent)
- [RUM JavaScript API](https://www.dynatrace.com/support/help/how-to-use-dynatrace/real-user-monitoring/setup-and-configuration/web-applications)

### **Endpoints Útiles**

```
# Problems API
GET /api/v2/problems
GET /api/v2/problems/{id}
POST /api/v2/problems/{id}/close

# Metrics API
GET /api/v2/metrics
GET /api/v2/metrics/query

# Entities API
GET /api/v2/entities
GET /api/v2/entities/{id}

# Events API
POST /api/v2/events/ingest
```

---

## 📞 **Soporte**

**Contactos internos:**
- DevOps Team: devops@example.com
- Dynatrace Admin: dynatrace-admin@example.com

**Links útiles:**
- Tenant: https://abc12345.live.dynatrace.com
- Confluence: https://wiki.example.com/dynatrace
- Runbooks: https://runbook.example.com/

---

## ✅ **Checklist de Implementación**

- [ ] Obtener credenciales de Dynatrace
- [ ] Instalar OneAgent en backend
- [ ] Integrar RUM en frontend
- [ ] Implementar `AlertManagerServiceDynatraceImpl`
- [ ] Configurar variables de entorno
- [ ] Crear dashboards en Dynatrace
- [ ] Configurar alerting profiles
- [ ] Testing end-to-end
- [ ] Deprecar Prometheus/AlertManager
- [ ] Actualizar documentación
- [ ] Training al equipo

---

**Última actualización:** 2025-12-04

