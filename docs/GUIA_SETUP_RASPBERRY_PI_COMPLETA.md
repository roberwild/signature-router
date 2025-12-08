# 🍓 Guía Completa: Setup Raspberry Pi 4 para Hevy MCP Server

## 📦 ¡Tu Raspberry Pi ha llegado!

Esta guía te llevará paso a paso desde desempaquetar tu Raspberry Pi hasta tener tu Hevy MCP Server funcionando 24/7 en tu casa.

**⏱️ Tiempo total estimado: 2-3 horas**

---

## 📋 Antes de empezar

### Lo que tienes en la caja:
- ✅ Raspberry Pi 4 (4GB)
- ✅ Fuente de alimentación USB-C (15W)
- ✅ Tarjeta microSD (64GB)
- ✅ Cable HDMI
- ✅ Carcasa con ventilador
- ✅ Disipadores térmicos

### Lo que necesitas además:
- 🖥️ Tu PC con Windows
- 🌐 Cable Ethernet (para conectar la Pi a tu router)
- ⌨️ Teclado USB (opcional, solo para setup inicial)
- 🖱️ Ratón USB (opcional, solo para setup inicial)
- 📺 Monitor con HDMI (opcional, podemos hacerlo headless)

### Software que descargaremos:
- **Raspberry Pi Imager** (para instalar el SO)
- **PuTTY** (para SSH desde Windows)

---

## 🎯 FASE 1: Preparar la tarjeta SD (30 minutos)

### Paso 1.1: Descargar Raspberry Pi Imager

En tu PC con Windows:

1. Ve a: https://www.raspberrypi.com/software/
2. Click en **"Download for Windows"**
3. Ejecuta el instalador (`imager_latest.exe`)
4. Instala con las opciones por defecto

### Paso 1.2: Insertar la tarjeta SD

1. Saca la tarjeta microSD del paquete
2. Insértala en el adaptador SD (si tu PC no tiene lector microSD)
3. Conéctala a tu PC

### Paso 1.3: Grabar el sistema operativo

1. **Abre Raspberry Pi Imager**

2. **CHOOSE DEVICE:**
   - Click en "CHOOSE DEVICE"
   - Selecciona: **"Raspberry Pi 4"**

3. **CHOOSE OS:**
   - Click en "CHOOSE OS"
   - Selecciona: **"Raspberry Pi OS (other)"**
   - Luego: **"Raspberry Pi OS Lite (64-bit)"**
   - ⚠️ IMPORTANTE: **Lite** (sin escritorio, más ligero)

4. **CHOOSE STORAGE:**
   - Click en "CHOOSE STORAGE"
   - Selecciona tu tarjeta SD (debería aparecer automáticamente)

5. **CONFIGURACIÓN AVANZADA (MUY IMPORTANTE):**
   - Click en el **icono de engranaje ⚙️** (esquina inferior derecha)
   - O presiona `Ctrl + Shift + X`

   **Configura lo siguiente:**

   **General:**
   - ✅ **Set hostname**: `hevy-mcp-pi` (o el nombre que quieras)
   - ✅ **Set username and password**:
     - Username: `rober` (o el que quieras)
     - Password: Elige una contraseña segura (apúntala)
   - ✅ **Configure wireless LAN** (opcional si usarás WiFi):
     - SSID: Nombre de tu WiFi
     - Password: Contraseña de tu WiFi
     - Wireless LAN country: `ES`
   - ✅ **Set locale settings**:
     - Time zone: `Europe/Madrid`
     - Keyboard layout: `es`

   **Services:**
   - ✅ **Enable SSH**
   - Selecciona: **"Use password authentication"**

   **Options:**
   - ✅ **Eject media when finished**
   - ✅ **Enable telemetry** (opcional, yo lo desactivo)

6. **Click en "SAVE"**

7. **Click en "WRITE"** (botón Next)
   - Confirmará que borrará todo en la SD
   - Click en **"YES"**

8. **Espera 5-10 minutos** mientras graba y verifica
   - Verás: "Writing... 0%"
   - Luego: "Verifying..."
   - Finalmente: "Write Successful"

9. **Extrae la tarjeta SD** cuando termine

---

