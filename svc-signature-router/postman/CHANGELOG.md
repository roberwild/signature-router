# 📋 Changelog - Colección de Postman

Registro de cambios en la colección de Postman para Signature Router API.

---

## [v2.0.1] - 2025-12-04

### 🔧 Correcciones Críticas

#### **Revert SpEL Context Changes** 🔄
- ✅ **Revertido `transactionContext` a su estado original**
  - **Problema detectado:** Los cambios de v2.1.0 rompían el backend existente
  - **Causa raíz:** El domain model `TransactionContext` NO tiene campos `customer`, `channel`, `deviceInfo`
  - **Solución:** Revertir Postman + Actualizar reglas SpEL en seed script
  - **Contexto actual:** `amount`, `merchantId`, `orderId`, `description` (campos que SÍ existen)
  
**Cambios en seed script (`seed-test-data.sql`):**
```sql
-- Reglas SpEL actualizadas para usar propiedades disponibles:
-- ✅ 'amount.value > 1000.00' → SMS (transacciones premium)
-- ✅ 'amount.value >= 100.00 && amount.value <= 1000.00' → PUSH (transacciones medias)
-- ✅ 'amount.value < 100.00' → VOICE (transacciones pequeñas)
-- ✅ 'description matches ''.*urgente.*''' → SMS (casos urgentes)
```

**Context disponible en SpEL:**
```json
{
  "amount": {
    "value": BigDecimal,    // ← context.amount.value
    "currency": String      // ← context.amount.currency
  },
  "merchantId": String,     // ← context.merchantId
  "orderId": String,        // ← context.orderId
  "description": String     // ← context.description
}
```

### 🎁 Beneficios

**Reglas SpEL realistas:**
- ✅ `amount.value > 1000.00` - Transacciones altas usan SMS
- ✅ `amount.value >= 100 && amount.value <= 1000` - Transacciones medias usan PUSH
- ✅ `amount.value < 100.00` - Transacciones bajas usan VOICE
- ✅ `description matches '.*urgente.*'` - Casos urgentes usan SMS

**Resultado:**
- 🟢 **Backend no modificado** (domain model intacto)
- 🟢 **Reglas evalúan correctamente**
- 🟢 **Tests no rotos**
- 🟢 **Arquitectura respetada**

---

## [v2.0.0] - 2025-11-30

### ✨ Nuevas Funcionalidades

#### **Epic 13: Provider Management CRUD** 🎉
- ✅ **Carpeta 3: Provider Management** (10 endpoints nuevos)
  - `List All Providers` - GET con filtros por tipo y estado
  - `List Providers by Type` - GET con query param `?type=SMS`
  - `List Providers by Enabled Status` - GET con query param `?enabled=true`
  - `Get Provider by ID` - GET por UUID
  - `Create Provider - SMS (Twilio)` - POST con body completo
  - `Create Provider - PUSH (Firebase)` - POST para FCM
  - `Update Provider` - PUT con actualización parcial
  - `Delete Provider (Soft Delete)` - DELETE
  - `Test Provider Connectivity` - POST para probar conexión

- ✅ **Carpeta 4: Provider Registry** (2 endpoints nuevos)
  - `Get Registry Statistics` - GET estadísticas del registro en memoria
  - `Reload Provider Registry` - POST para hot reload desde DB

- ✅ **Carpeta 5: Provider Health** (2 endpoints nuevos)
  - `Get All Providers Health Status` - GET salud de todos
  - `Get Provider Health by ID` - GET salud de uno específico

#### **Mejoras en Signature Requests**
- ✅ Actualizado `Verify Challenge` para usar endpoint correcto (`PATCH /signatures/{id}/complete`)
- ✅ Mejorados scripts de prueba con mejor logging
- ✅ Agregado comando directo de PostgreSQL en console logs

### 🔧 Mejoras Técnicas

- ✅ Agregada variable de entorno `provider_id` (auto-guardada)
- ✅ Scripts de prueba automáticos en todos los endpoints nuevos
- ✅ Mejor manejo de errores 401 en script global
- ✅ Descripciones detalladas en cada endpoint
- ✅ Ejemplos de bodies para crear providers SMS y PUSH

### 📚 Documentación

- ✅ Creado `README.md` completo con:
  - Guía de inicio rápido
  - Flujos de prueba recomendados
  - Configuración de variables de entorno
  - Troubleshooting
  - Documentación de scripts

- ✅ Creado `Signature-Router-Local.postman_environment.json`:
  - 15 variables preconfiguradas
  - Valores por defecto para desarrollo local
  - Secrets marcados como tipo `secret`

- ✅ Creado `CHANGELOG.md` (este archivo)

### 🗑️ Eliminado

- ❌ Endpoint obsoleto: `Provider Health (Admin)` en carpeta "1. Health & Monitoring"
  - **Razón**: Reemplazado por endpoints más específicos en "5. Provider Health"

---

## [v1.0.0] - 2025-11-27

