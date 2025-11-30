# 🔧 Instalar y Configurar Java 21

## ❌ **Problema**

```
[ERROR] Fatal error compiling: error: release version 21 not supported
```

**Causa:** El proyecto requiere Java 21, pero tu sistema tiene una versión anterior (probablemente Java 8, 11 o 17).

---

## ✅ **Solución Automática**

### **Paso 1: Ejecutar el script de configuración**

```powershell
.\setup-java.ps1
```

Este script:
- ✅ Detecta tu versión actual de Java
- ✅ Busca instalaciones de Java 21 en tu sistema
- ✅ Configura `JAVA_HOME` automáticamente
- ✅ Te guía para descargar Java 21 si no lo tienes

---

## 📥 **Si Necesitas Descargar Java 21**

### **Opción 1: Amazon Corretto 21** ⭐ (Recomendado)

**Descarga directa:**
```
https://corretto.aws/downloads/latest/amazon-corretto-21-x64-windows-jdk.msi
```

**Pasos:**
1. Descargar el instalador MSI
2. Ejecutar el instalador (siguiente, siguiente, finalizar)
3. Ejecutar: `.\setup-java.ps1`
4. Seleccionar "s" para configuración permanente

---

### **Opción 2: Eclipse Adoptium (Temurin) 21**

**URL:**
```
https://adoptium.net/temurin/releases/?version=21
```

**Pasos:**
1. Seleccionar: Windows, x64, JDK, .msi
2. Descargar e instalar
3. Ejecutar: `.\setup-java.ps1`

---

### **Opción 3: Microsoft Build of OpenJDK 21**

**URL:**
```
https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-21
```

---

## 🔧 **Configuración Manual (Si el script falla)**

### **1. Verificar si tienes Java 21 instalado**

```powershell
# Buscar instalaciones
Get-ChildItem "C:\Program Files\Java\jdk-21*"
Get-ChildItem "C:\Program Files\Amazon Corretto\jdk21*"
```

### **2. Configurar JAVA_HOME temporalmente (solo esta sesión)**

```powershell
# Reemplaza la ruta con tu instalación real
$env:JAVA_HOME = "C:\Program Files\Amazon Corretto\jdk21.0.5_11"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Verificar
java -version
# Debe mostrar: openjdk version "21.0.x"
```

### **3. Configurar JAVA_HOME permanentemente**

```powershell
# Reemplaza la ruta con tu instalación real
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Amazon Corretto\jdk21.0.5_11", "User")

# Actualizar PATH
$userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
$javaBinPath = "C:\Program Files\Amazon Corretto\jdk21.0.5_11\bin"
$newPath = "$javaBinPath;$userPath"
[System.Environment]::SetEnvironmentVariable("PATH", $newPath, "User")

# IMPORTANTE: Cierra y vuelve a abrir PowerShell
```

---

## ✅ **Verificar que Funciona**

```powershell
# 1. Verificar Java
java -version
# Esperado: openjdk version "21.0.x"

# 2. Verificar JAVA_HOME
echo $env:JAVA_HOME
# Esperado: C:\Program Files\...\jdk21...

# 3. Compilar el proyecto
mvn clean compile

# 4. Si funciona, iniciar la aplicación
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

---

## 🐛 **Troubleshooting**

### **Problema: "java: command not found"**

Java no está en el PATH.

**Solución:**
```powershell
$env:PATH = "C:\Program Files\Amazon Corretto\jdk21.0.5_11\bin;$env:PATH"
java -version
```

---

### **Problema: Maven sigue usando Java antiguo**

Maven tiene su propio `JAVA_HOME`.

**Solución:**
```powershell
# Forzar Maven a usar Java 21
mvn -version
# Verifica que "Java version" sea 21

# Si no, configura JAVA_HOME ANTES de ejecutar Maven
$env:JAVA_HOME = "C:\Program Files\Amazon Corretto\jdk21.0.5_11"
mvn -version
```

---

### **Problema: "Access Denied" al configurar variables de entorno**

**Solución:**
1. Ejecuta PowerShell como Administrador
2. O configura solo para el usuario actual (ya incluido en el script)

---

### **Problema: Tengo múltiples versiones de Java**

**Solución:**
Usa el script `setup-java.ps1` que detectará automáticamente Java 21 y lo configurará.

---

## 📋 **Resumen: Flujo Completo**

```powershell
# 1. Descargar e instalar Java 21
# (usar Amazon Corretto MSI: más fácil)

# 2. Configurar Java 21
.\setup-java.ps1

# 3. Verificar
java -version
mvn -version

# 4. Compilar proyecto
mvn clean compile

# 5. Iniciar aplicación
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

---

## 🎯 **Después de Configurar Java 21**

Una vez que Java 21 esté configurado y `mvn clean compile` funcione:

### **1. Iniciar la aplicación**

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### **2. En otra terminal, probar endpoints**

```powershell
# Health check
curl http://localhost:8080/actuator/health

# Providers
curl http://localhost:8080/actuator/health/providerHealth

# Circuit breakers
curl http://localhost:8080/actuator/circuitbreakers
```

---

## 📚 **Referencias**

- **Amazon Corretto:** https://aws.amazon.com/corretto/
- **Eclipse Adoptium:** https://adoptium.net/
- **Microsoft OpenJDK:** https://learn.microsoft.com/en-us/java/openjdk/
- **Oracle JDK:** https://www.oracle.com/java/technologies/downloads/#java21

---

## ✅ **Checklist**

- [ ] Java 21 descargado e instalado
- [ ] `java -version` muestra "21.0.x"
- [ ] `mvn -version` muestra Java 21
- [ ] `JAVA_HOME` configurado (permanente o temporal)
- [ ] `mvn clean compile` funciona sin errores
- [ ] Aplicación inicia con `mvn spring-boot:run`

---

**Creado por:** BMAD Dev Agent  
**Fecha:** 2025-11-27  
**Propósito:** Guía para instalar y configurar Java 21

