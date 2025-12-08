# Guía Completa de Instalación de Coolify en Raspberry Pi 5

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Preparación del Sistema](#preparación-del-sistema)
4. [Instalación de Docker](#instalación-de-docker)
5. [Instalación de Coolify](#instalación-de-coolify)
6. [Configuración de Red y DNS](#configuración-de-red-y-dns)
7. [Primer Deployment: Hevy-MCP](#primer-deployment-hevy-mcp)
8. [Configuración de Monitoreo con Coolify](#configuración-de-monitoreo-con-coolify)
9. [Exposición de Servicios Adicionales](#exposición-de-servicios-adicionales)
10. [Mantenimiento y Backups](#mantenimiento-y-backups)
11. [Troubleshooting](#troubleshooting)

---

## Introducción

Esta guía documenta la instalación completa de **Coolify** (self-hosted PaaS) en una **Raspberry Pi 5 (8GB)** corriendo **Raspberry Pi OS (64-bit)**. Coolify permite desplegar aplicaciones con SSL automático, similar a Vercel o Netlify, pero auto-hospedado.

### ¿Qué es Coolify?

Coolify es una plataforma como servicio (PaaS) auto-hospedada que:
- Despliega aplicaciones desde GitHub/GitLab automáticamente
- Genera certificados SSL con Let's Encrypt
- Usa Traefik como proxy inverso
- Gestiona bases de datos (PostgreSQL, Redis, etc.)
- Proporciona logs y monitoreo en tiempo real

### Especificaciones del Sistema

- **Hardware:** Raspberry Pi 5 (8GB RAM)
- **OS:** Raspberry Pi OS (64-bit) Bookworm
- **Hostname:** RASPBERRY-ROBER
- **Usuario:** rober
- **IP Local:** 192.168.1.210
- **IP Pública:** 79.117.122.77
- **Dominio:** roberace.com (Cloudflare Registrar + DNS)

---

## Requisitos Previos

### Hardware
- ✅ Raspberry Pi 5 (mínimo 4GB RAM, recomendado 8GB)
- ✅ MicroSD de al menos 32GB (recomendado 64GB o SSD)
- ✅ Alimentación oficial Raspberry Pi 5 (27W)
- ✅ Conexión Ethernet (recomendado sobre WiFi)

### Software
- ✅ Raspberry Pi OS (64-bit) instalado y actualizado
- ✅ Acceso SSH configurado
- ✅ Usuario con permisos sudo

### Red
- ✅ IP pública accesible
- ✅ Acceso al router para configurar port forwarding
- ✅ Dominio registrado (en este caso: roberace.com)

### Conocimientos
- Básicos de Linux/terminal
- Nociones de Docker (opcional)
- Acceso a DNS (Cloudflare en este caso)

---

## Preparación del Sistema

### 1. Actualizar el Sistema

```bash
# Conectarse a la Raspberry Pi
ssh rober@RASPBERRY-ROBER
# o
ssh rober@192.168.1.210

# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Reiniciar si es necesario
sudo reboot
```

### 2. Limpiar Instalaciones Previas (Si Aplica)

**⚠️ IMPORTANTE:** Este paso solo es necesario si tenías servicios previos (PM2, Nginx, etc.). En una instalación limpia, **omite esta sección**.

Si tenías un setup previo con PM2, Nginx, DuckDNS, etc., necesitas limpiarlo primero:

```bash
# Detener y deshabilitar servicios antiguos
sudo systemctl stop nginx
sudo systemctl disable nginx

# Eliminar PM2 y aplicaciones
pm2 delete all
pm2 kill
npm uninstall -g pm2

# Eliminar Nginx
sudo apt remove --purge nginx nginx-common -y

# Eliminar Certbot
sudo apt remove --purge certbot python3-certbot-nginx -y

# Eliminar cron de DuckDNS
crontab -e
# Eliminar la línea del cron de DuckDNS si existe

# Limpiar directorios antiguos (CUIDADO: verifica antes)
rm -rf ~/hevy-mcp
rm -rf ~/mi-web

# Limpiar paquetes huérfanos
sudo apt autoremove -y
sudo apt autoclean
```

### 3. Verificar Espacio en Disco

```bash
df -h

# Deberías tener al menos 10GB libres
# Ejemplo de salida esperada:
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/mmcblk0p2   58G   20G   36G  36% /
```

### 4. Configurar Firewall (Opcional pero Recomendado)

```bash
# Instalar UFW si no está instalado
sudo apt install ufw -y

# Configurar reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar UFW
sudo ufw enable

# Verificar estado
sudo ufw status verbose
```

---

## Instalación de Docker

Coolify requiere Docker. Vamos a instalar Docker Engine (no Docker Desktop).

### 1. Instalar Dependencias

```bash
sudo apt update
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

### 2. Agregar Repositorio de Docker

```bash
# Crear directorio para GPG keys
sudo install -m 0755 -d /etc/apt/keyrings

# Descargar GPG key de Docker
curl -fsSL https://download.docker.com/linux/debian/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Dar permisos correctos
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Agregar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 3. Instalar Docker Engine

```bash
# Actualizar índice de paquetes
sudo apt update

# Instalar Docker y componentes
sudo apt install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

# Verificar instalación
docker --version
# Salida esperada: Docker version 24.x.x, build xxxxx
```

### 4. Configurar Permisos de Usuario

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (IMPORTANTE: cerrar sesión y volver a conectar)
exit

# Volver a conectar por SSH
ssh rober@RASPBERRY-ROBER

# Verificar que funciona sin sudo
docker ps
# Debería mostrar una lista vacía sin errores
```

### 5. Habilitar Docker al Inicio

```bash
sudo systemctl enable docker
sudo systemctl start docker

# Verificar estado
sudo systemctl status docker
# Debería mostrar "active (running)"
```

---

## Instalación de Coolify

### 1. Descargar e Instalar Coolify

```bash
# Descargar script de instalación
curl -fsSL https://cdn.coollabs.io/coolify/install.sh -o install-coolify.sh

# Revisar el script (opcional pero recomendado)
cat install-coolify.sh

# Ejecutar instalación con sudo
sudo bash install-coolify.sh
```

**Salida esperada:**
```
Installing Coolify...
Docker is installed.
...
Coolify installed successfully!
```

### 2. Verificar Instalación

```bash
# Ver contenedores de Coolify
docker ps | grep coolify

# Deberías ver:
# - coolify (aplicación principal)
# - coolify-db (PostgreSQL)
# - coolify-redis (Redis)
# - coolify-proxy (Traefik)
# - coolify-realtime (WebSockets)
```

### 3. Obtener IP Pública

```bash
# Obtener tu IP pública
curl -4 ifconfig.me
# Salida: 79.117.122.77
```

### 4. Acceso Inicial a Coolify

**Accede desde tu navegador local:**

```
http://192.168.1.210:8000
```

**⚠️ IMPORTANTE:** En este punto Coolify **NO es accesible desde Internet**. Solo funciona en red local.

---

## Configuración de Red y DNS

Para hacer Coolify accesible desde Internet con SSL, necesitas:
1. Configurar port forwarding en tu router
2. Configurar DNS en Cloudflare
3. Configurar el proxy de Coolify

### 1. Configurar Port Forwarding en el Router

**Accede a tu router** (generalmente `http://192.168.1.1`) y configura estas reglas:

| Servicio | Puerto Externo | Puerto Interno | IP Interna | Protocolo |
|----------|----------------|----------------|------------|-----------|
| HTTP | 80 | 80 | 192.168.1.210 | TCP |
| HTTPS | 443 | 443 | 192.168.1.210 | TCP |

**Pasos generales** (varía según router):
1. Buscar sección "Port Forwarding" o "NAT"
2. Crear nueva regla
3. Puerto externo: 80, interno: 80, IP: 192.168.1.210, Protocolo: TCP
4. Crear nueva regla
5. Puerto externo: 443, interno: 443, IP: 192.168.1.210, Protocolo: TCP
6. Guardar y aplicar cambios

### 2. Registrar Dominio

En este caso usamos **Cloudflare Registrar**, pero puedes usar cualquier registrador (Namecheap, Porkbun, etc.).

**Dominio registrado:** `roberace.com`

### 3. Configurar DNS en Cloudflare

**Accede a Cloudflare Dashboard** → DNS → Records

**Agrega el siguiente registro A:**

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| A | coolify | 79.117.122.77 | DNS only (☁️ gris) | Auto |

**⚠️ CRÍTICO:** El "Proxy status" DEBE ser **"DNS only"** (nube gris), NO "Proxied" (nube naranja).

### 4. Verificar Propagación DNS

```bash
# Desde la Raspberry Pi
nslookup coolify.roberace.com

# Salida esperada:
# Server:         192.168.1.1
# Address:        192.168.1.1#53
#
# Non-authoritative answer:
# Name:   coolify.roberace.com
# Address: 79.117.122.77
```

**Si muestra IPs de Cloudflare** (104.x.x.x, 172.x.x.x), el DNS está en modo "Proxied". **Cámbialo a "DNS only"** y espera 5-10 minutos.

### 5. Configurar Coolify para Acceso Público

**Accede a Coolify:**

```
http://192.168.1.210:8000
```

**Pasos en la UI:**

1. **Completa el wizard inicial:**
   - Email: tu-email@ejemplo.com
   - Nombre: Tu Nombre
   - Contraseña: (una contraseña segura)
   - Click en "Register"

2. **Ir a Settings → Configuration:**
   - **Instance's Domain:** `https://coolify.roberace.com`
   - Guardar

3. **Ir a Servers → localhost → Proxy:**
   - Click en **"Start Proxy"**
   - Esperar a que Traefik inicie (30-60 segundos)
   - Verificar estado: "Running"

### 6. Verificar Acceso HTTPS

**Desde tu navegador:**

```
https://coolify.roberace.com
```

Deberías ver:
- ✅ Redireccionamiento de HTTP a HTTPS
- ✅ Certificado SSL válido de Let's Encrypt
- ✅ Página de login de Coolify

**Desde terminal:**

```bash
curl -I https://coolify.roberace.com

# Salida esperada:
# HTTP/2 200
# ...certificado válido...
```

---

## Primer Deployment: Hevy-MCP

Vamos a desplegar la aplicación `hevy-mcp` desde GitHub como ejemplo.

### 1. Preparar Repositorio

**En tu repositorio de GitHub (`hevy-mcp`):**

1. Asegúrate de tener un `package.json` con el script de build:

```json
{
  "name": "hevy-mcp",
  "scripts": {
    "build": "tsc",
    "start": "node dist/simple-server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "dotenv": "^16.4.7",
    "express": "^4.21.2"
  }
}
```

2. **IMPORTANTE:** Crear archivo `nixpacks.toml` en la raíz del proyecto:

```toml
[start]
cmd = "node dist/simple-server.js"
```

Este archivo le dice a Coolify qué comando usar para iniciar la aplicación.

3. Commit y push:

```bash
git add nixpacks.toml
git commit -m "Add nixpacks config for Coolify"
git push origin main
```

### 2. Crear Aplicación en Coolify

**En Coolify UI:**

1. **Dashboard → "+ New" → "Application"**

2. **Select Source:**
   - Source: "Public Repository"
   - Repository URL: `https://github.com/TU-USUARIO/hevy-mcp.git`
   - Branch: `main`
   - Click "Continue"

3. **Configure Build:**
   - Build Pack: Nixpacks (auto-detectado)
   - Click "Continue"

4. **Configure Destination:**
   - Server: `localhost`
   - Network: `coolify`
   - Click "Continue"

5. **Configure Application:**
   - Name: `hevy-mcp`
   - Domain: `hevy.roberace.com`
   - Port: `3000` (puerto interno de la app)
   - Click "Save"

### 3. Configurar Variables de Entorno

**En la aplicación → Environment Variables:**

Agrega las variables necesarias (ejemplo):

```
MCP_TRANSPORT=http
PORT=3000
NODE_ENV=production
```

### 4. Configurar DNS para la Aplicación

**En Cloudflare DNS, agrega:**

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| A | hevy | 79.117.122.77 | DNS only (☁️ gris) | Auto |

### 5. Desplegar

**En Coolify:**

1. Click en **"Deploy"** (arriba a la derecha)
2. Esperar a que termine el build (2-5 minutos)
3. Verificar logs en tiempo real
4. Estado final: "Healthy (running)"

### 6. Configurar HTTPS

**En la aplicación → Configuration → Advanced → Container Labels:**

Agrega estas labels (todas juntas):

```
traefik.enable=true
traefik.http.routers.http-0-j4w808go4osc0gccok0o0oo0.rule=Host(`hevy.roberace.com`)
traefik.http.routers.http-0-j4w808go4osc0gccok0o0oo0.entryPoints=http
traefik.http.routers.http-0-j4w808go4osc0gccok0o0oo0.middlewares=redirect-to-https
traefik.http.routers.http-0-j4w808go4osc0gccok0o0oo0.service=http-0-j4w808go4osc0gccok0o0oo0
traefik.http.services.http-0-j4w808go4osc0gccok0o0oo0.loadbalancer.server.port=3000
traefik.http.middlewares.gzip.compress=true
traefik.http.routers.https-0-j4w808go4osc0gccok0o0oo0.rule=Host(`hevy.roberace.com`)
traefik.http.routers.https-0-j4w808go4osc0gccok0o0oo0.entryPoints=https
traefik.http.routers.https-0-j4w808go4osc0gccok0o0oo0.tls=true
traefik.http.routers.https-0-j4w808go4osc0gccok0o0oo0.tls.certresolver=letsencrypt
traefik.http.routers.https-0-j4w808go4osc0gccok0o0oo0.service=http-0-j4w808go4osc0gccok0o0oo0
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true
```

**Nota:** Reemplaza `j4w808go4osc0gccok0o0oo0` con el ID único de tu aplicación (lo ves en el nombre del contenedor).

**Guardar y Redeploy:**

1. Guardar cambios
2. Click en "Deploy" nuevamente
3. Esperar 1-2 minutos

### 7. Verificar Deployment

```bash
# Desde terminal
curl -I https://hevy.roberace.com

# Salida esperada:
# HTTP/2 200
# ...certificado SSL válido...
```

**Desde navegador:**

```
https://hevy.roberace.com
```

Deberías ver:
- ✅ SSL válido (candado verde)
- ✅ Aplicación funcionando

---

## Configuración de Monitoreo con Coolify

Coolify incluye monitoreo básico, pero podemos agregar un stack completo de Prometheus + Grafana.

### Arquitectura de Monitoreo

```
Aplicaciones → Traefik (Logs) → Promtail → Loki → Grafana
               ↓
            Prometheus ← Node Exporter (Sistema)
                       ← cAdvisor (Contenedores)
```

### Stack de Monitoreo Recomendado

El stack de monitoreo corre en **contenedores Docker independientes** (no en Coolify) usando Docker Compose:

**Servicios:**
- **Grafana**: Dashboards y visualización
- **Prometheus**: Métricas del sistema y contenedores
- **Loki**: Agregador de logs
- **Promtail**: Recolector de logs
- **Node Exporter**: Métricas del sistema (CPU, RAM, disco)
- **cAdvisor**: Métricas de contenedores Docker

### Instalación del Stack de Monitoreo

**1. Crear directorio:**

```bash
mkdir -p ~/monitoring/grafana/provisioning/datasources
cd ~/monitoring
```

**2. Crear archivo `monitoring-stack.yml`:**

```yaml
version: '3.8'

services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SERVER_ROOT_URL=https://grafana.roberace.com
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - monitoring
      - coolify
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana-http.rule=Host(`grafana.roberace.com`)"
      - "traefik.http.routers.grafana-http.entrypoints=http"
      - "traefik.http.routers.grafana-http.middlewares=redirect-to-https"
      - "traefik.http.routers.grafana-https.rule=Host(`grafana.roberace.com`)"
      - "traefik.http.routers.grafana-https.entrypoints=https"
      - "traefik.http.routers.grafana-https.tls=true"
      - "traefik.http.routers.grafana-https.tls.certresolver=letsencrypt"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
      - "traefik.docker.network=coolify"

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - monitoring
      - coolify

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: unless-stopped
    ports:
      - "8081:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - monitoring

  loki:
    image: grafana/loki:latest
    container_name: loki
    restart: unless-stopped
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki_data:/loki
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    restart: unless-stopped
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    networks:
      - monitoring

volumes:
  grafana_data:
  prometheus_data:
  loki_data:

networks:
  monitoring:
    driver: bridge
  coolify:
    external: true
```

**3. Crear `prometheus.yml`:**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

**4. Crear `promtail-config.yml`:**

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*.log
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
      - output:
          source: output
```

**5. Configurar DNS para Grafana:**

En Cloudflare, agrega:

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| A | grafana | 79.117.122.77 | DNS only | Auto |

**6. Levantar el stack:**

```bash
cd ~/monitoring
docker compose -f monitoring-stack.yml up -d

# Verificar que todo está corriendo
docker compose -f monitoring-stack.yml ps
```

**7. Conectar Grafana a la red de Coolify:**

```bash
docker network connect coolify grafana
docker restart coolify-proxy
```

**8. Acceder a Grafana:**

```
https://grafana.roberace.com
```

Credenciales por defecto:
- Usuario: `admin`
- Contraseña: `admin` (te pedirá cambiarla)

**9. Configurar Datasources en Grafana:**

- Ir a Configuration → Data Sources
- Add data source → Prometheus
  - URL: `http://prometheus:9090`
  - Save & Test
- Add data source → Loki
  - URL: `http://loki:3100`
  - Save & Test

**10. Importar Dashboards:**

Ir a Dashboards → Import y usar estos IDs:

- **1860**: Node Exporter Full
- **893**: Docker and system monitoring
- **12611**: Loki & Promtail

---

## Exposición de Servicios Adicionales

Puedes exponer otros servicios del stack de monitoreo a Internet con SSL.

### Ejemplo: Portainer

**1. Agregar al `monitoring-stack.yml`:**

```yaml
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - monitoring
      - coolify
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.portainer-http.rule=Host(`portainer.roberace.com`)"
      - "traefik.http.routers.portainer-http.entrypoints=http"
      - "traefik.http.routers.portainer-http.middlewares=redirect-to-https"
      - "traefik.http.routers.portainer-https.rule=Host(`portainer.roberace.com`)"
      - "traefik.http.routers.portainer-https.entrypoints=https"
      - "traefik.http.routers.portainer-https.tls=true"
      - "traefik.http.routers.portainer-https.tls.certresolver=letsencrypt"
      - "traefik.http.services.portainer.loadbalancer.server.port=9000"
      - "traefik.docker.network=coolify"
```

**2. Agregar DNS:**

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| A | portainer | 79.117.122.77 | DNS only | Auto |

**3. Aplicar cambios:**

```bash
cd ~/monitoring
docker compose -f monitoring-stack.yml up -d portainer
docker restart coolify-proxy
```

**4. Acceder:**

```
https://portainer.roberace.com
```

### Servicios Recomendados para Exponer

1. **Grafana** - Monitoreo y dashboards ✅
2. **Portainer** - Gestión Docker visual
3. **Uptime Kuma** - Monitor de disponibilidad
4. **Homer** - Dashboard de enlaces
5. **pgAdmin** - Administración PostgreSQL

---

## Mantenimiento y Backups

### Actualizar Coolify

```bash
# Coolify se actualiza automáticamente
# Pero puedes forzar una actualización:
docker exec coolify php artisan self-update
```

### Backup de Coolify

**Datos importantes a respaldar:**

1. **Base de datos de Coolify:**

```bash
# Backup de PostgreSQL
docker exec coolify-db pg_dump -U coolify coolify > coolify-backup-$(date +%Y%m%d).sql
```

2. **Configuración de aplicaciones:**

```bash
# Copiar volúmenes importantes
docker run --rm \
  -v coolify-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/coolify-data-$(date +%Y%m%d).tar.gz /data
```

3. **Certificados SSL:**

```bash
# Backup de certificados Let's Encrypt
sudo cp -r /var/lib/docker/volumes/coolify-traefik/_data/acme.json \
  ~/backups/coolify-ssl-$(date +%Y%m%d).json
```

### Backup del Stack de Monitoreo

```bash
# Backup de Grafana
docker exec grafana grafana-cli admin export-dashboard > grafana-dashboards-$(date +%Y%m%d).json

# Backup de Prometheus (solo configuración)
cp ~/monitoring/prometheus.yml ~/backups/prometheus-$(date +%Y%m%d).yml
```

### Restaurar desde Backup

**Coolify Database:**

```bash
cat coolify-backup-20241208.sql | docker exec -i coolify-db psql -U coolify coolify
```

**Grafana:**

- Reinstalar stack
- Importar dashboards desde UI

### Logs y Debugging

**Ver logs de Coolify:**

```bash
# Logs de la aplicación principal
docker logs coolify -f

# Logs de Traefik (proxy)
docker logs coolify-proxy -f

# Logs de una aplicación específica
docker logs <container-name> -f
```

**Ver logs en Grafana:**

1. Ir a Explore
2. Seleccionar datasource: Loki
3. Query: `{job="docker"} |~ "error"`

---

## Troubleshooting

### Problema 1: No puedo acceder a Coolify desde Internet

**Síntomas:**
- `ERR_CONNECTION_REFUSED` al acceder a `https://coolify.roberace.com`

**Soluciones:**

1. **Verificar port forwarding:**
```bash
# Desde un servidor externo o usando https://www.yougetsignal.com/tools/open-ports/
# Verificar que los puertos 80 y 443 están abiertos
```

2. **Verificar DNS:**
```bash
nslookup coolify.roberace.com
# Debe devolver 79.117.122.77
# Si devuelve IPs de Cloudflare (104.x, 172.x), cambiar a "DNS only"
```

3. **Verificar que Traefik está corriendo:**
```bash
docker ps | grep traefik
# Debe mostrar coolify-proxy en estado "Up"
```

4. **Verificar logs de Traefik:**
```bash
docker logs coolify-proxy 2>&1 | grep -i error
```

5. **Reiniciar proxy:**
```bash
docker restart coolify-proxy
```

---

### Problema 2: Certificado SSL auto-firmado o inválido

**Síntomas:**
- Navegador muestra advertencia de certificado
- `curl` muestra "self-signed certificate"

**Soluciones:**

1. **Verificar que el DNS está en "DNS only":**
   - Ir a Cloudflare DNS
   - El registro debe tener nube GRIS, no naranja

2. **Esperar propagación DNS:**
```bash
# Verificar desde varios servicios
nslookup coolify.roberace.com 8.8.8.8
dig coolify.roberace.com
```

3. **Forzar regeneración de certificado:**
```bash
# Eliminar certificado viejo
docker exec coolify-proxy rm /traefik/acme.json
docker restart coolify-proxy
# Esperar 2-5 minutos
```

4. **Verificar logs de Let's Encrypt:**
```bash
docker logs coolify-proxy 2>&1 | grep -i "acme\|letsencrypt\|certificate"
```

---

### Problema 3: Aplicación muestra "Service Unavailable" (503)

**Síntomas:**
- HTTP 503 al acceder a la aplicación
- Coolify muestra "Degraded" o "Unhealthy"

**Soluciones:**

1. **Verificar logs de la aplicación:**
```bash
# En Coolify UI, ir a la aplicación → Logs
# O desde terminal:
docker logs <application-container> --tail 100
```

2. **Verificar que el puerto es correcto:**
   - En Coolify, verifica que el puerto configurado coincide con el puerto que expone la app

3. **Verificar comando de inicio:**
   - Para aplicaciones Node.js, crear `nixpacks.toml`:
```toml
[start]
cmd = "node dist/index.js"
```

4. **Verificar variables de entorno:**
   - Ir a Environment Variables
   - Asegurarse de que todas las variables necesarias están configuradas

5. **Redeploy:**
   - Click en "Deploy" para forzar un nuevo despliegue

---

### Problema 4: Coolify Proxy no inicia (puerto 8080 en uso)

**Síntomas:**
- Error: "Port 8080 already in use"
- Proxy no arranca

**Soluciones:**

1. **Identificar qué usa el puerto:**
```bash
sudo lsof -i :8080
# o
docker ps | grep 8080
```

2. **Si es otro contenedor (ej: homer):**
```bash
# Detener y cambiar puerto
docker stop homer
docker rm homer

# Recrear con otro puerto
docker run -d \
  --name homer \
  -p 8082:8080 \
  b4bz/homer:latest
```

3. **Reiniciar proxy:**
```bash
docker restart coolify-proxy
```

---

### Problema 5: Error "container name already in use"

**Síntomas:**
- Error al recrear contenedor con Docker Compose

**Soluciones:**

```bash
# Detener y eliminar contenedor viejo
docker stop <container-name>
docker rm <container-name>

# Recrear con force
docker compose -f monitoring-stack.yml up -d --force-recreate <service-name>
```

---

### Problema 6: Grafana no muestra datos de Prometheus/Loki

**Síntomas:**
- Dashboards vacíos
- "No data" en paneles

**Soluciones:**

1. **Verificar que los contenedores están en la misma red:**
```bash
docker inspect grafana --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'
# Debe mostrar: monitoring
```

2. **Verificar conexión desde Grafana:**
```bash
docker exec grafana curl http://prometheus:9090/api/v1/status/config
docker exec grafana curl http://loki:3100/ready
```

3. **Verificar configuración de datasources:**
   - Grafana → Configuration → Data Sources
   - URL debe ser: `http://prometheus:9090` (no localhost)
   - Click en "Save & Test"

4. **Verificar que Prometheus está recolectando métricas:**
```bash
# Acceder a Prometheus
http://192.168.1.210:9090/targets
# Todos los targets deben estar "UP"
```

---

### Problema 7: Promtail no captura logs de contenedores

**Síntomas:**
- No hay logs en Loki/Grafana
- Job "docker" no aparece en Loki

**Soluciones:**

1. **Verificar montajes de Promtail:**
```bash
docker inspect promtail --format='{{json .Mounts}}' | jq
# Debe tener montado /var/lib/docker/containers
```

2. **Verificar logs de Promtail:**
```bash
docker logs promtail --tail 50 | grep -i error
```

3. **Verificar configuración:**
```bash
cat ~/monitoring/promtail-config.yml
# Verificar que __path__ apunta a /var/lib/docker/containers/*/*.log
```

4. **Reiniciar Promtail:**
```bash
docker restart promtail
```

---

### Problema 8: Olvidé la contraseña de Coolify

**Soluciones:**

```bash
# Resetear contraseña del admin
docker exec coolify php artisan tinker

# En el prompt de tinker:
$user = \App\Models\User::whereEmail('tu-email@ejemplo.com')->first();
$user->password = bcrypt('nueva-contraseña');
$user->save();
exit
```

---

### Problema 9: Disco lleno

**Síntomas:**
- Error: "No space left on device"
- Aplicaciones fallan al desplegar

**Soluciones:**

1. **Verificar espacio:**
```bash
df -h
docker system df
```

2. **Limpiar imágenes y contenedores viejos:**
```bash
# Eliminar contenedores parados
docker container prune -f

# Eliminar imágenes sin usar
docker image prune -a -f

# Eliminar volúmenes huérfanos
docker volume prune -f

# Eliminar todo lo no usado
docker system prune -a --volumes -f
```

3. **Limpiar logs de Docker:**
```bash
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"
```

4. **Configurar rotación de logs:**
```bash
# Editar /etc/docker/daemon.json
sudo nano /etc/docker/daemon.json
```

Agregar:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

---

### Problema 10: Raspberry Pi se reinicia sola

**Síntomas:**
- Uptime bajo
- Servicios se caen aleatoriamente

**Posibles causas:**

1. **Alimentación insuficiente:**
   - Usar fuente oficial Raspberry Pi 5 (27W)
   - Verificar cable USB-C de buena calidad

2. **Sobrecalentamiento:**
```bash
vcgencmd measure_temp
# Si >80°C, agregar disipador o ventilador
```

3. **Memoria insuficiente:**
```bash
free -h
# Si swap está al 100%, considerar reducir servicios
```

4. **Ver logs del sistema:**
```bash
sudo journalctl -xe | grep -i "kernel\|panic\|error"
```

---

## Comandos Útiles de Referencia

### Docker

```bash
# Ver todos los contenedores
docker ps -a

# Ver logs de un contenedor
docker logs <container-name> -f

# Reiniciar contenedor
docker restart <container-name>

# Ejecutar comando en contenedor
docker exec -it <container-name> bash

# Ver uso de recursos
docker stats

# Limpiar sistema
docker system prune -a --volumes
```

### Docker Compose

```bash
# Levantar servicios
docker compose -f monitoring-stack.yml up -d

# Ver estado
docker compose -f monitoring-stack.yml ps

# Ver logs
docker compose -f monitoring-stack.yml logs -f

# Detener servicios
docker compose -f monitoring-stack.yml down

# Recrear servicio
docker compose -f monitoring-stack.yml up -d --force-recreate <service>
```

### Coolify

```bash
# Ver logs de Coolify
docker logs coolify -f

# Actualizar Coolify
docker exec coolify php artisan self-update

# Reiniciar Coolify
docker restart coolify

# Reiniciar proxy
docker restart coolify-proxy

# Limpiar cache
docker exec coolify php artisan cache:clear
```

### Sistema

```bash
# Ver uso de disco
df -h

# Ver uso de memoria
free -h

# Ver temperatura
vcgencmd measure_temp

# Ver procesos top
htop

# Ver servicios systemd
sudo systemctl status

# Ver logs del sistema
sudo journalctl -xe
```

---

## Recursos Adicionales

### Documentación Oficial

- **Coolify:** https://coolify.io/docs
- **Traefik:** https://doc.traefik.io/traefik/
- **Docker:** https://docs.docker.com/
- **Grafana:** https://grafana.com/docs/
- **Prometheus:** https://prometheus.io/docs/

### Comunidad

- **Coolify Discord:** https://coollabs.io/discord
- **Coolify GitHub:** https://github.com/coollabsio/coolify

### Herramientas Útiles

- **Verificar puertos abiertos:** https://www.yougetsignal.com/tools/open-ports/
- **Verificar DNS:** https://dnschecker.org/
- **Verificar SSL:** https://www.ssllabs.com/ssltest/

---

## Conclusión

Has instalado exitosamente Coolify en tu Raspberry Pi 5, configurado:

- ✅ Docker y Coolify
- ✅ Acceso HTTPS con SSL automático
- ✅ Deployment de aplicaciones desde GitHub
- ✅ Stack completo de monitoreo (Prometheus + Grafana + Loki)
- ✅ Múltiples servicios expuestos con SSL

**Tu infraestructura ahora incluye:**

1. **Coolify** - `https://coolify.roberace.com`
2. **Grafana** - `https://grafana.roberace.com`
3. **Hevy-MCP** - `https://hevy.roberace.com`
4. **Portainer** - `https://portainer.roberace.com` (opcional)
5. Y cualquier otro servicio que despliegues

**Próximos pasos sugeridos:**

1. Cambiar todas las contraseñas por defecto
2. Configurar backups automáticos
3. Configurar alertas en Grafana
4. Explorar más servicios para desplegar
5. Configurar CI/CD con GitHub Actions

¡Disfruta de tu PaaS auto-hospedado! 🚀

---

**Autor:** Documentado por Claude (Anthropic) basado en instalación real  
**Fecha:** Diciembre 2025  
**Hardware:** Raspberry Pi 5 (8GB)  
**Versión de Coolify:** 4.x  
**Dominio:** roberace.com

