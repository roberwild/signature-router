# Signature Router - Monorepo

Sistema de routing de firmas electrónicas con panel de administración.

## 📁 Estructura del Proyecto

```
signature-router/
│
├── svc-signature-router/          # 🔧 Backend Service (Spring Boot)
│   ├── src/main/                  # Código fuente Java
│   ├── src/test/                  # Tests
│   ├── pom.xml                    # Maven configuration
│   └── README.md
│
├── app-signature-router-admin/    # 🎨 Admin Frontend (Next.js)
│   ├── app/                       # Next.js App Router
│   ├── components/                # React components
│   ├── lib/                       # Utilities
│   ├── package.json
│   └── README.md
│
├── docs/                          # 📚 Documentación
├── docker/                        # 🐳 Docker configs
├── scripts/                       # 📜 Scripts útiles
└── README.md                      # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos

- **Java 21+** (para el backend)
- **Node.js 18+** (para el frontend)
- **Maven 3.9+**
- **PostgreSQL 15+** (o la BD que uses)

### 1. Backend (Spring Boot)

```bash
cd svc-signature-router

# Compilar
./mvnw clean package

# Ejecutar en desarrollo
./mvnw spring-boot:run

# Backend disponible en: http://localhost:8080
```

### 2. Frontend (Next.js)

```bash
cd app-signature-router-admin

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Ejecutar en desarrollo
npm run dev

# Frontend disponible en: http://localhost:3001
```

### 3. Ejecutar Todo (Desde la Raíz)

```bash
# Opción A: Manualmente en dos terminales
Terminal 1: cd svc-signature-router && ./mvnw spring-boot:run
Terminal 2: cd app-signature-router-admin && npm run dev

# Opción B: Con concurrently (si tienes package.json en la raíz)
npm run dev
```

## 🎨 Admin Panel

Panel de administración con diseño **Singular Bank**:

- ✅ Verde corporativo #00A651
- ✅ Diseño minimalista y profesional
- ✅ Dashboard con métricas de negocio
- ✅ Conexión con API Spring Boot
- ✅ TypeScript + Tailwind CSS
- ✅ Componentes reutilizables

Ver documentación completa: [`app-signature-router-admin/README.md`](app-signature-router-admin/README.md)

## 🔧 Backend Service

API REST con Spring Boot:

- ✅ Spring Boot 3.x
- ✅ Java 21
- ✅ Maven
- ✅ PostgreSQL
- ✅ Spring Security
- ✅ REST API

Ver documentación completa: [`svc-signature-router/README.md`](svc-signature-router/README.md)

## 📊 Arquitectura

```
┌─────────────────────────────────────────┐
│  app-signature-router-admin (Next.js)   │
│  Puerto: 3001                           │
│  UI: Singular Bank Style                │
└──────────────┬──────────────────────────┘
               │
               │ HTTP REST API
               │
┌──────────────▼──────────────────────────┐
│  svc-signature-router (Spring Boot)     │
│  Puerto: 8080                           │
│  API REST + Business Logic              │
└──────────────┬──────────────────────────┘
               │
               │ JDBC
               │
┌──────────────▼──────────────────────────┐
│  PostgreSQL Database                    │
│  Puerto: 5432                           │
└─────────────────────────────────────────┘
```

## 🔌 Conexión Frontend-Backend

El frontend se conecta al backend mediante:

1. **API Client** (`app-signature-router-admin/lib/api.ts`)
2. **Proxy en Next.js** (`next.config.ts` - rewrites)
3. **CORS habilitado** en Spring Boot

### Configuración CORS en Spring Boot

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3001")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## 📝 Scripts Útiles

### Desarrollo

```bash
# Backend
cd svc-signature-router
./mvnw spring-boot:run

# Frontend
cd app-signature-router-admin
npm run dev
```

### Build

```bash
# Backend
cd svc-signature-router
./mvnw clean package

# Frontend
cd app-signature-router-admin
npm run build
```

### Tests

```bash
# Backend
cd svc-signature-router
./mvnw test

# Frontend
cd app-signature-router-admin
npm run test
```

## 🐳 Docker

```bash
# Build images
docker-compose build

# Run all services
docker-compose up

# Stop
docker-compose down
```

## 📚 Documentación

- [Guía de Migración](app-signature-router-admin/MIGRATION-GUIDE.md)
- [Admin Frontend](app-signature-router-admin/README.md)
- [Backend Service](svc-signature-router/README.md)
- [Docs generales](docs/)

## 🛠️ Tecnologías

### Backend
- Java 21
- Spring Boot 3.x
- Maven
- PostgreSQL
- Spring Security

### Frontend
- Next.js 15
- React 19
- TypeScript 5.3
- Tailwind CSS 3.4
- Shadcn/UI

## 🎯 Roadmap

- [ ] Autenticación unificada (NextAuth + Spring Security)
- [ ] WebSocket para notificaciones en tiempo real
- [ ] Tests E2E (Playwright)
- [ ] CI/CD Pipeline
- [ ] Deploy en producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Privado - Signature Router © 2024

## 👥 Equipo

- **Backend**: Spring Boot Team
- **Frontend**: Next.js Team
- **DevOps**: Infrastructure Team

---

**¿Nuevo en el proyecto?** Lee primero la [Guía de Migración](app-signature-router-admin/MIGRATION-GUIDE.md)

