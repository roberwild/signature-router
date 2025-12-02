# 🚀 Signature Router Backend Service

## Sistema de Enrutamiento Inteligente de Firmas Digitales

**Signature Router** es un microservicio bancario enterprise-grade construido con Spring Boot 3.2 y Java 21, que implementa un sistema inteligente de enrutamiento de firmas digitales con arquitectura hexagonal (puertos y adaptadores).

---

## 📋 Tabla de Contenidos

- [**🚀 Quick Start**](#-quick-start)
- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [Testing](#-testing)
- [Documentación](#-documentación)
- [Seguridad](#-seguridad)
- [Observabilidad](#-observabilidad)
- [Deployment](#-deployment)
- [**⚠️ Liquibase - Arquitectura Mandatoria**](#️-liquibase---arquitectura-mandatoria)

---

## 🚀 Quick Start

### Arranque Rápido con Datos de Prueba (RECOMENDADO)

```powershell
# Desde svc-signature-router/
.\check-and-start.ps1 -LoadTestData
```

Este comando:
1. ✅ Verifica y libera puerto 5432 (si está ocupado)
2. ✅ Inicia Docker Compose (PostgreSQL, Kafka, Vault, Grafana, Jaeger)
3. ✅ **Carga 30+ registros de prueba** (proveedores, reglas, firmas)
4. ✅ Arranca Spring Boot backend

**Base de datos poblada con:**
- 7 proveedores (SMS: Twilio/AWS SNS, PUSH: FCM/OneSignal, VOICE: Twilio, BIOMETRIC: BioCatch)
- 6 reglas de enrutamiento
- 30 solicitudes de firma (COMPLETED, PENDING, EXPIRED, FAILED, ABORTED)
- Desafíos, audit logs, eventos

### Arranque Normal (sin datos)

```powershell
.\check-and-start.ps1
```

Base de datos vacía - Ideal para desarrollo limpio.

### URLs Útiles

- **API REST**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/actuator/health
- **Grafana**: http://localhost:3001 (admin/admin)
- **Jaeger**: http://localhost:16686

📖 **Guía completa**: Ver [`QUICK-START.md`](QUICK-START.md)

---

## 🎯 Descripción General

El **Signature Router Backend Service** es el núcleo del sistema de gestión de firmas digitales de Singular Bank. Proporciona:

- **Enrutamiento Inteligente**: Motor de reglas basado en SpEL para selección dinámica de proveedores
- **Multi-Proveedor**: Integración con múltiples canales (SMS, PUSH, VOICE, BIOMETRIC)
- **Alta Disponibilidad**: Circuit breakers, retry policies, fallback automático
- **Event-Driven**: Arquitectura basada en eventos con Apache Kafka
- **Seguridad Enterprise**: OAuth2, JWT (RS256), HashiCorp Vault
- **Observabilidad Completa**: Métricas, trazas distribuidas, alertas

---

## ✨ Características Principales

### Core Features

- ✅ **Motor de Routing Avanzado**: Reglas dinámicas con expresiones SpEL
- ✅ **Gestión de Firmas**: Ciclo de vida completo (solicitud, validación, expiración, aborto)
- ✅ **Multi-Canal**: Soporte para SMS, PUSH, VOICE, BIOMETRIC
- ✅ **Idempotencia**: Prevención de duplicados con TTL configurable
- ✅ **Outbox Pattern**: Garantía de entrega de eventos con Debezium CDC
- ✅ **Circuit Breaker**: Protección contra fallos en cascada
- ✅ **Rate Limiting**: Control de throughput por proveedor

### Seguridad

- 🔒 **OAuth2 Resource Server**: Autenticación basada en JWT (RS256)
- 🔒 **RBAC**: Control de acceso basado en roles (ADMIN, OPERATOR, VIEWER)
- 🔒 **Vault Integration**: Gestión segura de secretos con HashiCorp Vault
- 🔒 **Audit Log**: Registro inmutable de operaciones sensibles
- 🔒 **PostgreSQL RLS**: Row-Level Security para aislamiento multi-tenant
- 🔒 **Pseudonymization**: Protección de datos personales según GDPR

### Observabilidad

- 📊 **Prometheus Metrics**: 50+ métricas custom
- 📊 **Grafana Dashboards**: 7 dashboards ejecutivos y técnicos
- 📊 **Distributed Tracing**: Jaeger para trazabilidad end-to-end
- 📊 **SLO Monitoring**: Seguimiento de objetivos de nivel de servicio
- 📊 **Alertmanager**: Alertas críticas y warnings configurables
- 📊 **MDC Logging**: Logs estructurados con contexto de trazabilidad

---

## 🏗️ Arquitectura

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Use Cases, DTOs, Controllers, Application Services)        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                     Domain Layer                             │
│  (Entities, Value Objects, Domain Services, Domain Events)   │
│  - SignatureRequest Aggregate                                │
│  - RoutingRule Aggregate                                     │
│  - Domain Events (SignatureRequestCreated, etc.)             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  - Adapters (JPA, Kafka, REST Clients)                       │
│  - Configuration (Security, Observability, Resilience)       │
│  - External Integrations (Twilio, OneSignal, Biometric)      │
└──────────────────────────────────────────────────────────────┘
```

### Tecnical Stack

**Core:**
- Java 21 (LTS)
- Spring Boot 3.2.0
- Maven 3.9+

**Database:**
- PostgreSQL 15+
- Liquibase (migrations)
- JPA/Hibernate

**Messaging:**
- Apache Kafka 3.5+
- Avro (Schema Registry)
- Debezium CDC

**Security:**
- Spring Security OAuth2 Resource Server
- Keycloak (Identity Provider)
- HashiCorp Vault
- JWT (RS256)

**Observability:**
- Micrometer + Prometheus
- Grafana
- Jaeger (OpenTelemetry)
- Logback (JSON structured logs)

**Resilience:**
- Resilience4j (Circuit Breaker, Retry, Rate Limiter)
- Spring Cloud Gateway (opcional)

**Testing:**
- JUnit 5
- Mockito
- Testcontainers
- ArchUnit
- RestAssured

---

## 📦 Requisitos Previos

### Software Requerido

- **Java 21** (OpenJDK o Oracle JDK)
- **Maven 3.9+**
- **Docker Desktop** (o Docker Engine + Docker Compose)
- **Git**

### Puertos Necesarios

Asegúrate de que los siguientes puertos estén disponibles:

- `8080`: Aplicación Spring Boot
- `5432`: PostgreSQL
- `9092`: Kafka broker
- `8081`: Schema Registry
- `8083`: Kafka Connect (Debezium)
- `8200`: HashiCorp Vault
- `8082`: Keycloak
- `9090`: Prometheus
- `3000`: Grafana
- `16686`: Jaeger UI

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
# Si este es un repositorio independiente
git clone <repository-url>
cd svc-signature-router

# Si forma parte de un monorepo
cd signature-router/svc-signature-router
```

### 2. Verificar Requisitos

```powershell
# Windows
.\check-docker.ps1

# Linux/Mac
./scripts/check-requirements.sh
```

### 3. Instalar Dependencias

```bash
./mvnw clean install -DskipTests
```

---

## ⚙️ Configuración

### Variables de Entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp setenv.ps1.example setenv.ps1  # Windows
cp setenv.sh.example setenv.sh    # Linux/Mac
```

Edita `setenv.ps1` (Windows) o `setenv.sh` (Linux/Mac) con tus valores:

```powershell
# Database
$env:POSTGRES_HOST="localhost"
$env:POSTGRES_PORT="5432"
$env:POSTGRES_DB="signature_router"
$env:POSTGRES_USER="signature_user"
$env:POSTGRES_PASSWORD="signature_pass"

# Kafka
$env:KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
$env:SCHEMA_REGISTRY_URL="http://localhost:8081"

# Keycloak
$env:KEYCLOAK_URL="http://localhost:8082"
$env:KEYCLOAK_REALM="signature-router"

# Vault
$env:VAULT_ADDR="http://localhost:8200"
$env:VAULT_TOKEN="root-token"

# Observability
$env:JAEGER_ENDPOINT="http://localhost:14250"
```

### Perfiles de Spring

- `local`: Desarrollo local (default)
- `test`: Testing automático
- `uat`: User Acceptance Testing
- `prod`: Producción

---

## 🏃 Ejecución

### Opción 1: Docker Compose (Recomendado para desarrollo)

```bash
# Iniciar toda la infraestructura
docker-compose up -d

# Esperar a que todos los servicios estén listos (1-2 minutos)
# Verificar estado
docker-compose ps

# Iniciar la aplicación Spring Boot
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

### Opción 2: Ejecución Manual

```bash
# 1. Iniciar solo la infraestructura
docker-compose up -d postgres kafka zookeeper schema-registry

# 2. Inicializar Vault (solo primera vez)
./vault/scripts/vault-init.sh

# 3. Aplicar migraciones de base de datos
./mvnw liquibase:update

# 4. Iniciar aplicación
./mvnw spring-boot:run
```

### Opción 3: JAR Standalone

```bash
# Build
./mvnw clean package -DskipTests

# Run
java -jar target/signature-router-0.1.0-SNAPSHOT.jar --spring.profiles.active=local
```

### Verificar Salud del Sistema

```bash
# Health check
curl http://localhost:8080/actuator/health

# Info
curl http://localhost:8080/actuator/info

# Metrics
curl http://localhost:8080/actuator/prometheus
```

---

## 🧪 Testing

### Ejecutar Todos los Tests

```bash
./mvnw clean test
```

### Tests por Categoría

```bash
# Unit tests
./mvnw test -Dtest=*Test

# Integration tests
./mvnw test -Dtest=*IntegrationTest

# Architecture tests (ArchUnit)
./mvnw test -Dtest=HexagonalArchitectureTest
```

### Coverage Report

```bash
./mvnw clean verify jacoco:report

# Abrir reporte
open target/site/jacoco/index.html  # Mac/Linux
start target/site/jacoco/index.html # Windows
```

**Coverage Actual:** 78% (objetivo: >75%)

### Tests de Integración con Postman

Ver: [GUIA-PRUEBAS-POSTMAN.md](GUIA-PRUEBAS-POSTMAN.md)

```bash
# Importar colección
postman/Signature-Router-v2.postman_collection.json

# Importar environment
postman/Signature-Router-Local.postman_environment.json
```

---

## 📚 Documentación

### Documentación Técnica

- **[TESTING.md](TESTING.md)**: Guía completa de testing
- **[SECURITY.md](SECURITY.md)**: Arquitectura de seguridad
- **[TECH-DEBT.md](TECH-DEBT.md)**: Deuda técnica conocida
- **[docs/epics.md](docs/epics.md)**: Descripción de todas las épicas

### Documentación por Épica

| Epic | Descripción | Documentación |
|------|-------------|---------------|
| Epic 1 | Foundation & Core Domain | [docs/sprint-artifacts/tech-spec-epic-1.md](docs/sprint-artifacts/tech-spec-epic-1.md) |
| Epic 2 | Routing Engine | [docs/sprint-artifacts/tech-spec-epic-2.md](docs/sprint-artifacts/tech-spec-epic-2.md) |
| Epic 3 | Multi-Provider Integration | [docs/sprint-artifacts/tech-spec-epic-3.md](docs/sprint-artifacts/tech-spec-epic-3.md) |
| Epic 4 | Resilience & Fault Tolerance | [docs/sprint-artifacts/tech-spec-epic-4.md](docs/sprint-artifacts/tech-spec-epic-4.md) |
| Epic 5 | Event-Driven Architecture | [docs/sprint-artifacts/tech-spec-epic-5.md](docs/sprint-artifacts/tech-spec-epic-5.md) |
| Epic 8 | Security & Compliance | [docs/EPIC-8-README.md](docs/EPIC-8-README.md) |
| Epic 9 | Observability | [docs/sprint-artifacts/EPIC-9-EXECUTIVE-SUMMARY.md](docs/sprint-artifacts/EPIC-9-EXECUTIVE-SUMMARY.md) |
| Epic 10 | Quality & Testing | [docs/EPIC-10-QUALITY-TESTING-EXCELLENCE.md](docs/EPIC-10-QUALITY-TESTING-EXCELLENCE.md) |

### API Documentation

```bash
# Swagger UI (cuando la app está corriendo)
http://localhost:8080/swagger-ui.html

# OpenAPI JSON
http://localhost:8080/v3/api-docs
```

---

## 🔒 Seguridad

### Autenticación y Autorización

El servicio utiliza **OAuth2 Resource Server** con JWT (RS256).

#### Obtener Token de Acceso

```powershell
# Windows
.\keycloak\get-token.ps1

# Linux/Mac
./keycloak/get-token.sh
```

#### Roles Disponibles

- `ROLE_ADMIN`: Acceso completo (gestión de reglas, proveedores)
- `ROLE_OPERATOR`: Operaciones de firma, consultas
- `ROLE_VIEWER`: Solo lectura

#### Ejemplo de Request con Token

```bash
# Obtener token
TOKEN=$(curl -X POST "http://localhost:8082/realms/signature-router/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=signature-router-client" \
  | jq -r '.access_token')

# Usar token
curl -X GET "http://localhost:8080/api/v1/signatures" \
  -H "Authorization: Bearer $TOKEN"
```

### Vault Integration

Los secretos sensibles se gestionan con HashiCorp Vault:

```bash
# Inicializar Vault (solo primera vez)
./vault/scripts/vault-init.sh

# Configurar secretos
vault kv put secret/signature-router/providers/twilio \
  account-sid="ACxxxxxxxxxxxxxxxxx" \
  auth-token="your-auth-token"
```

Ver: [docs/VAULT-SETUP.md](docs/VAULT-SETUP.md)

---

## 📊 Observabilidad

### Prometheus Metrics

```bash
# Endpoint de métricas
http://localhost:8080/actuator/prometheus

# Prometheus UI
http://localhost:9090

# Query ejemplo
signature_request_total{status="COMPLETED"}
```

### Grafana Dashboards

```bash
# Grafana UI
http://localhost:3000
# Credenciales: admin / admin

# Dashboards disponibles:
# - Executive Overview
# - Signature Router Overview
# - Provider Health
# - SLO Compliance
# - Performance Metrics
# - Business Metrics
# - Infrastructure
```

### Jaeger (Distributed Tracing)

```bash
# Jaeger UI
http://localhost:16686

# Buscar trazas:
# - Service: signature-router
# - Operation: POST /api/v1/signatures
```

### Logs Estructurados

Los logs utilizan formato JSON con MDC para contexto de trazabilidad:

```json
{
  "timestamp": "2025-11-30T10:15:30.123Z",
  "level": "INFO",
  "logger": "c.b.s.a.u.CreateSignatureRequestUseCase",
  "message": "Signature request created successfully",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "requestId": "req-12345",
  "userId": "user-67890",
  "signatureId": "sig-abcdef"
}
```

Ver: [docs/observability/DISTRIBUTED_TRACING.md](docs/observability/DISTRIBUTED_TRACING.md)

---

## 🚢 Deployment

### Build para Producción

```bash
# Clean build con todos los tests
./mvnw clean package

# JAR generado
ls -la target/signature-router-*.jar
```

### Docker Image

```bash
# Build image
docker build -t signature-router:latest .

# Run container
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e POSTGRES_HOST=prod-db.example.com \
  --name signature-router \
  signature-router:latest
```

### Variables de Entorno - Producción

```bash
# Required
SPRING_PROFILES_ACTIVE=prod
POSTGRES_HOST=<db-host>
POSTGRES_PORT=5432
POSTGRES_DB=signature_router
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<password>
KAFKA_BOOTSTRAP_SERVERS=<kafka-servers>
KEYCLOAK_URL=<keycloak-url>
VAULT_ADDR=<vault-url>
VAULT_TOKEN=<vault-token>

# Optional (con valores por defecto)
SERVER_PORT=8080
LOGGING_LEVEL_ROOT=INFO
SPRING_JPA_SHOW_SQL=false
```

### Health Checks

```yaml
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 10

# Kubernetes readiness probe
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 5
```

---

## 📞 Soporte y Contacto

### Issues y Bugs

Para reportar bugs o solicitar features, crea un issue en el repositorio.

### Documentación Adicional

- **Quick Test Guide**: [QUICK-TEST-GUIDE.md](QUICK-TEST-GUIDE.md)
- **Keycloak Setup**: [KEYCLOAK-SETUP.md](KEYCLOAK-SETUP.md)
- **Twilio Configuration**: [CONFIGURAR-TWILIO.md](CONFIGURAR-TWILIO.md)
- **Troubleshooting**: [SOLUCION-RAPIDA.md](SOLUCION-RAPIDA.md)

### Lecciones Aprendidas

Ver: [LECCIONES-APRENDIDAS-SPRING-BOOT.md](LECCIONES-APRENDIDAS-SPRING-BOOT.md)

---

## 📄 Licencia

Copyright © 2025 Singular Bank. Todos los derechos reservados.

---

## 🎯 Roadmap

- [ ] Soporte para firma electrónica avanzada (AdES)
- [ ] Integración con más proveedores biométricos
- [ ] Dashboard de analíticas en tiempo real
- [ ] Soporte multi-región (replicación geográfica)
- [ ] Machine Learning para optimización de rutas

---

## ⚠️ Liquibase - Arquitectura Mandatoria

### Estado Actual: LOCAL

- **Liquibase:** `DESHABILITADO` (`enabled: false`)
- **Hibernate:** `ddl-auto: update` (genera esquema automáticamente)
- **Changesets:** Vacíos (se crearán para primer despliegue)

### 📖 Documentación Completa

**ANTES de crear changesets para DEV/UAT/PROD, LEER:**

```
src/main/resources/liquibase/README-LIQUIBASE-GUIDELINES.md
```

Este documento contiene la **arquitectura mandatoria** de la organización:
- ✅ Estructura de directorios obligatoria
- ✅ Convenciones de nomenclatura
- ✅ Columnas obligatorias (id, created_at, updated_at)
- ✅ Reglas de auditoría
- ✅ Proceso de validación y rollback
- ✅ Templates reutilizables

### 🚨 IMPORTANTE

**NO crear changesets** sin consultar primero `README-LIQUIBASE-GUIDELINES.md`.

La arquitectura Liquibase es **mandatoria** y debe cumplirse al 100% cuando se despliegue a otros entornos.

---

**¿Preguntas?** Consulta la documentación completa en [docs/](docs/) o contacta al equipo de desarrollo.

