# 📋 Plan de Separación de Repositorios - 11 Diciembre 2025

**Tipo:** Reorganización de Infraestructura  
**Razón:** Cumplimiento de estándares corporativos de Singular Bank (repositorios separados por componente)  
**Riesgo:** 🔴 ALTO (pérdida potencial de historial Git, referencias rotas)  
**Tiempo Estimado:** 3-4 horas

---

## 🎯 Objetivo

Separar el monorepo actual en dos repositorios independientes siguiendo el estándar de nombrado corporativo de Singular Bank:

1. **`svc-signature-routing-process-java`** - Backend Java/Spring Boot (microservicio de proceso)
2. **`app-signature-router-admin-web-react`** - Frontend Next.js/React (aplicación web admin)

---

## 📊 Estado Actual

### Monorepo Actual: `signature-router`

```
signature-router/
├── app-signature-router-admin-web-react/      ← Frontend Next.js (a mover)
├── svc-signature-router/            ← Backend Spring Boot (a mover)
├── docs/                             ← Documentación compartida (a dividir)
├── assets/                           ← Assets compartidos (mantener en ambos?)
├── README.md                         ← Root README (a dividir)
├── CHANGELOG.md                      ← Changelog (a dividir por fecha)
└── .git/                             ← Historial completo (a preservar)
```

**Remote Actual:**
```
origin: https://github.com/roberwild/signature-router.git
Branch: main
Status: clean (no cambios pendientes)
```

---

## 🏗️ Estructura Objetivo

### Repositorio 1: `svc-signature-routing-process-java`

```
svc-signature-routing-process-java/
├── src/                              ← Código Java (desde svc-signature-router/src)
├── docker/                           ← Docker configs
├── keycloak/                         ← Keycloak configs
├── observability/                    ← Prometheus, Grafana, Jaeger
├── scripts/                          ← Scripts de setup
├── postman/                          ← Colecciones Postman
├── vault/                            ← Vault configs
├── docs/                             ← Docs específicas de backend
│   ├── architecture/                 ← ADRs, diagramas
│   ├── api/                          ← API docs
│   └── setup/                        ← Setup guides
├── pom.xml                           ← Maven config
├── mvnw, mvnw.cmd                    ← Maven wrapper
├── docker-compose.yml                ← Docker compose
├── README.md                         ← Backend README
├── CHANGELOG.md                      ← Backend changelog
├── SECURITY.md                       ← Security policy
├── QUICK-START.md                    ← Quick start guide
└── .gitignore                        ← Backend gitignore
```

**Remote Nuevo:**
```
origin: https://github.com/roberwild/svc-signature-routing-process-java.git
```

### Repositorio 2: `app-signature-router-admin-web-react`

```
app-signature-router-admin-web-react/
├── app/                              ← Next.js app directory
├── components/                       ← React components
├── lib/                              ← Utilities & API client
├── public/                           ← Static assets
├── types/                            ← TypeScript types
├── docs/                             ← Docs específicas de frontend
│   ├── components/                   ← Component docs
│   ├── guides/                       ← User guides
│   └── integration/                  ← Integration docs
├── package.json                      ← NPM dependencies
├── next.config.ts                    ← Next.js config
├── tailwind.config.ts                ← Tailwind config
├── tsconfig.json                     ← TypeScript config
├── .env.local.example                ← Env vars template
├── README.md                         ← Frontend README
├── CHANGELOG.md                      ← Frontend changelog
├── QUICK-START.md                    ← Quick start guide
└── .gitignore                        ← Frontend gitignore
```

**Remote Nuevo:**
```
origin: https://github.com/roberwild/app-signature-router-admin-web-react.git
```

---

## 🏷️ Cumplimiento del Estándar Corporativo de Nombrado

### Patrón Identificado en la Organización

**Análisis de repositorios existentes:**

