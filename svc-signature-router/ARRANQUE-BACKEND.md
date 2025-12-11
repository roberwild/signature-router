# 🚀 Guía de Arranque del Backend

> Instrucciones paso a paso para arrancar el backend de Signature Router localmente

---

## 🎯 Arranque Rápido con Script Automático

Si prefieres un arranque automático que verifica todos los pre-requisitos:

```powershell
# Desde el directorio raíz del proyecto
cd svc-signature-router
.\check-and-start.ps1
```

El script automáticamente:
1. ✅ Verifica que el puerto 5432 esté libre (detecta Supabase)
2. ✅ Verifica que Docker Desktop esté en ejecución
3. ✅ Limpia volúmenes de PostgreSQL (opcional)
4. ✅ Inicia Docker Compose
5. ✅ Espera a que PostgreSQL esté listo
6. ✅ Opcionalmente arranca el backend con Maven

---

## 📖 Arranque Manual (Paso a Paso)

Si prefieres control total, sigue estos pasos:

---

## 📋 Pre-requisitos

- ✅ **Java 21** instalado y configurado
- ✅ **Maven 3.9+** instalado
- ✅ **Docker Desktop** en ejecución
- ✅ **Compilación exitosa** del proyecto

---

## ⚠️ PASO 0: Detener PostgreSQL de Supabase u Otros (CRÍTICO)

### 🐘 **PROBLEMA COMÚN**: Puerto 5432 en Uso

Si tienes **Supabase** u otro PostgreSQL en ejecución, ocupará el puerto `5432` y causará:
- ❌ Docker Compose no podrá iniciar `signature-router-postgres`
- ❌ Error: `bind: address already in use`
- ❌ El backend se conecta al PostgreSQL equivocado (ej: ves solo tabla `plugins` en lugar del schema del proyecto)
- ❌ Error: `Unable to determine Dialect without JDBC metadata`

### ✅ Verificar si el puerto 5432 está en uso:

```powershell
# Opción 1: Verificar puerto
netstat -ano | findstr :5432

# Opción 2: Buscar procesos PostgreSQL
Get-Process -Name postgres -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path
```

### 🛑 Solución: Detener Supabase / PostgreSQL Local

#### Si es Supabase:

```powershell
# Detener Supabase
supabase stop

# O si está en Docker:
docker ps | Select-String "supabase"
docker stop <container-id>
```

#### Si es PostgreSQL instalado localmente:

```powershell
# Windows - Detener servicio
Stop-Service -Name postgresql-x64-15

# O matar proceso manualmente
Get-Process -Name postgres | Stop-Process -Force
```

#### Verificar que el puerto quedó libre:

```powershell
netstat -ano | findstr :5432
# Debe NO mostrar ninguna línea
```

---

## 🗂️ Paso 1: Limpiar Volúmenes de PostgreSQL (CRÍTICO)

⚠️ **IMPORTANTE**: Si PostgreSQL tiene un schema previo de ejecuciones anteriores, Hibernate fallará al intentar crear tablas que ya existen.

### Verificar si hay contenedores previos:

```powershell
docker ps -a | Select-String "signature-router"
```

### Limpiar volúmenes (RECOMENDADO):

```powershell
# Detener todos los contenedores
docker-compose down

# Eliminar volúmenes (borra datos de PostgreSQL, Grafana, etc.)
docker-compose down -v

# Verificar que se eliminaron
docker volume ls | Select-String "signature-router"
```

**Razón:** La configuración actual usa `hibernate.ddl-auto=create`, que genera el schema automáticamente. Si la BD tiene tablas previas, habrá conflictos.

---

## 🐳 Paso 2: Iniciar Infraestructura con Docker Compose

```powershell
# Asegurarse de estar en el directorio raíz del proyecto
cd H:\Proyectos\signature-router

# Iniciar todos los servicios
docker-compose up -d

# Verificar que todos los contenedores estén healthy
docker-compose ps
```

### Servicios que se levantan:

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| **PostgreSQL** | 5432 | - | Base de datos principal |
| **PostgreSQL (Keycloak)** | 5433 | - | Base de datos de Keycloak |
| **Kafka** | 9092 | - | Broker de mensajería (deshabilitado en local) |
| **Zookeeper** | 2181 | - | Coordinador de Kafka |
| **Schema Registry** | 8081 | http://localhost:8081 | Registro de schemas Avro |
| **Vault** | 8200 | http://localhost:8200/ui | Gestión de secretos |
| **Prometheus** | 9090 | http://localhost:9090 | Métricas |
| **Grafana** | 3000 | http://localhost:3000 | Dashboards (admin/admin) |
| **Keycloak** | 8180 | http://localhost:8180 | IAM (admin/admin) |
| **Jaeger** | 16686 | http://localhost:16686 | Distributed Tracing |
| **Kafka Connect** | 8083 | http://localhost:8083 | CDC con Debezium |

### Esperar a que los servicios estén listos (30-60 segundos):

```powershell
# Ver logs de un servicio específico
docker-compose logs -f postgres

# Verificar health de todos los servicios
docker-compose ps
```

---

## 🔐 Paso 3: Configurar Secretos en Vault (OPCIONAL - ya hardcodeados)

⚠️ **NOTA**: La configuración actual tiene la contraseña de PostgreSQL **hardcodeada** en `application-local.yml`:

```yaml
spring:
  datasource:
    password: sigpass  # TODO: Fix Vault integration - hardcoded for now
```

Si quieres usar Vault correctamente:

```powershell
# Conectar a Vault
docker exec -it signature-router-vault sh

# Dentro del contenedor:
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='dev-token-123'

# Crear secreto para PostgreSQL
vault kv put secret/signature-router `
  spring.datasource.password=sigpass `
  database.password=sigpass

# Verificar
vault kv get secret/signature-router

# Salir
exit
```

