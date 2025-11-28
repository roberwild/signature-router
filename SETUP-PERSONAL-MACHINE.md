# 🖥️ Setup en Máquina Personal - Signature Router

**Guía rápida para configurar el proyecto en tu máquina personal**

---

## 📋 Requisitos Previos

### Software Necesario

| Software | Versión | Descarga |
|----------|---------|----------|
| **Java JDK** | 21 | https://adoptium.net/temurin/releases/?version=21 |
| **Maven** | 3.9+ | https://maven.apache.org/download.cgi |
| **Docker Desktop** | Latest | https://www.docker.com/products/docker-desktop/ |
| **VS Code** o **Cursor** | Latest | https://code.visualstudio.com/ o https://cursor.sh/ |
| **Git** | Latest | https://git-scm.com/downloads |

---

## 🚀 Instalación Rápida (5 pasos)

### Paso 1: Clonar el Repositorio

```powershell
cd C:\Proyectos
git clone https://github.com/roberwild/signature-router.git
cd signature-router
```

### Paso 2: Configurar Entorno

```powershell
# Ejecutar script de configuración
.\setenv.ps1

# Verificar que Java 21 y Maven estén configurados
java -version
mvn -version
```

### Paso 3: Instalar Extensiones de VS Code

```powershell
# Automático (ejecuta el script)
.\setup-vscode.ps1

# O manual: Abre VS Code y acepta instalar extensiones recomendadas
```

### Paso 4: Compilar el Proyecto

```powershell
# Primera compilación (puede tardar unos minutos)
mvn clean install -DskipTests
```

### Paso 5: Levantar Infraestructura

```powershell
# Iniciar todos los servicios
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps
```

**✅ ¡Listo! Ahora presiona `F5` en VS Code para ejecutar la aplicación**

---

## 📦 Archivos de Configuración Incluidos

Ya están en el repositorio, listos para usar:

```
signature-router/
├── .vscode/                          # Configuración de VS Code
│   ├── settings.json                 # Settings del workspace
│   ├── extensions.json               # Extensiones recomendadas
│   ├── launch.json                   # Configuraciones de debug
│   ├── tasks.json                    # Tareas de Maven y Docker
│   └── README.md                     # Guía de VS Code
├── .editorconfig                     # Formato de código consistente
├── setenv.ps1                        # Script de variables de entorno
├── setup-vscode.ps1                  # Script de instalación automática
├── vscode-profile-export.md          # Documentación completa del perfil
└── SETUP-PERSONAL-MACHINE.md         # Esta guía
```

---

## 🔧 Configuración Manual (si los scripts fallan)

### Java 21

```powershell
# Descargar e instalar desde: https://adoptium.net/
# Luego configurar variables de entorno:

setx JAVA_HOME "C:\Program Files\Java\jdk-21"
setx PATH "%JAVA_HOME%\bin;%PATH%"
```

### Maven

```powershell
# Descargar desde: https://maven.apache.org/download.cgi
# Extraer a C:\apache-maven-3.9.5
# Configurar variables de entorno:

setx M2_HOME "C:\apache-maven-3.9.5"
setx PATH "%M2_HOME%\bin;%PATH%"
```

### Extensiones de VS Code

Instalar manualmente desde VS Code:
1. `Ctrl+Shift+X` (Abrir extensiones)
2. Buscar e instalar:
   - Extension Pack for Java
   - Spring Boot Tools
   - Lombok Annotations Support
   - Docker
   - GitLens
   - YAML

---

## 🎯 Verificación del Setup

### Checklist Completo

```powershell
# ✅ Java 21
java -version
# Debe mostrar: openjdk version "21.0.x"

# ✅ Maven 3.9+
mvn -version
# Debe mostrar: Apache Maven 3.9.x

# ✅ Docker
docker --version
docker-compose --version

# ✅ Proyecto compila
mvn clean install -DskipTests
# Debe terminar con: BUILD SUCCESS

# ✅ Docker Compose funciona
docker-compose up -d
docker-compose ps
# Deben estar running: postgres, kafka, vault, etc.

# ✅ Aplicación arranca
mvn spring-boot:run -Dspring-boot.run.profiles=local
# O presionar F5 en VS Code
# Debe iniciar en: http://localhost:8080

# ✅ Tests pasan
mvn test
# Debe terminar con: Tests run: 185+, Failures: 0
```

---

## 📊 Servicios Docker Compose

Cuando ejecutes `docker-compose up -d`, se levantarán estos servicios:

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| **PostgreSQL** | 5432 | localhost:5432 | Base de datos principal |
| **Keycloak** | 8081 | http://localhost:8081 | OAuth2/JWT |
| **Kafka** | 9092 | localhost:9092 | Message broker |
| **Schema Registry** | 8085 | http://localhost:8085 | Avro schemas |
| **Vault** | 8200 | http://localhost:8200 | Secret management |
| **Prometheus** | 9090 | http://localhost:9090 | Metrics |
| **Grafana** | 3000 | http://localhost:3000 | Dashboards |

