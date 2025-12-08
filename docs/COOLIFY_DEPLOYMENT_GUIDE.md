# 📘 Guía Completa de Deployment en Coolify

> **Autor:** Roberto Gutiérrez Mourente  
> **Fecha:** 8 de Diciembre de 2025  
> **Setup:** Raspberry Pi 5 + Coolify + Traefik + Cloudflare  
> **Dominio:** roberace.com  

---

## 📋 Tabla de Contenidos

1. [Información del Setup](#información-del-setup)
2. [Deployar una Nueva Aplicación Node.js/Next.js](#deployar-una-nueva-aplicación-nodejsnextjs)
3. [Troubleshooting Común](#troubleshooting-común)
4. [Plantillas y Templates](#plantillas-y-templates)
5. [Servicios Desplegados](#servicios-desplegados)
6. [Comandos Útiles](#comandos-útiles)

---

## 🖥️ Información del Setup

### **Hardware y Acceso**
- **Dispositivo:** Raspberry Pi 5
- **IP Pública:** `79.117.122.77`
- **SSH:** `ssh rober@79.117.122.77`
- **Usuario Coolify:** `roberto.gmourente@gmail.com`
- **Password Coolify:** `Perranka.1`

### **Dominio y DNS**
- **Registrar:** Cloudflare
- **Dominio Principal:** `roberace.com`
- **DNS:** Cloudflare (Proxy Status: DNS only / Gray cloud)

### **Stack Tecnológico**
- **PaaS:** Coolify v4.0.0-beta.452
- **Reverse Proxy:** Traefik v3.6
- **SSL:** Let's Encrypt (automático vía Traefik)
- **Build System:** Nixpacks v1.41.0
- **Monitoring:** Prometheus + Grafana + Loki + Promtail

### **Redes Docker**
- **Red principal de Coolify:** `coolify`
- **Red de monitoring:** `monitoring`
- Ambas redes están conectadas para permitir comunicación

---

## 🚀 Deployar una Nueva Aplicación Node.js/Next.js

### **Tiempo Estimado:**
- **Aplicación simple:** 10-15 minutos
- **Con dependencias complejas:** 30-45 minutos
- **Con base de datos:** 1-2 horas

### **Paso 1: Preparar el Repositorio**

#### **1.1. Verificar archivos necesarios**
- ✅ `package.json` con scripts `build` y `start`
- ✅ `package-lock.json` actualizado
- ✅ `.gitignore` (excluir `node_modules`, `.env`, etc.)

#### **1.2. Si tienes problemas de dependencias de peers**

Crear `nixpacks.toml` en la raíz del proyecto:

```toml
[phases.install]
cmds = ["npm ci --legacy-peer-deps"]
```

Commit y push:
```bash
git add nixpacks.toml
git commit -m "feat: add nixpacks config"
git push origin master
```

---

### **Paso 2: Configurar DNS en Cloudflare**

1. **Ir a Cloudflare Dashboard** → DNS → Records
2. **Agregar registro A:**
   - **Type:** `A`
   - **Name:** `tu-app` (ejemplo: `etfs`)
   - **IPv4 address:** `79.117.122.77`
   - **Proxy status:** 🔴 **DNS only** (gray cloud - MUY IMPORTANTE)
   - **TTL:** Auto
3. **Save**

**Verificar propagación:**
```bash
nslookup tu-app.roberace.com
# Debe mostrar: 79.117.122.77
```

---

### **Paso 3: Crear Proyecto en Coolify**

1. **Login en Coolify:** `https://coolify.roberace.com`
2. **Projects → + Add**
3. **Nombre:** `Tu Aplicación`
4. **Save**

---

### **Paso 4: Crear Aplicación**

1. **Dentro del proyecto → + New Resource**
2. **Seleccionar:** `Public Repository`
3. **Git Repository URL:** `https://github.com/usuario/repo`
4. **Branch:** `master` o `main` (verificar cuál usa tu repo)
5. **Continue**

---

### **Paso 5: Configuración General**

#### **5.1. General Settings**
- **Name:** Nombre descriptivo
- **Domains:** `tu-app.roberace.com`
- **Port:** `3000` (o el puerto que use tu app)
- **Build Pack:** `nixpacks` (auto-detectado)

#### **5.2. Environment Variables**
Agregar las variables necesarias:
```
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
```

#### **5.3. Advanced → Container Labels**
Copiar y pegar estos labels (reemplazar `APPNAME` y `domain.com`):

```
traefik.enable=true
traefik.http.routers.APPNAME-http.rule=Host(`domain.com`)
traefik.http.routers.APPNAME-http.entryPoints=http
traefik.http.routers.APPNAME-http.middlewares=redirect-to-https
traefik.http.routers.APPNAME-http.service=APPNAME-service
traefik.http.services.APPNAME-service.loadbalancer.server.port=3000
traefik.http.middlewares.gzip.compress=true
traefik.http.routers.APPNAME-https.rule=Host(`domain.com`)
traefik.http.routers.APPNAME-https.entryPoints=https
traefik.http.routers.APPNAME-https.tls=true
traefik.http.routers.APPNAME-https.tls.certresolver=letsencrypt
traefik.http.routers.APPNAME-https.service=APPNAME-service
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true
```

**Ejemplo real:**
```
traefik.enable=true
traefik.http.routers.etfs-http.rule=Host(`etfs.roberace.com`)
traefik.http.routers.etfs-http.entryPoints=http
traefik.http.routers.etfs-http.middlewares=redirect-to-https
traefik.http.routers.etfs-http.service=etfs-service
traefik.http.services.etfs-service.loadbalancer.server.port=3000
traefik.http.middlewares.gzip.compress=true
traefik.http.routers.etfs-https.rule=Host(`etfs.roberace.com`)
traefik.http.routers.etfs-https.entryPoints=https
traefik.http.routers.etfs-https.tls=true
traefik.http.routers.etfs-https.tls.certresolver=letsencrypt
traefik.http.routers.etfs-https.service=etfs-service
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true
```

#### **5.4. Desactivar HTTP Basic Auth**
- **Configuration → Advanced**
- **HTTP Basic Authentication:** ❌ Desactivado

---

### **Paso 6: Deploy**

1. **Save** (guardar configuración)
2. **Deploy** (botón azul arriba a la derecha)
3. **Esperar 5-10 minutos** (ver logs en tiempo real)

---

### **Paso 7: Verificar Deployment**

#### **7.1. Ver logs del contenedor**
```bash
ssh rober@79.117.122.77
docker ps | grep APPNAME
docker logs CONTAINER_NAME --tail 50
```

Debe mostrar algo como:
```
✓ Ready in 547ms
- Local: http://localhost:3000
```

#### **7.2. Verificar Traefik**
```bash
docker logs coolify-proxy 2>&1 | grep -i tu-app | tail 20
```

No debe haber errores de `empty args for matcher Host`.

#### **7.3. Verificar SSL**
Esperar 1-2 minutos para que Let's Encrypt genere el certificado.

```bash
curl -Ik https://tu-app.roberace.com
```

Debe mostrar `HTTP/2 200` y certificado válido.

#### **7.4. Acceder desde el navegador**
```
https://tu-app.roberace.com
```

✅ Debe cargar con SSL (candado verde)

---

## 🔧 Troubleshooting Común

### **Problema 1: "no available server"**

**Causa:** Traefik no está enrutando correctamente.

**Solución:**
1. Verificar que los Container Labels estén correctos
2. Verificar que la app esté corriendo:
   ```bash
   docker logs CONTAINER_NAME
   ```
3. Reiniciar Traefik:
   ```bash
   docker restart coolify-proxy
   ```

---

### **Problema 2: `npm ci` falla con conflictos de dependencias**

**Error típico:**
```
npm error ERESOLVE unable to resolve dependency tree
```

**Solución:**

1. **En tu proyecto local:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   git add package-lock.json
   git commit -m "fix: update package-lock with legacy-peer-deps"
   git push
   ```

2. **Crear `nixpacks.toml`:**
   ```toml
   [phases.install]
   cmds = ["npm ci --legacy-peer-deps"]
   ```

3. **Push y redeploy**

---

### **Problema 3: La rama es `master` pero Coolify busca `main`**

**Error:**
```
fatal: Remote branch main not found in upstream origin
```

**Solución:**
1. **Coolify → Configuration → General**
2. **Branch:** Cambiar de `main` a `master`
3. **Save y Redeploy**

---

### **Problema 4: Módulos faltantes en el build**

**Error:**
```
Module not found: Can't resolve '@langchain/core/prompts'
```

**Solución:**

1. **Instalar la dependencia explícitamente:**
   ```bash
   npm install @langchain/core --legacy-peer-deps
   git add package.json package-lock.json
   git commit -m "fix: add missing dependency"
   git push
   ```

2. **Redeploy en Coolify**

---

### **Problema 5: Labels de Traefik malformados**

**Error en logs:**
```
error while parsing rule Host(``) && PathPrefix(`app.com`)
empty args for matcher Host
```

**Causa:** Coolify mezcló labels automáticos con los manuales.

**Solución:**
1. **Coolify → Configuration → Advanced → Container Labels**
2. **BORRAR TODO**
3. **Pegar SOLO los 14 labels correctos** (ver plantilla arriba)
4. **Save y Redeploy**

---

### **Problema 6: Coolify UI no carga Settings**

**Síntomas:** Pantalla vacía al entrar a Configuration.

**Solución:**
```bash
ssh rober@79.117.122.77
docker exec coolify php artisan cache:clear
docker exec coolify php artisan config:clear
docker restart coolify
```

Esperar 1 minuto y abrir Coolify en **modo incógnito**.

---

### **Problema 7: DNS no resuelve**

**Error:** `DNS_PROBE_FINISHED_NXDOMAIN`

**Solución:**
1. Verificar registro A en Cloudflare
2. **Proxy Status:** Debe estar en **DNS only** (gray cloud)
3. Verificar:
   ```bash
   nslookup tu-app.roberace.com
   ```
4. Esperar propagación (5-10 minutos)

---

## 📝 Plantillas y Templates

### **Template: nixpacks.toml (dependencias con peers)**

```toml
[phases.install]
cmds = ["npm ci --legacy-peer-deps"]
```

---

### **Template: Traefik Labels (HTTP + HTTPS con SSL)**

```
traefik.enable=true
traefik.http.routers.APPNAME-http.rule=Host(`DOMAIN.roberace.com`)
traefik.http.routers.APPNAME-http.entryPoints=http
traefik.http.routers.APPNAME-http.middlewares=redirect-to-https
traefik.http.routers.APPNAME-http.service=APPNAME-service
traefik.http.services.APPNAME-service.loadbalancer.server.port=3000
traefik.http.middlewares.gzip.compress=true
traefik.http.routers.APPNAME-https.rule=Host(`DOMAIN.roberace.com`)
traefik.http.routers.APPNAME-https.entryPoints=https
traefik.http.routers.APPNAME-https.tls=true
traefik.http.routers.APPNAME-https.tls.certresolver=letsencrypt
traefik.http.routers.APPNAME-https.service=APPNAME-service
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true
```

**Variables a reemplazar:**
- `APPNAME`: Nombre único de tu app (ej: `etfs`, `hevy`, `blog`)
- `DOMAIN`: Subdominio completo (ej: `etfs.roberace.com`)
- `3000`: Puerto donde corre tu app (verificar con `package.json` o código)

---

### **Template: .env Variables Comunes**

```bash
# Node Environment
NODE_ENV=production

# Next.js
NEXT_PUBLIC_API_URL=https://api.roberace.com
NEXTAUTH_URL=https://app.roberace.com
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Coolify (auto-generadas, NO tocar)
COOLIFY_URL=app.roberace.com
COOLIFY_FQDN=app.roberace.com
COOLIFY_BRANCH=master
```

---

## 🌐 Servicios Desplegados

### **Aplicaciones**
| Servicio | URL | Puerto | Descripción |
|----------|-----|--------|-------------|
| Hevy MCP | `https://hevy.roberace.com` | 3000 | API de Hevy (MCP Server) |
| Buscador ETFs | `https://etfs.roberace.com` | 3000 | Next.js - Buscador de fondos |

### **Infraestructura**
| Servicio | URL | Puerto | Descripción |
|----------|-----|--------|-------------|
| Coolify | `https://coolify.roberace.com` | 8000 | Panel de control |
| Grafana | `https://grafana.roberace.com` | 3002 | Dashboards de monitoreo |
| Portainer | `https://portainer.roberace.com` | 9000 | Gestión Docker |
| pgAdmin | `https://pgadmin.roberace.com` | 5050 | PostgreSQL Admin |
| Uptime Kuma | `https://uptime.roberace.com` | 3001 | Monitor de uptime |
| Homer | `https://homer.roberace.com` | 8082 | Dashboard de enlaces |

### **Solo Red Local**
| Servicio | URL | Puerto | Descripción |
|----------|-----|--------|-------------|
| Prometheus | `http://192.168.1.210:9090` | 9090 | Métricas |
| Loki | `http://192.168.1.210:3100` | 3100 | Agregador de logs |

---

## 🛠️ Comandos Útiles

### **SSH y Acceso**
```bash
# Conectar a Raspberry Pi
ssh rober@79.117.122.77

# Resetear password de Coolify
docker exec -it coolify php artisan tinker
# Luego ejecutar:
$user = \App\Models\User::whereEmail('roberto.gmourente@gmail.com')->first();
$user->password = bcrypt('Perranka.1');
$user->save();
exit
```

---

### **Docker - Gestión de Contenedores**
```bash
# Listar contenedores
docker ps
docker ps | grep coolify
docker ps | grep APPNAME

# Ver logs
docker logs CONTAINER_NAME
docker logs CONTAINER_NAME --tail 50
docker logs CONTAINER_NAME --follow

# Logs de Coolify
docker logs coolify --tail 100
docker logs coolify-proxy --tail 100

# Reiniciar contenedores
docker restart CONTAINER_NAME
docker restart coolify
docker restart coolify-proxy

# Estadísticas
docker stats --no-stream
docker stats --no-stream | grep coolify
```

---

### **Docker - Inspección y Debug**
```bash
# Inspeccionar labels de Traefik
docker inspect CONTAINER_NAME --format='{{json .Config.Labels}}' | jq | grep -i traefik

# Ver redes
docker network ls
docker network inspect coolify

# Ver qué contenedores están en una red
docker network inspect coolify --format='{{json .Containers}}' | jq
```

---

### **Coolify - Mantenimiento**
```bash
# Limpiar caché
docker exec coolify php artisan cache:clear
docker exec coolify php artisan config:clear

# Reiniciar Coolify
docker restart coolify

# Ver logs de errores
docker logs coolify --tail 100 | grep -i error
```

---

### **Traefik - Debug**
```bash
# Ver logs de Traefik
docker logs coolify-proxy --tail 50

# Ver logs de una app específica
docker logs coolify-proxy 2>&1 | grep -i APPNAME

# Ver errores de routing
docker logs coolify-proxy 2>&1 | grep -i error

# Ver certificados SSL generados
docker exec coolify-proxy cat /traefik/acme.json | jq '.letsencrypt.Certificates'
```

---

### **DNS y Red**
```bash
# Verificar DNS
nslookup app.roberace.com

# Verificar SSL
curl -Ik https://app.roberace.com

# Test de conectividad
ping app.roberace.com
curl -v https://app.roberace.com
```

---

### **Monitoring**
```bash
# Ver métricas de Prometheus
curl http://192.168.1.210:9090/api/v1/targets

# Ver logs en Loki
curl -G "http://192.168.1.210:3100/loki/api/v1/query" --data-urlencode 'query={job="docker"}'

# Restart monitoring stack
cd /home/rober/monitoring
docker compose restart
```

---

## 📊 Arquitectura del Sistema

```
Internet
    ↓
Cloudflare DNS (roberace.com)
    ↓
Router (Port 80, 443 → 192.168.1.210)
    ↓
Raspberry Pi 5 (192.168.1.210)
    ↓
Traefik (coolify-proxy)
    ├──→ Coolify UI (8000)
    ├──→ Aplicaciones (3000, etc.)
    └──→ Servicios (Grafana, Portainer, etc.)
    
Docker Networks:
    ├── coolify (red principal)
    └── monitoring (conectada a coolify)
```

---

## ⚠️ Notas Importantes

### **❌ NO HACER:**
1. **NO cambiar Cloudflare DNS a "Proxied"** (orange cloud) - rompe SSL
2. **NO usar `npm install` en producción** - siempre `npm ci`
3. **NO mezclar labels automáticos de Coolify con labels manuales** - borrar todo y poner solo los 14 correctos
4. **NO exponer puertos innecesarios** - usar solo Traefik como proxy
5. **NO olvidar hacer push de `package-lock.json`** después de `npm install`

### **✅ SIEMPRE HACER:**
1. **Verificar rama correcta** (master vs main) antes de deployar
2. **Esperar 1-2 minutos** después de deploy para que SSL se genere
3. **Verificar logs** antes de reportar un error
4. **Backup de base de datos** antes de cambios importantes
5. **Probar en local** antes de deployar a producción

---

## 🎓 Lecciones Aprendidas

### **Coolify vs Vercel**

| Aspecto | Vercel | Coolify |
|---------|--------|---------|
| **Tiempo primer deploy** | 5 minutos | 9 horas (setup inicial) |
| **Complejidad** | ⭐ Muy fácil | ⭐⭐⭐⭐⭐ Muy complejo |
| **Costo** | $20-100/mes | Gratis (después del setup) |
| **Control** | Limitado | Total |
| **Troubleshooting** | Automático | Manual (requiere conocimientos) |
| **Próximos deploys** | 5 minutos | 10-15 minutos |

### **¿Cuándo usar Coolify?**
✅ **SÍ:**
- Proyectos personales/educativos
- Necesitas control total del stack
- Quieres evitar costos mensuales
- Tienes tiempo para aprender

❌ **NO:**
- Proyectos con deadline corto
- Clientes que pagan por tiempo
- Equipos sin experiencia en DevOps
- Aplicaciones críticas sin redundancia

---

## 📚 Recursos Adicionales

### **Documentación**
- Coolify Docs: https://coolify.io/docs
- Nixpacks: https://nixpacks.com/docs
- Traefik: https://doc.traefik.io/traefik/
- Cloudflare DNS: https://developers.cloudflare.com/dns/

### **Archivos de Configuración**
- `/home/rober/monitoring/monitoring-stack.yml` - Docker Compose del monitoring
- `/home/rober/monitoring/prometheus.yml` - Config de Prometheus
- `/home/rober/monitoring/promtail-config.yml` - Config de Promtail
- `/home/rober/monitoring/homer/assets/config.yml` - Config de Homer

### **Guías Relacionadas**
- `COOLIFY_SETUP_GUIDE.md` - Instalación completa de Coolify en Raspberry Pi 5
- `SSH_SETUP_GUIDE.md` - Configuración de SSH y acceso remoto

---

## 🆘 En Caso de Emergencia

### **Si Coolify no responde:**
```bash
ssh rober@79.117.122.77
docker restart coolify
docker logs coolify --tail 100
```

### **Si Traefik no enruta:**
```bash
docker restart coolify-proxy
docker logs coolify-proxy --tail 50
```

### **Si todo falla:**
```bash
# Reiniciar stack completo
docker restart coolify coolify-proxy coolify-db coolify-redis coolify-realtime

# Si sigue sin funcionar
cd /home/rober/monitoring
docker compose restart

# Último recurso
sudo reboot
```

### **Contacto de Emergencia**
- **Acceso SSH:** `rober@79.117.122.77`
- **Coolify UI:** `https://coolify.roberace.com`
- **Documentación:** Este archivo 😉

---

**Última actualización:** 8 de Diciembre de 2025  
**Versión:** 1.0  
**Mantenido por:** Roberto Gutiérrez Mourente

**¡Buena suerte con tus próximos deploys! 🚀**