### ✨ Funcionalidades Iniciales

#### **Autenticación (Keycloak)**
- ✅ `Get Admin Token` - Obtener token con rol ADMIN
- ✅ `Get User Token` - Obtener token con rol USER
- ✅ `Verify Token (Introspect)` - Validar token JWT

#### **Health & Monitoring**
- ✅ `Health Check` - Endpoint de salud general
- ✅ `Prometheus Metrics` - Métricas en formato Prometheus

#### **Signature Requests**
- ✅ `Create Signature Request - SMS (Admin)` - Crear solicitud como admin
- ✅ `Create Signature Request - SMS (User)` - Crear solicitud como usuario
- ✅ `Get Signature Request by ID` - Consultar estado de firma

#### **Challenge Verification**
- ✅ `Verify Challenge` - Verificar código de challenge

### 🔧 Configuración

- ✅ Scripts globales de pre-request y test
- ✅ Validación automática de tiempo de respuesta (<5000ms)
- ✅ Auto-guardado de tokens y IDs en variables de entorno

---

## 📊 Estadísticas

### **Endpoints Totales**

| Versión | Carpetas | Endpoints | Cambios |
|---------|----------|-----------|---------|
| v1.0.0 | 3 | 8 | - |
| v2.0.0 | 5 | 22 | +14 (+175%) |
| v2.0.1 | 5 | 22 | SpEL seed fix |

### **Cobertura de Epics**

| Epic | Cobertura | Endpoints |
|------|-----------|-----------|
| Epic 1: Core Infrastructure | ✅ 100% | 2 (Health, Metrics) |
| Epic 2: Smart Routing | ✅ 100% | 4 (Create, Get, Verify) |
| Epic 3: Provider Integration | ✅ 100% | 4 (SMS, PUSH, Test) |
| Epic 13: Provider Management | ✅ 100% | 14 (CRUD, Registry, Health) |

---

## 🎯 Próximas Actualizaciones

### **Planificadas para v2.1.0**

- [ ] **Routing Rules Management**
  - GET /api/v1/admin/routing-rules
  - POST /api/v1/admin/routing-rules
  - PUT /api/v1/admin/routing-rules/{id}
  - DELETE /api/v1/admin/routing-rules/{id}

- [ ] **User Management (Epic 13)**
  - GET /api/v1/admin/users
  - POST /api/v1/admin/users
  - PUT /api/v1/admin/users/{id}
  - DELETE /api/v1/admin/users/{id}

- [ ] **Analytics & Metrics**
  - GET /api/v1/admin/metrics/dashboard
  - GET /api/v1/admin/metrics/analytics

- [ ] **Audit Logs**
  - GET /api/v1/admin/audit
  - GET /api/v1/admin/audit/{id}

### **Consideradas para v3.0.0**

- [ ] **Webhooks Management**
- [ ] **Template Management**
- [ ] **Configuration History**
- [ ] **Bulk Operations**

---

## 🔄 Proceso de Actualización

Para actualizar la colección en Postman:

1. **Exportar** la colección actual (backup)
2. **Eliminar** la colección antigua de Postman
3. **Importar** la nueva versión desde `Signature-Router-v2.postman_collection.json`
4. **Verificar** que el entorno esté configurado correctamente
5. **Probar** el flujo básico de autenticación

---

## 🐛 Bugs Corregidos

### **v2.0.1**
- ✅ **CRÍTICO:** Corregido enfoque para reglas SpEL
  - **Problema inicial:** Reglas fallaban con `RULE_ERROR: Property 'customer' cannot be found`
  - **Primera solución (v2.1.0 - REVERTIDA):** Intentar enriquecer el contexto (rompió el backend)
  - **Solución correcta (v2.0.1):** Actualizar reglas SpEL para usar propiedades existentes
  - **Fix aplicado:** Reglas en `seed-test-data.sql` ahora usan `amount.value`, `description`
  - **Impacto:** Routing funciona SIN modificar domain model ni romper tests

### **v2.0.0**
- ✅ Corregido endpoint de `Verify Challenge` (era POST, ahora es PATCH)
- ✅ Corregida URL de challenge verification (faltaba `/complete`)
- ✅ Mejorado script de extracción de `challenge_id`
- ✅ Corregidos nombres de variables de entorno inconsistentes

### **v1.0.0**
- ✅ Corregido puerto de Keycloak (8080 → 8180)
- ✅ Corregido formato de body en `Create Signature Request`
- ✅ Agregado header `Idempotency-Key` faltante

---

## 📞 Soporte

Si encuentras algún problema con la colección:

1. Verifica que estés usando la última versión (v2.0.0)
2. Revisa el `README.md` para troubleshooting
3. Consulta la documentación de Swagger UI: http://localhost:8080/swagger-ui.html
4. Reporta el issue al equipo de desarrollo

---

**Última actualización:** 2025-12-04  
**Versión Actual:** v2.0.1  
**Mantenedor:** Signature Router Team

