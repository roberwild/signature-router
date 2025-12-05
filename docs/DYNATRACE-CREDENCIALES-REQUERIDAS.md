# 🔑 Dynatrace - Credenciales y Configuración Requerida

**Proyecto:** Signature Router Platform  
**Fecha:** 2025-12-05  
**Propósito:** Checklist de información necesaria para integrar Dynatrace

---

## 📋 **Información que Necesito de Ti**

### ✅ **1. Environment ID** (Requerido)

**¿Qué es?** Identificador único de tu tenant de Dynatrace

**Formato:** Alfanumérico, 8 caracteres

**Ejemplo:**
```
abc12345
```

**¿Dónde lo encuentro?**
- URL de Dynatrace: `https://abc12345.live.dynatrace.com`
- El `abc12345` es tu Environment ID

**Variable que configuraremos:**
```bash
DYNATRACE_ENV_ID=abc12345
```

---

### ✅ **2. Tenant URL** (Requerido)

**¿Qué es?** URL completa de acceso a Dynatrace

**Formato:** URL HTTPS

**Ejemplo:**
```
https://abc12345.live.dynatrace.com
```

**Variantes según tipo de instalación:**
- **SaaS US:** `https://{env-id}.live.dynatrace.com`
- **SaaS EU:** `https://{env-id}.apps.dynatrace.com`
- **Sprint:** `https://{env-id}.sprint.dynatracelabs.com`
- **Managed:** `https://{tu-dominio}/e/{env-id}`

**Variable que configuraremos:**
```bash
DYNATRACE_URL=https://abc12345.live.dynatrace.com
```

---

### ✅ **3. API Token** (Requerido - CRÍTICO)

**¿Qué es?** Token de autenticación para llamar a la API de Dynatrace

**Formato:** String largo que empieza con `dt0c01.`

**Ejemplo:**
```
dt0c01.XA7LQ9XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Permisos OBLIGATORIOS que debe tener:**
- ✅ **Read problems (v2)** ← Para leer alertas
- ✅ **Write problems (v2)** ← Para cerrar/reconocer alertas
- ⚠️ **Read metrics (v2)** ← Opcional (para futuras métricas)
- ⚠️ **Read entities (v2)** ← Opcional (para futuro health check)

**¿Cómo generarlo?**

1. Accede a Dynatrace UI
2. Ve a: **Settings > Integration > Dynatrace API**
3. Click: **Generate token**
4. Nombre sugerido: `signature-router-admin-panel`
5. Selecciona los permisos de arriba
6. Click: **Generate**
7. **¡IMPORTANTE!** Copia el token inmediatamente (solo se muestra una vez)

**Variable que configuraremos:**
```bash
DYNATRACE_API_TOKEN=dt0c01.XA7LQ9XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🔐 **Resumen: Estas 3 Cosas**

```bash
# Esto es TODO lo que necesito de ti:

DYNATRACE_ENV_ID=abc12345
DYNATRACE_URL=https://abc12345.live.dynatrace.com
DYNATRACE_API_TOKEN=dt0c01.XA7LQ9XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 📝 **Formulario de Entrega**

Copia esto y completa los valores:

```bash
# ========================================
# DYNATRACE - Credenciales
# Proyecto: Signature Router
# Fecha: _____________
# ========================================

# 1. Environment ID
DYNATRACE_ENV_ID=

# 2. Tenant URL
DYNATRACE_URL=

# 3. API Token (con permisos: Read/Write problems v2)
DYNATRACE_API_TOKEN=

# ========================================
# Verificación de permisos del token:
# ✅ Read problems (v2)
# ✅ Write problems (v2)
# ⚠️ Read metrics (v2) - opcional
# ⚠️ Read entities (v2) - opcional
# ========================================
```

---

## ✅ **Verificación Rápida**

Una vez que me des las 3 credenciales, verificaré que funcionan con este comando:

```bash
curl -X GET \
  "${DYNATRACE_URL}/api/v2/problems?from=now-1h&pageSize=5" \
  -H "Authorization: Api-Token ${DYNATRACE_API_TOKEN}" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:** JSON con lista de problemas (puede estar vacío si no hay problemas activos)

**Respuesta de error:**
- `401 Unauthorized` → Token inválido o sin permisos
- `404 Not Found` → URL incorrecta
- `Connection refused` → Firewall/VPN bloqueando

---

## 🚫 **Lo que NO Necesito**

Para clarificar, **NO necesito:**