Luego **eliminar** la línea hardcodeada de `application-local.yml`.

---

## ▶️ Paso 4: Arrancar el Backend con Spring Boot

### Opción A: Desde la terminal con Maven

```powershell
cd svc-signature-router

# Arrancar con perfil local
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

### Opción B: Desde IntelliJ IDEA / Eclipse

1. Abrir el proyecto `svc-signature-router`
2. Crear configuración de ejecución:
   - **Main class**: `com.singularbank.signature.routing.SignatureRouterApplication`
   - **Active profiles**: `local`
   - **Working directory**: `H:\Proyectos\signature-router\svc-signature-router`
3. Ejecutar

### Opción C: Ejecutar el JAR compilado

```powershell
cd svc-signature-router

# Compilar
mvn clean package -DskipTests

# Ejecutar
java -jar target/signature-router-1.0.0.jar --spring.profiles.active=local
```

---

## ✅ Paso 5: Verificar que el Backend está Funcionando

### 1. Ver logs de arranque

Buscar en la consola:

```
Started SignatureRouterApplication in X.XXX seconds
```

### 2. Verificar Health Endpoint

```powershell
curl http://localhost:8080/actuator/health
```

**Respuesta esperada:**
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

### 3. Verificar Swagger UI

Abrir en el navegador:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Docs**: http://localhost:8080/v3/api-docs

### 4. Probar endpoint de prueba

```powershell
# Listar providers (debería devolver lista vacía inicialmente)
curl http://localhost:8080/admin/providers
```

**Respuesta esperada:**
```json
{
  "providers": [],
  "total_count": 0
}
```

---

## 🐛 Troubleshooting

### Error: "Table already exists"

**Causa:** Volúmenes de PostgreSQL con schema previo

**Solución:**
```powershell
docker-compose down -v
docker-compose up -d
# Esperar 30 segundos y reintentar
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

### Error: "Cannot create authentication mechanism for TOKEN"

**Causa:** Configuración de Vault incorrecta

**Solución:** Verificar que `application-local.yml` tiene:
```yaml
spring:
  cloud:
    vault:
      enabled: true
      token: dev-token-123
      uri: http://localhost:8200
      authentication: TOKEN
```

### Error: "No qualifying bean of type 'EventPublisher'"

**Causa:** Kafka deshabilitado pero `NoOpEventPublisher` no existe

**Solución:** Ya está implementado en `NoOpEventPublisher.java` (verificar que existe)

### PostgreSQL no arranca: "bind: address already in use"

**Causa:** Supabase u otro PostgreSQL está usando el puerto 5432

**Solución:**
```powershell
# 1. Identificar qué está usando el puerto
netstat -ano | findstr :5432

# 2. Detener Supabase
supabase stop

# 3. O detener servicio PostgreSQL local
Stop-Service -Name postgresql-x64-15 -ErrorAction SilentlyContinue

# 4. Verificar que el puerto quedó libre
netstat -ano | findstr :5432

# 5. Reiniciar Docker Compose
docker-compose down
docker-compose up -d postgres
```

### PostgreSQL arranca pero el backend no conecta

**Causa:** Backend conectándose al PostgreSQL equivocado (ej: Supabase en lugar de Docker)

**Solución:**
```powershell
# Verificar que el contenedor de Docker está en ejecución
docker ps | Select-String "signature-router-postgres"

# Verificar logs del contenedor
docker-compose logs postgres

# Probar conexión desde terminal
docker exec -it signature-router-postgres psql -U siguser -d signature_router
# Si conecta, el problema es en la configuración de Spring
```

### Puerto 8080 en uso

```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :8080

# Cambiar puerto del backend temporalmente
mvn spring-boot:run "-Dspring-boot.run.profiles=local" "-Dserver.port=8081"
```

---

## 📊 Endpoints Disponibles

Una vez arrancado, estos endpoints estarán disponibles:

### API de Negocio

- `POST /api/v1/signatures` - Crear solicitud de firma
- `POST /api/v1/signatures/{id}/validate` - Validar firma
- `GET /api/v1/signatures/{id}/status` - Estado de firma
- `POST /api/v1/signatures/{id}/abort` - Abortar firma

### Admin Panel

- `GET /admin/providers` - Listar providers
- `GET /admin/providers/{id}` - Detalle de provider
- `GET /admin/rules` - Listar reglas de routing
- `GET /admin/metrics` - Métricas agregadas

### Actuator

- `GET /actuator/health` - Estado de salud
- `GET /actuator/metrics` - Métricas de Micrometer
- `GET /actuator/prometheus` - Métricas en formato Prometheus

---

## 🎯 Siguiente Paso: Conectar Frontend

Una vez el backend esté funcionando:

1. Ir a `app-signature-router-admin`
2. Actualizar `lib/config.ts`:
   ```typescript
   useMockData: false,  // Cambiar a false
   apiBaseUrl: 'http://localhost:8080',
   ```
3. Reiniciar frontend: `npm run dev`

---

## 📝 Notas Importantes

1. **Liquibase está deshabilitado** en desarrollo local - Hibernate genera el schema
2. **Kafka está deshabilitado** - se usa `NoOpEventPublisher` (logs en consola)
3. **Contraseña de PostgreSQL hardcodeada** - para evitar problemas con Vault en desarrollo
4. **Todos los providers externos deshabilitados** excepto SMS (stub mode)
5. **Sampling de traces al 100%** - todos los requests se envían a Jaeger

---

¡Backend listo para desarrollo! 🚀

