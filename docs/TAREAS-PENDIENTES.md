# 📋 Tareas Pendientes - Signature Router

**Última actualización:** 5 Diciembre 2025

---

## 🔴 Alta Prioridad

### 1. Botón de Estado en Grid de Reglas (Switch Habilitado/Deshabilitado)

**Descripción:**  
En el grid de reglas de routing (`/admin/rules`), existe un botón/switch gris para habilitar/deshabilitar reglas que actualmente **NO está funcionando**.

**Ubicación:**
- **Frontend:** `app-signature-router-admin/app/admin/rules/page.tsx`
- **Componente:** Tabla de reglas, columna "Estado"
- **Elemento:** Switch/Toggle para campo `enabled`

**Comportamiento esperado:**
1. Al hacer clic en el switch, debe cambiar el estado `enabled` de la regla (true ↔ false)
2. El cambio debe persistirse en la base de datos
3. El switch debe reflejar visualmente el estado actual
4. Debe enviar una petición PUT al backend con todos los campos requeridos

**Problema actual:**
- El switch está deshabilitado o no actualiza el estado en el backend
- Posiblemente falta la función `toggleRule()` o está incompleta

**Referencias:**
- Similar al fix de los botones de orden (↑↓) que se arregló el 5 de diciembre
- Debe enviar todos los campos del `UpdateRoutingRuleDto`, no solo `enabled`

**Estimación:** 30 minutos

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

### 3. Remover Console.logs de Debug

**Descripción:**  
Eliminar los `console.log` de debug que se agregaron durante el troubleshooting del provider_id.

**Ubicación:**
- `app-signature-router-admin/app/admin/rules/page.tsx` (líneas 143-146)

```typescript
// Remover esto:
console.log('🔍 DEBUG handleSaveRule:');
console.log('  - ruleData.provider (nombre):', ruleData.provider);
console.log('  - providerNameToIdMap:', providerNameToIdMap);
console.log('  - providerId (UUID):', providerId);
```

**Estimación:** 5 minutos

---

### 4. Validación de Provider según Canal

**Descripción:**  
Cuando se selecciona un canal (SMS, PUSH, VOICE, BIOMETRIC), el selector de proveedores debería filtrar automáticamente para mostrar solo los proveedores compatibles con ese canal.

**Ejemplo:**
- Si selecciono canal **BIOMETRIC**, solo mostrar:
  - FaceTech (BIOMETRIC)
  - Veridas (BIOMETRIC)
- NO mostrar:
  - Twilio SMS (SMS)
  - Firebase Cloud Messaging (PUSH)

**Ubicación:**
- `app-signature-router-admin/components/admin/rule-editor-dialog.tsx`

**Estimación:** 20 minutos

---

### 5. Indicador Visual de Provider en Grid

**Descripción:**  
Agregar una columna o badge en el grid de reglas que muestre el proveedor asignado a cada regla.

**Mockup:**
```
| Orden | Nombre                | Canal      | Proveedor           | Condición SpEL |
|-------|-----------------------|------------|---------------------|----------------|
| 1     | SMS Premium - Twilio  | SMS        | 🔵 Twilio SMS       | amount > 1000  |
| 2     | High Value Biometric  | BIOMETRIC  | 🟢 FaceTech         | amount > 5000  |
```

**Ubicación:**
- `app-signature-router-admin/app/admin/rules/page.tsx`

**Estimación:** 30 minutos

---

## ✅ Completadas (Diciembre 2025)

- [x] Campo `provider_id` agregado a routing rules (backend + frontend)
- [x] Selector de proveedores dinámico desde API
- [x] Mapeo UUID ↔ nombre de proveedor
- [x] Persistencia de proveedor al editar/guardar reglas
- [x] Campo proveedor obligatorio (no opcional)
- [x] Fix botones de orden (↑↓) para cambiar prioridad
- [x] Documentación completa de Routing Rules + SpEL

---

## 📝 Notas

- Estas tareas están priorizadas pero no son bloqueantes
- Se pueden abordar en orden diferente según necesidad del negocio
- Para nueva funcionalidad, seguir siempre el checklist de `.cursorrules`

---

**Para agregar tareas:** Editar este archivo o crear un issue en el sistema de tracking.