| Tipo | Patrón | Ejemplos |
|------|--------|----------|
| **Frontend** | `app-<dominio>-web-react` | `app-onboarding-singular-web-react`<br>`app-asesoramiento-web-react`<br>`app-customer-management-web-react` |
| **Backend Process** | `svc-<dominio>-process-java` | `svc-onboarding-process-java`<br>`svc-mifid-process-java` |
| **Backend Experience** | `svc-<dominio>-experience-mule` | `svc-financial-advisory-experience-mule`<br>`svc-web-experience-mule` |
| **Backend System** | `svc-<dominio>-system-mule` | `svc-core-customer-system-mule`<br>`svc-notification-system-mule` |
| **Librerías** | `lib-<nombre>-java` | `lib-jwt-security-java`<br>`lib-rest-adapter-java` |

### Justificación de Nombres Elegidos

#### Backend: `svc-signature-routing-process-java`

- ✅ **`svc-`**: Prefijo corporativo para microservicios
- ✅ **`signature-routing`**: Dominio de negocio (orquestación de firmas)
- ✅ **`process`**: Capa de proceso (orquesta multi-provider, no es experience API ni system)
- ✅ **`-java`**: Sufijo de tecnología (Spring Boot 3.2 + Java 21)

**Alineado con:**
- `svc-onboarding-process-java` (proceso de onboarding)
- `svc-mifid-process-java` (proceso de test MiFID)

#### Frontend: `app-signature-router-admin-web-react`

- ✅ **`app-`**: Prefijo corporativo para aplicaciones web
- ✅ **`app-signature-router-admin-web-react`**: Nombre descriptivo del portal de administración
- ✅ **`web`**: Tipo de aplicación (web, no mobile)
- ✅ **`-react`**: Sufijo de tecnología (Next.js 15 + React 19)

**Alineado con:**
- `app-onboarding-singular-web-react` (portal web de onboarding)
- `app-customer-management-web-react` (portal de gestión de clientes)

### Cumplimiento 100% del Estándar ✅

| Aspecto | Status | Detalle |
|---------|--------|---------|
| **Prefijo correcto** | ✅ | `svc-` para backend, `app-` para frontend |
| **Kebab-case** | ✅ | Todo en minúsculas con guiones |
| **Dominio claro** | ✅ | `signature-routing` / `app-signature-router-admin-web-react` |
| **Capa identificada** | ✅ | `process` para backend |
| **Tecnología sufijo** | ✅ | `-java` y `-react` |
| **Longitud razonable** | ✅ | Similar a otros repos corporativos |

---

## 📁 Distribución de Documentación

### Documentación Backend (`svc-signature-routing-process-java/docs/`)

**Architecture:**
- ✅ `architecture/` completo (ADRs, diagramas, validation reports)
- ✅ `api/` completo (OpenAPI specs, Postman collections)
- ✅ `setup/` completo (installation, configuration guides)

**Epics & Planning:**
- ✅ `epics/` - Epic 1-5, 8-10, 13-17 (backend epics)
- ⚠️ `epics/` - Epic 6-7 (frontend epics) → Mover a frontend
- ⚠️ `epics/` - Epic 12 (integración) → Duplicar en ambos

**Sprint Artifacts:**
- ✅ `sprint-artifacts/` - Tech specs backend
- ⚠️ Separar por epic

**Executive:**
- ✅ `executive/` - Informes ejecutivos (mantener en backend)

**Frontend-specific docs:**
- ❌ `frontend/` completo → Mover a frontend repo

### Documentación Frontend (`app-signature-router-admin-web-react/docs/`)

**Component Docs:**
- ✅ Todos los `.md` de `app-signature-router-admin-web-react/`
- ✅ Guides de setup (Keycloak, auth, etc.)

**Epics:**
- ✅ Epic 6: Admin Portal - Rule Management
- ✅ Epic 7: Admin Portal - Monitoring & Ops
- ⚠️ Epic 12: Frontend-Backend Integration (compartido)

**Integration:**
- ✅ Guías de integración con backend
- ✅ API client documentation

### Documentación Compartida (duplicar en ambos)

- 📋 `TAREAS-PENDIENTES.md` (filtrar por componente)
- 📋 `bmm-workflow-status.yaml` (split por fase)
- 📋 `CHANGELOG.md` (split por fecha/componente)

---

## 🔄 Estrategias de Separación

### Opción A: Git Filter-Repo (RECOMENDADA) 🟢

