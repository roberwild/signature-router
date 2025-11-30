# 🐳 Iniciar Docker Desktop - Signature Router

## ⚠️ Problema Común

Si ves este error al ejecutar `docker-compose up -d`:

```
unable to get image '...': error during connect: 
open //./pipe/dockerDesktopLinuxEngine: El sistema no puede encontrar el archivo especificado.
```

**Causa:** Docker Desktop no está corriendo.

---

## ✅ Solución

### **Opción 1: PowerShell (Automático)**

```powershell
# Iniciar Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Esperar 30 segundos a que Docker inicie
Write-Host "Esperando a que Docker Desktop inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar que Docker está corriendo
docker ps
```

### **Opción 2: Manual**

1. **Buscar "Docker Desktop" en el menú de Windows**
2. **Hacer clic en el icono**
3. **Esperar 20-30 segundos** hasta que aparezca el ícono de Docker en la bandeja del sistema
4. **Verificar** que el ícono está en verde (corriendo)

---

## 🧪 Verificar que Docker está listo

```powershell
# Prueba 1: Verificar servicio
docker ps

# Salida esperada (si no hay contenedores):
# CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES

# Prueba 2: Verificar versión
docker --version
docker-compose --version
```

---

## 🚀 Iniciar Signature Router (Paso a Paso)

### **Paso 1: Iniciar Docker Desktop**

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30
```

### **Paso 2: Verificar Docker**

```powershell
docker ps
```

**Si ves error:** Espera 10 segundos más y vuelve a intentar.

### **Paso 3: Levantar servicios de infraestructura**

```powershell
cd C:\Proyectos\signature-router
docker-compose up -d
```

**Salida esperada:**
```
Creating network "signature-router-network" ... done
Creating signature-router-postgres ... done
Creating signature-router-zookeeper ... done
Creating signature-router-vault ... done
Creating signature-router-kafka ... done
Creating signature-router-schema-registry ... done
Creating signature-router-prometheus ... done
Creating signature-router-grafana ... done
```

### **Paso 4: Verificar salud de servicios**

```powershell
# Esperar 30 segundos a que los servicios se inicialicen
Start-Sleep -Seconds 30

# Ejecutar script de verificación
.\verify-health.ps1
```

**Salida esperada:**
```
======================================
Signature Router - Health Check
======================================

1. Docker Container Health Checks
===================================
Checking Docker container: signature-router-postgres... ✓ HEALTHY
Checking Docker container: signature-router-kafka... ✓ HEALTHY
Checking Docker container: signature-router-vault... ✓ HEALTHY
Checking Docker container: signature-router-prometheus... ✓ HEALTHY
Checking Docker container: signature-router-grafana... ✓ HEALTHY

✓ ALL SERVICES HEALTHY
```

### **Paso 5: Iniciar aplicación Spring Boot**

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**Logs esperados:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

Started SignatureRouterApplication in 8.123 seconds
```

### **Paso 6: Probar endpoints**

```powershell
# Health Check General
Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"

# Health Check de Providers
Invoke-RestMethod -Uri "http://localhost:8080/actuator/health/providerHealth"

# Estado de Circuit Breakers
Invoke-RestMethod -Uri "http://localhost:8080/actuator/circuitbreakers"
```

---

## 🐛 Troubleshooting

### **Problema: Docker Desktop no se encuentra**

**Solución:** Instalar Docker Desktop desde:
https://www.docker.com/products/docker-desktop/

### **Problema: "Docker is starting..."**

**Solución:** Esperar 30-60 segundos más. Docker Desktop tarda en iniciar.

```powershell
# Verificar cada 5 segundos
while ($true) {
    try {
        docker ps | Out-Null
        Write-Host "✓ Docker está listo!" -ForegroundColor Green
        break
    } catch {
        Write-Host "⚠ Docker aún está iniciando... esperando..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}
```

### **Problema: "port 5432 is already allocated"**

**Causa:** Ya hay un PostgreSQL corriendo en tu máquina.

