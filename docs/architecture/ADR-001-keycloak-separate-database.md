# ADR-001: Base de Datos Separada para Keycloak

**Fecha:** 2025-11-27  
**Estado:** ✅ Aceptada  
**Contexto:** Arquitectura Local (Desarrollo)

---

## Contexto y Problema

Durante la implementación de Keycloak como KDC (Key Distribution Center) para el Signature Router, se presentó la decisión de **dónde almacenar los datos de Keycloak**:

### Opciones Evaluadas:

1. **Base de datos compartida:** Usar la misma instancia de PostgreSQL que la aplicación, con el mismo usuario y base de datos `signature_router`.
2. **Base de datos dedicada:** Crear una instancia PostgreSQL independiente para Keycloak.

### Problema:

Mezclar el esquema de Keycloak (tablas de usuarios, roles, sesiones, tokens) con el esquema de la aplicación (tablas de negocio: `signature_request`, `signature_challenge`, `routing_rule`) viola el principio de **Separación de Responsabilidades** y puede causar problemas de:
- **Gestión de schemas**: Conflictos de nombres de tablas.
- **Seguridad**: Usuarios con acceso a la DB de la aplicación tendrían acceso a las credenciales de Keycloak.
- **Escalabilidad**: No se puede escalar Keycloak independientemente de la aplicación.
- **Backup y recuperación**: Ambos servicios tendrían la misma política de backup, aunque tienen criticidades diferentes.

---

## Decisión

✅ **Decisión:** Keycloak tendrá su **propia instancia de PostgreSQL dedicada**.

### Configuración Implementada:

#### PostgreSQL de la Aplicación:
- **Contenedor:** `signature-router-postgres`
- **Puerto:** `5432` (externo e interno)
- **Base de datos:** `signature_router`
- **Usuario:** `siguser`
- **Password:** `sigpass`
- **Schema:** `public` (tablas de negocio: `signature_request`, `signature_challenge`, `routing_rule`, etc.)

#### PostgreSQL de Keycloak:
- **Contenedor:** `signature-router-postgres-keycloak`
- **Puerto:** `5433` (externo, mapeado a `5432` interno)
- **Base de datos:** `keycloak`
- **Usuario:** `keycloak`
- **Password:** `keycloak`
- **Schema:** `public` (tablas de Keycloak: `user_entity`, `realm`, `client`, `credential`, etc.)

---

## Consecuencias

### ✅ Positivas:

1. **Separación de responsabilidades:**
   - Keycloak es un servicio de **infraestructura** (IAM - Identity and Access Management).
   - Signature Router es un servicio de **dominio de negocio**.
   - Cada uno gestiona su propio esquema de datos sin interferencias.

2. **Escalabilidad independiente:**
   - Keycloak puede escalar horizontalmente (cluster de Keycloak con su propia base de datos replicada).
   - La aplicación puede escalar según la carga de signature requests sin afectar la capacidad de autenticación.

3. **Backup y recuperación diferenciados:**
   - **Keycloak:** Backups frecuentes (usuarios, roles, sesiones activas). Alta prioridad para recuperación de identidades.
   - **Aplicación:** Backups según criticidad del negocio (signature requests, challenges). Pueden tener ventanas de recuperación diferentes.

4. **Seguridad mejorada:**
   - Un usuario con acceso a la base de datos de la aplicación **NO** tiene acceso automático a:
     - Credenciales de usuarios de Keycloak.
     - Sesiones activas.
     - Refresh tokens.
     - Configuraciones de roles y permisos.
   - Cumplimiento con principio de **Least Privilege**.

5. **Gestión de schemas simplificada:**
   - Liquibase de la aplicación gestiona solo las tablas de negocio.
   - Keycloak gestiona su propio schema con sus migraciones internas.
   - **Sin conflictos de nombres de tablas** (ej: si Keycloak usara una tabla `event` y la aplicación también).

6. **Mantenimiento independiente:**
   - Actualizaciones de Keycloak (ej: de versión 23.0 a 24.0) **no afectan** el schema de la aplicación.
   - Rollback de Keycloak **no requiere** rollback de la aplicación.

7. **Testing facilitado:**
   - En tests de integración, se puede usar una base de datos H2 in-memory para Keycloak sin afectar los tests de la aplicación.
   - Se puede resetear la base de datos de Keycloak sin perder datos de test de la aplicación.

