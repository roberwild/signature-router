# 🚀 Solución Rápida - Docker no está corriendo

## ❌ **Tu Error**

```
unable to get image '...': open //./pipe/dockerDesktopLinuxEngine: 
El sistema no puede encontrar el archivo especificado.
```

## ✅ **Solución en 3 Pasos**

### **Paso 1: Verificar Estado Actual**

```powershell
.\check-docker.ps1
```

Este script te dirá exactamente qué necesitas hacer.

---

### **Paso 2: Iniciar Docker Desktop**

**Opción A - Automático (Recomendado):**

```powershell
.\start-system.ps1
```

**Opción B - Manual:**

```powershell
# Iniciar Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Esperar 60 segundos
Start-Sleep -Seconds 60

# Verificar
docker ps
```

---

### **Paso 3: Levantar Servicios**

```powershell
docker-compose up -d
```

**Salida esperada:**
```
✔ Network signature-router-network        Created
✔ Container signature-router-postgres     Started
✔ Container signature-router-zookeeper    Started
✔ Container signature-router-vault        Started
✔ Container signature-router-kafka        Started
✔ Container signature-router-schema-registry Started
✔ Container signature-router-prometheus   Started
✔ Container signature-router-grafana      Started
```

---

## 🔍 **Verificar que Todo Funciona**

```powershell
# Ver contenedores corriendo
docker ps

# Verificar salud
.\verify-health.ps1

# Ver logs de un servicio específico
docker-compose logs postgres
```

---

## 🎯 **Iniciar la Aplicación**

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**Logs esperados:**
```
Started SignatureRouterApplication in 8.123 seconds
```

---

## 🧪 **Probar que Funciona**

```powershell
# Health check
curl http://localhost:8080/actuator/health

# Providers
curl http://localhost:8080/actuator/health/providerHealth

# Circuit breakers
curl http://localhost:8080/actuator/circuitbreakers
```

---

## 🐛 **Si Algo Falla**

### **Problema: "Docker Desktop not found"**

```powershell
# Verifica la ruta
Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

Si devuelve `False`, Docker Desktop no está instalado.
**Solución:** Descargar de https://www.docker.com/products/docker-desktop/

---

### **Problema: "port 5432 is already allocated"**

Ya tienes PostgreSQL corriendo en tu máquina.

**Solución:**
```powershell
# Detener PostgreSQL local
Stop-Service postgresql*

# O cambiar puerto en docker-compose.yml
# Línea 8: cambiar "5432:5432" a "5433:5432"
```

---

### **Problema: "Docker is starting..."**

Docker está iniciando pero aún no está listo.

**Solución:** Esperar 30-60 segundos más.

---

### **Problema: "version is obsolete"**

Es solo un warning. Puedes ignorarlo o eliminar la línea `version: '3.8'` de `docker-compose.yml`.

**Solución (opcional):**
```powershell
# Editar docker-compose.yml y eliminar línea 1
(Get-Content docker-compose.yml | Select-Object -Skip 2) | Set-Content docker-compose.yml
```

---

## 📊 **Scripts Útiles que Creé**

| Script | Propósito |
|--------|-----------|
| `check-docker.ps1` | Diagnosticar estado de Docker |
| `start-system.ps1` | Iniciar todo automáticamente |
| `verify-health.ps1` | Verificar salud de servicios |

---

## ✅ **Checklist Rápido**

- [ ] Docker Desktop instalado
- [ ] Docker Desktop corriendo (`docker ps` funciona)
- [ ] Servicios levantados (`docker-compose up -d`)
- [ ] Servicios saludables (`.\verify-health.ps1`)
- [ ] Aplicación iniciada (`mvn spring-boot:run`)
- [ ] Health check OK (`curl http://localhost:8080/actuator/health`)

---

## 🚀 **Comando Mágico (Todo en Uno)**

Si ya tienes Docker Desktop instalado:

```powershell
.\start-system.ps1
```

Espera 2-3 minutos y todo estará listo.

---

**Creado por:** BMAD Dev Agent  
**Fecha:** 2025-11-27  
**Propósito:** Solución rápida al error de Docker pipe

