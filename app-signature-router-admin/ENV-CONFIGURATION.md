# 🔧 Configuración de Variables de Entorno

## Archivo `.env.local`

Crea un archivo `.env.local` en la raíz de `app-signature-router-admin/` con el siguiente contenido:

```bash
# ============================================
# Signature Router Admin Panel - Configuration
# ============================================

# API Configuration
# -----------------
# Modo Mock (datos de demostración sin backend)
# true  = Usar datos mock (no requiere backend corriendo) ✅ RECOMENDADO PARA DESARROLLO
# false = Conectar al backend real (requiere Spring Boot en puerto 8080)
NEXT_PUBLIC_USE_MOCK_DATA=true

# URL del backend API (solo si USE_MOCK_DATA=false)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1

# Timeout de las peticiones API (en milisegundos)
NEXT_PUBLIC_API_TIMEOUT=10000

# Mock Configuration
# ------------------
# Delay artificial para simular latencia de red en modo mock (en ms)
NEXT_PUBLIC_MOCK_DELAY=500

# Debug
# -----
# Habilitar logs de debug en la consola
NEXT_PUBLIC_DEBUG=false
```

---

## 🚀 Modos de Ejecución

### Modo 1: Mock Data (Sin Backend) - **RECOMENDADO**

**Uso:** Desarrollo frontend sin necesidad de backend corriendo

```bash
# Opción A: Usar .env.local (configurar NEXT_PUBLIC_USE_MOCK_DATA=true)
npm run dev

# Opción B: Forzar modo mock (ignora .env.local)
npm run dev:mock
```

**Características:**
- ✅ No requiere backend Spring Boot
- ✅ Datos de demostración realistas
- ✅ Todas las operaciones CRUD funcionan (en memoria)
- ✅ Ideal para desarrollo UI/UX
- ⚠️ Los cambios NO se persisten (se pierden al recargar)

---

### Modo 2: Backend Real (Con Backend)

**Uso:** Testing de integración con backend real

```bash
# Opción A: Usar .env.local (configurar NEXT_PUBLIC_USE_MOCK_DATA=false)
npm run dev

# Opción B: Forzar modo real (ignora .env.local)
npm run dev:real
```

**Pre-requisitos:**
1. Backend Spring Boot debe estar corriendo en `http://localhost:8080`
2. Base de datos PostgreSQL debe estar activa
3. Keycloak debe estar configurado (para autenticación)

**Características:**
- ✅ Datos reales desde PostgreSQL
- ✅ Los cambios se persisten
- ✅ Autenticación real con Keycloak
- ⚠️ Requiere toda la infraestructura corriendo

---

## 📋 Configuración por Defecto

**Si NO existe `.env.local`:**
- El sistema usa **modo MOCK por defecto** (desde Nov 2025)
- Esto permite desarrollo inmediato sin configuración adicional

**Lógica de configuración:**
```typescript
// lib/config.ts
useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'
```

---

## 🎯 Casos de Uso

### Desarrollador Frontend (UI/UX)
```bash
# Usa modo mock - no necesitas backend
NEXT_PUBLIC_USE_MOCK_DATA=true
npm run dev
```

### Desarrollador Backend (Integración)
```bash
# Usa backend real
NEXT_PUBLIC_USE_MOCK_DATA=false
npm run dev

# Asegúrate de tener corriendo:
# - Backend: cd ../svc-signature-router && mvn spring-boot:run
# - PostgreSQL: docker-compose up postgres
# - Keycloak: docker-compose up keycloak
```

### Demo / Presentación
```bash
# Usa modo mock para demo sin dependencias
npm run dev:mock
```

### Testing E2E
```bash
# Usa backend real para tests de integración
npm run dev:real
```

---

## 🔍 Cómo Saber en Qué Modo Estás

### En la Consola del Navegador
```javascript
// Verás uno de estos mensajes al cargar:
🎭 Using MOCK API Client    // Modo Mock
🌐 Using REAL API Client    // Modo Real
```

### En la UI
- **Modo Mock:** Banner amarillo en páginas con "Modo Demostración Activo"
- **Modo Real:** Sin banner, conectando al backend

### En la Terminal
```bash
# Al iniciar el servidor verás:
🔧 App Configuration: {
  useMockData: true,     # o false
  apiBaseUrl: '...',
  mockDelay: 500
}
```

---

## 🛠️ Scripts NPM Disponibles

```json
{
  "dev": "next dev --port 3001",           // Usa .env.local
  "dev:mock": "... NEXT_PUBLIC_USE_MOCK_DATA=true ...",  // Fuerza mock
  "dev:real": "... NEXT_PUBLIC_USE_MOCK_DATA=false ...", // Fuerza real
  "build": "next build",                   // Build producción
  "build:mock": "... NEXT_PUBLIC_USE_MOCK_DATA=true ...", // Build mock
  "build:real": "... NEXT_PUBLIC_USE_MOCK_DATA=false ..." // Build real
}
```

---

## ⚡ Quick Start

### Primera vez (desarrollo UI):
```bash
cd app-signature-router-admin

# 1. NO necesitas crear .env.local (modo mock por defecto)

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo mock
npm run dev

# 4. Abrir navegador
# http://localhost:3001
```

### Con backend:
```bash
# Terminal 1: Backend
cd svc-signature-router
mvn spring-boot:run

# Terminal 2: Frontend
cd app-signature-router-admin
echo "NEXT_PUBLIC_USE_MOCK_DATA=false" > .env.local
npm run dev
```

---

## 📝 Notas Importantes

1. **Los cambios en `.env.local` requieren reiniciar el servidor de desarrollo**
   ```bash
   # Ctrl+C y luego:
   npm run dev
   ```

2. **Las variables NEXT_PUBLIC_* son públicas**
   - Se exponen en el bundle del cliente
   - NO pongas secretos/tokens aquí
   - Son solo para configuración de endpoints

3. **Modo Mock incluye:**
   - 4 Providers (Twilio, Firebase, Vonage, BioCatch)
   - 4 Templates pre-configurados
   - 150 Signatures de ejemplo
   - Métricas y estadísticas realistas
   - 5 Usuarios de ejemplo
   - 5 Reglas de routing

4. **Persistencia en Modo Mock:**
   - Los cambios se mantienen durante la sesión
   - Se pierden al recargar la página (F5)
   - Cada recarga vuelve a los datos iniciales

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"
```
❌ Causa: Modo REAL pero backend no está corriendo
✅ Solución: Cambiar a modo MOCK o iniciar el backend
```

### Error: "CORS blocked"
```
❌ Causa: Backend corriendo pero CORS no configurado
✅ Solución: Verificar CORS en application.yml del backend
```

### Los cambios no se guardan (Modo Mock)
```
ℹ️  Normal: Modo mock no persiste datos
✅ Solución: Usar modo REAL para persistencia
```

### Banner "Modo Demostración" no aparece
```
❌ Causa: Variable de entorno mal configurada
✅ Solución: Verificar que NEXT_PUBLIC_USE_MOCK_DATA=true
```

---

**Actualizado:** 30 Nov 2025  
**Versión:** 1.0.0

