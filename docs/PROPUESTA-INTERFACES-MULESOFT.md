# Propuesta de Interfaces MuleSoft - Signature Router

**Fecha:** 3 de diciembre de 2025  
**Proyecto:** Signature Router - Epic 14 (Frontend-Backend Integration)  
**Estado:** Propuesta para discusión con equipo MuleSoft

---

## 1. Contexto

Signature Router necesita métricas detalladas de los providers de comunicación (SMS, PUSH) para:

- Dashboard de operaciones en tiempo real
- Troubleshooting de errores
- Cumplimiento de SLAs (P99 < 500ms)
- Optimización de costos
- Alertas específicas por provider

Actualmente, los responses de MuleSoft **NO incluyen** metadata del provider real utilizado.

---

## 2. Response Actual vs. Response Propuesto

### 2.1 Response Actual (Limitado)

```json
{
  "notificationId": "COMM-EXEC-20241209-001234",
  "status": "SENT",
  "submittedAt": "2024-12-09T15:30:25.123Z",
  "channel": "SMS",
  "communicationExecutionId": "BIAN-COMM-EXEC-UUID-12345"
}
```

### 2.2 Response Propuesto (Con Metadata)

```json
{
  "notificationId": "COMM-EXEC-20241209-001234",
  "status": "SENT",
  "submittedAt": "2024-12-09T15:30:25.123Z",
  "channel": "SMS",
  "communicationExecutionId": "BIAN-COMM-EXEC-UUID-12345",
  
  "providerMetadata": {
    "providerId": "TWILIO_US",
    "providerName": "Twilio US East",
    "providerType": "SMS",
    "providerLatencyMs": 95,
    "mulesoftOverheadMs": 25,
    "totalLatencyMs": 120,
    "costPerRequest": 0.05,
    "currency": "EUR",
    "fallbackUsed": false,
    "attemptNumber": 1,
    "providerTransactionId": "SM1234567890abcdef"
  }
}
```

---

## 3. Endpoint de Métricas por Provider

### 3.1 GET /api/v1/providers/metrics

Endpoint para obtener métricas agregadas de todos los providers.

**Request:**
```http
GET /communication-execution/providers/metrics
Authorization: Bearer {token}
X-Correlation-Id: {uuid}
```

**Response:**
```json
{
  "timestamp": "2025-12-03T12:00:00Z",
  "aggregationPeriod": "24h",
  "providers": [
    {
      "providerId": "TWILIO_US",
      "providerName": "Twilio US East",
      "providerType": "SMS",
      "metrics": {
        "requestsTotal": 8521,
        "requestsSuccessful": 8427,
        "requestsFailed": 94,
        "successRate": 98.9,
        "latency": {
          "avgMs": 95,
          "p50Ms": 80,
          "p95Ms": 180,
          "p99Ms": 350
        },
        "cost": {
          "totalToday": 426.05,
          "totalMonth": 12580.50,
          "perRequest": 0.05,
          "currency": "EUR"
        }
      },
      "health": {
        "status": "UP",
        "uptime": 99.9,
        "lastCheckAt": "2025-12-03T11:59:45Z",
        "failuresLast24h": 0
      }
    },
    {
      "providerId": "FIREBASE_FCM",
      "providerName": "Firebase Cloud Messaging",
      "providerType": "PUSH",
      "metrics": {
        "requestsTotal": 2134,
        "requestsSuccessful": 2098,
        "requestsFailed": 36,
        "successRate": 98.3,
        "latency": {
          "avgMs": 65,
          "p50Ms": 55,
          "p95Ms": 120,
          "p99Ms": 250
        },
        "cost": {
          "totalToday": 21.34,
          "totalMonth": 640.20,
          "perRequest": 0.01,
          "currency": "EUR"
        }
      },
      "health": {
        "status": "UP",
        "uptime": 99.8,
        "lastCheckAt": "2025-12-03T11:59:50Z",
        "failuresLast24h": 1
      }
    }
  ]
}
```

### 3.2 GET /api/v1/providers/{providerId}/metrics

Endpoint para obtener métricas de un provider específico.

