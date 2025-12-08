# 🖥️ Raspberry Pi 5 - Environment Configuration

> **ESTE DOCUMENTO ES PARA IA:** Información del entorno de producción para deployar aplicaciones automáticamente.

---

## 📍 Información del Servidor

### **Hardware**
- **Dispositivo:** Raspberry Pi 5 (8GB RAM)
- **Hostname:** `RASPBERRY-ROBER`
- **IP Local:** `192.168.1.210`
- **IP Pública:** `79.117.122.77`
- **Almacenamiento:** MicroSD 64GB (36GB libres aprox.)

### **Acceso SSH**
```bash
ssh rober@RASPBERRY-ROBER
# o
ssh rober@79.117.122.77
```

### **Sistema Operativo**
- **OS:** Raspberry Pi OS (64-bit) Bookworm
- **Kernel:** Linux 6.12.47+rpt-rpi-2712 (ARM64)
- **Docker:** 24.x.x (con Docker Compose v2)

---

## 🌐 Dominio y DNS

### **Registrador y DNS**
- **Dominio:** `roberace.com`
- **Registrar:** Cloudflare
- **DNS:** Cloudflare (SIEMPRE en modo "DNS only" - nube gris)

### **Subdominios Activos**
```
coolify.roberace.com    → Coolify UI
hevy.roberace.com       → API Hevy MCP (Node.js)
etfs.roberace.com       → Buscador de ETFs (Next.js)
grafana.roberace.com    → Grafana Monitoring
portainer.roberace.com  → Docker Management
pgadmin.roberace.com    → PostgreSQL Admin
uptime.roberace.com     → Uptime Kuma
homer.roberace.com      → Dashboard
```

### **Cómo Agregar Nuevo Subdominio**
1. Ir a **Cloudflare Dashboard** → DNS → Records
2. Agregar registro tipo **A**:
   - **Name:** `tu-app`
   - **IPv4 address:** `79.117.122.77`
   - **Proxy status:** ☁️ **DNS only (GRIS)** ← CRÍTICO
   - **TTL:** Auto
3. Verificar: `nslookup tu-app.roberace.com` → debe devolver `79.117.122.77`

---

## 🐳 Docker y Coolify

### **Stack de Producción**
- **PaaS:** Coolify v4.0.0-beta.452
- **Reverse Proxy:** Traefik v3.6
- **SSL:** Let's Encrypt (automático)
- **Build System:** Nixpacks v1.41.0

### **Redes Docker**
```
coolify     → Red principal de Coolify (externa)
monitoring  → Stack de monitoreo (bridge, conectada a coolify)
```

### **Acceso a Coolify**
- **URL:** `https://coolify.roberace.com`
- **Usuario:** `roberto.gmourente@gmail.com`
- **Password:** `Perranka.1`

---

## 🚀 Deployar Nueva Aplicación

### **Requisitos del Repositorio**

#### **Archivos Obligatorios**
```
✅ package.json (con scripts "build" y "start")
✅ package-lock.json (actualizado)
✅ .gitignore (incluir node_modules, .env)
```

#### **Si Hay Problemas de Dependencias**
Crear `nixpacks.toml` en la raíz:
```toml
[phases.install]
cmds = ["npm ci --legacy-peer-deps"]
```

#### **Si Necesitas Comando de Start Personalizado**
Crear `nixpacks.toml`:
```toml
[start]
cmd = "node dist/simple-server.js"
```

---

### **Proceso de Deployment (Paso a Paso)**

#### **1. Configurar DNS** (1 min)
```
Cloudflare → DNS → Add Record:
  Type: A
  Name: tu-app
  IPv4: 79.117.122.77
  Proxy: DNS only (gris)
```

#### **2. Crear en Coolify** (2 min)
```
https://coolify.roberace.com
→ Projects → + Add → "Tu Aplicación"
→ + New Resource → Public Repository
→ Repository URL: https://github.com/usuario/repo
→ Branch: master (o main, verificar)
→ Continue
```