## 🔌 FASE 2: Primer arranque de la Raspberry Pi (15 minutos)

### Paso 2.1: Montar la Raspberry Pi

1. **Instala los disipadores térmicos:**
   - Pega el disipador grande en el chip principal (el cuadrado grande)
   - Pega los pequeños en los chips de memoria
   - Presiona firmemente

2. **Coloca la Pi en la carcasa:**
   - Sigue las instrucciones de la carcasa
   - Conecta el ventilador a los pines GPIO (si lo trae)
     - Cable rojo → Pin 4 (5V)
     - Cable negro → Pin 6 (GND)

3. **Inserta la tarjeta microSD:**
   - En la ranura debajo de la placa
   - Empuja hasta que haga click

### Paso 2.2: Conectar todo

**Orden de conexión (IMPORTANTE):**

1. ✅ **Ethernet** - Conecta cable Ethernet de la Pi a tu router
2. ⚠️ **NO conectes la alimentación todavía**

**Si prefieres hacerlo con monitor (más fácil para primera vez):**
1. Conecta **cable HDMI** de la Pi a un monitor
2. Conecta **teclado USB**
3. Conecta **ratón USB** (opcional)

**Finalmente:**
4. ✅ **Conecta la fuente de alimentación** (último paso)

### Paso 2.3: Primer boot

1. Cuando conectes la alimentación, verás:
   - LED rojo (alimentación) - encendido fijo
   - LED verde (actividad) - parpadeando

2. **Primera vez tarda ~2 minutos** en arrancar (expandiendo sistema)

3. **Si conectaste monitor**, verás:
   - Montón de texto de arranque
   - Finalmente: Prompt de login

4. **Login** (si usas monitor):
   ```
   raspberrypi login: rober
   Password: [tu_contraseña]
   ```

---

## 🌐 FASE 3: Conectar por SSH desde tu PC (15 minutos)

### Paso 3.1: Encontrar la IP de tu Raspberry Pi

**Método 1: Router (más fácil)**
1. Abre tu navegador
2. Ve a: `http://192.168.1.1` (o la IP de tu router)
3. Login en tu router
4. Busca sección "Dispositivos conectados" o "DHCP clients"
5. Busca: `hevy-mcp-pi` o `raspberrypi`
6. Anota la IP (ej: `192.168.1.45`)

**Método 2: Desde el monitor (si lo conectaste)**
```bash
hostname -I
```
Te mostrará la IP.

**Método 3: Desde Windows (avanzado)**
```powershell
# En PowerShell
arp -a | findstr "b8-27"
```

### Paso 3.2: Descargar PuTTY (cliente SSH para Windows)

1. Ve a: https://www.putty.org/
2. Descarga: **"putty-64bit-0.xx-installer.msi"**
3. Instala con opciones por defecto

### Paso 3.3: Conectar por SSH

1. **Abre PuTTY**

2. **En la pantalla principal:**
   - **Host Name (or IP address)**: Pon la IP de tu Pi (ej: `192.168.1.45`)
   - **Port**: `22`
   - **Connection type**: `SSH`

3. **Click en "Open"**

4. **Primera vez te preguntará:**
   ```
   The server's host key is not cached...
   ```
   - Click en **"Accept"** o **"Yes"**

5. **Login:**
   ```
   login as: rober
   rober@192.168.1.45's password: [tu_contraseña]
   ```

6. **¡Ya estás dentro!** 🎉
   Verás algo como:
   ```
   Linux raspberrypi 6.x.x-v8+ #xxxx
   ...
   rober@hevy-mcp-pi:~ $
   ```

---

## 🔧 FASE 4: Configuración inicial del sistema (30 minutos)

### Paso 4.1: Actualizar el sistema

```bash
# Actualizar lista de paquetes
sudo apt update

# Actualizar paquetes instalados (tarda ~10 min)
sudo apt upgrade -y

# Limpiar paquetes no necesarios
sudo apt autoremove -y
```

⏳ **Esto tardará 10-15 minutos la primera vez**

### Paso 4.2: Configurar IP estática (IMPORTANTE)

Para que tu servidor siempre tenga la misma IP local:

```bash
# Ver tu configuración actual
ip addr show eth0

# Ver tu gateway (router)
ip route | grep default
```

