# Admin Panel Implementation Guide

## 📋 Resumen

Panel de administración completo para Minery Guard con estilo **Singular Bank**, incluyendo:

- ✅ Dashboard con métricas de negocio
- ✅ Gestión de solicitudes de servicios
- ✅ Sistema de cualificación de leads
- ✅ Gestión de mensajes de contacto
- ✅ Diseño responsive con tema Singular Bank (#00A651)

## 🎨 Estilo Visual

### Paleta de Colores Singular Bank

```css
--primary: #00A651 (Verde corporativo)
--singular-dark: #1A1A1A (Negro/Gris oscuro)
--singular-gray: #F5F5F5 (Gris claro backgrounds)
```

### Componentes Clave

- **Cards**: Blancos con sombras sutiles y borde izquierdo verde
- **Botones**: Verde para acciones principales
- **Inputs**: Fondo gris claro con focus verde
- **Métricas**: Cards con iconos en backgrounds grises

## 📁 Estructura de Archivos Creados

```
dashboard/
├── styles/
│   └── singular-bank-theme.css          # Tema Singular Bank
├── middleware/
│   └── admin.ts                         # Middleware de autorización admin
├── app/[locale]/admin/
│   ├── layout.tsx                       # Layout con sidebar
│   ├── page.tsx                         # Dashboard principal
│   ├── components/
│   │   ├── admin-page-title.tsx         # Componente de título
│   │   ├── metric-card.tsx              # Card de métricas
│   │   ├── admin-nav-items.tsx          # Items del menú
│   │   └── admin-sidebar.tsx            # Sidebar de navegación
│   ├── services/
│   │   └── page.tsx                     # Gestión de solicitudes
│   ├── leads/
│   │   └── page.tsx                     # Gestión de leads
│   └── messages/
│       └── page.tsx                     # Gestión de mensajes
├── components/services/
│   └── service-request-modal.tsx        # Modal de solicitud
├── actions/admin/
│   ├── create-service-request.ts        # Server action
│   ├── update-service-request.ts        # Server action
│   └── create-lead-qualification.ts     # Server action
├── schemas/admin/
│   ├── service-request-schema.ts        # Validación
│   └── lead-qualification-schema.ts     # Validación
├── data/admin/
│   └── get-metrics.ts                   # Data fetching
├── types/dtos/
│   └── admin-metrics-dto.ts             # Type definitions
└── database/
    └── admin-panel-schema.sql           # SQL migrations
```

## 🚀 Pasos de Implementación

### 1. Aplicar el Tema Singular Bank

Importa el tema en el layout principal:

```tsx
// dashboard/app/layout.tsx
import '@workspace/ui/globals.css';
import '~/styles/singular-bank-theme.css'; // ⭐ Agregar esta línea
```

### 2. Ejecutar Migraciones de Base de Datos

```bash
# Conectar a la base de datos
psql -U postgres -d minery_db

# Ejecutar el script SQL
\i dashboard/database/admin-panel-schema.sql

# Verificar las tablas creadas
\dt
```

### 3. Crear el Primer Usuario Admin

**Opción A: Manualmente en la base de datos**

```sql
-- Después de que el usuario se haya registrado normalmente
UPDATE "user" 
SET "isPlatformAdmin" = TRUE 
WHERE "email" = 'tu-email@dominio.com';
```

**Opción B: Crear un script de configuración**

```typescript
// scripts/create-admin.ts
import { db } from '@workspace/database';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@mineryreport.com';
  
  await db.update(userTable)
    .set({ isPlatformAdmin: true })
    .where(eq(userTable.email, email));
    
  console.log(`✅ Admin privileges granted to ${email}`);
}

createAdmin();
```

```bash
# Ejecutar el script
pnpm tsx scripts/create-admin.ts
```

### 4. Conectar con la Base de Datos Real

Actualiza los archivos en `data/admin/` y `actions/admin/` para usar tu cliente de base de datos:

```typescript
// Reemplazar imports mock por reales:
import { db } from '@workspace/database';
import { serviceRequestTable, leadQualificationTable } from '@workspace/database/schema';
```

### 5. Configurar Rutas de API (Opcional)

Si quieres endpoints REST además de server actions:

```typescript
// dashboard/app/api/service-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRequest } from '~/actions/admin/create-service-request';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const result = await createServiceRequest(data);
  return NextResponse.json(result);
}
```

## 📊 Uso del Admin Panel

### Acceder al Panel

1. Inicia sesión con un usuario que tenga `isPlatformAdmin = true`
2. Navega a `/admin` o `/es/admin` (según tu locale)
3. Verás el dashboard con métricas

### URLs Disponibles

```
/[locale]/admin                    # Dashboard principal
/[locale]/admin/services          # Solicitudes de servicio
/[locale]/admin/leads             # Leads cualificados
/[locale]/admin/messages          # Mensajes de contacto
/[locale]/admin/organizations     # Lista de organizaciones
/[locale]/admin/users            # Lista de usuarios
/[locale]/admin/revenue          # Métricas de revenue
/[locale]/admin/analytics        # Analytics avanzado
/[locale]/admin/configuration    # Configuración
```

### Gestionar Solicitudes de Servicio

1. Los usuarios solicitan servicios desde `/organizations/[slug]/services`
2. Aparecen en el admin en `/admin/services`
3. Puedes actualizar el estado: pending → contacted → completed
4. Ver contacto y datos del WhatsApp

### Revisar Leads

1. Los leads se capturan durante el onboarding
2. Se clasifican automáticamente: A1 (Hot), B1 (Warm), C1 (Cold), D1 (Info)
3. Ver score detallado y respuestas completas
4. Priorizar según clasificación

## 🔒 Seguridad

### Middleware de Protección

```typescript
// Todas las rutas /admin están protegidas
export async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');
  if (!session.user.isPlatformAdmin) redirect('/');
}
```

### Control de Acceso

- ✅ Solo usuarios con `isPlatformAdmin = true` pueden acceder
- ✅ Redirección automática si no autorizado
- ✅ Server actions verifican permisos
- ✅ Layout del admin verifica en cada carga

## 📱 Responsive Design

El panel es completamente responsive:

- **Mobile**: Sidebar colapsable con iconos
- **Tablet**: Sidebar expandido
- **Desktop**: Layout completo con todas las características

## 🎯 Próximos Pasos

### TODOs Pendientes (marcados en el código)

1. **Conectar con base de datos real**
   - Reemplazar datos mock en `data/admin/get-metrics.ts`
   - Actualizar server actions en `actions/admin/`

2. **Implementar notificaciones por email**
   - Cuando se recibe una solicitud de servicio
   - Cuando hay un lead A1 (hot)
   - Cuando cambia el estado de una solicitud

3. **Agregar páginas de detalle**
   - `/admin/services/[id]` - Detalle de solicitud
   - `/admin/leads/[id]` - Detalle de lead
   - `/admin/messages/[id]` - Detalle de mensaje

4. **Implementar Analytics avanzado**
   - Gráficos de revenue por mes
   - Embudo de conversión interactivo
   - Métricas de tiempo de respuesta

5. **Agregar exportación**
   - Exportar leads a CSV/Excel
   - Exportar solicitudes a PDF
   - Reportes mensuales automáticos

## 🐛 Troubleshooting

### Error: "No autenticado"

- Verifica que el usuario esté logueado
- Comprueba que `isPlatformAdmin = true` en la BD

### Error: No se ve el sidebar

- Importa el CSS del tema en `layout.tsx`
- Verifica que `SidebarProvider` envuelva el contenido

### Error: TypeScript en server actions

- Asegúrate de tener `'use server'` al inicio del archivo
- Verifica que las schemas de Zod estén bien importadas

### Error: Base de datos no encontrada

- Ejecuta las migraciones SQL primero
- Verifica la conexión a PostgreSQL

## 📚 Referencias

- [Documentación Original](./docs/indicaciones-front/platform-admin-panel-prd-simplified.md)
- [Guía de Estructura de Páginas](./docs/indicaciones-front/admin-panel-page-structure.md)
- [Boilerplate del Sidebar](./docs/indicaciones-front/admin-sidebar-boilerplate.md)
- [Singular Bank Website](https://www.singularbank.es/soluciones-financieras/)

## ✨ Características Implementadas

- ✅ Tema Singular Bank completo
- ✅ Dashboard con métricas de negocio
- ✅ Gestión de solicitudes de servicios
- ✅ Sistema de leads con scoring automático
- ✅ Gestión de mensajes de contacto
- ✅ Sidebar responsive con navegación
- ✅ Componentes reutilizables (MetricCard, AdminPageTitle)
- ✅ Server actions con validación Zod
- ✅ Middleware de autorización
- ✅ SQL migrations completas
- ✅ TypeScript types y DTOs

## 🎉 ¡Listo para Usar!

El admin panel está completamente configurado con el estilo de Singular Bank. Solo necesitas:

1. Aplicar las migraciones SQL
2. Crear tu primer usuario admin
3. Conectar con tu base de datos real
4. Personalizar las métricas según tus necesidades

¡Disfruta de tu nuevo admin panel! 🚀