**Ventajas:**
- ✅ Preserva historial Git completo
- ✅ Mantiene commits, branches, tags
- ✅ Herramienta oficial recomendada por Git
- ✅ Más limpio que `git filter-branch`

**Desventajas:**
- ⚠️ Requiere instalación de `git-filter-repo`
- ⚠️ Proceso más complejo

**Pasos:**
1. Clonar repo 2 veces (uno para backend, otro para frontend)
2. Usar `git-filter-repo --path` para mantener solo directorios relevantes
3. Limpiar referencias y remotes
4. Crear nuevos repos en GitHub
5. Push a nuevos remotes

### Opción B: Copia Simple (MÁS RÁPIDA) 🟡

**Ventajas:**
- ✅ Más simple y rápida
- ✅ No requiere herramientas adicionales
- ✅ Menor riesgo de error

**Desventajas:**
- ❌ Pierde historial Git específico de cada componente
- ❌ Historial mixto (commits de backend y frontend juntos)

**Pasos:**
1. Copiar `svc-signature-router/` a nuevo directorio `svc-signature-routing-process-java/`
2. Copiar `app-signature-router-admin-web-react/` a nuevo directorio `app-signature-router-admin-web-react/`
3. Inicializar Git en cada uno
4. Hacer commit inicial
5. Crear repos en GitHub
6. Push a remotes

### Opción C: Subtree Split (INTERMEDIA) 🟡

**Ventajas:**
- ✅ Preserva historial relevante
- ✅ Usa comandos Git nativos
- ✅ No requiere herramientas externas

**Desventajas:**
- ⚠️ Más lento que copia simple
- ⚠️ Puede ser confuso

**Pasos:**
1. Usar `git subtree split` para extraer cada subdirectorio
2. Crear nuevos repos
3. Push de branches extraídos

---

## ✅ Estrategia Recomendada: Opción B (Copia Simple)

**Razón:** Balance entre simplicidad, velocidad y bajo riesgo para un proyecto en desarrollo activo.

**Consideraciones:**
- El historial mixto actual no es crítico (proyecto joven)
- Los commits futuros estarán limpios y separados
- Menor riesgo de corrupción de repo
- Más fácil de revertir si algo sale mal

---

## 📝 Plan de Ejecución Detallado

### Fase 0: Preparación (15 min)

#### 0.1. Backup del Repositorio Actual
```bash
# Crear backup completo
cd C:\Proyectos
tar -czf signature-router-backup-2025-12-11.tar.gz signature-router/

# O usar Git bundle
cd signature-router
git bundle create ../signature-router-backup.bundle --all
```

#### 0.2. Verificar Estado Limpio
```bash
cd C:\Proyectos\signature-router
git status
# Debe mostrar: "nothing to commit, working tree clean"
```

#### 0.3. Crear Directorios de Trabajo
```bash
mkdir C:\Proyectos\repos-nuevos
cd C:\Proyectos\repos-nuevos
```

---

### Fase 1: Crear Repositorio Backend (30 min)

#### 1.1. Copiar Backend y Documentación Relevante
```powershell
# Crear estructura backend
New-Item -ItemType Directory -Path "C:\Proyectos\repos-nuevos\svc-signature-routing-process-java"
cd C:\Proyectos\repos-nuevos\svc-signature-routing-process-java

# Copiar código backend
Copy-Item -Recurse "C:\Proyectos\signature-router\svc-signature-router\*" -Destination "." -Exclude "target","logs","*.log"

# Mover archivos de raíz a raíz del nuevo repo (no dentro de subdirectorio)
Move-Item -Path ".\src" -Destination ".\"
Move-Item -Path ".\docker" -Destination ".\"
Move-Item -Path ".\keycloak" -Destination ".\"
# ... etc

# Copiar docs de backend
New-Item -ItemType Directory -Path ".\docs"
Copy-Item -Recurse "C:\Proyectos\signature-router\docs\architecture" -Destination ".\docs\"
Copy-Item -Recurse "C:\Proyectos\signature-router\docs\api" -Destination ".\docs\"
Copy-Item -Recurse "C:\Proyectos\signature-router\docs\setup" -Destination ".\docs\"
Copy-Item -Recurse "C:\Proyectos\signature-router\docs\executive" -Destination ".\docs\"

# Copiar epics de backend (filtrar Epic 6-7)
New-Item -ItemType Directory -Path ".\docs\epics"
Copy-Item "C:\Proyectos\signature-router\docs\epics\epic-1-*.md" -Destination ".\docs\epics\"
Copy-Item "C:\Proyectos\signature-router\docs\epics\epic-2-*.md" -Destination ".\docs\epics\"
# ... Epic 1-5, 8-10, 13-17

# Copiar sprint artifacts (filtrar)
# Crear README.md específico de backend
```