Anota:
- Tu IP actual (ej: `192.168.1.45`)
- Tu gateway (ej: `192.168.1.1`)

**Editar configuración de red:**

```bash
sudo nano /etc/dhcpcd.conf
```

**Añade al FINAL del archivo:**

```bash
# IP estática para Hevy MCP Server
interface eth0
static ip_address=192.168.1.45/24
static routers=192.168.1.1
static domain_name_servers=1.1.1.1 8.8.8.8
```

⚠️ **Cambia `192.168.1.45` por tu IP actual**
⚠️ **Cambia `192.168.1.1` por tu gateway**

**Guardar y salir:**
- `Ctrl + O` → Enter (guardar)
- `Ctrl + X` (salir)

**Reiniciar red:**
```bash
sudo systemctl restart dhcpcd
```

### Paso 4.3: Configurar zona horaria (si no lo hiciste antes)

```bash
sudo timedatectl set-timezone Europe/Madrid
```

### Paso 4.4: Habilitar cgroup memory (necesario para Docker)

```bash
sudo nano /boot/firmware/cmdline.txt
```

**Al FINAL de la línea (NO crear nueva línea), añade:**
```
cgroup_memory=1 cgroup_enable=memory
```

La línea completa debería verse algo así (TODO EN UNA LÍNEA):
```
console=serial0,115200 console=tty1 root=PARTUUID=xxxxx rootfstype=ext4 ... cgroup_memory=1 cgroup_enable=memory
```

**Guardar y salir:**
- `Ctrl + O` → Enter
- `Ctrl + X`

**Reiniciar:**
```bash
sudo reboot
```

⏳ **Espera 1 minuto y reconecta por SSH**

---

## 🐳 FASE 5: Instalar Docker (20 minutos)

Una vez reconectado por SSH:

### Paso 5.1: Instalar Docker

```bash
# Descargar script oficial de instalación
curl -fsSL https://get.docker.com -o get-docker.sh

# Ejecutar instalación
sudo sh get-docker.sh

# Añadir tu usuario al grupo docker
sudo usermod -aG docker $USER

# Habilitar Docker al arranque
sudo systemctl enable docker

# Aplicar cambios de grupo (o logout/login)
newgrp docker
```

### Paso 5.2: Verificar instalación

```bash
# Ver versión de Docker
docker --version

# Test básico
docker run hello-world
```

Si ves "Hello from Docker!" → ✅ Todo OK

### Paso 5.3: Instalar Docker Compose

```bash
# Instalar Docker Compose
sudo apt install -y docker-compose

# Verificar versión
docker-compose --version
```

---

## 🚀 FASE 6: Deployar Hevy MCP Server (30 minutos)

### Paso 6.1: Crear estructura de directorios

```bash
# Ir a home
cd ~

# Crear directorio para el proyecto
mkdir hevy-mcp
cd hevy-mcp
```

### Paso 6.2: Clonar tu repositorio

```bash
# Instalar git si no lo tienes
sudo apt install -y git

# Clonar tu repo
git clone https://github.com/roberwild/hevy-mcp.git .

# Verificar que se clonó
ls -la
```

Deberías ver tus archivos: `Dockerfile`, `package.json`, etc.

### Paso 6.3: Crear archivo .env

```bash
# Crear archivo .env
nano .env
```

**Contenido del archivo:**
```bash
NODE_ENV=production
PORT=8000
HEVY_API_KEY=tu_api_key_aqui
```

⚠️ **Reemplaza `tu_api_key_aqui` con tu API key real de Hevy**

**Guardar y salir:**
- `Ctrl + O` → Enter
- `Ctrl + X`

### Paso 6.4: Construir la imagen Docker

```bash
# Construir imagen (tarda ~10 minutos en primera vez)
docker build -t hevy-mcp:latest .
```

⏳ **Esto tardará 10-15 minutos la primera vez**

Verás:
```
Step 1/XX : FROM node:lts-alpine
...
Successfully built xxxxx
Successfully tagged hevy-mcp:latest
```

### Paso 6.5: Ejecutar el contenedor

```bash
# Ejecutar contenedor
docker run -d \
  --name hevy-mcp-server \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file .env \
  hevy-mcp:latest
```

