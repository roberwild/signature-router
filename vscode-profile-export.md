# 🔧 Exportación de Perfil VS Code/Cursor - Signature Router Project

**Fecha de Exportación:** 28 de Noviembre de 2025  
**Proyecto:** signature-router  
**Tipo:** Spring Boot 3.2 + Java 21 + Hexagonal Architecture

---

## 📦 Configuración del Workspace

### `.vscode/settings.json`

```json
{
  "java.configuration.updateBuildConfiguration": "automatic",
  
  // Java Configuration
  "java.compile.nullAnalysis.mode": "automatic",
  "java.jdt.ls.vmargs": "-XX:+UseParallelGC -XX:GCTimeRatio=4 -XX:AdaptiveSizePolicyWeight=90 -Dsun.zip.disableMemoryMapping=true -Xmx2G -Xms100m",
  "java.semanticHighlighting.enabled": true,
  "java.import.gradle.enabled": false,
  "java.import.maven.enabled": true,
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-21",
      "path": "C:\\Program Files\\Java\\jdk-21",
      "default": true
    }
  ],
  
  // Spring Boot
  "spring-boot.ls.checkJVM": false,
  "spring.initializr.defaultLanguage": "Java",
  "spring.initializr.defaultJavaVersion": "21",
  "spring.initializr.defaultPackaging": "jar",
  
  // Maven
  "maven.executable.path": "mvn",
  "maven.terminal.useJavaHome": true,
  
  // Editor
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "editor.rulers": [120],
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  
  // Files
  "files.exclude": {
    "**/.git": true,
    "**/.mvn": true,
    "**/target": true,
    "**/.idea": true,
    "**/*.iml": true,
    "**/.classpath": true,
    "**/.project": true,
    "**/.settings": true
  },
  "files.watcherExclude": {
    "**/target/**": true,
    "**/node_modules/**": true,
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true
  },
  
  // Search
  "search.exclude": {
    "**/target": true,
    "**/node_modules": true,
    "**/.git": true
  },
  
  // Terminal
  "terminal.integrated.shell.windows": "C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  
  // Git
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,
  
  // Formatting
  "[java]": {
    "editor.defaultFormatter": "redhat.java",
    "editor.formatOnSave": true,
    "editor.tabSize": 4
  },
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.tabSize": 2
  },
  "[json]": {
    "editor.defaultFormatter": "vscode.json-language-features",
    "editor.tabSize": 2
  },
  "[xml]": {
    "editor.defaultFormatter": "redhat.vscode-xml",
    "editor.tabSize": 2
  },
  
  // Markdown
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.quickSuggestions": false
  }
}
```

---

## 🔌 Extensiones Recomendadas

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    // Java Essentials
    "vscjava.vscode-java-pack",
    "redhat.java",
    "vscjava.vscode-java-debug",
    "vscjava.vscode-java-test",
    "vscjava.vscode-maven",
    "vscjava.vscode-java-dependency",
    
    // Spring Boot
    "vmware.vscode-spring-boot",
    "vscjava.vscode-spring-initializr",
    "vscjava.vscode-spring-boot-dashboard",
    
    // Database
    "mtxr.sqltools",
    "mtxr.sqltools-driver-pg",
    
    // Docker & Kubernetes
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    
    // YAML & Configuration
    "redhat.vscode-yaml",
    "redhat.vscode-xml",
    
    // Lombok
    "gabrielbb.vscode-lombok",
    
    // Git
    "eamodio.gitlens",
    "mhutchie.git-graph",
    
    // REST Client
    "humao.rest-client",
    
    // Markdown
    "yzhang.markdown-all-in-one",
    "davidanson.vscode-markdownlint",
    
    // Utilities
    "christian-kohler.path-intellisense",
    "visualstudioexptteam.vscodeintellicode",
    "editorconfig.editorconfig",
    
    // Testing
    "richardwillis.vscode-gradle-extension-pack",
    
    // Avro
    "streetsidesoftware.avro"
  ]
}
```

---

## 🎨 Launch Configuration

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Spring Boot App (Local Profile)",
      "request": "launch",
      "mainClass": "com.bank.signature.SignatureRouterApplication",
      "projectName": "svc-signature-router-java",
      "args": "--spring.profiles.active=local",
      "env": {
        "SPRING_PROFILES_ACTIVE": "local"
      },
      "vmArgs": "-Xmx1024m -Xms512m"
    },
    {
      "type": "java",
      "name": "Spring Boot App (Test Profile)",
      "request": "launch",
      "mainClass": "com.bank.signature.SignatureRouterApplication",
      "projectName": "svc-signature-router-java",
      "args": "--spring.profiles.active=test",
      "env": {
        "SPRING_PROFILES_ACTIVE": "test"
      }
    },
    {
      "type": "java",
      "name": "Debug All Tests",
      "request": "launch",
      "mainClass": "",
      "projectName": "svc-signature-router-java",
      "preLaunchTask": "test"
    }
  ]
}
```

