# Story 10.12: TODO Cleanup - Inventario y Catalogación de Deuda Técnica

**Epic**: 10 - Quality Improvements & Technical Debt  
**Story ID**: 10.12  
**Story Key**: 10-12-todo-cleanup  
**Status**: drafted  
**Created**: 2025-11-29  
**Story Points**: 1 SP  
**Priority**: 🟡 IMPORTANTE

---

## Story

**As a** Development Team  
**I want** Inventario completo de TODOs y deuda técnica  
**So that** Podamos priorizar y planificar trabajo futuro

---

## Context

Esta story cataloga y organiza todos los comentarios TODO y código temporal en el proyecto. La evaluación de calidad identificó múltiples TODOs sin tickets asociados y código marcado como "TEMPORARY" sin decisión sobre su futuro.

**Source**: Evaluación de Calidad identificó TODOs sin tickets y código temporal.

**Business Value**:
- Visibilidad completa de deuda técnica
- Priorización clara de trabajo futuro
- Prevención de código temporal quedándose en producción
- Mejora mantenibilidad del código

**Prerequisites**:
- ✅ Código base existente con TODOs y código temporal

---

## Acceptance Criteria

### AC1: TODO Inventory Created

**Given** Código base  
**When** Ejecuto búsqueda de TODOs  
**Then** Se crea archivo `tech-debt-inventory.txt` con:
- Lista completa de todos los TODOs encontrados
- Ubicación (archivo, línea)
- Contexto (código alrededor)
- Prioridad (Crítico/Importante/Bajo)
- Categoría (Security/Performance/Refactoring/etc.)

### AC2: TODOs Categorized

**Given** `tech-debt-inventory.txt`  
**When** Reviso inventario  
**Then** Cada TODO está categorizado:
- **Security**: Vulnerabilidades o riesgos de seguridad
- **Performance**: Optimizaciones de performance
- **Refactoring**: Mejoras de código sin cambio funcional
- **Feature**: Features futuras o mejoras funcionales
- **Documentation**: Documentación faltante
- **Testing**: Tests faltantes o mejoras de testing

### AC3: Tickets Created for Valid TODOs

**Given** TODOs válidos (no obsoletos)  
**When** Reviso backlog  
**Then** Se crean tickets (GitHub issues) para cada TODO válido con:
- Título descriptivo
- Descripción con contexto
- Prioridad
- Labels apropiados
- Link a código fuente

### AC4: Obsolete TODOs Removed

**Given** TODOs obsoletos  
**When** Reviso código  
**Then** TODOs obsoletos son eliminados del código con commit message explicando por qué

### AC5: Temporary Code Decision

**Given** Código marcado como "TEMPORARY"  
**When** Reviso inventario  
**Then** Se toma decisión para cada pieza:
- **Keep**: Mantener código (remover marca TEMPORARY)
- **Replace**: Plan para reemplazar con implementación real
- **Remove**: Eliminar código si ya no es necesario

### AC6: Backlog Prioritized

**Given** Tickets creados  
**When** Reviso backlog  
**Then** Tickets están priorizados:
- **P0 (Critical)**: Bloquea producción o seguridad
- **P1 (High)**: Importante para calidad o performance
- **P2 (Medium)**: Mejoras importantes pero no críticas
- **P3 (Low)**: Nice to have

### AC7: Documentation Updated

**Given** Inventario completado  
**When** Reviso documentación  
**Then** `TECH-DEBT.md` creado con:
- Resumen de deuda técnica
- Priorización
- Timeline estimado para resolver
- Owners asignados (si aplica)

---

## Technical Notes

### TODO Search Command

```bash
# Buscar todos los TODOs en código
grep -r "TODO" src/ --include="*.java" -n > todos-raw.txt

# Buscar código TEMPORARY
grep -r "TEMPORARY\|Temporary\|temporary" src/ --include="*.java" -n > temporary-code.txt
```

### Inventory Format

```
tech-debt-inventory.txt
=======================

## Security TODOs

### TODO-001: SpEL Security Validation
- **Location**: `src/main/java/.../CreateRoutingRuleUseCaseImpl.java:45`
- **Context**: `// TODO: Add SpEL validation to prevent injection`
- **Priority**: CRITICAL
- **Category**: Security
- **Status**: ✅ Resolved (Story 10.6)

## Performance TODOs

