# 📋 Tareas Pendientes - Signature Router

**Última actualización:** 5 Diciembre 2025 (17:00)

---

## 🔴 Dashboard - Datos Placeholder (Auditoría 5 Dic 2025)

> **Contexto:** Auditoría de pantallas identificó que varios campos del Dashboard usan valores hardcoded en lugar de datos reales.  
> **NOTA:** Estas tareas están marcadas como pendientes de integración con **Dynatrace** (ver Epic 15).

### DASH-001: Latencia Promedio Hardcoded ⏳ DYNATRACE

**Problema:** `overview.avgLatency` siempre devuelve `245L` (placeholder)  
**Ubicación:** `GetDashboardMetricsUseCaseImpl.java` línea 153  
**Solución:** Calcular latencia real desde métricas **Dynatrace** (no Prometheus)  
**Prioridad:** Media | **Esfuerzo:** 2h  
**Dependencia:** Epic 15 - Dynatrace Integration

---

### DASH-002: Latencia Timeline con Valores Random ⏳ DYNATRACE

**Problema:** `latencyTimeline[].p50/p95/p99` usa `145 + random()`, `410 + random()`, etc.  
**Ubicación:** `GetDashboardMetricsUseCaseImpl.java` líneas 248-253  
**Solución:** Obtener percentiles reales desde **Dynatrace API**  
**Prioridad:** Media | **Esfuerzo:** 3h  
**Dependencia:** Epic 15 - Dynatrace Integration

---

### DASH-003: Latencia por Canal Placeholder ⏳ DYNATRACE

**Problema:** `byChannel[].avgLatency` usa valores fijos por tipo de canal  
**Ubicación:** `GetDashboardMetricsUseCaseImpl.java` líneas 301-307 (`getPlaceholderLatency()`)  
**Solución:** Calcular latencia real desde métricas tagueadas por canal en **Dynatrace**  
**Prioridad:** Media | **Esfuerzo:** 1h  
**Dependencia:** Epic 15 - Dynatrace Integration

---

### DASH-004: Uptime de Proveedores Hardcoded ⏳ DYNATRACE

**Problema:** `providerHealth[].uptime` siempre es `99.9`, `95.0` o `0.0`  
**Ubicación:** `GetDashboardMetricsUseCaseImpl.java` línea 335  
**Solución:** Calcular uptime real desde health checks en **Dynatrace**  
**Prioridad:** Baja | **Esfuerzo:** 30min  
**Dependencia:** Epic 15 - Dynatrace Integration

---

### ~~DASH-005: Display Names de Proveedores Estáticos~~ ✅ COMPLETADO

~~**Problema:** Mapeo fijo `SMS → "Twilio SMS"` en lugar de usar nombre real del provider~~  
**Implementado:** `getProviderDisplayName()` ahora extrae el nombre desde `provider.details()` (5 Dic 2025)

---

### ~~DASH-006: RelativeTime Estático en Actividad~~ ✅ COMPLETADO

~~**Problema:** `recentActivity[].relativeTime` usa strings fijos como "Hace 2 min"~~  
**Implementado:** Nuevo método `computeRelativeTime()` calcula dinámicamente (5 Dic 2025)

---

## 🟠 Rules - Datos Faltantes (Auditoría 5 Dic 2025)

> **Contexto:** Auditoría de pantalla `/admin/rules` identificó campos sin datos reales y validación simulada.

### RULES-001: Métricas de Ejecución por Regla

**Problema:** `executionCount` siempre es `0` (hardcoded en frontend)  
**Ubicación:** `app/admin/rules/page.tsx` línea 88  
**Solución:** Crear endpoint que devuelva count de `SignatureRequest` agrupado por `routing_rule_id`  
**Prioridad:** Media | **Esfuerzo:** 3h

---

### RULES-002: Tasa de Éxito por Regla

**Problema:** `successRate` siempre es `0` (hardcoded en frontend)  
**Ubicación:** `app/admin/rules/page.tsx` línea 89  
**Solución:** Calcular `(COMPLETED / total) * 100` desde `SignatureRequest` por regla  
**Prioridad:** Media | **Esfuerzo:** 2h

---

### ~~RULES-003: Validación SpEL Simulada~~ ✅ COMPLETADO