- ❌ PaaS Token (solo si vamos a instalar OneAgent, que es opcional)
- ❌ Usuario/Contraseña de Dynatrace
- ❌ Certificados SSL adicionales
- ❌ Configuración de OneAgent (lo haremos después si queremos)
- ❌ Configuración de Management Zones (usaremos las que existan)
- ❌ Configuración de alerting profiles (Dynatrace ya tiene sus alertas)

---

## 📧 **Cómo Compartir las Credenciales de Forma Segura**

### **Opción 1: Archivo Encriptado (Recomendado)**

```bash
# Crear archivo con credenciales
cat > dynatrace-credentials.txt << EOF
DYNATRACE_ENV_ID=abc12345
DYNATRACE_URL=https://abc12345.live.dynatrace.com
DYNATRACE_API_TOKEN=dt0c01.XA7LQ9...
EOF

# Encriptar con GPG
gpg --symmetric --cipher-algo AES256 dynatrace-credentials.txt

# Compartir el archivo .gpg por email/chat
# Compartir la contraseña por otro canal (SMS, teléfono)
```

### **Opción 2: Vault/Secrets Manager**

Si tu organización usa un secrets manager:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- 1Password / LastPass

Compárteme el **path** al secret y me encargaré de recuperarlo.

### **Opción 3: Variables de Entorno Directas**

Si estás en local/desarrollo, simplemente configura las variables de entorno y me confirmas que están listas.

---

## 🎯 **Pasos Siguientes (Una Vez Tenga las Credenciales)**

1. **Yo haré:**
   - ✅ Configurar `application.yml` con las URLs
   - ✅ Crear archivo `.env.dynatrace`
   - ✅ Implementar `AlertManagerServiceDynatraceImpl.java`
   - ✅ Verificar conectividad con Dynatrace
   - ✅ Probar endpoints de problemas
   - ✅ Integrar con el frontend

2. **Tú solo tendrás que:**
   - ✅ Revisar que las alertas se muestran en `/admin/alerts`
   - ✅ Probar los botones "Reconocer" y "Resolver"
   - ✅ Confirmar que funciona

---

## 🔍 **Preguntas Frecuentes**

### **¿El API Token expira?**

Sí, puede expirar según la configuración de Dynatrace. Cuando expira:
- Recibirás `401 Unauthorized`
- Tendrás que generar un nuevo token
- Me lo pasas y lo actualizo

### **¿Qué pasa si el token se filtra?**

1. Revócalo inmediatamente en Dynatrace UI
2. Genera uno nuevo
3. Actualiza la variable de entorno
4. Reinicia el backend

### **¿Necesito acceso admin a Dynatrace?**

No necesariamente. Solo necesitas permisos para:
- Generar API Tokens
- Ver la configuración de Access Tokens

Si no tienes permisos, pídele al equipo DevOps que genere el token por ti.

### **¿Puedo usar el mismo token en DEV, QA y PROD?**

**NO recomendado.** Mejores prácticas:
- Token diferente por ambiente
- Nombres descriptivos: `signature-router-dev`, `signature-router-prod`
- Permite revocar sin afectar otros ambientes

### **¿Qué hago si no tengo Dynatrace todavía?**

Opciones:
1. **Solicitar acceso** al equipo DevOps/Platform
2. **Crear trial gratuito** en dynatrace.com (15 días gratis)
3. **Usar el mock** mientras tanto (`ADMIN_PORTAL_ALERTS_MOCK=true`)

---

## 📞 **Contacto para Obtener Credenciales**

**Equipo DevOps/Platform:**
- Email: devops@example.com
- Slack: #dynatrace-support
- Ticket: JIRA/ServiceNow

**Solicitud tipo:**
```
Subject: Solicitud de API Token Dynatrace - Signature Router

Hola equipo,

Necesito un API Token de Dynatrace para integrar el panel de 
administración del proyecto Signature Router.

Permisos necesarios:
- Read problems (v2)
- Write problems (v2)

Ambiente: [DEV/QA/PROD]
Proyecto: Signature Router
Uso: Panel de alertas (/admin/alerts)

Gracias!
```

---

## 🎉 **Eso es Todo**

Solo necesito estas **3 cosas**:

```
1. DYNATRACE_ENV_ID
2. DYNATRACE_URL
3. DYNATRACE_API_TOKEN
```

Con eso, puedo configurar toda la integración. 🚀

---

**Última actualización:** 2025-12-05  
**Siguiente paso:** Una vez tengas las credenciales, compártelas de forma segura y empezamos la integración.