**Credenciales por defecto:**
- Grafana: `admin/admin`
- Keycloak: `admin/admin123`
- Vault: Token en `vault/init-output.txt`

---

## 🐛 Troubleshooting Común

### Error: "Java Language Server"
```powershell
# Limpiar workspace de Java
# En VS Code: Ctrl+Shift+P → "Java: Clean Java Language Server Workspace"
# Reiniciar VS Code
```

### Error: "Cannot connect to Docker"
```powershell
# Verificar que Docker Desktop esté corriendo
docker ps

# Si no funciona, reiniciar Docker Desktop
```

### Error: "Port already in use"
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :8080

# Detener procesos conflictivos o cambiar puerto en application-local.yml
```

### Error: "Lombok not working"
```powershell
# Descargar lombok.jar
# https://projectlombok.org/download

# Ejecutar instalador
java -jar lombok.jar

# Reiniciar VS Code
```

### Error: "Tests failing"
```powershell
# Asegurarse que Docker Compose está corriendo
docker-compose ps

# Limpiar y recompilar
mvn clean install
```

---

## ⌨️ Comandos Útiles

### Maven

```powershell
# Compilar sin tests
mvn clean install -DskipTests

# Ejecutar tests
mvn test

# Ejecutar un test específico
mvn test -Dtest=SignatureRequestTest

# Ejecutar aplicación
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Ver dependencias
mvn dependency:tree
```

### Docker Compose

```powershell
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio
docker-compose logs -f postgres

# Parar servicios
docker-compose down

# Parar y borrar volúmenes
docker-compose down -v

# Recrear servicios
docker-compose up -d --force-recreate
```

### Git

```powershell
# Ver estado
git status

# Crear rama
git checkout -b feature/mi-feature

# Commit
git add .
git commit -m "feat: descripción"

# Push
git push origin feature/mi-feature
```

---

## 📚 Documentación Adicional

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| **Perfil VS Code Completo** | `vscode-profile-export.md` | Configuración detallada |
| **Arquitectura** | `docs/architecture/` | ADRs, diagramas, tech stack |
| **Sprint Status** | `docs/sprint-artifacts/` | Estado del proyecto |
| **Tests** | `src/test/java/README-TESTS.md` | Guía de testing |
| **Runbooks** | `docs/runbooks/` | Guías operacionales |
| **Informes** | Raíz del proyecto | Informes ejecutivos |

---

## 🎯 Próximos Pasos

Una vez que tengas todo configurado:

1. **Familiarízate con el código**
   - Explorar `src/main/java/com/bank/signature/`
   - Revisar tests en `src/test/java/`

2. **Lee la documentación**
   - ADRs en `docs/architecture/adr/`
   - Tech specs en `docs/architecture/`

3. **Prueba los endpoints**
   - Importar `docs/postman/` (si existe)
   - Usar REST Client de VS Code

4. **Ejecuta los tests**
   - `mvn test` para ver >85% coverage
   - `mvn verify` para integration tests

5. **Experimenta con cambios**
   - Crear rama: `git checkout -b feature/test`
   - Hacer cambios
   - Ejecutar tests
   - Commit y push

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs**
   - Aplicación: `logs/application.log`
   - Docker: `docker-compose logs -f`

2. **Consulta la documentación**
   - `vscode-profile-export.md`
   - `.vscode/README.md`

3. **Verifica versiones**
   - `java -version` (debe ser 21)
   - `mvn -version` (debe ser 3.9+)
   - `docker --version`

---

## ✅ Checklist Final

- [ ] Java 21 instalado y en PATH
- [ ] Maven 3.9+ instalado y en PATH
- [ ] Docker Desktop instalado y corriendo
- [ ] VS Code/Cursor instalado
- [ ] Proyecto clonado desde GitHub
- [ ] Extensiones de VS Code instaladas
- [ ] Variables de entorno configuradas (`setenv.ps1`)
- [ ] Proyecto compila sin errores (`mvn clean install`)
- [ ] Docker Compose levantado (`docker-compose up -d`)
- [ ] Aplicación inicia correctamente (F5 en VS Code)
- [ ] Tests pasan (`mvn test`)
- [ ] Puedes hacer commit y push a una rama de prueba

---

**¡Feliz coding! 🚀**

---

**Creado el:** 28 de Noviembre de 2025  
**Proyecto:** Signature Router v0.2.0-SNAPSHOT  
**Repositorio:** https://github.com/roberwild/signature-router  
**Autor:** Roberto Gutierrez (@roberwild)