### TODO-002: Database Index Optimization
- **Location**: `src/main/resources/db/changelog/.../0001-schema.yaml:120`
- **Context**: `-- TODO: Add index on customer_id for faster queries`
- **Priority**: HIGH
- **Category**: Performance
- **Status**: 📋 Backlog (Ticket #123)

## Refactoring TODOs

### TODO-003: Degraded Mode Refactoring
- **Location**: `src/main/java/.../SignatureController.java:184`
- **Context**: `// TODO Story 4.3: Refactor to handle degraded mode in domain/use case layer`
- **Priority**: MEDIUM
- **Category**: Refactoring
- **Status**: 📋 Backlog (Ticket #124)
```

### GitHub Issue Template

```markdown
## TODO: [Título descriptivo]

**Source**: TODO encontrado en código  
**Location**: `path/to/file.java:line`  
**Priority**: [Critical/High/Medium/Low]  
**Category**: [Security/Performance/Refactoring/etc.]

### Context
```java
// Código alrededor del TODO
```

### Description
[Descripción detallada de qué necesita hacerse]

### Acceptance Criteria
- [ ] AC1
- [ ] AC2

### Related
- Link a código fuente
- Related issues/tickets
```

---

## Tasks

### Task 1: Search All TODOs
**Estimated**: 30 min

1. [ ] Ejecutar `grep -r "TODO" src/` para encontrar todos los TODOs
2. [ ] Ejecutar `grep -r "FIXME\|XXX\|HACK" src/` para otros marcadores
3. [ ] Ejecutar `grep -r "TEMPORARY\|Temporary" src/` para código temporal
4. [ ] Guardar resultados en archivos temporales

### Task 2: Create Inventory File
**Estimated**: 2h

1. [ ] Crear `tech-debt-inventory.txt`
2. [ ] Para cada TODO encontrado:
   - Extraer ubicación (archivo, línea)
   - Extraer contexto (código alrededor)
   - Categorizar (Security/Performance/etc.)
   - Priorizar (Critical/High/Medium/Low)
   - Determinar si es válido u obsoleto
3. [ ] Organizar por categoría y prioridad

**Files to Create**:
- `tech-debt-inventory.txt`

### Task 3: Review and Validate TODOs
**Estimated**: 1h

1. [ ] Revisar cada TODO manualmente
2. [ ] Determinar si es válido u obsoleto
3. [ ] Para obsoletos: marcar para eliminación
4. [ ] Para válidos: preparar para crear tickets

### Task 4: Create GitHub Issues
**Estimated**: 2h

1. [ ] Para cada TODO válido:
   - Crear GitHub issue con template
   - Asignar labels apropiados
   - Asignar prioridad
   - Link a código fuente
2. [ ] Documentar issues creados en inventario

### Task 5: Remove Obsolete TODOs
**Estimated**: 1h

1. [ ] Para cada TODO obsoleto:
   - Eliminar del código
   - Commit con mensaje explicativo
2. [ ] Actualizar inventario marcando como eliminados

### Task 6: Decision on Temporary Code
**Estimated**: 1h

1. [ ] Revisar cada pieza de código marcada como TEMPORARY
2. [ ] Para cada una, decidir:
   - Keep: Remover marca, documentar como permanente
   - Replace: Crear ticket para reemplazo
   - Remove: Eliminar código
3. [ ] Documentar decisiones en inventario

### Task 7: Prioritize Backlog
**Estimated**: 30 min

1. [ ] Revisar todos los tickets creados
2. [ ] Asignar prioridad (P0/P1/P2/P3)
3. [ ] Agregar estimaciones si posible
4. [ ] Organizar en milestones si aplica

### Task 8: Create TECH-DEBT.md
**Estimated**: 1h

1. [ ] Crear `TECH-DEBT.md` con resumen ejecutivo
2. [ ] Incluir estadísticas (total TODOs, por categoría, por prioridad)
3. [ ] Incluir timeline estimado
4. [ ] Incluir owners si asignados

**Files to Create**:
- `TECH-DEBT.md`

---

## Definition of Done

- [ ] Inventario de TODOs creado (`tech-debt-inventory.txt`)
- [ ] TODOs categorizados y priorizados
- [ ] Tickets creados para TODOs válidos
- [ ] TODOs obsoletos eliminados
- [ ] Decisión sobre código TEMPORARY tomada
- [ ] Backlog priorizado
- [ ] `TECH-DEBT.md` creado
- [ ] Code review aprobado

---

## Testing Strategy

### Verification
- Ejecutar búsqueda de TODOs y verificar que todos están en inventario
- Verificar que tickets creados tienen links correctos
- Verificar que código obsoleto fue eliminado

---

## Risks and Mitigations

**Risk**: Inventario puede ser muy grande y difícil de manejar  
**Mitigation**: Organizar por categoría y prioridad, usar milestones en GitHub

**Risk**: Algunos TODOs pueden ser ambiguos  
**Mitigation**: Revisar manualmente, pedir clarificación al autor original si posible

**Risk**: Código TEMPORARY puede tener dependencias  
**Mitigation**: Revisar dependencias antes de eliminar, crear plan de migración si necesario

---

## References

- Epic 10 Tech Spec: `docs/sprint-artifacts/tech-spec-epic-10.md`
- Quality Evaluation: `Evaluación_de_Calidad_del_Proyecto_Signature_Router.md`

---

**Next Story**: Story 10.2 (Domain Layer Tests) - Sprint 2