~~**Problema:** La validación SpEL es local en frontend (regex básico)~~  
**Implementado:** Conectado con endpoint `/admin/routing-rules/validate-spel` con fallback local (5 Dic 2025)  
**Fixes adicionales (5 Dic 2025 - Sesión 2):**
- Corregido mapeo de respuesta backend (`isValid`/`errorMessage` → `valid`/`message`)
- Corregido contexto de evaluación SpEL (`forPropertyAccessors` para comparaciones BigDecimal)
- Actualizadas variables SpEL: `amountValue`, `amountCurrency`, `merchantId`, `orderId`, `description`
- Limpieza de estado de validación al abrir diálogo

---

## 🟡 Providers - Métricas Estimadas (Auditoría 5 Dic 2025)

> **Contexto:** Auditoría de `/admin/providers` identificó métricas estimadas por falta de `provider_id` en requests.

### PROV-001: Requests por Provider Estimado

**Problema:** `requests_today` divide total requests entre número de providers  
**Ubicación:** `ProviderMetricsServiceImpl.java` líneas 76-102  
**Solución:** Agregar columna `provider_id` a `signature_requests` para métricas reales por provider  
**Prioridad:** Media | **Esfuerzo:** 4h

> **Nota:** Las métricas de latencia/uptime/costos dependen de integración MuleSoft (Epic 11) - no documentadas aquí.

---

## ~~🟢 Sidebar - Badge Hardcoded (Auditoría 5 Dic 2025)~~ ✅ COMPLETADO

### ~~SIDEBAR-001: Badge "47" en Monitoreo de Firmas~~ ✅

~~**Problema:** El badge "47" en el menú de Firmas es hardcoded~~  
**Implementado:** Badges dinámicos con `loadBadges()` que obtiene counts reales (5 Dic 2025)

---

### ~~SIDEBAR-002: Badge "3" en Alertas~~ ✅

~~**Problema:** El badge "3" en el menú de Alertas es hardcoded~~  
**Implementado:** Badges dinámicos con refresh cada 60 segundos (5 Dic 2025)

---

## 🔵 Alertas - Mock Implementation (Auditoría 5 Dic 2025)

### ALERTS-001: AlertManager Mock Activo

**Problema:** `AlertManagerServiceMockImpl` está activo en lugar de integración real  
**Ubicación:** `application/service/AlertManagerServiceMockImpl.java`  
**Solución:** Implementar `AlertManagerServiceImpl` con conexión real a Prometheus AlertManager  
**Prioridad:** Media | **Esfuerzo:** 4h  
**Dependencia:** Requiere Prometheus AlertManager desplegado

---

## ⚪ Media Prioridad

### 2. Actualizar Script de Seed con Provider IDs

**Descripción:**  
El script `seed-test-data.sql` debe incluir `provider_id` en los INSERT de `routing_rule` desde el inicio, en lugar de requerir UPDATEs manuales posteriores.

**Ubicación:**
- `svc-signature-router/scripts/seed-test-data.sql`

**Cambio necesario:**
```sql
-- Actualmente (PROBLEMA):
INSERT INTO routing_rule (...) VALUES (..., NULL, ...);  -- provider_id NULL

-- Debe ser (SOLUCIÓN):
INSERT INTO routing_rule (..., provider_id, ...) VALUES (
    ...,
    (SELECT id FROM provider_config WHERE provider_name = 'Twilio SMS' LIMIT 1),
    ...
);
```

**Estimación:** 15 minutos

---

## ⚫ Baja Prioridad / Mejoras Futuras

### ~~3. Remover Console.logs de Debug~~ ✅ COMPLETADO

~~**Descripción:** Eliminar los `console.log` de debug~~  
**Implementado:** Removidos los 4 console.log de `handleSaveRule` (5 Dic 2025)

---

### ~~4. Validación de Provider según Canal~~ ✅ COMPLETADO

~~**Descripción:** Filtrar proveedores por tipo de canal seleccionado~~  
**Implementado:** Selector de providers ahora filtra por `channel` (5 Dic 2025)

---

### ~~5. Indicador Visual de Provider en Grid~~ ✅ COMPLETADO

