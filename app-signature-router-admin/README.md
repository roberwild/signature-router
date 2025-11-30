# 🎯 Signature Router Admin Panel

Panel de administración moderna para el sistema Signature Router con diseño inspirado en Singular Bank.

## 🚀 Características

### Páginas Implementadas

- ✅ **Dashboard Principal** - Métricas en tiempo real del sistema
- ✅ **Reglas de Routing** - Gestión completa de reglas SpEL con drag & drop
- ✅ **Monitoreo de Firmas** - Seguimiento en tiempo real de solicitudes
- ✅ **Proveedores** - Estado de salud y métricas de cada proveedor
- ✅ **Métricas Avanzadas** - Análisis de rendimiento (P50, P95, P99, SLO)

### Componentes UI

- 🎨 Diseño Singular Bank (verde corporativo #00a859)
- 📊 Cards con métricas y estadísticas
- 🔄 Tablas interactivas con filtros y búsqueda
- 🎯 Badges de estado con colores semánticos
- 📈 Progress bars y visualizaciones
- 🔔 Sistema de notificaciones
- 🧭 Sidebar colapsable de navegación

## 📦 Instalación

```bash
# Instalar dependencias
npm install
```

## 🛠️ Desarrollo

### 🔄 Mock Data vs Backend Real

El admin panel puede funcionar en **dos modos**:

#### Modo Mock 🎭 (Sin Backend)
```bash
npm run dev:mock
```
- ✅ No requiere backend Spring Boot
- ✅ Ideal para demos y desarrollo frontend
- ✅ Datos simulados realistas

#### Modo Real 🌐 (Con Backend)
```bash
npm run dev:real
```
- ✅ Conecta con backend Spring Boot
- ✅ Datos reales del sistema
- ⚠️ Requiere backend levantado en `localhost:8080`

#### Modo Default
```bash
npm run dev
```
Usa el valor configurado en `.env.local`

### Variables de Entorno

Crea un archivo `.env.local`:

```env
# Mock Data Toggle (true = sin backend, false = con backend)
NEXT_PUBLIC_USE_MOCK_DATA=true

# API Configuration (cuando use backend real)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_API_TIMEOUT=10000

# Mock Configuration
NEXT_PUBLIC_MOCK_DELAY=500

# Debug
NEXT_PUBLIC_DEBUG=true
```

📖 **Guía Completa:** Ver [MOCK-VS-REAL-GUIDE.md](./MOCK-VS-REAL-GUIDE.md)

## 🏗️ Construir para Producción

```bash
# Build con mock data (para demos)
npm run build:mock

# Build con backend real (para producción)
npm run build:real

# Iniciar en modo producción
npm run start
```

## 🎨 Stack Tecnológico

- **Framework:** Next.js 15.2.1 (App Router)
- **React:** 19.0.0
- **TypeScript:** 5.3.3
- **Estilos:** Tailwind CSS 3.4.17
- **Componentes UI:** Shadcn UI (Radix UI primitives)
- **Iconos:** Lucide React 0.477.0
- **Animaciones:** Framer Motion 12.4.10
- **Formularios:** React Hook Form 7.54.2
- **Validación:** Zod 3.24.2
- **Autenticación:** NextAuth 5.0.0-beta.25

## 📁 Estructura del Proyecto

```
app-signature-router-admin/
├── app/
│   ├── admin/                 # Rutas del admin panel
│   │   ├── layout.tsx         # Layout con sidebar
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── rules/             # Gestión de reglas
│   │   ├── signatures/        # Monitoreo de firmas
│   │   ├── providers/         # Gestión de proveedores
│   │   ├── metrics/           # Métricas avanzadas
│   │   ├── security/          # Seguridad y auditoría
│   │   ├── alerts/            # Alertas del sistema
│   │   └── users/             # Gestión de usuarios
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Página principal (redirige a /admin)
│   └── globals.css            # Estilos globales + tema Singular Bank
├── components/
│   ├── admin/                 # Componentes específicos del admin
│   │   ├── admin-page-title.tsx
│   │   ├── admin-sidebar.tsx
│   │   └── metric-card.tsx
│   └── ui/                    # Componentes UI de Shadcn
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── table.tsx
│       └── ...
├── lib/
│   ├── config.ts              # Configuración (feature flags)
│   ├── api/
│   │   ├── types.ts           # IApiClient interface + tipos
│   │   ├── mock-client.ts     # Mock API (datos simulados)
│   │   ├── real-client.ts     # Real API (backend Spring Boot)
│   │   ├── client.ts          # Factory (selección mock/real)
│   │   └── mock-data.ts       # Fixtures de datos mock
│   ├── api.ts                 # Cliente API legacy (deprecated)
│   └── utils.ts               # Utilidades (cn, etc.)
├── MOCK-VS-REAL-GUIDE.md      # Guía Mock vs Real
├── package.json
├── tailwind.config.ts         # Configuración de Tailwind + colores Singular
├── tsconfig.json
└── README.md
```

## 🔌 Integración con Backend

El frontend se conecta automáticamente con el backend Spring Boot en `http://localhost:8080/api/v1`.

### Endpoints Principales

```typescript
// Firmas
GET    /api/v1/signatures
GET    /api/v1/signatures/{id}

// Reglas de Routing
GET    /api/v1/routing-rules
POST   /api/v1/routing-rules
PUT    /api/v1/routing-rules/{id}
DELETE /api/v1/routing-rules/{id}
PATCH  /api/v1/routing-rules/{id}/toggle

// Proveedores
GET    /api/v1/providers
GET    /api/v1/providers/{id}/health

// Métricas
GET    /api/v1/metrics
GET    /api/v1/metrics/channels
GET    /api/v1/metrics/performance
```

## 🎨 Tema Singular Bank

El diseño sigue la identidad visual de Singular Bank:

- **Color Primario:** #00a859 (verde corporativo)
- **Tipografía:** Inter (Google Fonts)
- **Estilo:** Minimalista, limpio, profesional
- **Componentes:** Cards con sombras suaves, borders sutiles
- **Badges:** Colores semánticos para estados

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Modo default (según .env.local)
npm run dev:mock     # Modo mock (sin backend)
npm run dev:real     # Modo real (con backend)

# Producción
npm run build        # Build default
npm run build:mock   # Build con mock data
npm run build:real   # Build con backend real
npm run start        # Iniciar en producción

# Calidad de Código
npm run lint         # Linter
npm run lint:fix     # Fix automático de linting
npm run typecheck    # Verificación de tipos TypeScript
npm run format       # Formatear código con Prettier
npm run format:fix   # Fix automático de formato
```

## 📝 Estado del Proyecto

### ✅ Epic 6 & 7 - Frontend Completo
- ✅ 8 páginas del admin panel implementadas
- ✅ Componentes UI con diseño Singular Bank
- ✅ Mock data para desarrollo

### ✅ Epic 12 - Story 12.8: Mock/Backend Toggle
- ✅ Sistema de alternancia Mock/Real implementado
- ✅ Scripts npm para cambiar de modo
- ✅ Interfaz `IApiClient` para abstracción
- ✅ `MockApiClient` con datos realistas
- ✅ `RealApiClient` para conexión con backend
- ✅ Factory pattern para selección automática

### 🚧 Epic 12 - Integración Backend (Pendiente)

**Fase 1 - Endpoints Prioritarios (1-2 días):**
- [ ] Story 12.1: Dashboard Metrics Endpoint
- [ ] Story 12.2: Admin Signatures con Filtros
- [ ] Story 12.3: Providers Read-Only Endpoint

**Fase 2 - Integraciones Avanzadas (3 semanas):**
- [ ] Story 12.4: Metrics Analytics Endpoint
- [ ] Story 12.5: Keycloak Users Proxy
- [ ] Story 12.6: Keycloak Security Audit
- [ ] Story 12.7: Prometheus AlertManager Integration

## 📖 Documentación Adicional

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

## 🤝 Contribuir

Este proyecto es parte del sistema Signature Router de Singular Bank.

---

**Versión:** 1.1.0  
**Última Actualización:** 30 de Noviembre 2025  
**Status:** ✅ Frontend Completo | ✅ Mock/Real Toggle | ⏳ Backend Endpoints Pendientes

**Epic 12 Progress:**
- ✅ Story 12.8: Mock/Backend Toggle System (COMPLETO)
- 🚧 Story 12.1-12.3: Endpoints Básicos (Pendiente)
- 🚧 Story 12.4-12.7: Integraciones Avanzadas (Pendiente)
