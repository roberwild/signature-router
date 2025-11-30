# 🔄 Guía: Mock Data vs Backend Real

Esta guía explica cómo alternar entre datos mock y backend real en el Admin Panel.

## 🎯 Objetivo

El sistema permite trabajar en **dos modos**:

1. **Mock Mode** 🎭 - Datos simulados, no requiere backend (ideal para demos)
2. **Real Mode** 🌐 - Conecta con el backend Spring Boot (datos reales)

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local - Desarrollo con Mock Data
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_MOCK_DELAY=500
NEXT_PUBLIC_DEBUG=true
```

O para usar backend real:

```bash
# .env.local - Desarrollo con Backend Real
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_DEBUG=true
```

## 🚀 Scripts NPM

### Modo Mock (sin backend)

```bash
# Desarrollo con mock data
npm run dev:mock

# Build con mock data
npm run build:mock
```

### Modo Real (con backend)

```bash
# Desarrollo con backend real
npm run dev:real

# Build con backend real
npm run build:real
```

### Modo Default

```bash
# Usa el valor de .env.local
npm run dev
npm run build
```

## 📁 Estructura del Código

```
lib/
├── config.ts                 # Configuración y feature flags
├── api/
│   ├── types.ts              # IApiClient interface + tipos
│   ├── mock-client.ts        # MockApiClient (datos simulados)
│   ├── real-client.ts        # RealApiClient (backend real)
│   ├── client.ts             # Factory pattern (selección automática)
│   └── mock-data.ts          # Fixtures de datos mock
```

## 🎨 Uso en Componentes

Los componentes **NO necesitan cambiar** para alternar entre mock/real:

```typescript
// hooks/use-dashboard.ts
import { apiClient } from '@/lib/api/client';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiClient.getDashboardMetrics(), // ← Mock o Real automático
  });
}
```

```typescript
// app/admin/page.tsx
'use client';

import { useDashboard } from '@/hooks/use-dashboard';

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  
  // El componente NO SABE si usa mock o real
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Total: {data?.overview.totalSignatures24h}</h1>
    </div>
  );
}
```

## ✅ Ventajas

| Característica | Mock Mode 🎭 | Real Mode 🌐 |
|----------------|--------------|--------------|
| Requiere backend | ❌ No | ✅ Sí |
| Demos rápidas | ✅ Ideal | ⚠️ Requiere setup |
| Datos realistas | ✅ Simulados | ✅ Reales |
| Desarrollo offline | ✅ Posible | ❌ Imposible |
| Testing E2E | ✅ Consistente | ⚠️ Variable |
| Latencia simulada | ✅ 500ms configurable | 🌐 Real |
| Cambio de modo | 🔄 Variable de entorno | 🔄 Variable de entorno |

## 🧪 Testing

### Mock Mode
```bash
NEXT_PUBLIC_USE_MOCK_DATA=true npm run test
```

### Real Mode
```bash
NEXT_PUBLIC_USE_MOCK_DATA=false npm run test
```

## 🔍 Debug

Cuando `NEXT_PUBLIC_DEBUG=true`, verás logs en consola:

### Mock Mode
```
🎭 Using MOCK API Client
🎭 [MOCK] GET /api/v1/admin/dashboard/metrics
```

### Real Mode
```
🌐 Using REAL API Client
🌐 [REAL] GET /admin/dashboard/metrics
```

## 📊 Datos Mock Disponibles

| Endpoint | Mock Data |
|----------|-----------|
| `/admin/dashboard/metrics` | ✅ Completo |
| `/admin/providers` | ✅ 4 providers |
| `/admin/signatures` | ✅ 150 registros |
| `/admin/metrics` | ✅ Timeline 7 días |
| `/admin/security/overview` | ✅ Datos de ejemplo |
| `/admin/alerts` | ✅ 4 alertas |
| `/admin/users` | ✅ 4 usuarios |
| `/admin/rules` | ✅ 5 reglas |

## 🚨 Troubleshooting

### Problema: "Cannot read property of undefined"
**Solución:** Verifica que el backend esté levantado si usas Real Mode

### Problema: "CORS error"
**Solución:** Configura CORS en Spring Boot:
```java
@CrossOrigin(origins = "http://localhost:3001")
```

### Problema: "404 Not Found"
**Solución:** Verifica que el endpoint exista en el backend

### Problema: Mock data no cambia
**Solución:** Reinicia el servidor de desarrollo (`npm run dev`)

## 📝 Migración Incremental

### Fase 1: Todo Mock (Actual)
```typescript
NEXT_PUBLIC_USE_MOCK_DATA=true
```
✅ 8/8 pantallas funcionando con mock

### Fase 2: Endpoints Prioritarios
```typescript
NEXT_PUBLIC_USE_MOCK_DATA=false
```
- Implementar backend para Dashboard, Signatures, Providers
- Resto sigue con mock

### Fase 3: Migración Completa
```typescript
NEXT_PUBLIC_USE_MOCK_DATA=false
```
- Todos los endpoints implementados
- Mock solo para testing

## 🎯 Próximos Pasos

### Story 12.1: Dashboard Metrics Endpoint
- [ ] Crear `DashboardMetricsController` en backend
- [ ] Implementar `GetDashboardMetricsUseCase`
- [ ] Integrar con frontend (ya listo)

### Story 12.2: Admin Signatures
- [ ] Crear `AdminSignatureController`
- [ ] Agregar filtros (status, channel, dates)
- [ ] Paginación

### Story 12.3: Providers Read-Only
- [ ] Crear `ProvidersController`
- [ ] Listar providers configurados
- [ ] Health status

---

**Autor:** Epic 12 Team  
**Fecha:** 2025-11-30  
**Versión:** 1.0  
**Status:** ✅ Mock/Real Toggle Implementado