~~**Descripción:** Mostrar columna de proveedor en el grid de reglas~~  
**Implementado:** Nueva columna "Proveedor" en tabla de reglas (5 Dic 2025)

---

## ✅ Completadas (Diciembre 2025)

- [x] Campo `provider_id` agregado a routing rules (backend + frontend)
- [x] Selector de proveedores dinámico desde API
- [x] Mapeo UUID ↔ nombre de proveedor
- [x] Persistencia de proveedor al editar/guardar reglas
- [x] Campo proveedor obligatorio (no opcional)
- [x] Fix botones de orden (↑↓) para cambiar prioridad
- [x] Documentación completa de Routing Rules + SpEL
- [x] **Botón Switch Estado (Habilitado/Deshabilitado)** - Endpoint PATCH `/toggle` agregado (5 Dic 2025)
- [x] **Fix Dashboard 500 Error** - Comparación enum vs string en `GetDashboardMetricsUseCaseImpl` (5 Dic 2025)
- [x] **Auditoría Completa Admin Panel** - 8 pantallas auditadas (5 Dic 2025)
- [x] **DASH-005** - Display names dinámicos desde `provider.details()` (5 Dic 2025)
- [x] **DASH-006** - RelativeTime dinámico con `computeRelativeTime()` (5 Dic 2025)
- [x] **RULES-003** - Validación SpEL conectada a backend `/validate-spel` (5 Dic 2025)
- [x] **SIDEBAR-001/002** - Badges dinámicos con refresh automático (5 Dic 2025)
- [x] **Filtro Provider por Canal** - Selector filtra por tipo de canal (5 Dic 2025)
- [x] **Columna Provider en Grid** - Nueva columna en tabla de reglas (5 Dic 2025)
- [x] **Console.logs Removidos** - Limpieza de logs de debug (5 Dic 2025)

### Fixes Sesión 2 (5 Dic 2025 17:00):
- [x] **URL Validación SpEL** - Corregido de `/admin/rules/validate-spel` a `/admin/routing-rules/validate-spel`
- [x] **Mapeo Respuesta SpEL** - Backend `isValid`/`errorMessage` → Frontend `valid`/`message`
- [x] **Contexto Evaluación SpEL** - Cambiado a `forPropertyAccessors()` para comparaciones BigDecimal
- [x] **Variables SpEL Actualizadas** - `amountValue`, `amountCurrency`, `merchantId`, `orderId`, `description`
- [x] **Estado Validación SpEL** - Se limpia al abrir diálogo de edición
- [x] **Badge +Fallback** - Lógica corregida: solo muestra si hay eventos FALLBACK/RETRY/ERROR
- [x] **Columna Canal Signatures** - Extrae canal de `routingTimeline.details` cuando `activeChallenge` es null

---

## 📊 Resumen Auditoría de Pantallas (5 Dic 2025 - Actualizado 17:00)

| Pantalla | Ruta | Estado | Tareas |
|----------|------|--------|--------|
| Dashboard | `/admin` | ⚠️ Parcial | DASH-001 a DASH-004 → Dynatrace (Epic 15) |
| Reglas | `/admin/rules` | ✅ Funcional | RULES-003 ✅, validación SpEL OK, RULES-001/002 nice-to-have |
| Firmas | `/admin/signatures` | ✅ 100% Real | Canal y Fallback corregidos |
| Proveedores | `/admin/providers` | ⚠️ Estimaciones | PROV-001 → MuleSoft (Epic 11) |
| Métricas | `/admin/metrics` | ⏳ Dynatrace | Latencias → Dynatrace (Epic 15) |
| Seguridad | `/admin/security` | ✅ 100% Real | - |
| Alertas | `/admin/alerts` | ⚠️ Mock activo | ALERTS-001 → AlertManager real |
| Usuarios | `/admin/users` | ✅ 100% Real (JWT audit) | - |
| Sidebar | N/A | ✅ Badges dinámicos | SIDEBAR-001/002 ✅ |

---

## 📝 Notas

- Estas tareas están priorizadas pero no son bloqueantes
- Se pueden abordar en orden diferente según necesidad del negocio
- Para nueva funcionalidad, seguir siempre el checklist de `.cursorrules`

---

**Para agregar tareas:** Editar este archivo o crear un issue en el sistema de tracking.