#### 1.2. Crear README.md del Backend
```bash
# Crear README.md adaptado (ver template abajo)
```

#### 1.3. Actualizar Referencias en Documentación
```bash
# Buscar y reemplazar referencias al frontend
# Ejemplo: "Ver app-signature-router-admin-web-react/" → "Frontend en: https://github.com/roberwild/app-signature-router-admin-web-react"
```

#### 1.4. Inicializar Git
```bash
cd C:\Proyectos\repos-nuevos\svc-signature-routing-process-java
git init
git add .
git commit -m "chore: Initialize backend repository

Separated from monorepo signature-router
Source: https://github.com/roberwild/signature-router
Date: 2025-12-11

Components included:
- Spring Boot 3.2.0 + Java 21 backend
- Hexagonal Architecture (Domain-Driven Design)
- Multi-provider signature routing engine
- PostgreSQL persistence
- Kafka event streaming
- OAuth2 + Keycloak security
- Prometheus + Grafana observability
- Circuit breaker + retry patterns
- 375 tests passing (25% coverage)
- ArchUnit architectural validations

Package: com.singularbank.signature.routing
Port: 8080
Tech Stack: Spring Boot, PostgreSQL, Kafka, Vault, Keycloak"
```

---

### Fase 2: Crear Repositorio Frontend (30 min)

#### 2.1. Copiar Frontend y Documentación Relevante
```powershell
# Crear estructura frontend
New-Item -ItemType Directory -Path "C:\Proyectos\repos-nuevos\app-signature-router-admin-web-react"
cd C:\Proyectos\repos-nuevos\app-signature-router-admin-web-react

# Copiar código frontend (TODO el directorio)
Copy-Item -Recurse "C:\Proyectos\signature-router\app-signature-router-admin-web-react\*" -Destination "." -Exclude "node_modules",".next"

# Copiar docs de frontend
New-Item -ItemType Directory -Path ".\docs"
Copy-Item -Recurse "C:\Proyectos\signature-router\docs\frontend" -Destination ".\docs\"

# Copiar epics de frontend
New-Item -ItemType Directory -Path ".\docs\epics"
Copy-Item "C:\Proyectos\signature-router\docs\epics\epic-6-*.md" -Destination ".\docs\epics\"
Copy-Item "C:\Proyectos\signature-router\docs\epics\epic-7-*.md" -Destination ".\docs\epics\"
Copy-Item "C:\Proyectos\signature-router\docs\epics\epic-12-*.md" -Destination ".\docs\epics\"
```

#### 2.2. Crear README.md del Frontend
```bash
# Crear README.md adaptado (ver template abajo)
```

#### 2.3. Actualizar lib/api.ts con URL del Backend
```typescript
// Actualizar configuración de API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
```

#### 2.4. Inicializar Git
```bash
cd C:\Proyectos\repos-nuevos\app-signature-router-admin-web-react
git init
git add .
git commit -m "chore: Initialize frontend repository

Separated from monorepo signature-router
Source: https://github.com/roberwild/signature-router
Date: 2025-12-11

Components included:
- Next.js 15.2.1 + React 19 Admin Portal
- TypeScript 5.3.3
- Tailwind CSS 3.4.17 + Shadcn UI
- NextAuth 5.0 (Keycloak integration)
- 5 admin pages (Dashboard, Rules, Signatures, Providers, Metrics)
- Responsive design (Mobile + Desktop)
- Dark mode support
- API client with mock/real toggle

Features:
- Routing rules management (CRUD)
- Signature requests monitoring
- Provider health dashboard
- Advanced metrics visualization
- Real-time activity feed
- Keycloak OAuth2 authentication

Backend API: https://github.com/roberwild/svc-signature-routing-process-java
Port: 3000"
```

