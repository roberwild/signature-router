# 🔐 Guía de Arranque - Modos de Autenticación

Esta guía explica cómo arrancar el proyecto con diferentes configuraciones de Keycloak.

---

## 📋 Requisitos Previos

### Para ambos modos:
- Java 21+
- Node.js 18+
- PostgreSQL corriendo (Docker)

### Solo para Keycloak Local:
- Docker Desktop corriendo
- Contenedor de Keycloak levantado

### Solo para Keycloak de Desarrollo (AD):
- Conexión a la red del banco (VPN si es necesario)
- Usuario en Active Directory con roles `PRF_ADMIN` o `PRF_CONSULTIVO`

---

## 🏠 Modo 1: Keycloak LOCAL (Docker)

Usa el Keycloak local en Docker para desarrollo sin conexión a la red del banco.

### 1. Levantar infraestructura Docker

```powershell
cd c:\Proyectos\signature-router\svc-signature-router
docker-compose up -d

# Inicializar secrets en Vault (solo primera vez)
docker-compose exec vault sh /vault/scripts/vault-init.sh
```

### 2. Configurar Frontend (.env.local)

Crea/edita `app-signature-router-admin\.env.local`:

```env
AUTH_SECRET="uG5xQjK8vN2zR6wP9mT3fH7cL4dS1aY0iE8oU6pW2qX5kJ9bV7nM4hG3tF8rA1cZ"
NEXTAUTH_URL="http://localhost:3000"

# Keycloak LOCAL (Docker)
KEYCLOAK_CLIENT_ID="signature-router-admin"
KEYCLOAK_CLIENT_SECRET="signature-router-admin-secret-12345"
KEYCLOAK_ISSUER="http://localhost:8180/realms/signature-router"

NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/api/v1"
NEXT_PUBLIC_USE_MOCK_DATA="false"
NEXT_PUBLIC_DEBUG="true"
```

### 3. Arrancar Backend

```powershell
cd c:\Proyectos\signature-router\svc-signature-router
mvn spring-boot:run "-Dspring-boot.run.profiles=local" "-Dmaven.test.skip=true"
```

### 4. Arrancar Frontend

```powershell
cd c:\Proyectos\signature-router\app-signature-router-admin
npm run dev
```

### 5. Acceder

- **Frontend:** http://localhost:3000
- **Keycloak Admin:** http://localhost:8180/admin (admin/admin)

### Usuarios disponibles (Keycloak Local):

| Usuario   | Password     | Roles           |
|-----------|--------------|-----------------|
| admin     | admin123     | ADMIN, USER     |
| user      | user123      | USER            |
| support   | support123   | SUPPORT, USER   |
| auditor   | auditor123   | AUDITOR         |

---

## 🏢 Modo 2: Keycloak DESARROLLO (Active Directory)

Usa el Keycloak de infraestructura conectado al Active Directory del banco.

### 1. Levantar infraestructura Docker (PostgreSQL + Vault)

```powershell
cd c:\Proyectos\signature-router\svc-signature-router

# Levantar PostgreSQL y Vault
docker-compose up -d postgres vault

# Inicializar secrets en Vault (solo primera vez)
docker-compose exec vault sh /vault/scripts/vault-init.sh
```

### 2. Actualizar Secrets en Vault para AD

Actualiza los secrets de Keycloak en Vault con los valores reales (solicita estos valores al equipo de infraestructura):

**PowerShell (Windows):**
```powershell
docker-compose exec vault vault kv patch secret/signature-router keycloak.client-id="<CLIENT_ID_REAL>"
docker-compose exec vault vault kv patch secret/signature-router keycloak.client-secret="<CLIENT_SECRET_REAL>"
docker-compose exec vault vault kv patch secret/signature-router keycloak.issuer-uri="https://identitydev.sbtech.es/realms/customer"

# Verificar que se guardaron
docker-compose exec vault vault kv get secret/signature-router
```

**Bash (Linux/Mac):**
```bash
docker-compose exec vault vault kv patch secret/signature-router \
  keycloak.client-id="<CLIENT_ID_REAL>" \
  keycloak.client-secret="<CLIENT_SECRET_REAL>" \
  keycloak.issuer-uri="https://identitydev.sbtech.es/realms/customer"

# Verificar que se guardaron
docker-compose exec vault vault kv get secret/signature-router
```

### 3. Configurar Frontend (.env.local)

Copia el archivo de ejemplo y edita con los **mismos valores** que pusiste en Vault:

```powershell
cd c:\Proyectos\signature-router\app-signature-router-admin
copy env.local.example .env.local
notepad .env.local
```

> 📧 **Las credenciales de Keycloak de desarrollo las proporciona el equipo de infraestructura.**
> Solicita: `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET` y `KEYCLOAK_ISSUER`

### 3. Arrancar Backend

```powershell
cd c:\Proyectos\signature-router\svc-signature-router
mvn spring-boot:run "-Dspring-boot.run.profiles=local,dev-remote" "-Dmaven.test.skip=true"
```

> ⚠️ **Nota:** Se usan DOS perfiles: `local` (infraestructura) + `dev-remote` (Keycloak remoto)

### 4. Arrancar Frontend

```powershell
cd c:\Proyectos\signature-router\app-signature-router-admin
npm run dev
```

### 5. Acceder

- **Frontend:** http://localhost:3000
- Login con tu usuario de Active Directory

### Roles de Active Directory:

| Rol AD          | Permisos                           |
|-----------------|------------------------------------|
| PRF_ADMIN       | Acceso total (CRUD completo)       |
| PRF_CONSULTIVO  | Solo lectura (consultar, listar)   |

---

## 🔄 Cambiar entre modos

Para cambiar de un modo a otro:

1. **Detener** el backend y frontend (Ctrl+C)
2. **Editar** el archivo `.env.local` con las credenciales correspondientes
3. **Arrancar** con el comando del modo deseado

### Comandos rápidos:

```powershell
# === MODO LOCAL ===
mvn spring-boot:run "-Dspring-boot.run.profiles=local" "-Dmaven.test.skip=true"

# === MODO DESARROLLO (AD) ===
mvn spring-boot:run "-Dspring-boot.run.profiles=local,dev-remote" "-Dmaven.test.skip=true"
```

---

## 🐛 Troubleshooting

### Error: "Connection refused" al backend
- Verifica que el backend esté corriendo
- Verifica que PostgreSQL esté corriendo: `docker ps`

### Error: "403 Forbidden"
- Verifica que tu usuario tenga el rol `PRF_ADMIN` o `PRF_CONSULTIVO`
- Cierra sesión y vuelve a iniciar sesión para obtener un nuevo token

### Error: El backend no arranca con dev-remote
- Verifica conectividad: Abre https://identitydev.sbtech.es/realms/customer/.well-known/openid-configuration en el navegador
- Si no carga, conecta la VPN

### Error: "Invalid issuer"
- Verifica que el `KEYCLOAK_ISSUER` coincide con el modo que estás usando

---

## 📁 Archivos de configuración

| Archivo | Descripción |
|---------|-------------|
| `app-signature-router-admin/.env.local` | Credenciales del frontend |
| `app-signature-router-admin/env.local.example` | Template (Keycloak dev) |
| `svc-signature-router/src/main/resources/application.yml` | Config base backend |
| `svc-signature-router/src/main/resources/application-dev-remote.yml` | Config Keycloak remoto |

---

## 📞 Contacto

Para solicitar acceso o roles en el Keycloak de desarrollo, contacta con el equipo de infraestructura.