8. **Alineación con arquitectura corporativa:**
   - En UAT/Producción, el Keycloak corporativo **siempre** tendrá su propia base de datos gestionada por IT.
   - Replicar esta separación en el entorno local facilita la migración futura.

---

### ⚠️ Negativas (Trade-offs):

1. **Complejidad operacional (leve):**
   - Se deben gestionar **dos contenedores** de PostgreSQL en lugar de uno.
   - **Mitigación:** Docker Compose gestiona ambos automáticamente. No hay impacto en el desarrollador.

2. **Consumo de recursos (mínimo):**
   - Dos instancias de PostgreSQL consumen ~100-200 MB de RAM adicionales.
   - **Mitigación:** En desarrollo local, esto es despreciable. En producción, cada servicio tiene sus propios recursos dedicados.

3. **Puertos adicionales:**
   - Se requiere exponer un puerto adicional (`5433`) para la base de datos de Keycloak.
   - **Mitigación:** No hay conflicto de puertos, y en producción no se exponen puertos externos.

---

## Alternativas Consideradas

### Alternativa 1: Base de datos compartida con schemas separados

**Configuración:**
- Una sola instancia de PostgreSQL.
- Schema `public` para la aplicación.
- Schema `keycloak` para Keycloak.

**Rechazada porque:**
- ❌ Keycloak espera usar el schema `public` por defecto (configurable, pero añade complejidad).
- ❌ Ambos servicios comparten el mismo pool de conexiones, lo que puede causar contención.
- ❌ Los problemas de seguridad, escalabilidad y backup persisten (misma instancia).
- ❌ Require configuración adicional en Keycloak (`KC_DB_SCHEMA=keycloak`).

---

### Alternativa 2: Keycloak en modo H2 (desarrollo)

**Configuración:**
- Keycloak usa base de datos H2 embebida en desarrollo.
- PostgreSQL dedicado en producción.

**Rechazada porque:**
- ❌ **Falta de paridad entre entornos:** Desarrollo usa H2, producción usa PostgreSQL.
- ❌ **Bugs no detectables:** H2 puede comportarse diferente a PostgreSQL (tipos de datos, índices, constraints).
- ❌ **Migración complicada:** Al pasar a UAT/Prod, pueden surgir errores relacionados con el cambio de DB.
- ❌ **Datos no persistentes:** H2 in-memory pierde todos los datos al reiniciar Keycloak.

---

### Alternativa 3: Keycloak en modo desarrollo sin persistencia

**Configuración:**
- Keycloak en modo `dev` sin base de datos (datos en memoria).

**Rechazada porque:**
- ❌ **Pérdida de datos al reiniciar:** Cada vez que se reinicia Keycloak, se pierden usuarios, roles, configuraciones.
- ❌ **No realista:** No refleja el comportamiento de producción.
- ❌ **Dificulta testing:** No se puede probar migración de datos, backups, etc.

---

## Implementación

### Cambios en `docker-compose.yml`:

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U siguser"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - signature-router-network

  # PostgreSQL for Keycloak (separate database)
  postgres-keycloak:
    image: postgres:15-alpine
    container_name: signature-router-postgres-keycloak
    ports:
      - "5433:5432"  # Different external port to avoid conflict
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - postgres-keycloak-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - signature-router-network

  # Keycloak (Identity & Access Management - KDC)
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
    # ... rest of configuration

volumes:
  postgres-data:
  postgres-keycloak-data:  # New volume for Keycloak DB
```

---

## Referencias

- [Keycloak Relational Database Setup](https://www.keycloak.org/server/db)
- [PostgreSQL Multi-Database Architecture](https://www.postgresql.org/docs/current/managing-databases.html)
- [Twelve-Factor App: Backing Services](https://12factor.net/backing-services)
- [Microservices Pattern: Database per Service](https://microservices.io/patterns/data/database-per-service.html)

---

## Notas

- **Fecha de implementación:** 2025-11-27
- **Implementado por:** BMAD Dev Agent
- **Revisión:** Aprobada tras feedback de usuario ("es guarrear la base de datos de la aplicación")
- **Impacto en código:** Ninguno. Solo configuración de infraestructura.
- **Impacto en testing:** Positivo. Facilita tests de integración.
- **Impacto en producción:** Alineado con arquitectura corporativa.

---

**Estado Final:** ✅ **ACEPTADA e IMPLEMENTADA**

