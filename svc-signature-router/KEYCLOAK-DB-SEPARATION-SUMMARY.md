# 🗄️ Separación de Bases de Datos: Keycloak vs Aplicación

## 📋 Resumen Ejecutivo

**Decisión:** Keycloak ahora utiliza su **propia instancia de PostgreSQL dedicada**, separada de la base de datos de la aplicación.

**Razón:** Evitar "guarrear" la base de datos de la aplicación mezclando tablas de infraestructura (IAM) con tablas de dominio de negocio.

---

## 🏗️ Antes vs Después

### ❌ Antes (Arquitectura Compartida - NO RECOMENDADA)

```
┌──────────────────────────────────────────────┐
│   PostgreSQL (Puerto 5432)                   │
│   Base de datos: signature_router            │
│   Usuario: siguser                           │
│                                              │
│   Schema: public                             │
│   ┌────────────────────────────────────────┐ │
│   │ Tablas de la Aplicación:               │ │
│   │  - signature_request                   │ │
│   │  - signature_challenge                 │ │
│   │  - routing_rule                        │ │
│   │  - outbox_event                        │ │
│   │  - audit_log                           │ │
│   ├────────────────────────────────────────┤ │
│   │ Tablas de Keycloak:                    │ │
│   │  - user_entity                         │ │
│   │  - realm                               │ │
│   │  - client                              │ │
│   │  - credential                          │ │
│   │  - user_role_mapping                   │ │
│   │  - keycloak_role                       │ │
│   │  - admin_event_entity                  │ │
│   │  - ... (70+ tablas más de Keycloak)    │ │
│   └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
     ▲                          ▲
     │                          │
     │                          │
┌────┴──────┐           ┌───────┴──────┐
│ Signature │           │   Keycloak   │
│  Router   │           │     KDC      │
│  (8080)   │           │   (8180)     │
└───────────┘           └──────────────┘

❌ Problemas:
  - Mezcla de responsabilidades (IAM + Negocio)
  - Conflictos de nombres de tablas
  - Acceso cruzado no deseado (seguridad)
  - No se puede escalar independientemente
  - Backups y migraciones acopladas
```

---

### ✅ Después (Arquitectura Separada - IMPLEMENTADA)

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ PostgreSQL (Puerto 5432)     │       │ PostgreSQL (Puerto 5433)     │
│ Base de datos: signature_    │       │ Base de datos: keycloak      │
│                router         │       │ Usuario: keycloak            │
│ Usuario: siguser             │       │                              │
│                              │       │                              │
│ Schema: public               │       │ Schema: public               │
│ ┌──────────────────────────┐ │       │ ┌──────────────────────────┐ │
│ │ Tablas de Aplicación:    │ │       │ │ Tablas de Keycloak:      │ │
│ │  - signature_request     │ │       │ │  - user_entity           │ │
│ │  - signature_challenge   │ │       │ │  - realm                 │ │
│ │  - routing_rule          │ │       │ │  - client                │ │
│ │  - outbox_event          │ │       │ │  - credential            │ │
│ │  - audit_log             │ │       │ │  - user_role_mapping     │ │
│ │  - connector_config      │ │       │ │  - keycloak_role         │ │
│ │                          │ │       │ │  - admin_event_entity    │ │
│ │  (Solo dominio de        │ │       │ │  - ... (70+ tablas IAM)  │ │
│ │   negocio)               │ │       │ │                          │ │
│ └──────────────────────────┘ │       │ └──────────────────────────┘ │
└──────────────▲───────────────┘       └──────────────▲───────────────┘
               │                                      │
               │                                      │
               │                                      │
       ┌───────┴────────┐                    ┌───────┴──────┐
       │   Signature    │                    │   Keycloak   │
       │    Router      │                    │     KDC      │
       │    (8080)      │                    │   (8180)     │
       └────────────────┘                    └──────────────┘

✅ Beneficios:
  ✔ Separación de responsabilidades clara
  ✔ Sin conflictos de nombres de tablas
  ✔ Seguridad: Acceso a DB de app ≠ acceso a DB de Keycloak
  ✔ Escalabilidad independiente
  ✔ Backups diferenciados por criticidad
  ✔ Migraciones y actualizaciones independientes