#### **3. Configuración General** (2 min)
```
Name: tu-app
Domains: tu-app.roberace.com
Port: 3000 (o el puerto de tu app)
Build Pack: nixpacks (auto-detectado)
```

#### **4. Environment Variables** (1 min)
Agregar variables necesarias (ejemplos):
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
```

#### **5. Container Labels (Traefik)** (1 min)
Ir a **Configuration → Advanced → Container Labels** y pegar:

```
traefik.enable=true
traefik.http.routers.APPNAME-http.rule=Host(`tu-app.roberace.com`)
traefik.http.routers.APPNAME-http.entryPoints=http
traefik.http.routers.APPNAME-http.middlewares=redirect-to-https
traefik.http.routers.APPNAME-http.service=APPNAME-service
traefik.http.services.APPNAME-service.loadbalancer.server.port=3000
traefik.http.middlewares.gzip.compress=true
traefik.http.routers.APPNAME-https.rule=Host(`tu-app.roberace.com`)
traefik.http.routers.APPNAME-https.entryPoints=https
traefik.http.routers.APPNAME-https.tls=true
traefik.http.routers.APPNAME-https.tls.certresolver=letsencrypt
traefik.http.routers.APPNAME-https.service=APPNAME-service
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true
```

**Variables a reemplazar:**
- `APPNAME` → Nombre corto de tu app (ej: `blog`, `api`, `admin`)
- `tu-app.roberace.com` → Tu subdominio
- `3000` → Puerto de tu app

#### **6. Deploy** (5-10 min)
```
Save → Deploy
Esperar logs del build
Estado final: "Healthy (running)"
```

#### **7. Verificar** (1 min)
```bash
# SSL debe estar activo
curl -I https://tu-app.roberace.com
# Debe devolver: HTTP/2 200

# Navegador
https://tu-app.roberace.com
# Debe cargar con candado verde 🔒
```

---

## 🔧 Stack de Monitoreo

### **Servicios Activos**
```
Grafana      → https://grafana.roberace.com (admin/admin)
Prometheus   → http://192.168.1.210:9090 (solo local)
Loki         → http://192.168.1.210:3100 (solo local)
Portainer    → https://portainer.roberace.com
Uptime Kuma  → https://uptime.roberace.com
Homer        → https://homer.roberace.com
```

### **Archivos de Configuración**
```
/home/rober/monitoring/monitoring-stack.yml  → Docker Compose del stack
/home/rober/monitoring/prometheus.yml        → Config de Prometheus
/home/rober/monitoring/promtail-config.yml   → Config de Promtail
/home/rober/monitoring/homer/assets/config.yml → Config de Homer
```

### **Agregar App al Dashboard Homer**
```bash
ssh rober@RASPBERRY-ROBER
nano /home/rober/monitoring/homer/assets/config.yml
```

Agregar en la sección `Applications`:
```yaml
      - name: "Tu Aplicación"
        logo: "https://example.com/logo.svg"
        subtitle: "Descripción corta"
        tag: "tag-opcional"
        url: "https://tu-app.roberace.com"
        target: "_blank"
```

Reiniciar:
```bash
docker restart homer
```

---

## 📊 Recursos Disponibles

### **RAM**
```
Total: 8GB
Usada: ~3GB (Coolify + apps + monitoring)
Libre: ~5GB
```

### **Aplicaciones Actuales**
```
Coolify Stack       ~800MB
hevy-mcp (Node.js)  ~150MB
buscador-etfs       ~200MB
Monitoring Stack    ~600MB
Otros servicios     ~400MB
━━━━━━━━━━━━━━━━━━━━━━━━━━
Total usado        ~2.2GB
━━━━━━━━━━━━━━━━━━━━━━━━━━
RAM disponible     ~5.8GB
```

**Conclusión:** Hay recursos suficientes para:
- ✅ 3-4 aplicaciones Node.js adicionales
- ✅ 1-2 aplicaciones Next.js
- ✅ 1 aplicación Spring Boot con PostgreSQL

---

## ⚠️ Reglas Críticas

### **❌ NUNCA HACER:**
1. Cambiar DNS a "Proxied" (nube naranja) → Rompe SSL
2. Usar `npm install` en producción → Siempre `npm ci`
3. Mezclar labels de Coolify con labels manuales
4. Exponer puertos directamente (usar Traefik)
5. Olvidar push de `package-lock.json`

### **✅ SIEMPRE HACER:**
1. Verificar rama (`master` vs `main`)
2. Esperar 1-2 min post-deploy para SSL
3. Verificar logs antes de reportar error
4. Probar en local antes de deploy
5. Usar paths absolutos en configs

---

## 🐛 Troubleshooting Rápido

### **Error: "no available server"**
```bash
# Verificar app corriendo
ssh rober@RASPBERRY-ROBER "docker logs CONTAINER_NAME --tail 50"

