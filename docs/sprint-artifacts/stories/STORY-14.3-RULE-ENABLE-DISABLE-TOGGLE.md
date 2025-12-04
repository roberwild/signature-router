# Story 14.3: Rule Enable/Disable Toggle

**Story ID:** 14.3  
**Epic:** E14 - Integración Completa Frontend-Backend (Admin Panel)  
**Story Owner:** Developer  
**Created:** 2025-12-05  
**Status:** 📋 Backlog  
**Priority:** 🔴 HIGH  
**Estimated Effort:** 30 minutos  

---

## 📖 User Story

**As a** Administrador del sistema  
**I want** Habilitar/deshabilitar reglas de routing mediante un toggle switch  
**So that** Puedo controlar qué reglas están activas sin necesidad de eliminarlas

---

## 🎯 Business Value

- **Operaciones:** Permite activar/desactivar reglas temporalmente para troubleshooting
- **Flexibilidad:** Mantener reglas deshabilitadas para uso futuro sin perderlas
- **Rapidez:** Cambio de estado instantáneo sin necesidad de editar la regla completa
- **Seguridad:** Auditoría de quién deshabilitó/habilitó cada regla

---

## ✅ Acceptance Criteria

### AC1: Toggle Switch Funcional

**Given** La página `/admin/rules` está abierta con reglas existentes  
**When** Hago clic en el switch de estado (enabled/disabled) de una regla  
**Then** El switch cambia visualmente a su nuevo estado (ON ↔ OFF)

**And** Se envía una petición `PUT /api/v1/admin/rules/{id}` con el DTO completo:

```typescript
const toggleRule = async (ruleId: string, currentEnabled: boolean) => {
  const rule = rules.find(r => r.id === ruleId);
  if (!rule) return;

  try {
    const updateDto: UpdateRuleDto = {
      name: rule.name,
      description: rule.description,
      condition: rule.condition,
      targetChannel: rule.targetChannel,
      providerId: rule.providerId,
      priority: rule.priority,
      enabled: !currentEnabled, // Toggle the value
    };

    const updatedRule = await apiClient.updateRule(ruleId, updateDto);
    
    // Update local state
    setRules(rules.map(r => 
      r.id === ruleId 
        ? { ...r, enabled: !currentEnabled }
        : r
    ));
    
    toast.success(`Regla ${!currentEnabled ? 'habilitada' : 'deshabilitada'} exitosamente`);
  } catch (error) {
    console.error('Error toggling rule:', error);
    toast.error('Error al cambiar estado de la regla');
  }
};
```

**And** El estado se persiste en la base de datos en la columna `routing_rule.enabled`

**And** La regla deshabilitada ya NO se evalúa en el routing engine (`RoutingServiceImpl`)

---

### AC2: Indicador Visual del Estado

**Given** Una regla deshabilitada (`enabled: false`)  
**When** Veo la tabla de reglas  
**Then** El switch aparece en estado OFF (gris)

**And** Opcionalmente, la fila completa puede tener un estilo visual diferente (ej: opacidad reducida):

```tsx
<TableRow 
  key={rule.id} 
  className={!rule.enabled ? "opacity-50" : ""}
>
  {/* ... */}
  <TableCell>
    <Switch
      checked={rule.enabled}
      onCheckedChange={() => toggleRule(rule.id, rule.enabled)}
      aria-label={`${rule.enabled ? 'Deshabilitar' : 'Habilitar'} regla`}
    />
  </TableCell>
</TableRow>
```

---

### AC3: Validación de Campos Requeridos

**Given** El usuario intenta cambiar el estado de una regla  
**When** Se construye el `UpdateRuleDto`  
**Then** Todos los campos requeridos están presentes:

- ✅ `name` (string, required)
- ✅ `description` (string, optional)
- ✅ `condition` (string, required)
- ✅ `targetChannel` (ChannelType, required)
- ✅ `providerId` (UUID, required si ya existe)
- ✅ `priority` (number, required)
- ✅ `enabled` (boolean, required)

**And** Si algún campo falta, el backend responde con HTTP 400 Bad Request

**And** El frontend muestra un mensaje de error descriptivo

---

### AC4: Manejo de Errores

**Given** El backend no está disponible o responde con error  
**When** El usuario intenta cambiar el estado de una regla  
**Then** Se muestra un mensaje de error: "No se pudo cambiar el estado de la regla. Intenta de nuevo."

**And** El switch vuelve a su estado original (no se actualiza localmente si falla el backend)

**And** El error se registra en la consola del navegador para debugging

---

### AC5: Auditoría de Cambios

**Given** Un administrador cambia el estado de una regla  
**When** La actualización se persiste en base de datos  
**Then** Los campos de auditoría se actualizan:

```sql
UPDATE routing_rule
SET 
  enabled = :newEnabledValue,
  modified_at = NOW(),
  modified_by = :currentUserId
WHERE id = :ruleId;
```

**And** El `modified_by` se extrae del JWT del usuario autenticado

**And** El cambio se puede auditar consultando la tabla

---

## 🔧 Technical Implementation

### Ubicación de Archivos

#### Frontend
- **Archivo principal:** `app-signature-router-admin/app/admin/rules/page.tsx`
- **Componente UI:** Usar `@/components/ui/switch` de shadcn/ui
- **API Client:** `lib/api/real-client.ts` y `lib/api/mock-client.ts`

#### Backend
- **Endpoint:** Ya existe `PUT /api/v1/admin/rules/{id}` en `AdminRuleController`
- **Use Case:** `ManageRoutingRulesUseCaseImpl.updateRule()`
- **Validación:** `UpdateRoutingRuleDto` con Jakarta Validation

---

### Código de Implementación

#### Frontend: Función `toggleRule`

