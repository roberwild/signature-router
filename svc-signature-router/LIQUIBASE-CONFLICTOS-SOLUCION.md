# Problema: Changesets de Liquibase Duplicados y en Conflicto

## El Lío Actual

**Problema:** Los changesets `0010` y `0016` intentan agregar las mismas columnas (`aborted_at`, `abort_reason`) causando conflictos.

### Changesets Conflictivos

1. **`0010-add-abort-fields-to-signature-request.yaml`**
   - ID: `2.12-add-abort-fields-to-signature-request`
   - Agrega: `aborted_at`, `abort_reason`
   - ✅ Se ejecuta primero

2. **`0016-add-missing-audit-columns-signature-request.yaml`**
   - ID: `0016`
   - Intenta agregar: `routing_timeline`, `signed_at`, **`aborted_at`** ← DUPLICADO
   - ❌ Falla porque `aborted_at` ya existe

## Solución Temporal Aplicada

```sql
-- 1. Marcamos 0016 como ejecutado para que Liquibase lo salte
INSERT INTO databasechangelog (...) VALUES ('0016', ...);

-- 2. Agregamos manualmente las columnas que SÍ faltan
ALTER TABLE signature_request ADD COLUMN routing_timeline jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE signature_request ADD COLUMN signed_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_signature_request_routing_timeline_gin ON signature_request USING GIN (routing_timeline);
```

✅ **Resultado:** Backend funciona, providers cargados, pero el problema de fondo persiste.

---

## Solución Definitiva: Eliminar Changeset 0016

### Opción 1: Eliminar el Archivo (RECOMENDADO)

El changeset `0016` es **redundante y problemático**. Debería eliminarse:

```powershell
# Eliminar el archivo
rm svc-signature-router/src/main/resources/liquibase/changes/dev/0016-add-missing-audit-columns-signature-request.yaml
```

**Razones:**
1. La columna `aborted_at` ya la agrega `0010`
2. Las columnas `routing_timeline` y `signed_at` deberían estar en el changeset inicial `0002` (create table) o en un changeset separado sin duplicados
3. Causa conflictos en despliegues limpios

### Opción 2: Dividir el Changeset 0016

Si necesitas mantener `routing_timeline` y `signed_at`, crea un nuevo changeset limpio:

**Nuevo archivo:** `0016-add-audit-timeline-columns.yaml`

```yaml
databaseChangeLog:
  - changeSet:
      id: "0016-add-audit-timeline"
      author: "dev-team"
      context: dev
      comment: "Add routing_timeline and signed_at columns (NO aborted_at - ya existe en 0010)"
      preConditions:
        onFail: MARK_RAN
      changes:
        - addColumn:
            tableName: signature_request
            columns:
              - column:
                  name: routing_timeline
                  type: jsonb
                  defaultValueComputed: "'[]'::jsonb"
                  constraints:
                    nullable: false
                  remarks: "Audit trail of routing decisions"
        
        - addColumn:
            tableName: signature_request
            columns:
              - column:
                  name: signed_at
                  type: timestamp with time zone
                  constraints:
                    nullable: true
                  remarks: "Timestamp when signed"
        
        - createIndex:
            indexName: idx_signature_request_routing_timeline_gin
            tableName: signature_request
            columns:
              - column:
                  name: routing_timeline
```

**Elimina:** El changeset 0016 original que tiene `aborted_at` duplicado.

---

## Prevención de Conflictos Futuros

### Regla 1: Un Changeset = Un Propósito Claro

❌ **MAL:**
```yaml
# Changeset que mezcla columnas de diferentes Stories
- addColumn: aborted_at     # Story 2.12
- addColumn: routing_timeline # Story ???
- addColumn: signed_at       # Story ???
```

✅ **BIEN:**
```yaml
# 0010: Story 2.12 - Abort functionality
- addColumn: aborted_at
- addColumn: abort_reason

# 0016: Story X.X - Audit timeline
- addColumn: routing_timeline
- addColumn: signed_at
```

### Regla 2: Siempre Usar Precondiciones para Columnas

```yaml
- addColumn:
    tableName: signature_request
    columns:
      - column:
          name: nueva_columna
          type: varchar(100)
    preConditions:
      onFail: MARK_RAN  # Si falla, marca como ejecutado y continúa
      not:
        columnExists:
          tableName: signature_request
          columnName: nueva_columna
```

### Regla 3: Verificar Antes de Crear Changesets

```sql
-- Antes de crear un changeset, verificar qué columnas ya existen
\d signature_request

-- Ver qué changesets ya se ejecutaron
SELECT id, filename FROM databasechangelog ORDER BY dateexecuted;
```

### Regla 4: Numeración Consistente

```
0001 - create-uuidv7-function
0002 - create-signature-request-table  ← TODAS las columnas iniciales aquí
0003 - create-signature-challenge-table
...
0010 - add-abort-fields (Story 2.12)
0011 - update-audit-log (Story 8.4)
0015 - provider-config-tables (Epic 13)
0017 - add-routing-timeline (Story X.X)  ← Nuevo, sin duplicados
```

**NO mezclar columnas de diferentes features en un solo changeset.**

---

## Checklist para Futuros Changesets

Antes de crear/ejecutar un changeset:

- [ ] ¿La columna ya existe en otro changeset?
- [ ] ¿El changeset tiene un propósito claro (una Story/Epic)?
- [ ] ¿Tiene precondiciones para evitar conflictos?
- [ ] ¿El nombre del archivo refleja su contenido?
- [ ] ¿Se probó en DB limpia (docker-compose down -v)?

---

## Comando de Emergencia: Reset Completo

Si Liquibase se vuelve inmanejable:

```powershell
# 1. Detener todo y limpiar volúmenes
docker-compose down -v

# 2. Eliminar changesets problemáticos
rm svc-signature-router/src/main/resources/liquibase/changes/dev/0016-*.yaml

# 3. Levantar PostgreSQL
docker-compose up -d postgres

# 4. Arrancar backend (Liquibase creará todo desde cero)
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

---

## Estado Actual (Post-Fix)

✅ **Base de datos funcionando**
✅ **4 providers cargados**
✅ **Todas las columnas presentes**
✅ **Backend debería arrancar correctamente**

**Pero:** El changeset 0016 sigue en el código fuente → próximo reset limpio fallará de nuevo.

**Acción requerida:** Eliminar o refactorizar `0016-add-missing-audit-columns-signature-request.yaml`

---

## Recomendación Final

**Elimina el archivo problemático:**

```powershell
rm svc-signature-router/src/main/resources/liquibase/changes/dev/0016-add-missing-audit-columns-signature-request.yaml
```

Las columnas `routing_timeline` y `signed_at` ya están en la DB (las agregamos manualmente).
El changeset está marcado como ejecutado en `databasechangelog`.
Futuras instalaciones limpias funcionarán sin este changeset conflictivo.

---

**TL;DR:** Liquibase es un puto lío cuando hay changesets duplicados. La solución es eliminar `0016` y mantener solo changesets atómicos sin duplicados.