```

---

## 📊 Comparación Detallada

| Aspecto | Base Compartida ❌ | Bases Separadas ✅ |
|---------|-------------------|-------------------|
| **Separación de Responsabilidades** | ❌ Mezcladas (IAM + Negocio) | ✅ Separadas (cada servicio su DB) |
| **Seguridad** | ❌ Acceso a DB app = acceso a credenciales Keycloak | ✅ Acceso aislado por servicio |
| **Escalabilidad** | ❌ Acopladas (mismo pool de conexiones) | ✅ Independiente (cada DB escala según necesidad) |
| **Backups** | ❌ Misma política para ambos | ✅ Políticas diferenciadas (IAM crítico ≠ Negocio) |
| **Migraciones** | ❌ Liquibase de app y Keycloak en mismo schema | ✅ Liquibase de app separado de migraciones Keycloak |
| **Conflictos de Nombres** | ⚠️ Riesgo (ej: ambos usan tabla `event`) | ✅ Sin riesgo (schemas aislados) |
| **Mantenimiento** | ❌ Actualizar Keycloak afecta schema de app | ✅ Actualizaciones independientes |
| **Testing** | ⚠️ Resetear DB de Keycloak afecta tests de app | ✅ Tests aislados |
| **Complejidad Operacional** | ✅ 1 contenedor PostgreSQL | ⚠️ 2 contenedores PostgreSQL (mínimo impacto) |
| **Consumo de Recursos** | ✅ ~100 MB RAM | ⚠️ ~200-300 MB RAM (despreciable en dev) |
| **Alineación con Producción** | ❌ En producción siempre están separadas | ✅ Paridad con arquitectura corporativa |

---

## 🔧 Configuración Implementada

### Docker Compose

```yaml
services:
  # PostgreSQL for Signature Router Application
  postgres:
    image: postgres:15-alpine
    container_name: signature-router-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: signature_router
      POSTGRES_USER: siguser
      POSTGRES_PASSWORD: sigpass
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # PostgreSQL for Keycloak (separate database)
  postgres-keycloak:
    image: postgres:15-alpine
    container_name: signature-router-postgres-keycloak
    ports:
      - "5433:5432"  # Different external port
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - postgres-keycloak-data:/var/lib/postgresql/data

  # Keycloak (uses postgres-keycloak)
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: signature-router-keycloak
    depends_on:
      - postgres-keycloak
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres-keycloak:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak

volumes:
  postgres-data:
  postgres-keycloak-data:
```

---

## 🚀 Cómo Conectarse a Cada Base de Datos

### Base de Datos de la Aplicación (Signature Router)

```bash
# Desde terminal local
psql -h localhost -p 5432 -U siguser -d signature_router

# Desde contenedor Docker
docker exec -it signature-router-postgres psql -U siguser -d signature_router

# Verificar tablas de negocio
\dt

# Deberías ver:
# - signature_request
# - signature_challenge
# - routing_rule
# - outbox_event
# - audit_log
# - connector_config
# - databasechangelog (Liquibase)
```

### Base de Datos de Keycloak (IAM)

```bash
# Desde terminal local
psql -h localhost -p 5433 -U keycloak -d keycloak

# Desde contenedor Docker
docker exec -it signature-router-postgres-keycloak psql -U keycloak -d keycloak

# Verificar tablas de Keycloak
\dt

# Deberías ver:
# - user_entity
# - realm
# - client
# - credential
# - user_role_mapping
# - keycloak_role
# - admin_event_entity
# - ... (70+ tablas de Keycloak)
```

---

## 📝 Archivos Modificados/Creados

### Modificados:
- ✅ `docker-compose.yml` - Agregado servicio `postgres-keycloak`
- ✅ `README.md` - Actualizada sección de infraestructura
- ✅ `KEYCLOAK-SETUP.md` - Agregada sección "¿Por qué Bases de Datos Separadas?"
- ✅ `SEGURIDAD-KEYCLOAK-RESUMEN.md` - Actualizada configuración de base de datos
- ✅ `KEYCLOAK-CORPORATE-MIGRATION.md` - Tabla comparativa actualizada

### Creados:
- ✅ `docs/architecture/ADR-001-keycloak-separate-database.md` - Architecture Decision Record
- ✅ `KEYCLOAK-DB-SEPARATION-SUMMARY.md` - Este documento (resumen ejecutivo)

---

## 🎯 Beneficios Clave

### 1. Separación de Responsabilidades
- **Keycloak**: Servicio de **infraestructura** (IAM - Identity and Access Management)
- **Signature Router**: Servicio de **dominio de negocio** (Firma digital, routing, providers)

### 2. Seguridad Mejorada
```
Usuario DB Aplicación (siguser)
  ├─ Acceso SOLO a: signature_router
  └─ NO puede ver: credenciales de usuarios, roles, sesiones de Keycloak

