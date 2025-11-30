# Guía de Migración - Reorganización del Proyecto

Este documento explica cómo reorganizar tu proyecto signature-router con la nueva estructura.

## 📁 Estructura Objetivo

```
signature-router/                       # Nuevo monorepo
│
├── svc-signature-router/              # ⭐ Backend Service
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   ├── lombok.config
│   └── README.md
│
├── app-signature-router-admin/        # ⭐ Admin Frontend (YA CREADO)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── docs/                              # Documentación general
├── docker/                            # Docker configs
├── scripts/                           # Scripts compartidos
├── .gitignore                         # Git ignore principal
└── README.md                          # README principal
```

## 🔄 Plan de Migración

### Opción Recomendada: Reorganización Manual

#### Paso 1: Backup

```bash
# Crear backup del proyecto actual
cd H:\Proyectos
7z a signature-router-backup.7z signature-router\
```

#### Paso 2: Crear Nueva Estructura

```bash
cd H:\Proyectos\signature-router

# Crear carpeta del servicio
mkdir svc-signature-router
```

#### Paso 3: Mover Archivos del Backend

```powershell
# Mover archivos principales de Maven
Move-Item pom.xml svc-signature-router\
Move-Item src svc-signature-router\
Move-Item target svc-signature-router\ -ErrorAction SilentlyContinue
Move-Item mvnw svc-signature-router\
Move-Item mvnw.cmd svc-signature-router\
Move-Item lombok.config svc-signature-router\ -ErrorAction SilentlyContinue

# Archivos de configuración Maven
Move-Item .mvn svc-signature-router\ -ErrorAction SilentlyContinue
```

#### Paso 4: Verificar

```bash
# Verificar que el backend funciona
cd svc-signature-router
./mvnw spring-boot:run

# Verificar que el frontend funciona
cd ../app-signature-router-admin
npm install
npm run dev
```

#### Paso 5: Actualizar Git

```bash
# En la raíz del proyecto
git add -A
git commit -m "refactor: reorganizar proyecto en monorepo (svc + app)"
```

## ⚙️ Actualización de Configuraciones

### 1. Scripts de desarrollo

Crea en la raíz un `package.json` para gestionar ambos proyectos:

```json
{
  "name": "signature-router-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm:dev:*\"",
    "dev:backend": "cd svc-signature-router && ./mvnw spring-boot:run",
    "dev:frontend": "cd app-signature-router-admin && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd svc-signature-router && ./mvnw clean package",
    "build:frontend": "cd app-signature-router-admin && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### 2. Docker Compose (opcional)

```yaml
version: '3.8'

services:
  backend:
    build: ./svc-signature-router
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
  
  frontend:
    build: ./app-signature-router-admin
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:8080
    depends_on:
      - backend
```

### 3. Actualizar paths en documentación

Buscar y reemplazar en todos los docs:

- `src/main` → `svc-signature-router/src/main`
- `pom.xml` → `svc-signature-router/pom.xml`

## 🎯 Verificación Post-Migración

### Checklist

- [ ] Backend compila: `cd svc-signature-router && ./mvnw clean package`
- [ ] Backend ejecuta: `./mvnw spring-boot:run`
- [ ] Frontend compila: `cd app-signature-router-admin && npm run build`
- [ ] Frontend ejecuta: `npm run dev`
- [ ] Frontend conecta con backend: Verificar en http://localhost:3001
- [ ] Tests backend pasan: `cd svc-signature-router && ./mvnw test`
- [ ] Git history intacto: `git log`

## 🚨 Problemas Comunes

### Backend no compila después del movimiento

```bash
cd svc-signature-router
./mvnw clean install -U
```

### Frontend no encuentra el backend

Verificar `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Git history perdido

Si usaste `Move-Item` en lugar de `git mv`, el history se mantiene igualmente.

## 📚 Recursos

- [Maven Multi-Module Projects](https://maven.apache.org/guides/mini/guide-multiple-modules.html)
- [Next.js Monorepo](https://nextjs.org/docs/app/building-your-application/deploying)
- [Spring Boot CORS](https://spring.io/guides/gs/rest-service-cors/)

---

**¡Migración completada!** Ahora tienes una estructura limpia y profesional tipo monorepo.