```typescript
// app/admin/rules/page.tsx

const toggleRule = async (ruleId: string, currentEnabled: boolean) => {
  const rule = rules.find(r => r.id === ruleId);
  if (!rule) {
    console.error('Rule not found:', ruleId);
    return;
  }

  setActionLoading('toggle'); // Optional: loading state

  try {
    // Build complete DTO (all fields required by backend)
    const updateDto: UpdateRuleDto = {
      name: rule.name,
      description: rule.description,
      condition: rule.condition,
      targetChannel: rule.targetChannel,
      providerId: rule.providerId,
      priority: rule.priority,
      enabled: !currentEnabled, // Toggle
    };

    // Call backend
    const updated = await apiClient.updateRule(ruleId, updateDto);

    // Update local state
    setRules(rules.map(r =>
      r.id === ruleId
        ? { ...r, enabled: !currentEnabled }
        : r
    ));

    toast.success(
      `Regla "${rule.name}" ${!currentEnabled ? 'habilitada' : 'deshabilitada'}`
    );
  } catch (err) {
    console.error('Error toggling rule:', err);
    toast.error('Error al cambiar estado de la regla');
  } finally {
    setActionLoading(null);
  }
};
```

#### Frontend: Renderizado del Switch

```tsx
{/* En la tabla de reglas, columna "Estado" */}
<TableCell>
  <Switch
    checked={rule.enabled}
    onCheckedChange={() => toggleRule(rule.id, rule.enabled)}
    disabled={actionLoading === 'toggle'}
    aria-label={`${rule.enabled ? 'Deshabilitar' : 'Habilitar'} regla ${rule.name}`}
  />
</TableCell>
```

#### Backend: Validación en RoutingServiceImpl

```java
// infrastructure/adapter/outbound/routing/RoutingServiceImpl.java

public RoutingDecision evaluateRules(TransactionContext context) {
    List<RoutingRule> activeRules = routingRuleRepository.findAll()
        .stream()
        .filter(RoutingRule::getEnabled) // ✅ Solo evaluar reglas habilitadas
        .sorted(Comparator.comparing(RoutingRule::getPriority))
        .toList();

    // ... resto de la lógica de evaluación
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// __tests__/rules/toggle-rule.test.ts

describe('toggleRule', () => {
  it('should toggle rule from enabled to disabled', async () => {
    const rule = { id: '123', enabled: true, name: 'Test Rule', ... };
    const apiClient = { updateRule: jest.fn().mockResolvedValue({ ...rule, enabled: false }) };

    await toggleRule(rule.id, rule.enabled, apiClient);

    expect(apiClient.updateRule).toHaveBeenCalledWith('123', {
      ...rule,
      enabled: false,
    });
  });

  it('should handle errors gracefully', async () => {
    const apiClient = { updateRule: jest.fn().mockRejectedValue(new Error('Network error')) };
    
    await toggleRule('123', true, apiClient);

    expect(toast.error).toHaveBeenCalledWith('Error al cambiar estado de la regla');
  });
});
```

### Manual Testing

1. **Habilitar regla deshabilitada:**
   - Abrir `/admin/rules`
   - Click en switch de regla deshabilitada
   - Verificar que cambia a ON
   - Verificar en BD: `SELECT enabled FROM routing_rule WHERE id = '...'`

2. **Deshabilitar regla habilitada:**
   - Click en switch de regla habilitada
   - Verificar que cambia a OFF
   - Crear signature request y verificar que la regla NO se evalúa

3. **Error de red:**
   - Detener backend
   - Intentar cambiar estado
   - Verificar mensaje de error
   - Verificar que switch vuelve a estado original

---

## 📋 Prerequisites

- ✅ Backend endpoint `PUT /api/v1/admin/rules/{id}` implementado
- ✅ `UpdateRoutingRuleDto` acepta todos los campos (name, description, condition, etc.)
- ✅ Frontend tiene `useApiClient()` hook funcionando
- ✅ `@/components/ui/switch` de shadcn/ui disponible

---

## 🎯 Definition of Done

- [ ] Switch funcional en grid de reglas
- [ ] Estado se persiste correctamente en BD
- [ ] Todos los campos del DTO se envían (no solo `enabled`)
- [ ] Indicador visual del estado (ON/OFF)
- [ ] Manejo de errores con toast notification
- [ ] Auditoría (`modified_at`, `modified_by`) actualizada
- [ ] Reglas deshabilitadas NO se evalúan en routing engine
- [ ] Unit tests pasando
- [ ] Manual testing completado
- [ ] Sin errores de linting
- [ ] Documentación actualizada en TAREAS-PENDIENTES.md

---

## 🔗 Related Items

- **Epic:** E14 - Integración Completa Frontend-Backend
- **Story 14.2.3:** Fix de botones de orden (↑↓) - patrón similar de enviar DTO completo
- **Documento:** `docs/TAREAS-PENDIENTES.md` - Tarea #1 (Alta Prioridad)
- **Arquitectura:** Seguir checklist de `.cursorrules` para cambios en capas

---

## 📝 Notes

- Esta story completa la funcionalidad CRUD de reglas
- Similar al fix de los botones de orden: enviar TODOS los campos del DTO, no solo el que cambia
- El switch ya existe en el componente pero está deshabilitado o no funciona
- Prioridad ALTA porque es funcionalidad visible y esperada por los usuarios

---

## 🚀 Next Steps After Completion

1. Marcar tarea como completada en `docs/TAREAS-PENDIENTES.md`
2. Actualizar estado en `docs/sprint-artifacts/sprint-status.yaml`
3. Considerar agregar filtro "Solo reglas activas" en la tabla
4. Considerar agregar acción bulk para habilitar/deshabilitar múltiples reglas