Usuario DB Keycloak (keycloak)
  ├─ Acceso SOLO a: keycloak
  └─ NO puede ver: signature requests, challenges, routing rules
```

### 3. Escalabilidad Independiente

**Escenario 1: Spike de Signature Requests**
- Escalar PostgreSQL de aplicación (más memoria, CPU, réplicas)
- Keycloak DB no se ve afectada

**Escenario 2: Spike de Autenticaciones**
- Escalar PostgreSQL de Keycloak (cluster, réplicas de lectura)
- Aplicación DB no se ve afectada

### 4. Backups Diferenciados

```
Backup Policy - Signature Router DB:
  - Frecuencia: Diaria (según criticidad del negocio)
  - Retención: 30 días
  - Ventana de recuperación: 4 horas

Backup Policy - Keycloak DB:
  - Frecuencia: Cada hora (usuarios, sesiones, tokens)
  - Retención: 90 días (cumplimiento)
  - Ventana de recuperación: 30 minutos (crítico para autenticación)
```

### 5. Migraciones Independientes

```bash
# Actualizar Keycloak de 23.0 a 24.0
docker-compose pull keycloak
docker-compose up -d keycloak

# ✅ Schema de Keycloak se actualiza automáticamente
# ✅ Schema de Signature Router NO se toca
# ✅ Sin riesgo de breaking changes en tablas de negocio
```

---

## 🔄 Alineación con Producción

### Desarrollo Local (Este Setup)

```
[PostgreSQL App - 5432]  ←→  [Signature Router - 8080]
[PostgreSQL Keycloak - 5433]  ←→  [Keycloak - 8180]
```

### UAT / Producción Corporativa

```
[PostgreSQL Corporativo - Cluster 1]  ←→  [Signature Router UAT/Prod]
[PostgreSQL Corporativo - Cluster 2]  ←→  [Keycloak Corporativo]
```

**✅ Paridad arquitectónica:** El setup local replica la separación de producción, facilitando la migración y evitando sorpresas.

---

## 📚 Referencias

- **ADR-001:** [`docs/architecture/ADR-001-keycloak-separate-database.md`](docs/architecture/ADR-001-keycloak-separate-database.md)
- **Keycloak Setup:** [`KEYCLOAK-SETUP.md`](KEYCLOAK-SETUP.md)
- **Migración Corporativa:** [`KEYCLOAK-CORPORATE-MIGRATION.md`](KEYCLOAK-CORPORATE-MIGRATION.md)
- **Microservices Pattern:** [Database per Service](https://microservices.io/patterns/data/database-per-service.html)

---

## ✅ Verificación

### Paso 1: Verificar que ambas bases de datos están corriendo

```bash
docker ps | grep postgres

# Deberías ver:
# signature-router-postgres (puerto 5432)
# signature-router-postgres-keycloak (puerto 5433)
```

### Paso 2: Conectarse a cada una

```bash
# Aplicación
docker exec -it signature-router-postgres psql -U siguser -d signature_router -c "\dt"

# Keycloak
docker exec -it signature-router-postgres-keycloak psql -U keycloak -d keycloak -c "\dt"
```

### Paso 3: Verificar que Keycloak arranca correctamente

```bash
docker logs signature-router-keycloak | grep "Listening on"

# Deberías ver:
# Listening on: http://0.0.0.0:8080
```

---

**Fecha de Implementación:** 2025-11-27  
**Razón:** "Es guarrear la base de datos de la aplicación" - Feedback de usuario ✅  
**Estado:** ✅ IMPLEMENTADA y DOCUMENTADA