**Request:**
```http
GET /communication-execution/providers/TWILIO_US/metrics?period=7d
Authorization: Bearer {token}
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `period` | string | `24h` | Período de agregación: `1h`, `24h`, `7d`, `30d` |

**Response:**
```json
{
  "providerId": "TWILIO_US",
  "providerName": "Twilio US East",
  "providerType": "SMS",
  "period": "7d",
  "calculatedAt": "2025-12-03T12:00:00Z",
  
  "summary": {
    "requestsTotal": 52340,
    "requestsSuccessful": 51762,
    "requestsFailed": 578,
    "successRate": 98.9
  },
  
  "latency": {
    "current": {
      "avgMs": 95,
      "p50Ms": 80,
      "p95Ms": 180,
      "p99Ms": 350
    },
    "timeline": [
      { "timestamp": "2025-12-02T00:00:00Z", "avgMs": 92, "p99Ms": 340 },
      { "timestamp": "2025-12-02T01:00:00Z", "avgMs": 88, "p99Ms": 320 },
      { "timestamp": "2025-12-02T02:00:00Z", "avgMs": 95, "p99Ms": 360 }
    ]
  },
  
  "throughput": {
    "current": 142,
    "unit": "requests/minute",
    "timeline": [
      { "timestamp": "2025-12-02T00:00:00Z", "value": 135 },
      { "timestamp": "2025-12-02T01:00:00Z", "value": 128 },
      { "timestamp": "2025-12-02T02:00:00Z", "value": 145 }
    ]
  },
  
  "errors": {
    "total": 578,
    "byType": {
      "INVALID_PHONE": 234,
      "TIMEOUT": 156,
      "RATE_LIMITED": 98,
      "PROVIDER_ERROR": 90
    }
  },
  
  "cost": {
    "totalPeriod": 2617.00,
    "perRequest": 0.05,
    "currency": "EUR",
    "timeline": [
      { "date": "2025-12-02", "cost": 426.05 },
      { "date": "2025-12-01", "cost": 412.30 },
      { "date": "2025-11-30", "cost": 398.75 }
    ]
  },
  
  "health": {
    "status": "UP",
    "uptime": 99.9,
    "uptimeTimeline": [
      { "date": "2025-12-02", "uptime": 100.0 },
      { "date": "2025-12-01", "uptime": 99.8 },
      { "date": "2025-11-30", "uptime": 99.9 }
    ],
    "incidents": []
  }
}
```

---

## 4. Endpoint de Health por Provider

### 4.1 GET /api/v1/providers/health

Endpoint para obtener el estado de salud de todos los providers.

**Request:**
```http
GET /communication-execution/providers/health
Authorization: Bearer {token}
```

**Response:**
```json
{
  "timestamp": "2025-12-03T12:00:00Z",
  "overallStatus": "HEALTHY",
  "providers": [
    {
      "providerId": "TWILIO_US",
      "providerName": "Twilio US East",
      "providerType": "SMS",
      "status": "UP",
      "statusSince": "2025-12-01T00:00:00Z",
      "lastCheckAt": "2025-12-03T11:59:45Z",
      "latencyMs": 45,
      "details": "All systems operational"
    },
    {
      "providerId": "FIREBASE_FCM",
      "providerName": "Firebase Cloud Messaging",
      "providerType": "PUSH",
      "status": "UP",
      "statusSince": "2025-12-02T08:30:00Z",
      "lastCheckAt": "2025-12-03T11:59:50Z",
      "latencyMs": 32,
      "details": "All systems operational"
    },
    {
      "providerId": "VONAGE_EU",
      "providerName": "Vonage EU",
      "providerType": "SMS",
      "status": "DEGRADED",
      "statusSince": "2025-12-03T10:15:00Z",
      "lastCheckAt": "2025-12-03T11:59:55Z",
      "latencyMs": 850,
      "details": "High latency detected",
      "degradedReason": "Provider experiencing delays in EU region"
    }
  ]
}
```

---

## 5. Response de Error con Metadata

Cuando un envío falla, necesitamos información detallada del error.

### 5.1 Error Response Propuesto

```json
{
  "notificationId": "COMM-EXEC-20241209-001235",
  "status": "FAILED",
  "submittedAt": "2024-12-09T15:30:25.123Z",
  "channel": "SMS",
  "communicationExecutionId": "BIAN-COMM-EXEC-UUID-12346",
  
  "error": {
    "code": "PROVIDER_ERROR",
    "message": "Failed to send SMS notification",
    "retryable": true
  },
  
  "providerMetadata": {
    "providerId": "TWILIO_US",
    "providerName": "Twilio US East",
    "providerType": "SMS",
    "providerLatencyMs": 450,
    "attemptNumber": 2,
    "providerError": {
      "code": "21211",
      "message": "The 'To' number +341234 is not a valid phone number.",
      "category": "INVALID_PHONE"
    },
    "fallbackAttempted": true,
    "fallbackProvider": "VONAGE_EU",
    "fallbackResult": "ALSO_FAILED"
  }
}
```

---

## 6. Headers HTTP Alternativos

Si modificar el body no es viable, se pueden usar headers HTTP:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Provider-Id: TWILIO_US
X-Provider-Name: Twilio US East
X-Provider-Latency-Ms: 95
X-MuleSoft-Overhead-Ms: 25
X-Total-Latency-Ms: 120
X-Provider-Cost: 0.05
X-Provider-Currency: EUR
X-Fallback-Used: false
```

