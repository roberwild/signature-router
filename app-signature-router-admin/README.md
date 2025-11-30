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

# Instalar @radix-ui/react-switch (si es necesario)
npm install @radix-ui/react-switch
```

## 🛠️ Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001) en tu navegador.

### Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Authentication (NextAuth)
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Environment
NODE_ENV=development
```

## 🏗️ Construir para Producción

```bash
# Construir la aplicación
npm run build

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
│   │   └── metrics/           # Métricas avanzadas
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
│       ├── switch.tsx
│       └── ...
├── lib/
│   ├── api.ts                 # Cliente API para backend Spring Boot
│   └── utils.ts               # Utilidades (cn, etc.)
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
npm run dev          # Desarrollo (puerto 3001)
npm run build        # Build para producción
npm run start        # Iniciar en producción
npm run lint         # Linter
npm run lint:fix     # Fix automático de linting
npm run typecheck    # Verificación de tipos TypeScript
npm run format       # Formatear código con Prettier
npm run format:fix   # Fix automático de formato
```

## 📝 Próximos Pasos

### Epic 6 - Rule Management (Pendiente)

- [ ] Integración real con API de reglas
- [ ] Editor SpEL con syntax highlighting
- [ ] Validador SpEL en tiempo real
- [ ] Drag & drop para reordenar prioridades
- [ ] Historial de auditoría de cambios

### Epic 7 - Monitoring & Ops (Pendiente)

- [ ] Gráficos interactivos con Recharts
- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Integración con Grafana (embed dashboards)
- [ ] Búsqueda avanzada de firmas
- [ ] Exportación de datos (CSV, Excel)
- [ ] Sistema de alertas configurables

## 📖 Documentación Adicional

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

## 🤝 Contribuir

Este proyecto es parte del sistema Signature Router de Singular Bank.

---

**Versión:** 1.0.0  
**Última Actualización:** 29 de Noviembre 2025  
**Status:** ✅ Frontend Base Implementado | ⏳ Integración con Backend Pendiente