---

### Fase 3: Crear Repositorios en GitHub (15 min)

#### 3.1. Opción A: Via Web UI (RECOMENDADA)

1. **Ir a GitHub:** https://github.com/roberwild
2. **Crear Repo Backend:**
   - Name: `svc-signature-routing-process-java`
   - Description: "🔐 Signature Router Backend - Multi-Provider Signature Orchestration (Spring Boot 3.2 + Java 21)"
   - Visibility: Private (o Public según preferencia)
   - ❌ NO inicializar con README, .gitignore, ni license
3. **Crear Repo Frontend:**
   - Name: `app-signature-router-admin-web-react`
   - Description: "🎨 Signature Router Admin Portal - Next.js 15 + React 19 Admin Dashboard"
   - Visibility: Private (o Public según preferencia)
   - ❌ NO inicializar con README, .gitignore, ni license

#### 3.2. Opción B: Via GitHub CLI
```bash
# Instalar GitHub CLI si no está instalado
# https://cli.github.com/

# Autenticarse
gh auth login

# Crear repos
gh repo create roberwild/svc-signature-routing-process-java --private --source=. --remote=origin --description="Signature Router Backend - Spring Boot 3.2 + Java 21"

gh repo create roberwild/app-signature-router-admin-web-react --private --source=. --remote=origin --description="Signature Router Admin Portal - Next.js 15 + React 19"
```

---

### Fase 4: Push a GitHub (15 min)

#### 4.1. Backend
```bash
cd C:\Proyectos\repos-nuevos\svc-signature-routing-process-java
git remote add origin https://github.com/roberwild/svc-signature-routing-process-java.git
git branch -M main
git push -u origin main

# Verificar
git remote -v
git log --oneline
```

#### 4.2. Frontend
```bash
cd C:\Proyectos\repos-nuevos\app-signature-router-admin-web-react
git remote add origin https://github.com/roberwild/app-signature-router-admin-web-react.git
git branch -M main
git push -u origin main

# Verificar
git remote -v
git log --oneline
```

---

### Fase 5: Actualizar Documentación Cruzada (30 min)

#### 5.1. Backend README.md - Agregar Sección de Frontend
```markdown
## 🎨 Admin Portal (Frontend)

El Admin Portal está en un repositorio separado:

**Repository:** https://github.com/roberwild/app-signature-router-admin-web-react

**Stack:**
- Next.js 15.2.1 + React 19
- TypeScript 5.3.3
- Tailwind CSS + Shadcn UI
- NextAuth 5.0

**Pages:**
- `/admin` - Dashboard principal
- `/admin/rules` - Gestión de reglas de routing
- `/admin/signatures` - Monitoreo de solicitudes
- `/admin/providers` - Salud de proveedores
- `/admin/metrics` - Métricas avanzadas

**Quick Start:**
```bash
git clone https://github.com/roberwild/app-signature-router-admin-web-react.git
cd app-signature-router-admin-web-react
npm install
cp .env.local.example .env.local
# Configurar NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev
```
```

#### 5.2. Frontend README.md - Agregar Sección de Backend
```markdown
## 🔐 Backend API

El Backend está en un repositorio separado:

**Repository:** https://github.com/roberwild/svc-signature-routing-process-java

**Stack:**
- Spring Boot 3.2.0 + Java 21
- PostgreSQL 15
- Kafka
- Keycloak
- Prometheus + Grafana

**API Base URL:** `http://localhost:8080/api/v1`

**Endpoints Principales:**
- `GET /api/v1/routing-rules` - Listar reglas
- `POST /api/v1/signature-requests` - Crear solicitud
- `GET /api/v1/providers` - Listar proveedores
- `GET /api/v1/dashboard/metrics` - Métricas del dashboard

**Quick Start:**
```bash
git clone https://github.com/roberwild/svc-signature-routing-process-java.git
cd svc-signature-routing-process-java
# Iniciar infraestructura
docker-compose up -d postgres kafka keycloak vault
# Iniciar backend
./mvnw spring-boot:run
```

