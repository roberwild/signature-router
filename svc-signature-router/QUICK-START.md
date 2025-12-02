# Quick Start - Signature Router Backend

## Arranque Rápido

### Opción 1: Arranque Normal (sin datos)
```powershell
.\check-and-start.ps1
```

Base de datos vacía - Ideal para desarrollo limpio.

### Opción 2: Arranque con Datos de Prueba (RECOMENDADO)
```powershell
.\check-and-start.ps1 -LoadTestData
```

Base de datos poblada con:
- ✅ 7 proveedores (SMS, PUSH, VOICE, BIOMETRIC)
- ✅ 6 reglas de enrutamiento
- ✅ 30 solicitudes de firma con todos los estados
- ✅ Desafíos, audit logs, y eventos

**Ideal para:**
- Testing del frontend
- Validación de pantallas
- Demos
- QA

---

## Lo que hace `check-and-start.ps1`

1. ✅ Verifica puerto 5432 (libera si está ocupado)
2. ✅ Verifica Docker Desktop
3. ✅ Limpia contenedores anteriores
4. ✅ Inicia Docker Compose (PostgreSQL, Kafka, Vault, etc.)
5. ✅ Espera a que PostgreSQL esté listo
6. ✅ **[OPCIONAL]** Carga datos de prueba
7. ✅ Arranca Spring Boot backend

---

## Cargar Datos Después

Si arrancaste sin datos y quieres cargarlos después:

```powershell
.\scripts\load-test-data.ps1
```

---

## URLs Útiles

- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Actuator Health**: http://localhost:8080/actuator/health
- **Prometheus Metrics**: http://localhost:8080/actuator/prometheus
- **Grafana**: http://localhost:3001 (admin/admin)
- **Jaeger Tracing**: http://localhost:16686

---

## Frontend Admin Portal

```powershell
cd ..\app-signature-router-admin
npm run dev
```

- **Admin Portal**: http://localhost:3000/admin
- **Signatures**: http://localhost:3000/admin/signatures
- **Providers**: http://localhost:3000/admin/providers
- **Rules**: http://localhost:3000/admin/rules

---

## Troubleshooting

### Puerto 5432 ocupado
El script lo detecta automáticamente. Si eres admin, lo libera. Si no:
```powershell
# Ejecutar PowerShell como Administrador
.\check-and-start.ps1
```

### Docker no arranca
```powershell
# Verificar Docker Desktop
docker ps

# Reiniciar Docker Desktop
# Menú de Windows > Docker Desktop > Quit
# Iniciar nuevamente
```

### Backend no compila
```powershell
# Limpiar y recompilar
mvn clean install -DskipTests
```

### Ver logs de contenedores
```powershell
# PostgreSQL
docker logs signature-router-postgres

# Kafka
docker logs signature-router-kafka

# Todos
docker-compose logs -f
```

---

## Detener Todo

```powershell
# Ctrl+C en la terminal donde corre Spring Boot

# Detener contenedores
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

---

## Configuración de Desarrollo

### Local (perfil por defecto)
- Liquibase: **DESHABILITADO**
- Hibernate: `ddl-auto: update` (genera esquema automáticamente)
- Vault: Mock (sin credenciales reales)
- Kafka: Deshabilitado (eventos en memoria)

### Cambiar Perfil
```powershell
# UAT
mvn spring-boot:run -Dspring-boot.run.profiles=uat

# Producción (NO USAR EN LOCAL)
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## Próximos Pasos

1. ✅ **Arrancar con datos**: `.\check-and-start.ps1 -LoadTestData`
2. ✅ **Verificar Swagger**: http://localhost:8080/swagger-ui.html
3. ✅ **Probar API**: Crear signature request desde Swagger
4. ✅ **Ver en frontend**: http://localhost:3000/admin/signatures
5. ✅ **Explorar métricas**: http://localhost:3001 (Grafana)

---

**¿Problemas?** Consulta `docs/` o crea un issue en el repositorio.