**Explicación de flags:**
- `-d`: Modo daemon (background)
- `--name`: Nombre del contenedor
- `--restart unless-stopped`: Auto-reinicia si se cae o si reinicias la Pi
- `-p 8000:8000`: Mapea puerto 8000
- `--env-file`: Carga variables de entorno desde .env

### Paso 6.6: Verificar que funciona

```bash
# Ver logs
docker logs hevy-mcp-server

# Ver estado
docker ps

# Test local
curl http://localhost:8000/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "hevy-mcp",
  "version": "1.10.7"
}
```

✅ **¡Tu servidor está funcionando localmente!**

---

## 🌐 FASE 7: Configurar acceso desde Internet (45 minutos)

### Paso 7.1: Configurar Port Forwarding en tu router

Necesitas acceder a la configuración de tu router:

1. **Abrir navegador** en tu PC
2. Ir a: `http://192.168.1.1` (o la IP de tu router)
3. **Login** con tus credenciales de administrador

4. **Buscar sección** (varía según router):
   - "Port Forwarding"
   - "NAT"
   - "Virtual Servers"
   - "Aplicaciones y juegos"

5. **Crear nueva regla:**
   ```
   Service Name: Hevy-MCP
   External Port: 8000
   Internal IP: 192.168.1.45 (la IP de tu Pi)
   Internal Port: 8000
   Protocol: TCP
   ```

6. **Guardar** y **Activar** la regla

### Paso 7.2: Verificar tu IP pública

```bash
# Desde la Raspberry Pi
curl ifconfig.me
```

O desde tu PC: https://www.cual-es-mi-ip.net/

Anota tu IP pública (ej: `85.123.45.67`)

### Paso 7.3: Probar acceso externo

Desde tu móvil (usando datos 4G/5G, NO WiFi de casa):

Abre navegador y ve a:
```
http://TU_IP_PUBLICA:8000/health
```

Si ves el JSON de health → ✅ ¡Funciona!

---

## 🔒 FASE 8: Configurar HTTPS con Let's Encrypt (30 minutos)

### Paso 8.1: Instalar Nginx como reverse proxy

```bash
# Instalar nginx
sudo apt install -y nginx

# Detener nginx por ahora
sudo systemctl stop nginx
```

### Paso 8.2: Configurar DDNS (Dynamic DNS)

Aunque tengas IP fija, es mejor tener un nombre de dominio.

**Opción recomendada: DuckDNS** (gratis y fácil)

1. **Ir a:** https://www.duckdns.org/
2. **Login** con Google/GitHub
3. **Crear subdominio:** `hevy-mcp` (o el que quieras)
   - Quedará: `hevy-mcp.duckdns.org`
4. **Copiar tu token** (lo necesitarás)

**Configurar en la Raspberry Pi:**

```bash
# Crear directorio
mkdir ~/duckdns
cd ~/duckdns

# Crear script de actualización
nano duck.sh
```

**Contenido:**
```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=hevy-mcp&token=TU_TOKEN_AQUI&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

⚠️ **Reemplaza:**
- `hevy-mcp` con tu subdominio
- `TU_TOKEN_AQUI` con tu token de DuckDNS

**Dar permisos:**
```bash
chmod 700 duck.sh

# Probar
./duck.sh

# Ver resultado
cat duck.log
```

Debería decir: `OK`

**Automatizar actualización:**
```bash
# Editar crontab
crontab -e
```

**Añadir al final:**
```bash
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

Esto actualizará tu IP cada 5 minutos.

### Paso 8.3: Configurar Nginx

```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/hevy-mcp
```

**Contenido:**
```nginx
server {
    listen 80;
    server_name hevy-mcp.duckdns.org;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

⚠️ **Cambia `hevy-mcp.duckdns.org` por tu dominio**

**Activar configuración:**
```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/hevy-mcp /etc/nginx/sites-enabled/