---

## ⚙️ Tasks Configuration

### `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "maven: clean install",
      "type": "shell",
      "command": "mvn clean install -DskipTests",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "maven: clean package",
      "type": "shell",
      "command": "mvn clean package -DskipTests",
      "group": "build"
    },
    {
      "label": "maven: test",
      "type": "shell",
      "command": "mvn test",
      "group": "test"
    },
    {
      "label": "maven: spring-boot:run",
      "type": "shell",
      "command": "mvn spring-boot:run -Dspring-boot.run.profiles=local",
      "group": "none",
      "isBackground": true
    },
    {
      "label": "docker-compose: up",
      "type": "shell",
      "command": "docker-compose up -d",
      "group": "none"
    },
    {
      "label": "docker-compose: down",
      "type": "shell",
      "command": "docker-compose down",
      "group": "none"
    },
    {
      "label": "docker-compose: logs",
      "type": "shell",
      "command": "docker-compose logs -f",
      "group": "none"
    }
  ]
}
```

---

## 📝 Editor Config

### `.editorconfig`

```ini
# EditorConfig is awesome: https://EditorConfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.java]
indent_style = space
indent_size = 4
max_line_length = 120

[*.{yml,yaml}]
indent_style = space
indent_size = 2

[*.{json,xml}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
max_line_length = 0

[Dockerfile*]
indent_style = space
indent_size = 2

[*.sh]
indent_style = space
indent_size = 2
```

---

## 🚀 Pasos para Importar el Perfil

### 1. Instalar VS Code/Cursor

```bash
# Windows
winget install Microsoft.VisualStudioCode
# o
winget install Cursor
```

### 2. Instalar Java 21

```bash
# Descargar desde:
https://adoptium.net/temurin/releases/?version=21

# Configurar JAVA_HOME
setx JAVA_HOME "C:\Program Files\Java\jdk-21"
setx PATH "%JAVA_HOME%\bin;%PATH%"
```

### 3. Instalar Maven

```bash
# Descargar desde:
https://maven.apache.org/download.cgi

# Configurar M2_HOME
setx M2_HOME "C:\apache-maven-3.9.5"
setx PATH "%M2_HOME%\bin;%PATH%"
```

### 4. Clonar el Repositorio

```bash
cd C:\Proyectos
git clone https://github.com/roberwild/signature-router.git
cd signature-router
```

### 5. Copiar Configuraciones

```bash
# Crear carpeta .vscode si no existe
mkdir .vscode

# Copiar los archivos de configuración:
# - settings.json
# - extensions.json
# - launch.json
# - tasks.json

# Copiar .editorconfig a la raíz
```

### 6. Instalar Extensiones

Opción A: **Automático (Recomendado)**
- Abrir VS Code/Cursor
- Ir a la carpeta del proyecto
- VS Code detectará `extensions.json` y preguntará si quieres instalar las recomendadas
- Hacer clic en "Install All"

Opción B: **Manual**
```bash
# Lista de extensiones esenciales
code --install-extension vscjava.vscode-java-pack
code --install-extension vmware.vscode-spring-boot
code --install-extension redhat.vscode-yaml
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens
code --install-extension gabrielbb.vscode-lombok
```

### 7. Configurar Lombok

- Descargar lombok.jar desde: https://projectlombok.org/download
- Ejecutar: `java -jar lombok.jar`
- Seleccionar instalación de Eclipse/IDE
- Reiniciar VS Code

### 8. Verificar Configuración

```bash
# Verificar Java
java -version
# Debe mostrar: openjdk version "21.0.x"

# Verificar Maven
mvn -version
# Debe mostrar: Apache Maven 3.9.x

# Compilar proyecto
mvn clean install -DskipTests
```

### 9. Levantar Infraestructura

```bash
# Iniciar Docker Compose
docker-compose up -d

# Verificar que todo esté corriendo
docker-compose ps
```

### 10. Ejecutar Aplicación

**Desde VS Code:**
- Presionar `F5`
- Seleccionar "Spring Boot App (Local Profile)"

**Desde Terminal:**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

---

## 🔑 Variables de Entorno Opcionales

### Crear archivo: `setenv.ps1`

```powershell
# Configuración de entorno para Signature Router

# Java
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Maven
$env:M2_HOME = "C:\apache-maven-3.9.5"
$env:MAVEN_OPTS = "-Xmx2048m -Xms512m"

# Spring Boot
$env:SPRING_PROFILES_ACTIVE = "local"

# Docker
$env:COMPOSE_PROJECT_NAME = "signature-router"

# PATH
$env:PATH = "$env:JAVA_HOME\bin;$env:M2_HOME\bin;$env:PATH"

Write-Host "✅ Entorno configurado para Signature Router" -ForegroundColor Green
Write-Host "   Java: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Cyan
Write-Host "   Maven: $(mvn -version | Select-Object -First 1)" -ForegroundColor Cyan
```

**Uso:**
```powershell
# Ejecutar antes de trabajar en el proyecto
.\setenv.ps1
```

---

## 📚 Shortcuts Útiles

| Comando | Atajo | Descripción |
|---------|-------|-------------|
| Buscar en archivos | `Ctrl+Shift+F` | Búsqueda global |
| Ir a definición | `F12` | Saltar a definición de clase/método |
| Buscar referencias | `Shift+F12` | Encontrar usos |
| Renombrar símbolo | `F2` | Refactorización segura |
| Organizar imports | `Shift+Alt+O` | Limpiar imports |
| Format document | `Shift+Alt+F` | Formatear código |
| Command Palette | `Ctrl+Shift+P` | Ejecutar comandos |
| Terminal | `Ctrl+ñ` | Abrir/cerrar terminal |
| Debug | `F5` | Iniciar debug |
| Run without debug | `Ctrl+F5` | Ejecutar sin debug |
| Run tests | `Ctrl+Shift+T` | Ejecutar tests |

---

## 🎯 Checklist de Verificación

- [ ] Java 21 instalado y configurado
- [ ] Maven 3.9+ instalado
- [ ] Docker Desktop instalado y corriendo
- [ ] VS Code/Cursor instalado
- [ ] Extensiones Java Pack instaladas
- [ ] Lombok configurado
- [ ] Proyecto clonado desde GitHub
- [ ] `.vscode/` configurado
- [ ] `.editorconfig` en la raíz
- [ ] `mvn clean install` exitoso
- [ ] `docker-compose up -d` exitoso
- [ ] Aplicación inicia con `F5`
- [ ] Tests pasan (`mvn test`)

---

**Creado el:** 28 de Noviembre de 2025  
**Para:** Máquina Personal  
**Proyecto:** signature-router v0.2.0-SNAPSHOT  
**Autor:** Roberto Gutierrez (@roberwild)