---

## 7. Implementación por Fases

### Fase 1: Metadata Básica (MVP) - 1 Sprint

Añadir al response actual:

```json
{
  "providerMetadata": {
    "providerId": "TWILIO_US",
    "providerLatencyMs": 95
  }
}
```

**Esfuerzo estimado:** Bajo (la información ya existe internamente)

### Fase 2: Metadata Completa - 2 Sprints

```json
{
  "providerMetadata": {
    "providerId": "TWILIO_US",
    "providerName": "Twilio US East",
    "providerType": "SMS",
    "providerLatencyMs": 95,
    "mulesoftOverheadMs": 25,
    "costPerRequest": 0.05,
    "currency": "EUR",
    "fallbackUsed": false
  }
}
```

### Fase 3: Endpoints de Métricas - 2 Sprints

- `GET /providers/metrics` - Métricas agregadas
- `GET /providers/{id}/metrics` - Métricas por provider
- `GET /providers/health` - Health check detallado

---

## 8. Beneficios para MuleSoft

| Beneficio | Descripción |
|-----------|-------------|
| Menos escalaciones | Signature Router puede hacer troubleshooting sin escalar a MuleSoft |
| Mejor SLA percibido | Clientes internos ven métricas detalladas, no solo "MuleSoft funciona" |
| Optimización de costos | Datos para negociar mejores tarifas con providers |
| Visibilidad compartida | Dashboard unificado para operaciones |

---

## 9. Impacto de NO Implementar

| Funcionalidad | Con Metadata | Sin Metadata |
|---------------|--------------|--------------|
| Dashboard por provider | Twilio: 95%, Firebase: 88% | Solo "MuleSoft": 90% |
| Troubleshooting | "Twilio error 21211: Invalid phone" | "MuleSoft error genérico" |
| SLA Tracking | P99 por provider | P99 total (impreciso) |
| Optimización de costos | Comparar providers | Imposible |
| Alertas específicas | "Twilio degradado" | "MuleSoft degradado" |
| Tiempo de resolución | ~5 minutos | ~24 horas (escalación) |

---

## 10. Próximos Pasos

1. **Revisar propuesta** con equipo MuleSoft
2. **Priorizar fases** según capacidad del equipo
3. **Definir timeline** para implementación
4. **Coordinar testing** en ambiente DEV/UAT

---

## 11. Contacto

**Signature Router Team:**
- Responsable técnico: [TBD]
- Email: [TBD]

**MuleSoft Team:**
- Contacto técnico: [TBD]
- Email: [TBD]

---

**Documento preparado para:** Reunión técnica MuleSoft  
**Última actualización:** 3 de diciembre de 2025

