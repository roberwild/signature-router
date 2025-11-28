# 🧪 Guía de Pruebas - Signature Router

**Versión:** 1.0  
**Fecha:** 2025-11-27  
**Epic:** 4 - Resilience & Circuit Breaking  
**Última Story:** 4-2 - Fallback Chain Implementation

---

## 📋 **Índice**

1. [Requisitos Previos](#requisitos-previos)
2. [Pruebas Unitarias](#pruebas-unitarias)
3. [Pruebas de Arquitectura](#pruebas-de-arquitectura)
4. [Entorno Local con Docker](#entorno-local-con-docker)
5. [Pruebas de Integración](#pruebas-de-integración)
6. [Pruebas de Resilience4j](#pruebas-de-resilience4j)
7. [Pruebas de Health Checks](#pruebas-de-health-checks)
8. [Pruebas de Fallback Chain](#pruebas-de-fallback-chain)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 **Requisitos Previos**

### Software Requerido

- **Java 21** (Amazon Corretto o similar)
- **Maven 3.9+**
- **Docker Desktop** (para servicios de infraestructura)
- **PowerShell 5.1+** (Windows)

### Verificación Rápida

```powershell
# Java
java -version
# Debe mostrar: openjdk version "21.x.x"

# Maven
mvn -version
# Debe mostrar: Apache Maven 3.9.x

# Docker
docker --version
docker-compose --version
```

---

## 🧪 **1. Pruebas Unitarias**

### 1.1 Ejecutar Todas las Pruebas

```bash
mvn clean test
```

### 1.2 Pruebas Específicas por Módulo

#### **Provider Tests** (Stories 3.1, 3.2, 3.3, 3.4, 3.5)

```bash
# Todos los providers
mvn test -Dtest=*ProviderTest

# Twilio SMS
mvn test -Dtest=TwilioSmsProviderTest

# Push Notification (FCM)
mvn test -Dtest=PushNotificationProviderTest

# Voice Call (Twilio)
mvn test -Dtest=VoiceCallProviderTest

# Biometric (Stub)
mvn test -Dtest=BiometricProviderTest
```

#### **Health Check Tests** (Story 3.7)

```bash
mvn test -Dtest=ProviderHealthIndicatorTest,ProviderHealthServiceImplTest
```

#### **Circuit Breaker Tests** (Story 4-1)

```bash
# Buscar tests que validen @CircuitBreaker
mvn test -Dtest=ChallengeServiceImplTest
```

#### **Domain Model Tests**

```bash
mvn test -Dtest=SignatureRequestTest,SignatureChallengeTest,ProviderResultTest
```

### 1.3 Cobertura de Tests

```bash
mvn clean verify jacoco:report
```

**Ver reporte:**
- Abrir: `target/site/jacoco/index.html`

---

## 🏗️ **2. Pruebas de Arquitectura**

### 2.1 Validar Arquitectura Hexagonal

```bash
mvn test -Dtest=HexagonalArchitectureTest
```

**Valida:**
- ✅ Dominio puro (sin dependencias de infraestructura)
- ✅ `SignatureProviderPort` es una interfaz
- ✅ Value Objects sin dependencias externas
- ✅ Dependencias solo desde infraestructura hacia dominio

### 2.2 Resultados Esperados

```
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
```

---

## 🐳 **3. Entorno Local con Docker**

### 3.1 Iniciar Servicios de Infraestructura

```bash
docker-compose up -d
```

**Servicios:**
- PostgreSQL (puerto 5432)
- Kafka + Zookeeper (puerto 9092)
- Schema Registry (puerto 8081)
- Vault (puerto 8200)
- Prometheus (puerto 9090)
- Grafana (puerto 3000)

### 3.2 Verificar Salud de Servicios

```powershell
.\verify-health.ps1
```

**Salida esperada:**
```
✓ signature-router-postgres - HEALTHY
✓ signature-router-kafka - HEALTHY
✓ signature-router-vault - HEALTHY
✓ signature-router-prometheus - HEALTHY
✓ signature-router-grafana - HEALTHY
```

### 3.3 Configurar Vault (Primera vez)

```bash
# Acceder al contenedor
docker exec -it signature-router-vault sh

# Ejecutar script de inicialización
/vault/scripts/vault-init.sh
```

**Secrets que se crean:**
- `secret/signature-router/twilio` (ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER)
- `secret/signature-router/fcm` (SERVICE_ACCOUNT_PATH)
- `secret/signature-router/db` (POSTGRES_PASSWORD)

---

## 🚀 **4. Iniciar la Aplicación**

### 4.1 Perfil Local (Recomendado)

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 4.2 Verificar Inicio Exitoso

**Logs esperados:**
```
Started SignatureRouterApplication in X.XXX seconds
Tomcat started on port(s): 8080 (http)
```

### 4.3 Health Check Inicial

```bash
curl http://localhost:8080/actuator/health
```

**Respuesta esperada:**
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "kafka": {"status": "UP"},
    "providerHealth": {"status": "UP"}
  }
}
```

---

## 🧪 **5. Pruebas de Integración**

### 5.1 Health Check de Providers (Story 3.7)

```bash
# Endpoint Actuator
curl http://localhost:8080/actuator/health/providerHealth

# Endpoint Admin (requiere autenticación)
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:8080/api/v1/admin/providers/health
```

**Respuesta esperada (Admin Endpoint):**
```json
{
  "overallStatus": "UP",
  "timestamp": "2025-11-27T12:00:00Z",
  "providers": [
    {
      "name": "smsProvider",
      "type": "SMS",
      "status": "UP",
      "details": "Twilio API reachable",
      "lastCheckTimestamp": "2025-11-27T12:00:00Z",
      "latencyMs": 150
    },
    {
      "name": "pushProvider",
      "type": "PUSH",
      "status": "UP",
      "details": "FCM API reachable",
      "lastCheckTimestamp": "2025-11-27T12:00:00Z",
      "latencyMs": 200
    }
  ]
}
```

### 5.2 Crear una Solicitud de Firma (End-to-End)

```bash
curl -X POST http://localhost:8080/api/v1/signature-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "transactionId": "TXN-12345",
    "userId": "user-001",
    "channelType": "SMS",
    "amount": {
      "amount": 100.50,
      "currency": "USD"
    },
    "description": "Test transaction"
  }'
```

**Respuesta esperada:**
```json
{
  "requestId": "REQ-...",
  "status": "PENDING",
  "challengeId": "CHAL-...",
  "expiresAt": "2025-11-27T12:05:00Z"
}
```

---

## 🔄 **6. Pruebas de Resilience4j (Story 4-1)**

### 6.1 Circuit Breaker - Estado Normal

```bash
# Obtener métricas de Circuit Breaker
curl http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.state

# Ver estado de cada provider
curl http://localhost:8080/actuator/circuitbreakers
```

**Respuesta esperada:**
```json
{
  "circuitBreakers": {
    "smsProvider": {"state": "CLOSED"},
    "pushProvider": {"state": "CLOSED"},
    "voiceProvider": {"state": "CLOSED"},
    "biometricProvider": {"state": "CLOSED"}
  }
}
```

### 6.2 Simular Fallo y Activar Circuit Breaker

**Configuración actual (application.yml):**
```yaml
circuitbreaker:
  smsProvider:
    failure-rate-threshold: 50
    slow-call-rate-threshold: 80
    slow-call-duration-threshold: 3s
    minimum-number-of-calls: 5
```

**Pasos:**
1. Desactivar Twilio (cambiar credenciales inválidas en Vault)
2. Enviar 5+ solicitudes SMS
3. Verificar que el Circuit Breaker se abre (state: OPEN)

```bash
# Enviar múltiples solicitudes
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/v1/signature-requests -H "..." -d '{...}'
  sleep 1
done

# Verificar estado del Circuit Breaker
curl http://localhost:8080/actuator/circuitbreakers
```

**Respuesta esperada después de 5 fallos:**
```json
{
  "circuitBreakers": {
    "smsProvider": {"state": "OPEN"}  // ⚠️ ABIERTO
  }
}
```

### 6.3 Verificar Métricas de Fallos

```bash
curl http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.failure.rate
```

---

## 🔁 **7. Pruebas de Fallback Chain (Story 4-2)**

### 7.1 Configuración de Fallback

**En `application.yml`:**
```yaml
fallback:
  enabled: true
  chains:
    SMS: VOICE       # Si SMS falla, intenta VOICE
    PUSH: SMS        # Si PUSH falla, intenta SMS
    BIOMETRIC: SMS   # Si BIOMETRIC falla, intenta SMS
    VOICE: null      # VOICE no tiene fallback
```

### 7.2 Probar Fallback de SMS a VOICE

**Escenario:**
1. Desactivar Twilio SMS (credenciales inválidas)
2. Enviar solicitud con `channelType: SMS`
3. Verificar que el sistema automáticamente intenta VOICE

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/signature-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "transactionId": "TXN-FALLBACK-001",
    "userId": "user-001",
    "channelType": "SMS",
    "phoneNumber": "+1234567890",
    "amount": {"amount": 50.0, "currency": "USD"}
  }'
```

**Logs esperados:**
```
WARN  ChallengeServiceImpl - Primary provider failed for SMS: <error>
INFO  ChallengeServiceImpl - Attempting fallback from SMS to VOICE
INFO  ChallengeServiceImpl - Fallback successful: VOICE
```

**Métricas:**
```bash
curl http://localhost:8080/actuator/metrics/signature.challenge.fallback
```

**Respuesta esperada:**
```json
{
  "name": "signature.challenge.fallback",
  "measurements": [
    {"statistic": "COUNT", "value": 1}
  ],
  "availableTags": [
    {"tag": "from_channel", "values": ["SMS"]},
    {"tag": "to_channel", "values": ["VOICE"]},
    {"tag": "outcome", "values": ["success"]}
  ]
}
```

### 7.3 Probar Cadena Completa de Fallos

**Escenario:**
1. Desactivar SMS y VOICE
2. Enviar solicitud con `channelType: SMS`
3. Verificar que la solicitud finalmente falla después de agotar fallbacks

**Logs esperados:**
```
WARN  ChallengeServiceImpl - Primary provider failed for SMS: <error>
INFO  ChallengeServiceImpl - Attempting fallback from SMS to VOICE
WARN  ChallengeServiceImpl - Fallback provider VOICE also failed: <error>
ERROR ChallengeServiceImpl - All providers exhausted for challenge: <challengeId>
```

---

## 🩺 **8. Verificar Observabilidad**

### 8.1 Prometheus

**Acceder:**
- URL: http://localhost:9090
- Queries útiles:
  ```promql
  # Tasa de éxito de providers
  rate(signature_provider_send_total{result="success"}[5m])
  
  # Tasa de fallbacks
  rate(signature_challenge_fallback_total[5m])
  
  # Estado de Circuit Breakers
  resilience4j_circuitbreaker_state
  ```

### 8.2 Grafana

**Acceder:**
- URL: http://localhost:3000
- Usuario: `admin`
- Contraseña: `admin`

**Dashboard:**
- Navegar a: Dashboards → Signature Router Overview

**Paneles esperados:**
- Request Rate (por channel)
- Provider Success Rate
- Circuit Breaker Status
- Fallback Events
- Latency (p50, p95, p99)

---

## 🐛 **9. Troubleshooting**

### 9.1 Problema: "Connection refused" a PostgreSQL

**Causa:** Docker no está corriendo o PostgreSQL no inició.

**Solución:**
```bash
docker-compose up -d postgres
docker-compose logs postgres
```

### 9.2 Problema: "Twilio API credentials invalid"

**Causa:** Credenciales no configuradas en Vault.

**Solución:**
```bash
docker exec -it signature-router-vault sh
vault kv put secret/signature-router/twilio \
  ACCOUNT_SID=ACxxxx \
  AUTH_TOKEN=xxxx \
  PHONE_NUMBER=+1234567890
```

### 9.3 Problema: "Circuit Breaker OPEN"

**Causa:** Muchos fallos recientes.

**Solución:**
1. Esperar el tiempo de `wait-duration-in-open-state` (10s por defecto)
2. O reiniciar la aplicación para reset

### 9.4 Problema: Tests fallan por FCM

**Causa:** `firebase-credentials.json` no encontrado.

**Solución:**
```bash
# Desactivar FCM en tests
export FCM_ENABLED=false
mvn test
```

### 9.5 Logs Detallados

**Activar DEBUG:**
```yaml
# application-local.yml
logging:
  level:
    com.bank.signature: DEBUG
    io.github.resilience4j: DEBUG
```

---

## ✅ **Checklist de Validación Completa**

### Epic 1: Infrastructure
- [x] PostgreSQL conecta
- [x] Kafka funciona
- [x] Vault devuelve secrets

### Epic 2: Routing & Challenge
- [x] Routing rules evalúan correctamente
- [x] Challenges se crean y almacenan

### Epic 3: Provider Abstraction
- [x] `SignatureProviderPort` es interfaz pura
- [x] TwilioSmsProvider implementa puerto
- [x] PushNotificationProvider (FCM) implementa puerto
- [x] VoiceCallProvider implementa puerto
- [x] BiometricProvider (stub) implementa puerto
- [x] Health checks por provider funcionan
- [x] Endpoint `/api/v1/admin/providers/health` responde

### Epic 4: Resilience
- [x] Circuit Breakers por provider configurados
- [x] Circuit Breaker se abre tras fallos
- [x] Fallback SMS → VOICE funciona
- [x] Fallback PUSH → SMS funciona
- [x] Métricas de fallback se registran

---

## 📊 **Métricas Clave**

| Métrica | Objetivo | Comando |
|---------|----------|---------|
| Test Coverage | > 80% | `mvn jacoco:report` |
| ArchUnit Tests | 100% pass | `mvn test -Dtest=HexagonalArchitectureTest` |
| Provider Health | All UP | `curl localhost:8080/actuator/health/providerHealth` |
| Circuit Breaker | CLOSED | `curl localhost:8080/actuator/circuitbreakers` |
| Fallback Success | > 90% | Prometheus query: `rate(signature_challenge_fallback_total{outcome="success"}[5m])` |

---

## 🚀 **Quick Start (Todo en Uno)**

```powershell
# 1. Iniciar infraestructura
docker-compose up -d

# 2. Verificar salud
.\verify-health.ps1

# 3. Ejecutar tests
mvn clean test

# 4. Iniciar aplicación
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 5. Verificar aplicación
curl http://localhost:8080/actuator/health
```

---

## 📚 **Referencias**

- [README.md](./README.md) - Documentación general del proyecto
- [CHANGELOG.md](./CHANGELOG.md) - Historial de cambios
- [docs/sprint-artifacts/](./docs/sprint-artifacts/) - Stories completadas
- [Resilience4j Docs](https://resilience4j.readme.io/docs)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)

---

**Generado por:** BMAD Dev Agent  
**Última actualización:** 2025-11-27  
**Version:** 1.0 (Epic 4, Story 4-2 completada)