**Documentation:** [Backend README](https://github.com/roberwild/svc-signature-routing-process-java)
```

#### 5.3. Actualizar TAREAS-PENDIENTES.md en Ambos Repos

**Backend:** Mantener solo tareas de backend  
**Frontend:** Mantener solo tareas de frontend  
**Compartidas:** Epic 12 (integración) en ambos con referencias cruzadas

#### 5.4. Actualizar bmm-workflow-status.yaml

Crear versión para cada repo con referencia al otro

---

### Fase 6: Actualizar Monorepo Original (30 min)

#### Opción A: Archivar Monorepo 🟡 RECOMENDADA

```bash
cd C:\Proyectos\signature-router

# Agregar README de deprecación
echo "# ⚠️ DEPRECATED - Monorepo Archived

Este repositorio ha sido separado en dos repositorios independientes:

## 🔐 Backend (Spring Boot)
**Repository:** https://github.com/roberwild/svc-signature-routing-process-java

## 🎨 Frontend (Next.js)
**Repository:** https://github.com/roberwild/app-signature-router-admin-web-react

**Fecha de Separación:** 11 Diciembre 2025

Por favor usa los nuevos repositorios para cualquier desarrollo futuro.
" > README-DEPRECATED.md

git add README-DEPRECATED.md
git commit -m "docs: Archive monorepo - split into backend and frontend repos"
git push origin main

# En GitHub: Settings → Archive this repository
```

#### Opción B: Eliminar Monorepo (NO RECOMENDADA)

Solo si estás 100% seguro de que los nuevos repos funcionan.

#### Opción C: Mantener Monorepo como Referencia

Útil si hay branches o PRs activos que no quieres perder.

---

### Fase 7: Verificación Final (30 min)

#### 7.1. Checklist Backend

- [ ] Repo creado en GitHub: `https://github.com/roberwild/svc-signature-routing-process-java`
- [ ] Código backend copiado correctamente
- [ ] `mvnw` y `pom.xml` en raíz
- [ ] Documentación de backend incluida
- [ ] README.md actualizado con referencias al frontend
- [ ] .gitignore apropiado (Java, Maven, logs)
- [ ] Docker configs incluidos
- [ ] Scripts de setup incluidos
- [ ] Commit inicial realizado
- [ ] Push a GitHub exitoso
- [ ] Build funciona: `./mvnw clean compile`
- [ ] Tests funcionan: `./mvnw test`
- [ ] Docker compose funciona: `docker-compose up -d`

#### 7.2. Checklist Frontend

- [ ] Repo creado en GitHub: `https://github.com/roberwild/app-signature-router-admin-web-react`
- [ ] Código frontend copiado correctamente
- [ ] `package.json` y `next.config.ts` en raíz
- [ ] Documentación de frontend incluida
- [ ] README.md actualizado con referencias al backend
- [ ] .gitignore apropiado (Node, Next.js)
- [ ] `.env.local.example` incluido
- [ ] Commit inicial realizado
- [ ] Push a GitHub exitoso
- [ ] Build funciona: `npm run build`
- [ ] Dev server funciona: `npm run dev`
- [ ] API client apunta a backend correcto

#### 7.3. Checklist Documentación

- [ ] Referencias cruzadas actualizadas
- [ ] Epic 6 en frontend repo
- [ ] Epic 7 en frontend repo
- [ ] Epic 12 en ambos repos (con enlaces cruzados)
- [ ] TAREAS-PENDIENTES.md divididas por componente
- [ ] bmm-workflow-status.yaml actualizado en ambos
- [ ] CHANGELOG.md divididos por componente

#### 7.4. Checklist Monorepo Original

- [ ] README-DEPRECATED.md creado
- [ ] Commit de deprecación realizado
- [ ] Push a GitHub exitoso
- [ ] (Opcional) Repo archivado en GitHub

---

## 🚨 Plan de Rollback

Si algo sale mal durante la separación:

### Rollback Fase 1-2 (Antes de Push a GitHub)

```bash
# Simplemente eliminar directorios de trabajo
rm -rf C:\Proyectos\repos-nuevos

# El monorepo original sigue intacto
```

### Rollback Fase 3-4 (Después de Push a GitHub)

```bash
# Eliminar repos de GitHub (Settings → Delete repository)
# O via CLI:
gh repo delete roberwild/svc-signature-routing-process-java --confirm
gh repo delete roberwild/app-signature-router-admin-web-react --confirm

# Restaurar desde backup
cd C:\Proyectos
tar -xzf signature-router-backup-2025-12-11.tar.gz
```

### Rollback Fase 5-6 (Documentación)

```bash
# Revertir commits de documentación
cd C:\Proyectos\signature-router
git reset --hard HEAD~1  # Revertir último commit
git push origin main --force  # CUIDADO: Solo si no hay colaboradores
```

---

## 📋 Decisiones Pendientes

### 1. Visibilidad de Repositorios

**Opción A:** Private (ambos repos) 🔒 RECOMENDADA  
**Opción B:** Public (ambos repos) 🌍  
**Opción C:** Backend Private, Frontend Public 🔒🌍

**Recomendación:** Private para ambos (código corporativo Singular Bank)

### 2. Destino del Monorepo Original

**Opción A:** Archivar en GitHub 🟡 RECOMENDADA  
**Opción B:** Eliminar completamente 🔴  
**Opción C:** Mantener como referencia 🟢

**Recomendación:** Archivar (mantiene historial, evita confusión)

### 3. Gestión de Issues y PRs

**Opción A:** Cerrar todos en monorepo, empezar fresh 🟢 RECOMENDADA  
**Opción B:** Migrar issues manualmente 🟡  
**Opción C:** Usar GitHub issue transfer 🟢

**Recomendación:** Cerrar en monorepo, crear nuevos issues en repos apropiados

### 4. CI/CD

**Opción A:** Configurar GitHub Actions en cada repo 🟢 RECOMENDADA  
**Opción B:** Usar Jenkins/GitLab CI corporativo 🟡  
**Opción C:** Sin CI/CD inicial 🔴

**Recomendación:** GitHub Actions básico en ambos repos

---

## 🎯 Próximos Pasos (Post-Separación)

### Inmediato (mismo día)

1. ✅ Verificar builds en ambos repos
2. ✅ Actualizar workspace local de desarrollo
3. ✅ Comunicar cambio al equipo
4. ✅ Actualizar documentación en Confluence/Wiki

### Corto Plazo (1 semana)

1. ⏳ Configurar CI/CD en ambos repos
2. ⏳ Configurar branch protection rules
3. ⏳ Agregar badges de build status
4. ⏳ Crear templates de issues/PRs

### Medio Plazo (2 semanas)

1. ⏳ Configurar dependabot para security updates
2. ⏳ Configurar Sonarqube/CodeClimate
3. ⏳ Setup de environments (dev, uat, prod)
4. ⏳ Documentar flujo de deployment separado

---

## 📚 Referencias

### Guías Oficiales
- [Git Filter-Repo](https://github.com/newren/git-filter-repo)
- [GitHub: Splitting a subfolder into a new repo](https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository)
- [Monorepo to Multirepo Migration](https://medium.com/swlh/monorepo-to-multirepo-d4a5d6d6d731)

### Tools
- GitHub CLI: https://cli.github.com/
- Git Filter-Repo: https://github.com/newren/git-filter-repo

---

## ✅ Aprobación

**Fecha de Creación:** 11 Diciembre 2025  
**Autor:** AI Agent (Cursor + Claude Sonnet 4.5)  
**Status:** 📋 PENDING APPROVAL  
**Requiere Aprobación de:** Tech Lead + Product Manager

**Revisar y Aprobar Antes de Proceder:**
- [ ] Estrategia de separación (Opción A/B/C)
- [ ] Destino de monorepo original
- [ ] Visibilidad de repos (Private/Public)
- [ ] Plan de comunicación al equipo
- [ ] Backup realizado

---

**IMPORTANTE:** Este es un plan detallado. Antes de ejecutar, asegúrate de:
1. Tener backup completo del monorepo
2. Notificar al equipo
3. Programar en horario de bajo impacto
4. Tener rollback plan listo
5. Revisar todas las referencias cruzadas

**¿Proceder con la ejecución?** 🚦