**Solución:**
```powershell
# Opción 1: Detener PostgreSQL local
Stop-Service postgresql-x64-15

# Opción 2: Cambiar puerto en docker-compose.yml
# Línea 8: "5433:5432" (usar puerto 5433 externo)
```

### **Problema: "permission denied" en volúmenes**

**Solución:**
```powershell
# Eliminar volúmenes y recrear
docker-compose down -v
docker-compose up -d
```

---

## 📊 Verificación Completa (Script Automático)

Copia y pega este script completo en PowerShell:

```powershell
# ==============================================
# Script Completo de Inicio - Signature Router
# ==============================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Signature Router - Inicio Automático" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar si Docker Desktop está corriendo
Write-Host "[1/6] Verificando Docker Desktop..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "      ✓ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "      ⚠ Docker no está corriendo. Iniciando..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    Write-Host "      Esperando a que Docker inicie (esto puede tomar 30-60 segundos)..." -ForegroundColor Yellow
    $maxWait = 60
    $waited = 0
    while ($waited -lt $maxWait) {
        try {
            docker ps | Out-Null
            Write-Host "      ✓ Docker está listo!" -ForegroundColor Green
            break
        } catch {
            Start-Sleep -Seconds 5
            $waited += 5
            Write-Host "      ⏳ Esperando... ($waited/$maxWait segundos)" -ForegroundColor Yellow
        }
    }
    
    if ($waited -ge $maxWait) {
        Write-Host "      ✗ Error: Docker no inició en $maxWait segundos" -ForegroundColor Red
        Write-Host "      Por favor, inicia Docker Desktop manualmente y vuelve a ejecutar este script." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Paso 2: Levantar servicios de infraestructura
Write-Host "[2/6] Iniciando servicios de infraestructura..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "      ✗ Error al iniciar servicios" -ForegroundColor Red
    exit 1
}

Write-Host "      ✓ Servicios iniciados" -ForegroundColor Green
Write-Host ""

# Paso 3: Esperar a que los servicios estén healthy
Write-Host "[3/6] Esperando a que los servicios estén listos (30 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "      ✓ Tiempo de espera completado" -ForegroundColor Green
Write-Host ""

# Paso 4: Verificar salud de servicios
Write-Host "[4/6] Verificando salud de servicios..." -ForegroundColor Yellow
$healthCheck = .\verify-health.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ Todos los servicios están saludables" -ForegroundColor Green
} else {
    Write-Host "      ⚠ Algunos servicios no están listos. Continuando..." -ForegroundColor Yellow
}

Write-Host ""

# Paso 5: Compilar proyecto
Write-Host "[5/6] Compilando proyecto..." -ForegroundColor Yellow
mvn clean compile -DskipTests | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "      ✗ Error al compilar" -ForegroundColor Red
    exit 1
}

Write-Host "      ✓ Proyecto compilado" -ForegroundColor Green
Write-Host ""

# Paso 6: Instrucciones finales
Write-Host "[6/6] ¡Listo para iniciar!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Próximos Pasos" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar la aplicación:" -ForegroundColor White
Write-Host "   mvn spring-boot:run -Dspring-boot.run.profiles=local" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Verificar salud (en otra terminal):" -ForegroundColor White
Write-Host "   curl http://localhost:8080/actuator/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Ver servicios disponibles:" -ForegroundColor White
Write-Host "   - PostgreSQL:      http://localhost:5432" -ForegroundColor Cyan
Write-Host "   - Kafka:           http://localhost:9092" -ForegroundColor Cyan
Write-Host "   - Vault:           http://localhost:8200" -ForegroundColor Cyan
Write-Host "   - Prometheus:      http://localhost:9090" -ForegroundColor Cyan
Write-Host "   - Grafana:         http://localhost:3000 (admin/admin)" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
```

---

## 📚 Referencias

- **Guía completa de pruebas:** [TESTING.md](./TESTING.md)
- **Guía rápida:** [QUICK-TEST-GUIDE.md](./QUICK-TEST-GUIDE.md)
- **Verificación de salud:** [verify-health.ps1](./verify-health.ps1)

---

**Generado por:** BMAD Dev Agent  
**Fecha:** 2025-11-27