# Eliminar default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si dice "test is successful"
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Paso 8.4: Instalar certificado SSL (Let's Encrypt)

```bash
# Instalar certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d hevy-mcp.duckdns.org
```

**Responde:**
- Email: Tu email
- Terms of Service: `Y`
- Share email: `N` (opcional)
- Redirect HTTP to HTTPS: `2` (Sí, redirect)

⏳ **Tarda 1-2 minutos**

Si todo va bien:
```
Successfully received certificate.
...
```

### Paso 8.5: Actualizar Port Forwarding

Vuelve a la configuración de tu router y:

**Actualiza la regla anterior:**
```
External Port: 443 (HTTPS)
Internal Port: 443
Protocol: TCP
```

**O crea una nueva:**
```
Service Name: Hevy-MCP-HTTPS
External Port: 443
Internal IP: 192.168.1.45
Internal Port: 443
Protocol: TCP
```

### Paso 8.6: Probar HTTPS

Desde tu móvil (datos 4G/5G):
```
https://hevy-mcp.duckdns.org/health
```

✅ **Si ves el JSON con el candado 🔒 → ¡PERFECTO!**

---

## 📊 FASE 9: Monitoreo y mantenimiento (15 minutos)

### Paso 9.1: Script de monitoreo básico

```bash
# Crear script
nano ~/monitor.sh
```

**Contenido:**
```bash
#!/bin/bash

echo "========================================="
echo "Hevy MCP Server - Status"
echo "========================================="
echo ""

echo "🐳 Docker Container:"
docker ps --filter name=hevy-mcp-server --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "📊 System Resources:"
echo "CPU Temp: $(vcgencmd measure_temp)"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo ""

echo "📝 Last 10 log lines:"
docker logs --tail 10 hevy-mcp-server
echo ""

echo "✅ Health Check:"
curl -s http://localhost:8000/health | jq .
```

**Dar permisos:**
```bash
chmod +x ~/monitor.sh

# Instalar jq para formatear JSON
sudo apt install -y jq

# Ejecutar
./monitor.sh
```

### Paso 9.2: Comandos útiles

```bash
# Ver logs en tiempo real
docker logs -f hevy-mcp-server

# Reiniciar contenedor
docker restart hevy-mcp-server

# Detener contenedor
docker stop hevy-mcp-server

# Iniciar contenedor
docker start hevy-mcp-server

# Ver estadísticas de recursos
docker stats hevy-mcp-server

# Ver temperatura de CPU
vcgencmd measure_temp

# Ver uso de memoria
free -h

# Ver espacio en disco
df -h
```

### Paso 9.3: Backup automático

```bash
# Crear directorio de backups
mkdir ~/backups

# Script de backup
nano ~/backup.sh
```

**Contenido:**
```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
SOURCE_DIR=~/hevy-mcp

# Crear backup
tar -czf $BACKUP_DIR/hevy-mcp-backup-$DATE.tar.gz -C ~ hevy-mcp

# Mantener solo últimos 7 backups
cd $BACKUP_DIR
ls -t hevy-mcp-backup-*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: hevy-mcp-backup-$DATE.tar.gz"
```

**Automatizar:**
```bash
chmod +x ~/backup.sh

# Añadir a crontab (backup diario a las 3 AM)
crontab -e
```

**Añadir:**
```bash
0 3 * * * ~/backup.sh >> ~/backup.log 2>&1
```

---

## 🎊 ¡COMPLETADO!

### ✅ Lo que has conseguido:

1. ✅ Raspberry Pi 4 configurada y funcionando
2. ✅ IP estática en tu red local
3. ✅ Docker instalado y funcionando
4. ✅ Hevy MCP Server corriendo 24/7
5. ✅ Accesible desde Internet
6. ✅ HTTPS con certificado válido
7. ✅ Dominio personalizado (tudominio.duckdns.org)
8. ✅ Monitoreo básico
9. ✅ Backups automáticos

### 🌐 Tu servidor ahora está en:

**Interno (desde tu red):**
```
http://192.168.1.45:8000/health
```

**Externo (desde cualquier lugar):**
```
https://hevy-mcp.duckdns.org/health
```

### 🔗 Actualizar tu GPT

Ahora actualiza tu Custom GPT con la nueva URL:
```
https://hevy-mcp.duckdns.org/mcp/v1
```

---

## 🛠️ Troubleshooting

### Problema: No puedo acceder desde Internet

**Verificar:**
1. Port forwarding configurado correctamente
2. Firewall del router no bloqueando
3. Nginx corriendo: `sudo systemctl status nginx`
4. Contenedor corriendo: `docker ps`

**Comandos útiles:**
```bash
# Ver logs de nginx
sudo tail -f /var/log/nginx/error.log

# Test local
curl http://localhost:8000/health
curl http://localhost/health

# Ver puertos abiertos
sudo netstat -tlnp | grep -E ':(80|443|8000)'
```

### Problema: Certificado SSL falla

```bash
# Ver logs de certbot
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --dry-run

# Si falla, eliminar y recrear
sudo certbot delete
sudo certbot --nginx -d tudominio.duckdns.org
```

### Problema: Contenedor no inicia

```bash
# Ver logs detallados
docker logs hevy-mcp-server

# Ver estado
docker inspect hevy-mcp-server

# Reconstruir imagen
cd ~/hevy-mcp
docker stop hevy-mcp-server
docker rm hevy-mcp-server
docker build -t hevy-mcp:latest .
docker run -d --name hevy-mcp-server --restart unless-stopped -p 8000:8000 --env-file .env hevy-mcp:latest
```

### Problema: Raspberry Pi muy lenta

```bash
# Ver temperatura
vcgencmd measure_temp

# Si está >80°C, verificar ventilador y disipadores

# Ver procesos que más consumen
top

# Liberar memoria caché
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

---

## 📚 Comandos de referencia rápida

```bash
# Docker
docker ps                                    # Ver contenedores activos
docker logs -f hevy-mcp-server              # Ver logs en tiempo real
docker restart hevy-mcp-server              # Reiniciar servidor
docker stats hevy-mcp-server                # Ver uso de recursos
docker exec -it hevy-mcp-server sh          # Entrar al contenedor

# Sistema
vcgencmd measure_temp                        # Temperatura CPU
free -h                                      # Memoria RAM
df -h                                        # Espacio disco
htop                                         # Monitor de procesos

# Nginx
sudo systemctl status nginx                  # Estado de nginx
sudo nginx -t                                # Test configuración
sudo systemctl reload nginx                  # Recargar config
sudo tail -f /var/log/nginx/access.log      # Logs de acceso

# Red
ip addr show                                 # Ver IPs
ping google.com                              # Test internet
curl http://localhost:8000/health           # Test local
curl https://tudominio.duckdns.org/health   # Test externo

# Actualizar servidor
cd ~/hevy-mcp
git pull                                     # Actualizar código
docker build -t hevy-mcp:latest .           # Reconstruir imagen
docker stop hevy-mcp-server
docker rm hevy-mcp-server
docker run -d --name hevy-mcp-server --restart unless-stopped -p 8000:8000 --env-file .env hevy-mcp:latest
```

---

## 🎓 Siguientes pasos (opcional)

### Mejoras adicionales:

1. **Portainer** (UI para gestionar Docker):
   ```bash
   docker run -d -p 9000:9000 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce
   ```
   Accede: `http://192.168.1.45:9000`

2. **Uptime Kuma** (monitor de uptime):
   ```bash
   docker run -d -p 3001:3001 --name uptime-kuma --restart=always -v uptime-kuma:/app/data louislam/uptime-kuma:1
   ```

3. **Watchtower** (auto-actualiza contenedores):
   ```bash
   docker run -d --name watchtower -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --cleanup
   ```

---

## 💰 Costo mensual estimado

**Electricidad:**
- Consumo: ~5-8W
- 24h × 30 días × 0.008 kW × €0.15/kWh
- **~€0.87/mes** ☕

**Comparado con:**
- Render Free: €0 (pero con sleep)
- Railway: €5/mes
- Tu PC gaming: ~€16-20/mes

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs: `docker logs hevy-mcp-server`
2. Revisa esta guía de troubleshooting
3. Google el error específico
4. Comunidad Raspberry Pi: https://forums.raspberrypi.com/

---

**¡Felicidades! Ahora tienes tu propio servidor self-hosted 24/7 en casa** 🎉🏠💻

---

**Última actualización:** Noviembre 2025  
**Versión:** 1.0  
**Autor:** Setup para Rober - Hevy MCP en Raspberry Pi 4

