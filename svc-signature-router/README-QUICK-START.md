# 🚀 Quick Start - Backend Signature Router

## Arranque con 1 Solo Comando

```powershell
.\check-and-start.ps1
```

Este script automáticamente:
- ✅ Verifica que el puerto 5432 esté libre (detiene Supabase si es necesario)
- ✅ Limpia volúmenes de Docker
- ✅ Inicia Docker Compose (PostgreSQL, Kafka, Vault, Keycloak, etc.)
- ✅ Espera a que PostgreSQL esté listo
- ✅ Arranca Spring Boot con el perfil `local`

---

## URLs Importantes

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Backend API** | http://localhost:8080 | - |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | - |
| **Keycloak Admin** | http://localhost:8080/admin | admin / admin |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3000 | admin / admin |
| **Jaeger UI** | http://localhost:16686 | - |
| **PostgreSQL** | localhost:5432 | siguser / sigpass |
| **Vault UI** | http://localhost:8200 | Token: dev-root-token |

---

## Arranque Manual (si prefieres hacerlo paso a paso)

### 1. Verificar puerto 5432
```powershell
netstat -ano | findstr :5432
```

Si está ocupado por Supabase:
```powershell
supabase stop
```

### 2. Limpiar y arrancar Docker
```powershell
cd svc-signature-router
docker-compose down -v
docker-compose up -d
```

### 3. Esperar a PostgreSQL (15 segundos aprox)
```powershell
Start-Sleep -Seconds 15
```

### 4. Arrancar Backend
```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=local" "-Dmaven.test.skip=true"
```

---

## Troubleshooting

### Error: "Port 5432 already in use"
**Causa:** Supabase u otro PostgreSQL local está corriendo.

**Solución:**
```powershell
supabase stop
# O detener servicio de PostgreSQL
Stop-Service -Name postgresql*
```

### Error: "Unable to determine Dialect"
**Causa:** PostgreSQL no está corriendo o no está listo.

**Solución:**
```powershell
docker logs signature-router-postgres
# Debe aparecer: "database system is ready to accept connections"
```

### Error: "No plugin found for prefix 'spring-boot'"
**Causa:** Maven se ejecutó desde el directorio raíz en lugar de `svc-signature-router`.

**Solución:**
```powershell
cd svc-signature-router
mvn spring-boot:run "-Dspring-boot.run.profiles=local" "-Dmaven.test.skip=true"
```

---

## Detener Todo

```powershell
# Detener Spring Boot: Ctrl+C en la terminal donde corre

# Detener Docker Compose:
docker-compose down

# Detener y eliminar volúmenes:
docker-compose down -v
```

---

**Más información:** Ver `ARRANQUE-BACKEND.md` para detalles completos.
