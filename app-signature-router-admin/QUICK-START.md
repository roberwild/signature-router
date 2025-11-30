# 🚀 Quick Start - Admin Panel Signature Router

Guía de inicio rápido en **5 minutos**.

## ✅ Prerequisitos

```bash
Node.js 18+ installed
npm or pnpm installed
Backend running on http://localhost:8080
```

## 📦 Paso 1: Instalar (2 min)

```bash
cd app-signature-router-admin
npm install
```

## ⚙️ Paso 2: Configurar (1 min)

Crea `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=cambiar-por-secret-seguro
```

## 🏃 Paso 3: Ejecutar (30 seg)

```bash
npm run dev
```

## ✨ Paso 4: Verificar (30 seg)

Abre: **http://localhost:3001**

Deberías ver:
- ✅ Dashboard con métricas
- ✅ Cards en verde Singular Bank (#00A651)
- ✅ Embudo de conversión
- ✅ Acciones rápidas

## 🎨 ¿Qué Incluye?

### Diseño Singular Bank
- Verde corporativo #00A651
- Tipografía Inter
- Cards con bordes izquierdos verdes
- Diseño minimalista

### Componentes
- MetricCard - Cards de métricas
- AdminPageTitle - Títulos de página
- UI Components - Buttons, Badges, Progress

### Funcionalidades
- Dashboard con 8 métricas
- Embudo de conversión visual
- Acciones rápidas
- Diseño responsive

## 🔌 Conectar con Backend

### Ejemplo de uso del API Client

```typescript
// En cualquier componente
import { api } from '@/lib/api';

// GET
const users = await api.get('/api/users');

// POST
const newUser = await api.post('/api/users', {
  name: 'John Doe'
});
```

### CORS en Spring Boot

Agregar en tu backend:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3001")
                .allowedMethods("*")
                .allowedHeaders("*");
    }
}
```

## 📂 Archivos Importantes

```
app-signature-router-admin/
├── app/admin/page.tsx       # Dashboard principal
├── components/admin/        # Componentes del admin
├── lib/api.ts              # Cliente API
├── app/globals.css         # Tema Singular Bank
└── .env.local              # Variables de entorno
```

## 🐛 Problemas Comunes

### Frontend no se conecta al backend

✅ **Verificar**:
1. Backend corriendo en `http://localhost:8080`
2. `.env.local` configurado correctamente
3. CORS habilitado en Spring Boot

### Estilos no se ven

✅ **Verificar**:
1. `npm install` completado
2. `tailwindcss` instalado
3. Reiniciar servidor de dev

### Puerto 3001 ocupado

```bash
# Cambiar puerto en package.json
"dev": "next dev --port 3002"
```

## 📚 Siguiente Nivel

- 📖 Lee el [README completo](README.md)
- 🔧 Conecta con tu backend real
- 🎨 Personaliza los componentes
- 📊 Agrega nuevas métricas

## ✨ ¡Listo!

Ahora tienes el admin panel corriendo con el estilo de Singular Bank.

**¿Preguntas?** Consulta la documentación completa en [README.md](README.md)

