# 🚀 Guía de Despliegue en Raspberry Pi 5

> **Documento de Deployment:** Stack minimalista de Signature Router en Raspberry Pi 5 usando Coolify

---

## 📋 Tabla de Contenidos

- [Resumen Ejecutivo](#-resumen-ejecutivo)
- [Stack a Desplegar](#-stack-a-desplegar)
- [Recursos Estimados](#-recursos-estimados)
- [Pre-requisitos](#-pre-requisitos)
- [Paso 1: Configurar DNS](#paso-1-configurar-dns-en-cloudflare)
- [Paso 2: Preparar Archivos del Proyecto](#paso-2-preparar-archivos-del-proyecto)
- [Paso 3: Desplegar PostgreSQL](#paso-3-desplegar-postgresql-en-coolify)
- [Paso 4: Desplegar Keycloak](#paso-4-desplegar-keycloak-en-coolify)
- [Paso 5: Configurar Keycloak](#paso-5-configurar-keycloak)
- [Paso 6: Desplegar Backend Spring Boot](#paso-6-desplegar-backend-spring-boot)
- [Paso 7: Desplegar Frontend Next.js](#paso-7-desplegar-frontend-nextjs)
- [Paso 8: Integración con Monitoring](#paso-8-integración-con-monitoring-existente)
- [Verificación Final](#-verificación-final)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Resumen Ejecutivo

Esta guía despliega una versión **minimalista pero funcional** de Signature Router en tu Raspberry Pi 5, optimizada para demostración y portfolio.

### ✅ Lo que SÍ incluye:

- Frontend Next.js con autenticación
- Backend Spring Boot API REST completa
- PostgreSQL compartido (app + Keycloak)
- Keycloak para OAuth2/JWT
- SSL automático con Let's Encrypt
- Integración con Grafana/Prometheus/Loki existentes

### ❌ Lo que NO incluye (para ahorrar RAM):

- Kafka + Zookeeper (eventos asíncronos)
- HashiCorp Vault (secretos en Coolify)
- Jaeger (tracing)
- Kafka Connect (CDC)
- Prometheus/Grafana locales (se reutilizan los existentes)

### 📊 Consumo de Recursos:

```
PostgreSQL:              300 MB
Keycloak:                500 MB
Spring Boot Backend:     800 MB
Next.js Frontend:        200 MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                  ~1.8 GB
Margen disponible:      ~3.2 GB ✅ EXCELENTE
```

---

## 📦 Stack a Desplegar

```
┌─────────────────────────────────────────────┐
│          EN COOLIFY (4 servicios)           │
├─────────────────────────────────────────────┤
│ 1. PostgreSQL                               │
│    ├─ DB: signature_router                  │
│    └─ DB: keycloak                          │
│                                             │
│ 2. Keycloak                                 │
│    └─ keycloak-sig.roberace.com             │
│                                             │
│ 3. Spring Boot Backend                      │
│    └─ api-signatures.roberace.com           │
│                                             │
│ 4. Next.js Frontend                         │
│    └─ admin-signatures.roberace.com         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│      REUTILIZAR (Ya existen)                │
├─────────────────────────────────────────────┤
│ ✅ Grafana    (grafana.roberace.com)        │
│ ✅ Prometheus (192.168.1.210:9090)          │
│ ✅ Loki       (192.168.1.210:3100)          │
│ ✅ Homer      (homer.roberace.com)          │
└─────────────────────────────────────────────┘
```

---

## 💻 Recursos Estimados

| Componente | RAM | CPU | Disco |
|------------|-----|-----|-------|
| PostgreSQL | 300 MB | 10% | 500 MB |
| Keycloak | 500 MB | 15% | 200 MB |
| Backend | 800 MB | 20% | 300 MB |
| Frontend | 200 MB | 5% | 150 MB |
| **TOTAL** | **~1.8 GB** | **~50%** | **~1.2 GB** |

**RAM disponible en Raspberry:** 8 GB  
**Margen de seguridad:** ~3.2 GB (40% libre) ✅

---

## 🔧 Pre-requisitos

### En tu Raspberry Pi:

- [x] Coolify v4 instalado y funcionando
- [x] Traefik configurado como reverse proxy
- [x] Stack de monitoring activo (Grafana, Prometheus, Loki)
- [x] Espacio en disco: mínimo 2 GB libres
- [x] Acceso SSH: `ssh rober@RASPBERRY-ROBER`

### En Cloudflare:

- [x] Dominio `roberace.com` configurado
- [x] Acceso al panel de DNS

### En tu Máquina Local:

- [x] Git configurado
- [x] Acceso al repositorio del proyecto

### Credenciales a tener a mano:

- Coolify: `https://coolify.roberace.com` (roberto.gmourente@gmail.com / Perranka.1)
- Cloudflare: Panel de DNS
- GitHub/GitLab: Token de acceso si repo es privado

---

## PASO 1: Configurar DNS en Cloudflare

### 1.1 Acceder a Cloudflare

```
https://dash.cloudflare.com
→ Seleccionar dominio: roberace.com
→ DNS → Records
```

### 1.2 Crear Subdominios

Crear **3 registros DNS** tipo A:

#### Registro 1: Backend API

```
Type: A
Name: api-signatures
IPv4 address: 79.117.122.77
Proxy status: DNS only ☁️ (GRIS - NO NARANJA)
TTL: Auto
```

#### Registro 2: Frontend Admin

```
Type: A
Name: admin-signatures
IPv4 address: 79.117.122.77
Proxy status: DNS only ☁️ (GRIS)
TTL: Auto
```

#### Registro 3: Keycloak

```
Type: A
Name: keycloak-sig
IPv4 address: 79.117.122.77
Proxy status: DNS only ☁️ (GRIS)
TTL: Auto
```

### 1.3 Verificar DNS

Esperar 1-2 minutos y verificar:

```bash
nslookup api-signatures.roberace.com
# Debe devolver: 79.117.122.77

nslookup admin-signatures.roberace.com
# Debe devolver: 79.117.122.77

nslookup keycloak-sig.roberace.com
# Debe devolver: 79.117.122.77
```

✅ **Checkpoint:** Los 3 subdominios deben resolver a tu IP pública.

---

## PASO 2: Preparar Archivos del Proyecto

### 2.1 Crear Dockerfile para Backend

En `svc-signature-router/Dockerfile`:

```dockerfile
# Multi-stage build optimizado para ARM64
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copiar archivos de configuración Maven
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Descargar dependencias (se cachea si pom.xml no cambia)
RUN ./mvnw dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Build (skip tests para CI)
RUN ./mvnw clean package -DskipTests

# ============================================
# Imagen final (solo JRE para reducir tamaño)
# ============================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar JAR compilado del stage anterior
COPY --from=build /app/target/*.jar app.jar

# Usuario no-root por seguridad
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Variables JVM optimizadas para Raspberry
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Entrypoint
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 2.2 Crear .dockerignore para Backend

En `svc-signature-router/.dockerignore`:

```
target/
.mvn/wrapper/maven-wrapper.jar
*.md
docs/
postman/
scripts/
docker-compose*.yml
.env*
*.log
.git
.gitignore
```

### 2.3 Crear Perfil Spring Boot para Coolify

En `svc-signature-router/src/main/resources/application-coolify.yml`:

```yaml
spring:
  application:
    name: signature-router
  
  # PostgreSQL en Coolify
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
  
  jpa:
    hibernate:
      ddl-auto: validate  # Liquibase maneja DDL
    show-sql: false
    properties:
      hibernate:
        format_sql: false
        jdbc:
          batch_size: 20
  
  liquibase:
    enabled: true
    change-log: classpath:db/changelog/db.changelog-master.xml
  
  # Deshabilitar Kafka (no está en este deployment)
  kafka:
    enabled: false
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration

# Security - Keycloak
security:
  oauth2:
    resourceserver:
      jwt:
        issuer-uri: ${KEYCLOAK_ISSUER_URI}
        jwk-set-uri: ${KEYCLOAK_JWK_SET_URI}

keycloak:
  enabled: true
  auth-server-url: ${KEYCLOAK_URL}
  realm: ${KEYCLOAK_REALM}
  resource: ${KEYCLOAK_CLIENT_ID}
  credentials:
    secret: ${KEYCLOAK_CLIENT_SECRET}
  ssl-required: none  # HTTP interno, HTTPS en Traefik
  public-client: false
  bearer-only: true
  use-resource-role-mappings: true

# Vault DESHABILITADO (secretos en Coolify)
vault:
  enabled: false

# Actuator (para Prometheus existente)
management:
  endpoints:
    web:
      base-path: /actuator
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
      environment: coolify
  
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true

# Server
server:
  port: 8080
  shutdown: graceful
  tomcat:
    threads:
      max: 100
      min-spare: 20
    connection-timeout: 60s

# Logging
logging:
  level:
    root: INFO
    com.singularbank: INFO
    org.springframework.security: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

### 2.4 Crear Dockerfile para Frontend

En `app-signature-router-admin/Dockerfile`:

```dockerfile
# ============================================
# Build stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build (usa .env.production si existe)
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios del build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "server.js"]
```

### 2.5 Modificar next.config.ts

En `app-signature-router-admin/next.config.ts`, asegurar que tenga:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // ← IMPORTANTE para Docker
  reactStrictMode: true,
  
  // ... resto de tu configuración existente
};

export default nextConfig;
```

### 2.6 Crear .dockerignore para Frontend

En `app-signature-router-admin/.dockerignore`:

```
node_modules/
.next/
out/
.git/
.gitignore
*.md
.env.local
.env.development
.env.test
```

### 2.7 Crear .env.production para Frontend

En `app-signature-router-admin/.env.production`:

```env
# API Backend
NEXT_PUBLIC_API_URL=https://api-signatures.roberace.com
NEXT_PUBLIC_USE_MOCK_DATA=false

# NextAuth
NEXTAUTH_URL=https://admin-signatures.roberace.com
NEXTAUTH_SECRET=PLACEHOLDER_CAMBIAR_EN_COOLIFY

# Keycloak
KEYCLOAK_CLIENT_ID=signature-router-admin
KEYCLOAK_CLIENT_SECRET=PLACEHOLDER_CAMBIAR_EN_COOLIFY
KEYCLOAK_ISSUER=https://keycloak-sig.roberace.com/realms/signature-router
```

**⚠️ IMPORTANTE:** Los valores PLACEHOLDER se configurarán en Coolify.

### 2.8 Commit y Push

```bash
# Desde la raíz del proyecto
git add .
git commit -m "feat: add Docker configs for Raspberry Pi deployment"
git push origin main
```

✅ **Checkpoint:** Cambios subidos a GitHub/GitLab.

---

## PASO 3: Desplegar PostgreSQL en Coolify

### 3.1 Acceder a Coolify

```
URL: https://coolify.roberace.com
Usuario: roberto.gmourente@gmail.com
Password: Perranka.1
```

### 3.2 Crear Proyecto

```
Dashboard → Projects → + Add
  Name: Signature Router
  Description: Sistema de Enrutamiento de Firmas Digitales
  → Create
```

### 3.3 Crear PostgreSQL Database

```
Projects → Signature Router → + New Resource → Database → PostgreSQL

Configuración:
  Name: signature-router-postgres
  Description: PostgreSQL compartido (app + Keycloak)
  PostgreSQL Version: 15
  
Database Settings:
  Initial Database: signature_router
  Username: siguser
  Password: [auto-generado - COPIAR Y GUARDAR]
  
Storage:
  Persistent Volume: ✅ Yes
  Storage Size: 5 GB
  
Backups:
  Enabled: ✅ Yes
  Schedule: 0 3 * * * (diario a las 3:00 AM)
  Retention: 7 días

→ Save
→ Deploy
```

Esperar 2-3 minutos a que el estado sea **"Running"**.

### 3.4 Crear Base de Datos para Keycloak

```bash
# Conectar vía SSH a la Raspberry
ssh rober@RASPBERRY-ROBER

# Encontrar el ID del contenedor PostgreSQL
docker ps | grep signature-router-postgres

# Conectar al contenedor (reemplazar CONTAINER_ID)
docker exec -it CONTAINER_ID psql -U siguser -d signature_router

# Ejecutar en el prompt psql:
CREATE DATABASE keycloak;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO siguser;
\q
```

### 3.5 Verificar

```bash
docker exec -it CONTAINER_ID psql -U siguser -l
# Debe listar:
# - signature_router
# - keycloak
```

✅ **Checkpoint:** PostgreSQL corriendo con 2 bases de datos.

---

## PASO 4: Desplegar Keycloak en Coolify

### 4.1 Crear Resource

```
Projects → Signature Router → + New Resource → Docker Image

General:
  Image: quay.io/keycloak/keycloak:23.0
  Name: signature-router-keycloak
  Description: Identity & Access Management
  
Network:
  Connect to PostgreSQL network: ✅ Yes
```

### 4.2 Configurar Domains

```
Domains & URLs:
  Domain: keycloak-sig.roberace.com
  HTTPS: ✅ Enabled (Let's Encrypt automático)
  Redirect HTTP to HTTPS: ✅ Yes
```

### 4.3 Configurar Port

```
Ports:
  Container Port: 8080
  Public Port: (auto - gestionado por Traefik)
```

### 4.4 Environment Variables

```
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://signature-router-postgres:5432/keycloak
KC_DB_USERNAME=siguser
KC_DB_PASSWORD=[password del PASO 3.3]
KC_HOSTNAME=keycloak-sig.roberace.com
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_HEALTH_ENABLED=true
KC_METRICS_ENABLED=true
KC_PROXY=edge
```

### 4.5 Start Command

```
Start Command:
  start --optimized
```

### 4.6 Health Check

```
Health Check Command:
  curl -f http://localhost:8080/health/ready || exit 1
  
Interval: 30s
Timeout: 5s
Retries: 5
Start Period: 60s
```

### 4.7 Deploy

```
→ Save
→ Deploy
```

Esperar 5-7 minutos. El primer arranque es lento porque Keycloak inicializa el schema.

### 4.8 Verificar

```bash
# Desde tu navegador
https://keycloak-sig.roberace.com

# Debe cargar la página de Keycloak con candado verde 🔒
```

✅ **Checkpoint:** Keycloak accesible por HTTPS.

---

## PASO 5: Configurar Keycloak

### 5.1 Login Administrativo

```
URL: https://keycloak-sig.roberace.com
Click: Administration Console

Usuario: admin
Password: admin
```

### 5.2 Crear Realm

```
Menú superior izquierdo → Dropdown "master" → Create Realm

Realm name: signature-router
Enabled: ✅ ON

→ Create
```

### 5.3 Crear Client para Backend

```
Sidebar → Clients → Create client

General Settings:
  Client type: OpenID Connect
  Client ID: signature-router-backend
  
  → Next

Capability config:
  Client authentication: ✅ ON
  Authorization: ❌ OFF
  
  Authentication flow:
    ✅ Standard flow
    ✅ Direct access grants
    ❌ Implicit flow
    ❌ Service accounts roles
  
  → Next

Login settings:
  Root URL: https://api-signatures.roberace.com
  Valid redirect URIs: https://api-signatures.roberace.com/*
  Valid post logout redirect URIs: +
  Web origins: https://api-signatures.roberace.com
  
  → Save
```

**Copiar Client Secret:**

```
Clients → signature-router-backend → Credentials tab
  
Client Secret: [COPIAR ESTE VALOR]
  
Guardar como: KEYCLOAK_BACKEND_SECRET
```

### 5.4 Crear Client para Frontend

```
Clients → Create client

General Settings:
  Client ID: signature-router-admin
  
  → Next

Capability config:
  Client authentication: ✅ ON
  Authorization: ❌ OFF
  
  Authentication flow:
    ✅ Standard flow
    ✅ Direct access grants
  
  → Next

Login settings:
  Root URL: https://admin-signatures.roberace.com
  Valid redirect URIs: https://admin-signatures.roberace.com/*
  Valid post logout redirect URIs: https://admin-signatures.roberace.com
  Web origins: https://admin-signatures.roberace.com
  
  → Save
```

**Copiar Client Secret:**

```
Clients → signature-router-admin → Credentials tab
  
Client Secret: [COPIAR ESTE VALOR]
  
Guardar como: KEYCLOAK_FRONTEND_SECRET
```

### 5.5 Crear Roles

```
Sidebar → Realm roles → Create role

Crear 3 roles:

1. Role name: admin
   Description: Administrator with full access
   → Save

2. Role name: user
   Description: Regular user
   → Save

3. Role name: provider_manager
   Description: Manage signature providers
   → Save
```

### 5.6 Crear Usuario de Prueba

```
Sidebar → Users → Add user

Username: admin@roberace.com
Email: admin@roberace.com
Email verified: ✅ ON
First name: Admin
Last name: Signature Router
Enabled: ✅ ON

→ Create
```

**Asignar Password:**

```
Users → admin@roberace.com → Credentials tab

→ Set password
  Password: Admin123!
  Password confirmation: Admin123!
  Temporary: ❌ OFF
  
→ Save
```

**Asignar Roles:**

```
Users → admin@roberace.com → Role mappings tab

→ Assign role
  Filter by realm roles
  ✅ admin
  ✅ user
  ✅ provider_manager
  
→ Assign
```

### 5.7 Verificar Configuración

```bash
# Obtener token de prueba (desde PowerShell o bash)
curl -X POST https://keycloak-sig.roberace.com/realms/signature-router/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=signature-router-backend" \
  -d "client_secret=KEYCLOAK_BACKEND_SECRET" \
  -d "grant_type=password" \
  -d "username=admin@roberace.com" \
  -d "password=Admin123!"

# Debe devolver un JSON con "access_token"
```

✅ **Checkpoint:** Keycloak configurado con realm, clients, roles y usuario.

---

## PASO 6: Desplegar Backend Spring Boot

### 6.1 Crear Resource

```
Projects → Signature Router → + New Resource → Public Repository

Repository:
  Source: GitHub / GitLab
  Repository URL: https://github.com/TU-USUARIO/signature-router
  Branch: main
  
  ⚠️ Si es repo privado:
    - Generar Personal Access Token en GitHub/GitLab
    - Ingresar en "Private Key (Deploy Token)"
```

### 6.2 Configuración Build

```
Build Configuration:
  Build Pack: Dockerfile
  Dockerfile Location: ./svc-signature-router/Dockerfile
  Base Directory: ./svc-signature-router
  
  Watch Paths (opcional para deployments selectivos):
    - svc-signature-router/**
```

### 6.3 Configuración General

```
General:
  Name: signature-router-backend
  Description: Spring Boot REST API
  
Domains:
  Domain: api-signatures.roberace.com
  HTTPS: ✅ Enabled
  Redirect HTTP to HTTPS: ✅ Yes
  
Ports:
  Container Port: 8080
```

### 6.4 Environment Variables

**⚠️ IMPORTANTE:** Reemplazar valores entre `[corchetes]`.

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=coolify

# Database (usar hostname interno de Coolify)
SPRING_DATASOURCE_URL=jdbc:postgresql://signature-router-postgres:5432/signature_router
SPRING_DATASOURCE_USERNAME=siguser
SPRING_DATASOURCE_PASSWORD=[password del PASO 3.3]

# Keycloak
KEYCLOAK_URL=http://signature-router-keycloak:8080
KEYCLOAK_REALM=signature-router
KEYCLOAK_CLIENT_ID=signature-router-backend
KEYCLOAK_CLIENT_SECRET=[KEYCLOAK_BACKEND_SECRET del PASO 5.3]
KEYCLOAK_ISSUER_URI=https://keycloak-sig.roberace.com/realms/signature-router
KEYCLOAK_JWK_SET_URI=https://keycloak-sig.roberace.com/realms/signature-router/protocol/openid-connect/certs

# JWT (generar con: openssl rand -base64 32)
JWT_SECRET=[generar nuevo secreto]

# CORS (permitir frontend)
CORS_ALLOWED_ORIGINS=https://admin-signatures.roberace.com

# JVM Tuning
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200

# Actuator
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,prometheus,metrics

# Logging
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_SINGULARBANK=INFO
```

### 6.5 Health Check

```
Health Check:
  Path: /actuator/health
  Port: 8080
  Interval: 30s
  Timeout: 5s
  Retries: 5
  Start Period: 120s
```

### 6.6 Resources Limits (opcional)

```
Resources:
  Memory Limit: 1.5 GB
  Memory Reservation: 512 MB
  CPU Limit: 2 cores
```

### 6.7 Deploy

```
→ Save
→ Deploy
```

**Tiempo estimado:** 8-12 minutos (incluye build Maven).

### 6.8 Monitorear Build

```
Coolify → signature-router-backend → Deployments → Ver logs en tiempo real

Esperar mensajes:
  ✅ Building Docker image...
  ✅ Maven build successful
  ✅ Starting container...
  ✅ Health check passed
  ✅ Deployment successful
```

### 6.9 Verificar

```bash
# Health check
curl https://api-signatures.roberace.com/actuator/health

# Debe devolver:
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "diskSpace": {"status": "UP"},
    ...
  }
}

# Swagger UI
https://api-signatures.roberace.com/swagger-ui.html
```

✅ **Checkpoint:** Backend desplegado y respondiendo.

---

## PASO 7: Desplegar Frontend Next.js

### 7.1 Crear Resource

```
Projects → Signature Router → + New Resource → Public Repository

Repository:
  Source: (mismo repositorio del backend)
  Repository URL: https://github.com/TU-USUARIO/signature-router
  Branch: main
```

### 7.2 Configuración Build

```
Build Configuration:
  Build Pack: Dockerfile
  Dockerfile Location: ./app-signature-router-admin/Dockerfile
  Base Directory: ./app-signature-router-admin
  
  Watch Paths (opcional):
    - app-signature-router-admin/**
```

### 7.3 Configuración General

```
General:
  Name: signature-router-admin
  Description: Next.js Admin Panel
  
Domains:
  Domain: admin-signatures.roberace.com
  HTTPS: ✅ Enabled
  Redirect HTTP to HTTPS: ✅ Yes
  
Ports:
  Container Port: 3000
```

### 7.4 Environment Variables

**⚠️ Generar NEXTAUTH_SECRET:**

```bash
# Desde tu terminal
openssl rand -base64 32
# Copiar el resultado
```

**Variables:**

```bash
# API Backend
NEXT_PUBLIC_API_URL=https://api-signatures.roberace.com
NEXT_PUBLIC_USE_MOCK_DATA=false

# NextAuth
NEXTAUTH_URL=https://admin-signatures.roberace.com
NEXTAUTH_SECRET=[resultado de openssl rand -base64 32]

# Keycloak
KEYCLOAK_CLIENT_ID=signature-router-admin
KEYCLOAK_CLIENT_SECRET=[KEYCLOAK_FRONTEND_SECRET del PASO 5.4]
KEYCLOAK_ISSUER=https://keycloak-sig.roberace.com/realms/signature-router

# Node Environment
NODE_ENV=production
PORT=3000
```

### 7.5 Build Arguments (si son necesarios)

```
Build Arguments:
  NEXT_PUBLIC_API_URL=https://api-signatures.roberace.com
```

### 7.6 Health Check

```
Health Check:
  Path: /
  Port: 3000
  Interval: 30s
  Timeout: 3s
  Retries: 3
  Start Period: 30s
```

### 7.7 Resources Limits

```
Resources:
  Memory Limit: 512 MB
  Memory Reservation: 200 MB
  CPU Limit: 1 core
```

### 7.8 Deploy

```
→ Save
→ Deploy
```

**Tiempo estimado:** 6-10 minutos (build de Next.js).

### 7.9 Monitorear Build

```
Coolify → signature-router-admin → Deployments → Logs

Esperar mensajes:
  ✅ npm ci completed
  ✅ Next.js build completed
  ✅ Creating optimized production build
  ✅ Container started
  ✅ Health check passed
```

### 7.10 Verificar

```bash
# Navegador
https://admin-signatures.roberace.com

# Debe cargar la página de login con SSL 🔒
```

### 7.11 Probar Login

```
URL: https://admin-signatures.roberace.com

Hacer clic en "Sign In" o botón de login

Credenciales:
  Usuario: admin@roberace.com
  Password: Admin123!

Debe redirigir al dashboard después del login exitoso.
```

✅ **Checkpoint:** Frontend desplegado y autenticación funcional.

---

## PASO 8: Integración con Monitoring Existente

### 8.1 Agregar Backend a Prometheus

Conectar vía SSH:

```bash
ssh rober@RASPBERRY-ROBER
```

Editar configuración de Prometheus:

```bash
nano /home/rober/monitoring/prometheus.yml
```

Agregar al final del archivo (dentro de `scrape_configs`):

```yaml
  - job_name: 'signature-router-backend'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 15s
    static_configs:
      - targets: ['signature-router-backend:8080']
    relabel_configs:
      - target_label: app
        replacement: 'signature-router'
      - target_label: component
        replacement: 'backend'
      - target_label: environment
        replacement: 'raspberry'
```

Guardar (`Ctrl+O`, `Enter`, `Ctrl+X`).

Reiniciar Prometheus:

```bash
docker restart prometheus
```

Verificar:

```bash
# Abrir en navegador
http://192.168.1.210:9090/targets

# Debe aparecer: signature-router-backend (UP)
```

### 8.2 Importar Dashboard en Grafana

Abrir Grafana:

```
https://grafana.roberace.com
Usuario: admin
Password: admin
```

Importar dashboard de Spring Boot:

```
Sidebar → Dashboards → Import

Opción 1 - ID de dashboard público:
  Import via grafana.com: 4701
  → Load
  
  Prometheus datasource: Prometheus
  → Import

Opción 2 - Otro dashboard popular:
  Import via grafana.com: 11378
  → Load
  → Import
```

Verificar que aparecen métricas de `signature-router`.

### 8.3 Agregar Apps a Homer Dashboard

Editar configuración de Homer:

```bash
nano /home/rober/monitoring/homer/assets/config.yml
```

Agregar en la sección de servicios (adaptar según tu estructura YAML):

```yaml
      - name: "Signature Router - Admin"
        logo: "https://cdn-icons-png.flaticon.com/512/2344/2344187.png"
        subtitle: "Panel de Administración"
        tag: "app"
        url: "https://admin-signatures.roberace.com"
        target: "_blank"

      - name: "Signature Router - API"
        logo: "https://cdn-icons-png.flaticon.com/512/1828/1828911.png"
        subtitle: "REST API & Swagger"
        tag: "api"
        url: "https://api-signatures.roberace.com/swagger-ui.html"
        target: "_blank"

      - name: "Keycloak (Signatures)"
        logo: "https://www.keycloak.org/resources/images/icon.svg"
        subtitle: "Identity & Access"
        tag: "security"
        url: "https://keycloak-sig.roberace.com"
        target: "_blank"
```

Guardar y reiniciar Homer:

```bash
docker restart homer
```

Verificar:

```bash
# Abrir en navegador
https://homer.roberace.com

# Deben aparecer las 3 nuevas apps
```

### 8.4 Configurar Uptime Kuma (Opcional)

Si tienes Uptime Kuma instalado:

```
https://uptime.roberace.com

Add New Monitor:

Monitor 1:
  Type: HTTP(s)
  Friendly Name: Signature Router API
  URL: https://api-signatures.roberace.com/actuator/health
  Heartbeat Interval: 60 seconds
  Retries: 3
  
Monitor 2:
  Type: HTTP(s)
  Friendly Name: Signature Router Admin
  URL: https://admin-signatures.roberace.com
  Heartbeat Interval: 60 seconds
  
Monitor 3:
  Type: HTTP(s)
  Friendly Name: Keycloak (Signatures)
  URL: https://keycloak-sig.roberace.com/health/ready
  Heartbeat Interval: 60 seconds
```

✅ **Checkpoint:** Monitoring integrado completamente.

---

## ✅ Verificación Final

### Checklist de Deployment

- [ ] **DNS**: Los 3 subdominios resuelven a 79.117.122.77
- [ ] **SSL**: Todos los sitios tienen candado verde 🔒
- [ ] **PostgreSQL**: 2 bases de datos creadas (signature_router + keycloak)
- [ ] **Keycloak**: Accesible, realm configurado, usuario creado
- [ ] **Backend**: API responde en `/actuator/health` (status: UP)
- [ ] **Frontend**: Login funcional, redirige a dashboard
- [ ] **Swagger**: Accesible en `/swagger-ui.html`
- [ ] **Prometheus**: Target `signature-router-backend` UP
- [ ] **Grafana**: Dashboard importado con métricas visibles
- [ ] **Homer**: 3 nuevas apps aparecen en el dashboard

### URLs Finales

```
🌐 Frontend Admin:   https://admin-signatures.roberace.com
🔌 Backend API:      https://api-signatures.roberace.com
📖 Swagger UI:       https://api-signatures.roberace.com/swagger-ui.html
🔐 Keycloak:         https://keycloak-sig.roberace.com
📊 Grafana:          https://grafana.roberace.com
🏠 Homer:            https://homer.roberace.com
```

### Credenciales de Acceso

```
Keycloak Admin Console:
  URL: https://keycloak-sig.roberace.com
  Usuario: admin
  Password: admin

Signature Router Admin:
  URL: https://admin-signatures.roberace.com
  Usuario: admin@roberace.com
  Password: Admin123!

Grafana:
  URL: https://grafana.roberace.com
  Usuario: admin
  Password: admin
```

### Pruebas Funcionales

#### 1. Test de Autenticación

```bash
# Obtener token
curl -X POST https://keycloak-sig.roberace.com/realms/signature-router/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=signature-router-backend" \
  -d "client_secret=KEYCLOAK_BACKEND_SECRET" \
  -d "grant_type=password" \
  -d "username=admin@roberace.com" \
  -d "password=Admin123!"

# Guardar el access_token del response
```

#### 2. Test de API Protegida

```bash
# Reemplazar TOKEN con el access_token obtenido
curl -H "Authorization: Bearer TOKEN" \
  https://api-signatures.roberace.com/api/v1/providers

# Debe devolver lista de proveedores (puede estar vacía si no hay datos)
```

#### 3. Test de Frontend

1. Abrir `https://admin-signatures.roberace.com`
2. Click en "Sign In"
3. Ingresar credenciales (`admin@roberace.com` / `Admin123!`)
4. Verificar que carga el dashboard
5. Navegar a "Providers" o "Rules"
6. Verificar que las llamadas API funcionan (ver Network tab en DevTools)

---

## 🐛 Troubleshooting

### Problema: "502 Bad Gateway" en Backend

**Causa:** Container no está listo o falló el health check.

**Solución:**

```bash
# Ver logs del contenedor
Coolify → signature-router-backend → Logs

# Buscar errores:
# - Database connection failed → Verificar SPRING_DATASOURCE_*
# - Port already in use → Reiniciar servicio
# - Out of memory → Aumentar limits
```

### Problema: "Cannot connect to database"

**Causa:** Hostname incorrecto o PostgreSQL no accesible.

**Solución:**

```bash
# Desde Coolify, verificar que backend y postgres estén en la misma red
Coolify → signature-router-backend → Network
  → Debe estar conectado a la red de PostgreSQL

# Verificar hostname interno:
# Debe ser: signature-router-postgres (no localhost ni IP)
```

### Problema: Frontend muestra error de autenticación

**Causa:** NEXTAUTH_SECRET incorrecto o Keycloak no responde.

**Solución:**

```bash
# Verificar variables en Coolify
NEXTAUTH_URL=https://admin-signatures.roberace.com (sin / al final)
KEYCLOAK_ISSUER=https://keycloak-sig.roberace.com/realms/signature-router

# Probar acceso directo a Keycloak:
curl https://keycloak-sig.roberace.com/realms/signature-router/.well-known/openid-configuration

# Debe devolver JSON con configuración OIDC
```

### Problema: Métricas no aparecen en Prometheus

**Causa:** Target mal configurado o red no accesible.

**Solución:**

```bash
# SSH a Raspberry
ssh rober@RASPBERRY-ROBER

# Verificar que Prometheus puede alcanzar el backend
docker exec -it prometheus wget -O- http://signature-router-backend:8080/actuator/prometheus

# Si falla:
# 1. Verificar que ambos contenedores estén en red 'coolify'
# 2. Reiniciar Prometheus: docker restart prometheus
# 3. Verificar sintaxis de prometheus.yml
```

### Problema: Build de Maven falla en Coolify

**Causa:** Falta de memoria durante compilación.

**Solución 1 - Aumentar límites:**

```
Coolify → Backend → Resources
  Memory Limit: 2 GB (durante build)
```

**Solución 2 - Build local y push de imagen:**

```bash
# Desde tu máquina local
cd svc-signature-router

# Build para ARM64
docker buildx build --platform linux/arm64 -t tu-usuario/signature-router:latest .

# Push a Docker Hub
docker push tu-usuario/signature-router:latest

# En Coolify, cambiar a "Docker Image" en vez de "Repository"
# Image: tu-usuario/signature-router:latest
```

### Problema: SSL no se genera

**Causa:** DNS no resuelve correctamente o proxy naranja en Cloudflare.

**Solución:**

```bash
# 1. Verificar DNS
nslookup api-signatures.roberace.com
# Debe devolver: 79.117.122.77

# 2. Verificar Cloudflare
# Asegurar que sea "DNS only" (nube gris), NO "Proxied" (naranja)

# 3. Esperar 2-3 minutos para Let's Encrypt
# 4. Forzar renovación en Coolify
Coolify → Service → Configuration → Force SSL Renewal
```

### Problema: "Out of Memory" en Raspberry

**Causa:** Demasiados servicios corriendo.

**Solución:**

```bash
# Ver consumo de RAM
ssh rober@RASPBERRY-ROBER
free -h

# Detener servicios no esenciales temporalmente
docker stop <containers-no-necesarios>

# Reducir límites de JVM en backend
JAVA_OPTS=-Xms256m -Xmx768m -XX:+UseG1GC
```

### Logs Útiles

```bash
# Backend logs
Coolify → signature-router-backend → Logs (en tiempo real)

# Frontend logs
Coolify → signature-router-admin → Logs

# Keycloak logs
Coolify → signature-router-keycloak → Logs

# PostgreSQL logs
Coolify → signature-router-postgres → Logs

# Traefik logs (reverse proxy)
ssh rober@RASPBERRY-ROBER
docker logs coolify-proxy --tail 100 -f
```

---

## 📊 Monitoreo Post-Deployment

### Métricas Clave a Observar

**En Grafana (`https://grafana.roberace.com`):**

```
Dashboard: Spring Boot Statistics

Paneles importantes:
  - JVM Heap Used → Debe estar < 800 MB
  - CPU Usage → Debe estar < 50%
  - HTTP Request Rate → Tráfico de la API
  - Database Connections → Max 10 (configurado en HikariCP)
  - Response Time (P95) → < 500ms idealmente
```

**En Prometheus (`http://192.168.1.210:9090`):**

```
Queries útiles:

# RAM del backend
container_memory_usage_bytes{name="signature-router-backend"} / 1024 / 1024

# CPU del backend
rate(container_cpu_usage_seconds_total{name="signature-router-backend"}[1m]) * 100

# Requests por segundo
rate(http_server_requests_seconds_count{application="signature-router"}[1m])

# Database connections
hikaricp_connections_active{application="signature-router"}
```

### Alertas Recomendadas

Si configuras alertas en Prometheus/Alertmanager:

```yaml
# RAM > 1GB
alert: HighMemoryUsage
expr: container_memory_usage_bytes{name="signature-router-backend"} > 1073741824
for: 5m

# CPU > 80%
alert: HighCPUUsage
expr: rate(container_cpu_usage_seconds_total{name="signature-router-backend"}[5m]) > 0.8
for: 10m

# API down
alert: APIDown
expr: up{job="signature-router-backend"} == 0
for: 2m
```

---

## 🔄 CI/CD Automático

### Configurar Webhooks en GitHub

```
GitHub → Tu Repo → Settings → Webhooks → Add webhook

Payload URL: [copiar de Coolify → Backend → Webhooks]
Content type: application/json
Secret: [copiar de Coolify]
Events: Just the push event
Active: ✅

→ Add webhook
```

Ahora cada `git push` a `main` disparará un nuevo deployment automático.

### Estrategia de Branches

```
main → Production (auto-deploy a Raspberry)
develop → Desarrollo local
feature/* → Branches de features (no se despliegan)
```

---

## 🎯 Próximos Pasos (Opcional)

### 1. Poblar Base de Datos

```bash
# Ejecutar scripts de seed data
ssh rober@RASPBERRY-ROBER

# Conectar a PostgreSQL
docker exec -it signature-router-postgres psql -U siguser -d signature_router

# Ejecutar tus scripts SQL de seed
\i /ruta/a/tu/seed-data.sql
```

### 2. Configurar Backups Automáticos

Coolify ya hace backups de PostgreSQL (configurado en PASO 3.3).

Verificar backups:

```
Coolify → signature-router-postgres → Backups
  → Ver listado de backups realizados
  → Download para descargar backup manual
```

### 3. Monitoreo Avanzado

- Configurar alertas por email en Alertmanager
- Crear dashboards personalizados en Grafana
- Integrar logs con Loki (ya está instalado)

### 4. Optimizaciones de Performance

```yaml
# En application-coolify.yml, agregar:

spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          region.factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
        javax.cache.provider: org.ehcache.jsr107.EhcacheCachingProvider
```

---

## 📚 Documentación de Referencia

### Enlaces Útiles

- **Coolify Docs:** https://coolify.io/docs
- **Keycloak Docs:** https://www.keycloak.org/documentation
- **Spring Boot Actuator:** https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Traefik Docs:** https://doc.traefik.io/traefik/

### Archivos de Configuración Creados

```
signature-router/
├── svc-signature-router/
│   ├── Dockerfile ✅ (nuevo)
│   ├── .dockerignore ✅ (nuevo)
│   └── src/main/resources/
│       └── application-coolify.yml ✅ (nuevo)
│
└── app-signature-router-admin/
    ├── Dockerfile ✅ (nuevo)
    ├── .dockerignore ✅ (nuevo)
    ├── .env.production ✅ (nuevo)
    └── next.config.ts ⚠️ (modificado - agregar output: 'standalone')
```

---

## 🎉 ¡Deployment Completo!

Si llegaste hasta aquí y todos los checkpoints están ✅, entonces:

🎊 **¡Felicitaciones!** 🎊

Has desplegado exitosamente **Signature Router** en tu Raspberry Pi 5 con:

- ✅ Frontend profesional con autenticación
- ✅ Backend REST API completo
- ✅ Base de datos persistente
- ✅ Seguridad OAuth2/JWT
- ✅ SSL en todos los servicios
- ✅ Monitoreo integrado
- ✅ CI/CD automático
- ✅ URLs públicas profesionales

### 📸 Para tu Portfolio

```
🌐 Demo Live: https://admin-signatures.roberace.com
📖 API Docs:  https://api-signatures.roberace.com/swagger-ui.html
👤 Test User: admin@roberace.com / Admin123!
```

---

**Última actualización:** Diciembre 2024  
**Autor:** Roberto Gutiérrez Mourente  
**Entorno:** Raspberry Pi 5 (8GB) @ roberace.com  
**Stack:** Spring Boot 3.2 + Next.js 15 + Keycloak 23 + PostgreSQL 15