# Reiniciar Traefik
ssh rober@RASPBERRY-ROBER "docker restart coolify-proxy"
```

### **Error: Dependencias (ERESOLVE)**
```bash
# Local
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
git add package-lock.json
git commit -m "fix: update package-lock with legacy-peer-deps"
git push

# Crear nixpacks.toml
echo '[phases.install]
cmds = ["npm ci --legacy-peer-deps"]' > nixpacks.toml
git add nixpacks.toml
git commit -m "feat: add nixpacks config"
git push
```

### **Error: Labels malformados**
```
Coolify → Configuration → Advanced → Container Labels
→ BORRAR TODO
→ Pegar los 14 labels correctos (ver arriba)
→ Save → Redeploy
```

### **Error: DNS no resuelve**
```bash
# Verificar DNS
nslookup tu-app.roberace.com

# Si devuelve IPs de Cloudflare (104.x, 172.x):
# → Ir a Cloudflare y cambiar a "DNS only"
# → Esperar 5-10 min
```

### **Error: Coolify UI no carga**
```bash
ssh rober@RASPBERRY-ROBER
docker exec coolify php artisan cache:clear
docker exec coolify php artisan config:clear
docker restart coolify
# Esperar 1 min, abrir en incógnito
```

---

## 🛠️ Comandos Útiles

### **Conectarse al Servidor**
```bash
ssh rober@RASPBERRY-ROBER
```

### **Ver Logs de Aplicación**
```bash
docker logs CONTAINER_NAME --tail 100 -f
```

### **Reiniciar Traefik**
```bash
docker restart coolify-proxy
```

### **Ver Logs de Traefik**
```bash
docker logs coolify-proxy --tail 50
```

### **Ver Certificados SSL**
```bash
docker exec coolify-proxy cat /traefik/acme.json | jq '.letsencrypt.Certificates'
```

### **Resetear Password de Coolify**
```bash
docker exec -it coolify php artisan tinker
# Ejecutar:
$user = \App\Models\User::whereEmail('roberto.gmourente@gmail.com')->first();
$user->password = bcrypt('Perranka.1');
$user->save();
exit
```

---

## 📚 Documentación Completa

Para información detallada, consultar:

1. **`COOLIFY_SETUP_GUIDE.md`** - Instalación completa de Coolify
2. **`COOLIFY_DEPLOYMENT_GUIDE.md`** - Guía de deployment paso a paso
3. **`SSH_SETUP_GUIDE.md`** - Configuración de SSH

---

## 🎯 Checklist de Deployment

Para una nueva aplicación, verificar:

- [ ] Repositorio tiene `package.json` con `build` y `start`
- [ ] `package-lock.json` está actualizado
- [ ] DNS configurado en Cloudflare (DNS only)
- [ ] Proyecto creado en Coolify
- [ ] Environment Variables configuradas
- [ ] Container Labels (Traefik) configurados
- [ ] Deploy exitoso (estado "Healthy")
- [ ] SSL funcionando (candado verde)
- [ ] App agregada a Homer dashboard

---

**Owner:** Roberto Gutiérrez Mourente  
**Última actualización:** Diciembre 2025  
**Dominio:** roberace.com  
**Servidor:** Raspberry Pi 5 (8GB) @ 79.117.122.77

